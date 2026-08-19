import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import toast, { Toaster } from 'react-hot-toast';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function SetupHogar({ userId, onHogarSet }) {
  const { actualizarHogar } = useUser();
  const [tempHogar, setTempHogar] = useState('');
  const [loading, setLoading] = useState(false);
  const [misHogares, setMisHogares] = useState([]);
  const [existe, setExiste] = useState(null);

  // 1. Verificar si el hogar existe al escribir manualmente
  useEffect(() => {
    if (tempHogar.length < 3) {
      setExiste(null);
      return;
    }

    const esHogarExistente = misHogares.some(h => h.codigo === tempHogar.toUpperCase());
    if (esHogarExistente) {
      setExiste(true);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('hogares')
        .select('id')
        .eq('codigo', tempHogar.toUpperCase())
        .maybeSingle();
      setExiste(!!data);
    }, 300);

    return () => clearTimeout(timer);
  }, [tempHogar, misHogares]);

  // 2. Cargar hogares propios y hogares de invitaciones ya aceptadas
  useEffect(() => {
    const fetchMisHogares = async () => {
      if (!userId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: creados } = await supabase
        .from('hogares')
        .select('id, codigo')
        .eq('creador_id', userId);

      const { data: invitacionesAceptadas } = await supabase
        .from('invitaciones')
        .select('hogares(id, codigo)')
        .eq('email_invitado', user.email)
        .eq('estado', 'aceptada');

      const listaRaw = [
        ...(creados || []),
        ...(invitacionesAceptadas?.map(i => i.hogares).filter(h => h !== null) || [])
      ];

      const listaUnica = Array.from(
        new Map(listaRaw.map(hogar => [hogar.id, hogar])).values()
      );

      setMisHogares(listaUnica);
    };
    fetchMisHogares();
  }, [userId]);

  // 3. Crear Hogar
  const handleCrearHogar = async (nombreHogar) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const codigoHogar = nombreHogar.toUpperCase();

      const { data: nuevoHogar, error } = await supabase
        .from('hogares')
        .insert([{ codigo: codigoHogar, creador_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('perfiles')
        .update({ hogar_id: nuevoHogar.id })
        .eq('id', user.id);
      
      actualizarHogar(nuevoHogar.id, codigoHogar);

      setMisHogares(prev => [...prev, nuevoHogar]); 
      setTempHogar(''); 
      if (onHogarSet) onHogarSet(nuevoHogar.id, codigoHogar);
      
      toast.success("¡Bolsillo creado correctamente!");
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el Bolsillo");
    } finally {
      setLoading(false);
    }
  };

  // 4. Unirse a Hogar existente
  const handleUnirseHogar = async () => {
    setLoading(true);
    try {
      const codigoHogar = tempHogar.toUpperCase();
      const { data: hogar } = await supabase
        .from('hogares')
        .select('id, codigo')
        .eq('codigo', codigoHogar)
        .single();

      if (hogar) {
        await supabase
          .from('perfiles')
          .update({ hogar_id: hogar.id })
          .eq('id', userId);

        actualizarHogar(hogar.id, hogar.codigo);

        if (onHogarSet) onHogarSet(hogar.id, hogar.codigo);
        toast.success(`Te uniste al Bolsillo ${hogar.codigo}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al unirse al Bolsillo");
    } finally {
      setLoading(false);
    }
  };

  // 5. Eliminar Hogar validando antes de mostrar confirmación
  const confirmarEliminarHogar = async () => {
    setLoading(true);
    const { data: hogarInfo, error: fetchError } = await supabase
      .from('hogares')
      .select('id, creador_id')
      .eq('codigo', tempHogar.toUpperCase())
      .single();

    setLoading(false);

    if (fetchError || !hogarInfo) {
      toast.error("No se pudo verificar la propiedad del Bolsillo.");
      return;
    }

    if (hogarInfo.creador_id !== userId) {
      toast(
        (t) => (
          <span className="flex items-center gap-2 text-amber-300 font-medium text-m">
            <FaExclamationTriangle className="text-amber-400 text-base shrink-0" />
            Solo el creador de este Bolsillo puede eliminarlo.
          </span>
        ),
        {
          style: {
            background: '#451a03',
            color: '#fde047',
            border: '1px solid #b45309',
          },
        }
      );
      return;
    }

    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-m text-slate-200 font-medium">
          ¿Estás seguro? Esto borrará el Bolsillo y todos sus datos permanentemente.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              ejecutarEliminacionHogar(hogarInfo.id);
            }}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        background: '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        maxWidth: '350px',
      },
    });
  };

  const ejecutarEliminacionHogar = async (hogarId) => {
    setLoading(true);
    try {
      const { error: hogarError } = await supabase
        .from('hogares')
        .delete()
        .eq('id', hogarId);

      if (hogarError) throw hogarError;
      
      actualizarHogar(null, null);
      
      setMisHogares(prev => prev.filter(h => h.id !== hogarId));
      setTempHogar(''); 
      setExiste(false);
      
      toast.success("Bolsillo eliminado correctamente.");
    } catch (err) {
      console.error("Error detallado al eliminar:", err);
      toast.error("Error al intentar eliminar el Bolsillo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-200 dark:bg-slate-950 dark:text-white text-slate-950">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
        }} 
      />

      <div className="relative z-[9991] bg-white dark:bg-slate-900 p-8 rounded-xl border dark:border-slate-800 text-center max-w-sm w-full shadow-lg">
        <h2 className=" text-xl font-bold mb-2">¡Bienvenido!</h2>
        <p className="dark:text-slate-400 mb-6 text-sm">Seleccioná o creá tu Bolsillo para continuar:</p>
        
        <input 
          className="w-full p-3 mb-4 bg-white  dark:bg-slate-950 dark:text-white text-slate-950 font-semibold border border-slate-700 rounded-full uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition-colors" 
          placeholder="Código de Bolsillo" 
          value={tempHogar} 
          onChange={(e) => setTempHogar(e.target.value.toUpperCase())} 
        />

        {misHogares.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {misHogares.map((hogar) => (
              <button
                key={hogar.id}
                onClick={() => {
                  setTempHogar(hogar.codigo);
                  setExiste(true);
                }}
                className="px-3 py-1 bg-indigo-800 dark:bg-indigo-800 text-slate-300 rounded-full text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors border border-slate-700"
              >
                {hogar.codigo}
              </button>
            ))}
          </div>
        )}

        {tempHogar.length >= 3 && (
          <div className="mb-5 text-sm">
            {existe ? (
              <div className="p-3 dark:bg-emerald-950/40 bg-emerald-500 border border-emerald-600/50 rounded-lg dark:text-emerald-400  text-emerald-900 font-bold flex items-center justify-center gap-2">
                <i className="fa fa-check-circle text-base"></i> ¡El Bolsillo existe! Podés unirte.
              </div>
            ) : (
              <div className="p-3 dark:bg-amber-950/40 bg-amber-500 border border-amber-600/50 rounded-lg dark:text-amber-400 text-amber-800 font-bold flex items-center justify-center gap-2">
                <i className="fa fa-exclamation-triangle text-base"></i> El Bolsillo no existe. Podés crearlo.
              </div>
            )}
          </div>
        )}

        <button 
          onClick={existe ? handleUnirseHogar : () => handleCrearHogar(tempHogar)} 
          disabled={loading || tempHogar.length < 3}
          className={`w-full p-3 rounded-lg font-bold text-white transition-colors disabled:opacity-50 shadow-lg ${
            existe 
              ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' 
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
          }`}
        >
          {loading ? 'Procesando...' : (existe ? 'Unirse al Bolsillo' : 'Crear nuevo Bolsillo')}
        </button>

        {existe && misHogares.find(h => h.codigo === tempHogar.toUpperCase()) && (
          <button 
            onClick={confirmarEliminarHogar}
            className="w-full mt-4 p-2 dark:text-rose-400 text-rose-900 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors underline"
          >
            <i className="fa fa-trash"></i> Eliminar este Bolsillo
          </button>
        )}
      </div>
    </div>
  );
}