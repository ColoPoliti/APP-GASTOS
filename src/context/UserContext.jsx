import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  
  // Inicializamos leyendo de localStorage para que el F5 mantenga el hogar al instante
  const [hogarId, setHogarId] = useState(() => localStorage.getItem('hogar_id') || null);
  const [nombreHogar, setNombreHogar] = useState(() => localStorage.getItem('nombreHogar') || '');
  const [loading, setLoading] = useState(true);

  const actualizarHogar = async (id, nombre, userIdActual = null) => {
    setHogarId(id);
    setNombreHogar(nombre || '');
    
    if (id) {
      localStorage.setItem('hogar_id', id);
      localStorage.setItem('nombreHogar', nombre || '');
    } else {
      localStorage.removeItem('hogar_id');
      localStorage.removeItem('nombreHogar');
    }

    // Persistimos el cambio en la base de datos para que el perfil no pise el hogar al hacer F5
    const targetUserId = userIdActual || user?.id;
    if (targetUserId) {
      try {
        await supabase
          .from('perfiles')
          .update({ hogar_id: id })
          .eq('id', targetUserId);
      } catch (err) {
        console.error("Error al actualizar el hogar en el perfil:", err);
      }
    }
  };

  const fetchPerfil = async (currentUser) => {
    try {
      const userId = currentUser.id;
      
      // 1. Buscamos si el perfil ya existe
      let { data: perfil, error: errorPerfil } = await supabase
        .from('perfiles')
        .select('nombre, hogar_id')
        .eq('id', userId)
        .single();

      // 2. Si no existe (es el primer login tras confirmar correo), lo creamos al vuelo
      if (!perfil) {
        const { data: nuevoPerfil, error: errorCreacion } = await supabase
          .from('perfiles')
          .insert({
            id: userId,
            email: currentUser.email,
            nombre: currentUser.user_metadata?.nombre || 'Usuario',
            telefono: currentUser.user_metadata?.telefono || ''
          })
          .select('nombre, hogar_id')
          .single();

        if (errorCreacion) {
          console.error("Error al crear el perfil post-confirmación:", errorCreacion);
        } else {
          perfil = nuevoPerfil;
          console.log("¡Perfil creado con éxito en el primer login tras confirmar mail!");
        }
      }

      if (perfil) {
        setNombreUsuario(perfil.nombre || '');
        
        // Verificamos si ya tenemos un hogar local válido; si no, usaremos el de la base
        const hogarLocalId = localStorage.getItem('hogar_id');
        const hogarAUsar = hogarLocalId || perfil.hogar_id;

        if (hogarAUsar) {
          const { data: hogar } = await supabase
            .from('hogares')
            .select('id, codigo')
            .eq('id', hogarAUsar)
            .single();

          if (hogar) {
            actualizarHogar(hogar.id, hogar.codigo, userId);
          } else {
            actualizarHogar(null, null, userId);
          }
        } else {
          actualizarHogar(null, null, userId);
        }
      }
    } catch (err) {
      console.error("Error al traer o crear el perfil:", err);
    }
  };

  const refrescarPerfil = async () => {
    if (user) {
      await fetchPerfil(user);
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
            await fetchPerfil(currentUser);
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
          await fetchPerfil(currentUser);
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