import React, { useState, useEffect } from 'react';
import TablaGastos from '../components/TablaGastos'; // Ajusta la ruta a donde guardaste el componente
import { supabase } from '../supabaseClient'; // Asegúrate de importar tu cliente de supabase

export default function PaginaHistorial() {
  const [gastos, setGastos] = useState([]);
  const [hogarId, setHogarId] = useState(null); 

  const traerGastos = async (idHogar) => {
    if (!idHogar) return;

    // CORRECCIÓN: Traemos la relación completa de categorías con `categorias(*)` 
    // para que no falte ningún campo de color o ID necesario para los estilos.
    const { data, error } = await supabase
      .from('gastos')
      .select('*, perfiles(nombre), categorias(*)')
      .eq('hogar_id', idHogar);
    
    if (error) {
      console.error("Error al traer gastos:", error);
    } else {
      setGastos(data || []);
    }
  };

  useEffect(() => {
    const obtenerHogarYGastos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('hogar_id')
        .eq('id', user.id)
        .single();

      if (perfil?.hogar_id) {
        setHogarId(perfil.hogar_id);
        traerGastos(perfil.hogar_id);
      }
    };

    obtenerHogarYGastos();
  }, []);

  const gastosValidos = gastos.filter(gasto => gasto.categorias !== null);

  return (
    <div className="p-6 mt-9">
      <h1 className="text-2xl font-bold dark:text-white text-slate-950 mb-6">Historial de Gastos</h1>
      <TablaGastos gastos={gastosValidos} />
    </div>
  );
}