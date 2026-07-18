import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SetupHogar({ userId, onHogarSet }) {
  const [tempHogar, setTempHogar] = useState('');
  const [loading, setLoading] = useState(false);
  const [misHogares, setMisHogares] = useState([]);
  const [existe, setExiste] = useState(null);
  const [hogarSeleccionadoId, setHogarSeleccionadoId] = useState(null);

  // Verificar si el hogar existe al escribir
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
        .maybeSingle(); // Usamos maybeSingle para evitar errores si no hay resultados
      
      setExiste(!!data);
    };
    checkHogar();
  }, [tempHogar]);

  // Cargar hogares propios
  useEffect(() => {
    const fetchHogares = async () => {
      const { data, error } = await supabase
        .from('hogares')
        .select('id, codigo')
        .eq('creador_id', userId);
      
      if (error) console.error("Error al traer hogares:", error);
      else setMisHogares(data || []);
    };
    fetchHogares();
  }, [userId]);

  const handleCrearHogar = async (nombreHogar) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: nuevoHogar, error } = await supabase
      .from('hogares')
      .insert([{ codigo: nombreHogar.toUpperCase(), creador_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error("Error al crear hogar:", error);
    } else {
      // Asignar automáticamente al usuario
      await supabase
        .from('perfiles')
        .update({ hogar_id: nuevoHogar.id })
        .eq('id', user.id);
      
      onHogarSet(nombreHogar.toUpperCase());
    }
    setLoading(false);
  };
const eliminarHogar = async () => {
    const hogarABorrar = misHogares.find(h => h.codigo === tempHogar.toUpperCase());
    if (!hogarABorrar) return;

    if (!window.confirm("¿Seguro? Esto borrará TODO lo que haya en este hogar.")) return;

    try {
      setLoading(true);
      
      // 1. Borramos los gastos del hogar primero
      await supabase.from('gastos').delete().eq('hogar_id', hogarABorrar.id);
      
      // 2. Borramos el hogar
      const { error } = await supabase.from('hogares').delete().eq('id', hogarABorrar.id);
      if (error) throw error;

      // 3. Limpiamos el perfil
      await supabase.from('perfiles').update({ hogar_id: null }).eq('id', userId);

      alert("¡Borrado con éxito!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleUnirseHogar = async () => {
    setLoading(true);
    const { data: hogar, error: fetchError } = await supabase
      .from('hogares')
      .select('id')
      .eq('codigo', tempHogar.toUpperCase())
      .single();

    if (fetchError || !hogar) {
      console.error("Error al buscar hogar:", fetchError);
    } else {
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ hogar_id: hogar.id })
        .eq('id', userId);

      if (updateError) console.error("Error al asignar hogar:", updateError);
      else onHogarSet(tempHogar.toUpperCase());
    }
    setLoading(false);
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