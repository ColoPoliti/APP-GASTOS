import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  
  // Inicializamos en null para que espere a leer de la base de datos y no tire falsos renders
  const [hogarId, setHogarId] = useState(null);
  const [nombreHogar, setNombreHogar] = useState('');
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
        
        if (perfil.hogar_id) {
          const { data: hogar } = await supabase
            .from('hogares')
            .select('id, codigo')
            .eq('id', perfil.hogar_id)
            .single();

          if (hogar) {
            actualizarHogar(hogar.id, hogar.codigo);
          } else {
            actualizarHogar(null, null);
          }
        } else {
          actualizarHogar(null, null);
        }
      }
    } catch (err) {
      console.error("Error al traer perfil:", err);
    }
  };

  const refrescarPerfil = async () => {
    if (user?.id) {
      await fetchPerfil(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const inicializarAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session;
        const currentUser = currentSession?.user ?? null;
        
        if (isMounted) {
          setSesion(currentSession);
          setUser(currentUser);
          
          if (currentUser) {
            await fetchPerfil(currentUser.id);
          }
        }
      } catch (error) {
        console.error("Error de autenticación:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    inicializarAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentSession = session;
      const currentUser = currentSession?.user ?? null;
      
      if (isMounted) {
        setSesion(currentSession);
        setUser(currentUser);

        if (currentUser) {
          await fetchPerfil(currentUser.id);
        } else {
          setNombreUsuario('');
          actualizarHogar(null, null);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      sesion, 
      nombreUsuario, 
      hogarId, 
      nombreHogar, 
      actualizarHogar, 
      refrescarPerfil, 
      loading 
    }}>
      {children}
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