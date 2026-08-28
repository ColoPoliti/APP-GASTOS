import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const UserContext = createContext();

// Variables globales de control y caché a nivel módulo para blindar contra llamadas paralelas de componentes hijos
let globalFetchingLock = false;
let activePerfilPromise = null;
let activeHogarDataPromise = null;
let lastGastosFetchTime = 0;
let cachedGastosData = [];
let cachedTransferenciasData = [];

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  
  const [hogarId, setHogarId] = useState(() => localStorage.getItem('hogar_id') || null);
  const [nombreHogar, setNombreHogar] = useState(() => localStorage.getItem('nombreHogar') || '');
  const [invitacionPendiente, setInvitacionPendiente] = useState(null);
  
  const [gastos, setGastos] = useState([]);
  const [transferencias, setTransferencias] = useState([]);
  const [loading, setLoading] = useState(true);

  const actualizarHogar = async (id, nombre, userIdActual = null) => {
    if (hogarId === id && nombreHogar === (nombre || '')) return;

    setHogarId(id);
    setNombreHogar(nombre || '');
    
    if (id) {
      localStorage.setItem('hogar_id', id);
      localStorage.setItem('nombreHogar', nombre || '');
    } else {
      localStorage.removeItem('hogar_id');
      localStorage.removeItem('nombreHogar');
      setGastos([]);
      setTransferencias([]);
      cachedGastosData = [];
      cachedTransferenciasData = [];
    }

    const targetUserId = userIdActual || user?.id;
    if (targetUserId && id !== undefined) {
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

  const traerDatosHogar = useCallback(async (currentHogarId) => {
    const targetHogar = currentHogarId || hogarId;
    if (!targetHogar) {
      setGastos([]);
      setTransferencias([]);
      return;
    }

    const now = Date.now();
    // Si ya se consultó hace menos de 2 segundos, devolvemos lo que tenemos en caché y evitamos el fetch duplicado
    if (now - lastGastosFetchTime < 2000 && cachedGastosData.length > 0) {
      setGastos(cachedGastosData);
      setTransferencias(cachedTransferenciasData);
      return;
    }

    if (activeHogarDataPromise) {
      return activeHogarDataPromise;
    }

    activeHogarDataPromise = (async () => {
      try {
        const [resGastos, resTransfers] = await Promise.all([
          supabase.from('gastos').select(`*, categorias (*), perfiles (*)`).eq('hogar_id', targetHogar),
          supabase.from('transferencias').select('*').eq('hogar_id', targetHogar)
        ]);

        const fetchedGastos = resGastos.data || [];
        const fetchedTransfers = resTransfers.error ? [] : (resTransfers.data || []);

        cachedGastosData = fetchedGastos;
        cachedTransferenciasData = fetchedTransfers;
        lastGastosFetchTime = Date.now();

        setGastos(fetchedGastos);
        setTransferencias(fetchedTransfers);
      } catch (error) {
        console.error("Error al traer los datos del hogar:", error);
      } finally {
        activeHogarDataPromise = null;
      }
    })();

    return activeHogarDataPromise;
  }, [hogarId]);

  const fetchPerfil = async (currentUser) => {
    if (globalFetchingLock) return;
    
    if (activePerfilPromise) {
      return activePerfilPromise;
    }

    globalFetchingLock = true;

    activePerfilPromise = (async () => {
      try {
        const userId = currentUser.id;
        
        let { data: perfil, error: errorPerfil } = await supabase
          .from('perfiles')
          .select('nombre, hogar_id')
          .eq('id', userId)
          .maybeSingle();

        if (errorPerfil) {
          console.error("Error al buscar el perfil:", errorPerfil);
        }

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
            console.error("Error al crear el perfil:", errorCreacion);
          } else {
            perfil = nuevoPerfil;
          }
        }

        if (perfil) {
          setNombreUsuario(perfil.nombre || perfil.full_name || currentUser.email || 'Sin nombre');
          
          const hogarAUsar = perfil.hogar_id || localStorage.getItem('hogar_id');

          if (hogarAUsar) {
            const { data: hogar } = await supabase
              .from('hogares')
              .select('id, codigo')
              .eq('id', hogarAUsar)
              .maybeSingle();

            if (hogar) {
              await actualizarHogar(hogar.id, hogar.codigo, userId);
              await traerDatosHogar(hogar.id);
            } else {
              await actualizarHogar(null, null, userId);
            }
          } else {
            await actualizarHogar(null, null, userId);
          }
        }

        const { data: invData } = await supabase
          .from('invitaciones')
          .select('*, hogares(codigo)')
          .eq('email_invitado', currentUser.email)
          .eq('estado', 'pendiente');

        setInvitacionPendiente(invData && invData.length > 0 ? invData[0] : null);

      } catch (err) {
        console.error("Error al traer o crear el perfil:", err);
      } finally {
        setTimeout(() => {
          globalFetchingLock = false;
          activePerfilPromise = null;
        }, 1000);
      }
    })();

    return activePerfilPromise;
  };

  const refrescarPerfil = async () => {
    if (user) {
      globalFetchingLock = false;
      activePerfilPromise = null;
      lastGastosFetchTime = 0; // Forzamos invalidación de caché si se refresca manualmente
      await fetchPerfil(user);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        setSesion(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchPerfil(session.user);
        }
      } catch (error) {
        console.error("Error crítico en la inicialización de auth:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user?.id === user?.id && event === 'TOKEN_REFRESHED') return;

      setSesion(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchPerfil(session.user);
      } else {
        setNombreUsuario('');
        setInvitacionPendiente(null);
        await actualizarHogar(null, null);
      }
      setLoading(false);
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
      invitacionPendiente,
      gastos,
      transferencias,
      actualizarHogar, 
      refrescarPerfil, 
      traerDatosHogar,
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