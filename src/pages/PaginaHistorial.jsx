import React, { useState, useEffect } from 'react';
import TablaGastos from '../components/TablaGastos'; // Ajusta la ruta a donde guardaste el componente
import { supabase } from '../supabaseClient'; // Asegúrate de importar tu cliente de supabase



export default function PaginaHistorial() {
  const [gastos, setGastos] = useState([]);
  
  // Asumo que tenés forma de saber el hogarId actual. 
  // Si usas un contexto, tráelo de ahí. Si no, vas a tener que buscarlo.
  const [hogarId, setHogarId] = useState(null); 

  const traerGastos = async (idHogar) => {
    if (!idHogar) return; // Si no hay ID, no traemos nada

    const { data, error } = await supabase
      .from('gastos')
      .select('*, perfiles(nombre), categorias(nombre, color)')
      .eq('hogar_id', idHogar); // <--- ESTO ES LO QUE TE FALTABA, CRACK
    
    if (error) {
      console.error("Error al traer gastos:", error);
    } else {
      setGastos(data || []);
    }
  };

  // Necesitamos obtener el hogarId primero
  useEffect(() => {
    const obtenerHogarYGastos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscamos a qué hogar pertenece el usuario
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('hogar_id')
        .eq('id', user.id)
        .single();

      if (perfil?.hogar_id) {
        setHogarId(perfil.hogar_id);
        traerGastos(perfil.hogar_id); // Llamamos a traerGastos con el ID encontrado
      }
    };

    obtenerHogarYGastos();
  }, []);

  const gastosValidos = gastos.filter(gasto => gasto.categorias !== null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Historial de Gastos</h1>
      <TablaGastos gastos={gastosValidos} />
    </div>
  );
}