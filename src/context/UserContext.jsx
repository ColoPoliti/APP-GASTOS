import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  // Inicializamos directamente desde localStorage para que no parpadee al hacer F5
  const [nombreUsuario, setNombreUsuario] = useState(() => localStorage.getItem('usuario_nombre') || '');
  const [hogarId, setHogarId] = useState(() => localStorage.getItem('hogar_id') || null);
  const [nombreHogar, setNombreHogar] = useState(() => localStorage.getItem('hogar_nombre') || '');
  const [loading, setLoading] = useState(true);

  // Función maestra para traer datos
  const fetchPerfil = async (userId) => {
    try {
      // 1. Traer perfil
      const { data: perfil, error: errorPerfil } = await supabase
        .from('perfiles')
        .select('nombre, hogar_id')
        .eq('id', userId)
        .single();

      if (errorPerfil) throw errorPerfil;

      if (perfil) {
        setNombreUsuario(perfil.nombre);
        localStorage.setItem('usuario_nombre', perfil.nombre);
        setHogarId(perfil.hogar_id);
        localStorage.setItem('hogar_id', perfil.hogar_id || '');

        // 2. Traer nombre del hogar (usando 'codigo' como vimos en la base de datos)
        if (perfil.hogar_id) {
          const { data: hogar, error: errorHogar } = await supabase
            .from('hogares')
            .select('id, codigo')
            .eq('id', perfil.hogar_id)
            .single();

          if (hogar) {
            setNombreHogar(hogar.codigo);
            localStorage.setItem('hogar_nombre', hogar.codigo);
          }
        }
      }
    } catch (err) {
      console.error("Error en fetchPerfil:", err);
    }
  };

  useEffect(() => {
    // Verificamos la sesión al montar
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSesion(session);
      if (session) {
        await fetchPerfil(session.user.id);
      }
      setLoading(false);
    };

    checkSession();

    // Listener para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
      if (session) {
        fetchPerfil(session.user.id);
      } else {
        // Solo limpiamos si realmente se cerró la sesión
        setSesion(null);
        setNombreUsuario('');
        setHogarId(null);
        setNombreHogar('');
        localStorage.clear(); // Limpiamos todo el storage al salir
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
      nombreHogar, 
      setNombreHogar, 
      loading 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);