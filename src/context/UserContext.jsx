import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';


const UserContext = createContext();

export function UserProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [nombreHogar, setNombreHogar] = useState('');
  const [hogarId, setHogarId] = useState(null);
  const [loading, setLoading] = useState(true);

  const actualizarHogar = (id, nombre) => {
    setHogarId(id);
    setNombreHogar(nombre || '');
    if (id) {
      localStorage.setItem('hogar_id', id);
      localStorage.setItem('hogar_nombre', nombre || '');
    } else {
      localStorage.removeItem('hogar_id');
      localStorage.removeItem('hogar_nombre');
    }
  };

const fetchPerfil = async (userId) => {
  console.log("DEBUG: Buscando perfil para:", userId);
  
  try {
    // 1. Buscamos el perfil del usuario
    const { data: perfil, error: errorPerfil } = await supabase
      .from('perfiles')
      .select('nombre, hogar_id')
      .eq('id', userId)
      .single();

    if (errorPerfil) {
      console.error("DEBUG: Error al traer perfil:", errorPerfil);
      throw errorPerfil;
    }

    console.log("DEBUG: Perfil encontrado:", perfil);
    setNombreUsuario(perfil.nombre); // Actualizamos el nombre en el estado

    // 2. Si tiene hogar_id, buscamos el hogar
    if (perfil.hogar_id) {
      console.log("DEBUG: Buscando hogar con ID:", perfil.hogar_id);
      
      const { data: hogar, error: errorHogar } = await supabase
        .from('hogares')
        .select('id, codigo')
        .eq('id', perfil.hogar_id)
        .single();

      if (errorHogar) {
        console.error("DEBUG: Error al traer datos del hogar:", errorHogar);
      } else if (hogar) {
        console.log("DEBUG: Hogar encontrado:", hogar);
        actualizarHogar(hogar.id, hogar.codigo);
      } else {
        console.warn("DEBUG: El perfil tiene un hogar_id, pero no existe en la tabla hogares.");
      }
    } else {
      console.log("DEBUG: El usuario no tiene un hogar asignado.");
      actualizarHogar(null, null); // Limpiamos si no tiene hogar
    }
  } catch (err) {
    console.error("DEBUG: Error crítico en fetchPerfil:", err);
  }
};

  const refrescarPerfil = async () => {
    if (sesion?.user?.id) {
      await fetchPerfil(sesion.user.id);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSesion(session);
        await fetchPerfil(session.user.id);
      }
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
      if (session) {
        fetchPerfil(session.user.id);
      } else {
        setSesion(null);
        setNombreUsuario('');
        actualizarHogar(null, '');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ 
      sesion, 
      nombreUsuario, 
      hogarId, 
      setHogarId, 
      actualizarHogar, 
      nombreHogar, 
      loading,
      refrescarPerfil
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);