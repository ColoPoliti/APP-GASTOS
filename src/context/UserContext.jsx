import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  
  // Recuperamos el hogar directamente del localStorage al iniciar
  const [hogarId, setHogarId] = useState(() => localStorage.getItem('hogar_id') || null);
  const [nombreHogar, setNombreHogar] = useState(() => localStorage.getItem('nombreHogar') || '');
  const [loading, setLoading] = useState(true);

  const actualizarHogar = (id, nombre) => {
    setHogarId(id);
    setNombreHogar(nombre || '');
    if (id) {
      localStorage.setItem('hogar_id', id);
      localStorage.setItem('nombreHogar', nombre || '');
    } else {
      localStorage.removeItem('hogar_id');
      localStorage.removeItem('nombreHogar');
    }
  };

  const fetchPerfil = async (userId) => {
    try {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre, hogar_id')
        .eq('id', userId)
        .single();

      if (perfil) {
        setNombreUsuario(perfil.nombre || '');
        
        // Si el usuario ya tiene un hogar en la base de datos y nosotros no tenemos uno guardado (o queremos sincronizarlo)
        if (perfil.hogar_id && !hogarId) {
          const { data: hogar } = await supabase
            .from('hogares')
            .select('id, codigo')
            .eq('id', perfil.hogar_id)
            .single();

          if (hogar) {
            actualizarHogar(hogar.id, hogar.codigo);
          }
        }
      }
    } catch (err) {
      console.error("Error al traer perfil:", err);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;
      const currentUser = currentSession?.user ?? null;
      
      setSesion(currentSession);
      setUser(currentUser);
      
      if (currentUser) {
        await fetchPerfil(currentUser.id);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentSession = session;
      const currentUser = currentSession?.user ?? null;
      
      setSesion(currentSession);
      setUser(currentUser);

      if (currentUser) {
        await fetchPerfil(currentUser.id);
      } else {
        setNombreUsuario('');
        // Opcional: si querés que al cerrar sesión se borre el hogar recordado, descomentá la siguiente línea:
        // actualizarHogar(null, null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      sesion, 
      nombreUsuario, 
      hogarId, 
      nombreHogar, 
      actualizarHogar, 
      loading 
    }}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
};