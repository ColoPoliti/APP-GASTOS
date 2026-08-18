import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';

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
    } catch (err) {
      console.error(err);
      alert("Error al crear el Bolsillo");
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
      }
    } catch (err) {
      console.error(err);
      alert("Error al unirse al Bolsillo");
    } finally {
      setLoading(false);
    }
  };

  // 5. Eliminar Hogar de forma directa
  const eliminarHogar = async () => {
    setLoading(true);
    const { data: hogarInfo, error: fetchError } = await supabase
      .from('hogares')
      .select('id, creador_id')
      .eq('codigo', tempHogar.toUpperCase())
      .single();

    if (fetchError || !hogarInfo) {
      alert("No se pudo verificar la propiedad del Bolsillo.");
      setLoading(false);
      return;
    }

    if (hogarInfo.creador_id !== userId) {
      alert("⚠️ Solo el creador de este Bolsillo puede eliminarlo.");
      setLoading(false);
      return;
    }

    if (!window.confirm("¿Estás seguro? Esto borrará el Bolsillo y todos sus datos permanentemente.")) {
      setLoading(false);
      return;
    }

    try {
      const { error: hogarError } = await supabase
        .from('hogares')
        .delete()
        .eq('id', hogarInfo.id);

      if (hogarError) throw hogarError;
      
      actualizarHogar(null, null);
      
      setMisHogares(prev => prev.filter(h => h.id !== hogarInfo.id));
      setTempHogar(''); 
      setExiste(false);
      
      alert("Bolsillo eliminado correctamente.");
    } catch (err) {
      console.error("Error detallado al eliminar:", err);
      alert("Error al intentar eliminar el Bolsillo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center max-w-sm w-full shadow-2xl">
        <h2 className="text-white text-xl font-bold mb-2">¡Bienvenido!</h2>
        <p className="text-slate-400 mb-6 text-sm">Seleccioná o creá tu Bolsillo para continuar:</p>
        
        <input 
          className="w-full p-3 mb-4 bg-slate-950 text-white font-semibold border border-slate-700 rounded-lg uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition-colors" 
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
                  // SOLO rellena el input y valida, permitiendo confirmación previa
                  setTempHogar(hogar.codigo);
                  setExiste(true);
                }}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-medium hover:bg-indigo-600 hover:text-white transition-colors border border-slate-700"
              >
                {hogar.codigo}
              </button>
            ))}
          </div>
        )}

        {tempHogar.length >= 3 && (
          <div className="mb-5 text-sm">
            {existe ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-600/50 rounded-lg text-emerald-400 font-medium flex items-center justify-center gap-2">
                <i className="fa fa-check-circle text-base"></i> ¡El Bolsillo existe! Podés unirte.
              </div>
            ) : (
              <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-lg text-amber-400 font-medium flex items-center justify-center gap-2">
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
            onClick={eliminarHogar}
            className="w-full mt-4 p-2 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors underline"
          >
            <i className="fa fa-trash"></i> Eliminar este Bolsillo
          </button>
        )}
      </div>
    </div>
  );
}