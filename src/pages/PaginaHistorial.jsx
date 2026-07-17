import React, { useState, useEffect } from 'react';
import TablaGastos from '../components/TablaGastos'; // Ajusta la ruta a donde guardaste el componente
import { supabase } from '../supabaseClient'; // Asegúrate de importar tu cliente de supabase



export default function PaginaHistorial() {
  const [gastos, setGastos] = useState([]);
  const gastosValidos = gastos.filter(gasto => gasto.categorias !== null);


  const traerGastos = async () => {
    const { data, error } = await supabase
      .from('gastos')
      .select('*, perfiles(nombre), categorias(nombre, color)');
    
    if (error) {
      console.error("Error al traer gastos:", error);
    } else {
      setGastos(data || []); // 2. Guardamos en el estado
    }
  };

  useEffect(() => {
    traerGastos();
  }, []); // 3. EL ARRAY VACÍO ES LO MÁS IMPORTANTE PARA QUE NO SE CUEGUE

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Historial de Gastos</h1>
      {/* 4. Pasamos los datos al componente */}
      <TablaGastos gastos={gastosValidos} />
    </div>
  );
}