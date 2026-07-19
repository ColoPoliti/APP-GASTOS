import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SetupHogar({ userId, onHogarSet }) {
  const [tempHogar, setTempHogar] = useState('');
  const [loading, setLoading] = useState(false);
  const [misHogares, setMisHogares] = useState([]);
  const [existe, setExiste] = useState(null);

  // 1. Verificar si el hogar existe al escribir
  useEffect(() => {
    if (tempHogar.length < 3) {
      setExiste(null);
      return;
    }
    const checkHogar = async () => {
      const { data } = await supabase
        .from('hogares')
        .select('id')
        .eq('codigo', tempHogar.toUpperCase())
        .maybeSingle();
      setExiste(!!data);
    };
    checkHogar();
  }, [tempHogar]);

  // 2. Unificar la carga de hogares (propios + invitados)
  useEffect(() => {
    const fetchTodosLosHogares = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Hogares creados
      const { data: creados } = await supabase
        .from('hogares')
        .select('id, codigo')
        .eq('creador_id', userId);

      // Hogares invitados
      const { data: invitaciones } = await supabase
        .from('invitaciones')
        .select('hogares(id, codigo)')
        .eq('email_invitado', user.email);

      const listaCombinada = [
        ...(creados || []),
        ...(invitaciones?.map(i => i.hogares).filter(h => h !== null) || [])
      ];
      setMisHogares(listaCombinada);
    };
    fetchTodosLosHogares();
  }, [userId]);

  // 3. Crear Hogar
const handleCrearHogar = async (nombreHogar) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: nuevoHogar, error } = await supabase
        .from('hogares')
        .insert([{ codigo: nombreHogar.toUpperCase(), creador_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('perfiles')
        .update({ hogar_id: nuevoHogar.id })
        .eq('id', user.id);
      
      // ACTUALIZACIÓN SIN REFRESH:
      setMisHogares(prev => [...prev, nuevoHogar]); 
      setTempHogar(''); // Limpiamos el input
      onHogarSet(nombreHogar.toUpperCase()); // Avisamos al padre
    } catch (err) {
      console.error(err);
      alert("Error al crear hogar");
    } finally {
      setLoading(false);
    }
  };

  // 4. Unirse a Hogar existente
  const handleUnirseHogar = async () => {
    setLoading(true);
    const { data: hogar } = await supabase
      .from('hogares')
      .select('id')
      .eq('codigo', tempHogar.toUpperCase())
      .single();

    if (hogar) {
      await supabase
        .from('perfiles')
        .update({ hogar_id: hogar.id })
        .eq('id', userId);
      onHogarSet(tempHogar.toUpperCase());
    }
    setLoading(false);
  };

  // 5. Eliminar Hogar
const eliminarHogar = async () => {
    // Buscamos el hogar en la lista de hogares creados por el usuario
    // (Asegurate de que 'misHogares' contenga los datos necesarios, 
    // quizás necesites ajustar el fetch para traer el creador_id si no lo tienes)
    
    // Primero, traemos la info real del hogar desde Supabase para verificar el creador
    setLoading(true);
    const { data: hogarInfo, error: fetchError } = await supabase
      .from('hogares')
      .select('id, creador_id')
      .eq('codigo', tempHogar.toUpperCase())
      .single();

    if (fetchError || !hogarInfo) {
      alert("No se pudo verificar la propiedad del hogar.");
      setLoading(false);
      return;
    }

    // Comparamos el creador_id con tu userId actual
    if (hogarInfo.creador_id !== userId) {
      alert("⚠️ Solo el creador de este hogar puede eliminarlo.");
      setLoading(false);
      return;
    }

    // Si pasó la validación, procedemos con el borrado
    if (!window.confirm("¿Seguro? Esto borrará todo permanentemente.")) {
      setLoading(false);
      return;
    }

    try {
      await supabase.from('gastos').delete().eq('hogar_id', hogarInfo.id);
      await supabase.from('hogares').delete().eq('id', hogarInfo.id);
      await supabase.from('perfiles').update({ hogar_id: null }).eq('id', userId);
      
      setMisHogares(prev => prev.filter(h => h.id !== hogarInfo.id));
      setTempHogar(''); 
      setExiste(false);
      
      alert("Hogar eliminado correctamente.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Error al intentar eliminar el hogar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center max-w-sm w-full">
        <h2 className="text-white text-xl font-bold mb-4">¡Bienvenido!</h2>
        <p className="text-slate-400 mb-4 text-sm">Seleccioná o creá tu hogar:</p>
        
        <input 
          className="w-full p-2 mb-4 bg-slate-950 text-white border border-slate-700 rounded-lg uppercase" 
          placeholder="Código de hogar" 
          value={tempHogar} 
          onChange={(e) => setTempHogar(e.target.value.toUpperCase())} 
        />

        {misHogares.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {misHogares.map((hogar) => (
              <button
                key={hogar.id}
                onClick={() => setTempHogar(hogar.codigo)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs hover:bg-indigo-600 hover:text-white transition-colors border border-slate-700"
              >
                {hogar.codigo}
              </button>
            ))}
          </div>
        )}

        {tempHogar.length >= 3 && (
          <div className="mb-4 text-xs">
            {existe ? (
              <p className="text-emerald-500">✅ Hogar encontrado. ¡Podés unirte!</p>
            ) : (
              <p className="text-amber-500">⚠️ El código no existe. Podés crearlo.</p>
            )}
          </div>
        )}

        <button 
          onClick={existe ? handleUnirseHogar : () => handleCrearHogar(tempHogar)} 
          disabled={loading || tempHogar.length < 3}
          className="bg-indigo-600 text-white w-full p-2 rounded-lg font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Procesando...' : (existe ? 'Unirse al Hogar' : 'Crear nuevo Hogar')}
        </button>
        {existe && misHogares.find(h => h.codigo === tempHogar.toUpperCase()) && (
          <button 
            onClick={eliminarHogar}
            className="w-full mt-4 p-2 text-red-500 hover:text-red-400 text-xs underline"
          >
            Eliminar este hogar
          </button>
        )}
      </div>
    </div>
  );
}