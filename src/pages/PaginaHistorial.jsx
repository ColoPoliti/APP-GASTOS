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
 <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 my-6 overflow-x-hidden">
    <h1 className="text-3xl font-black mb-1  mt-12 text-dark dark:text-slate-100">Historial de Gastos</h1>
     <p className="text-slate-400 text-sm">Distribución de Gastos por Usuario</p>
         <hr className="border-slate-800 my-6" />
    <TablaGastos gastos={gastosValidos} />
</div>
  );
}
