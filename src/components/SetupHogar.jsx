import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SetupHogar({ userId, onHogarSet }) {
  const [tempHogar, setTempHogar] = useState('');
  const [loading, setLoading] = useState(false);
  const [misHogares, setMisHogares] = useState([]);
  const [existe, setExiste] = useState(null);

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
      .single();
    
    setExiste(!!data); // true si existe, false si no
  };
  checkHogar();
}, [tempHogar]);

  useEffect(() => {
    const fetchHogares = async () => {
      // Ahora consultamos la tabla 'hogares' filtrando por el usuario actual
      const { data, error } = await supabase
        .from('hogares')
        .select('id, codigo') // Traemos el ID y el código
        .eq('creador_id', userId); // Solo los hogares que este usuario creó
      
      if (error) {
        console.error("Error al traer hogares:", error);
      } else {
        setMisHogares(data || []);
      }
    };
    fetchHogares();
  }, [userId]);

const handleCrearHogar = async (nombreHogar) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('hogares')
    .insert([{ codigo: nombreHogar.toUpperCase(), creador_id: user.id }])
    .select(); // IMPORTANTE: Agregá .select() para recibir el objeto creado

  if (error) {
    console.error("Error:", error);
  } else {
    // Agregamos el nuevo hogar a la lista local inmediatamente
    setMisHogares([...misHogares, ...data]);
    setTempHogar(nombreHogar.toUpperCase());
  }
};
const handleConfirmar = async () => {
    if (!tempHogar) return;
    setLoading(true);
    
    // Buscamos hogares que coincidan con el código
    const { data: hogares, error: fetchError } = await supabase
      .from('hogares')
      .select('id')
      .eq('codigo', tempHogar.toUpperCase())
      .eq('creador_id', userId); // ¡IMPORTANTE! Solo los del usuario actual

    if (fetchError || !hogares || hogares.length === 0) {
      console.error("Hogar no encontrado o error:", fetchError);
      setLoading(false);
      return;
    }

    // Tomamos el primero que encuentre de los que son MÍOS
    const hogarElegido = hogares[0];

    const { error: updateError } = await supabase
      .from('perfiles')
      .update({ hogar_id: hogarElegido.id }) 
      .eq('id', userId);

    if (updateError) {
      console.error("Error al asignar hogar:", updateError);
    } else {
      onHogarSet(tempHogar.toUpperCase());
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center max-w-sm w-full">
        <h2 className="text-white text-xl font-bold mb-4">¡Bienvenido!</h2>
        <p className="text-slate-400 mb-4 text-sm">Seleccioná tu hogar:</p>
        
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
<input 
  className="w-full p-2 mb-2 bg-slate-950 text-white border border-slate-700 rounded-lg uppercase" 
  placeholder="Ingresá código de hogar" 
  value={tempHogar} 
  onChange={(e) => setTempHogar(e.target.value.toUpperCase())} 
/>

{tempHogar.length >= 3 && (
  <div className="mb-4">
    {existe === true ? (
      <p className="text-emerald-500 text-xs">✅ Hogar encontrado. ¡Podés unirte!</p>
    ) : existe === false ? (
      <p className="text-amber-500 text-xs">⚠️ El hogar no existe. Podés crearlo.</p>
    ) : null}
  </div>
)}

<button 
  onClick={existe ? handleConfirmar : () => handleCrearHogar(tempHogar)} 
  disabled={loading || tempHogar.length < 3}
  className="bg-indigo-600 text-white w-full p-2 rounded-lg font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
>
  {loading ? 'Procesando...' : (existe ? 'Unirse al Hogar' : 'Crear nuevo Hogar')}
</button>
        <button 
          onClick={handleConfirmar} 
          disabled={loading}
          className="bg-indigo-600 text-white w-full p-2 rounded-lg font-bold hover:bg-indigo-500 transition-colors"
        >
          {loading ? 'Procesando...' : 'Confirmar y Activar'}
        </button>
      </div>
    </div>
  );
}