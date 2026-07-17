import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function GastoForm({ gastoEditando, categorias, onGuardar, onCancelar, hogarId, sesionId }) {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [cargando, setCargando] = useState(false);

  // Cada vez que 'gastoEditando' cambie, el formulario se autorellena
  useEffect(() => {
    if (gastoEditando) {
      setMonto(gastoEditando.monto);
      setDescripcion(gastoEditando.descripcion);
      setCategoriaId(gastoEditando.categoria_id);
    } else {
      setMonto('');
      setDescripcion('');
      setCategoriaId('');
    }
  }, [gastoEditando]);

const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    const payload = { 
    monto: parseFloat(monto), 
    descripcion: descripcion, 
    categoria_id: categoriaId,
    hogar_id: hogarId,        // Correcto según tu tabla
    pagado_por: sesionId      // Correcto según tu tabla
};

    try {
        if (gastoEditando) {
            const { error } = await supabase.from('gastos').update(payload).eq('id', gastoEditando.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('gastos').insert([payload]);
            if (error) throw error; // <--- Si falla, esto saltará al catch
        }
        
        onGuardar();
        setMonto('');
        setDescripcion('');
        setCategoriaId('');
    } catch (error) {
        console.error("Error detallado de Supabase:", error);
        alert("Error al guardar: " + error.message); // Esto te va a decir POR QUÉ falla
    } finally {
        setCargando(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-xl border bg-slate-900/30 border-slate-900 space-y-4">
      <h3 className="text-sm font-bold uppercase text-slate-400">
        {gastoEditando ? 'Editar Gasto' : 'Cargar Nuevo Gasto'}
      </h3>
      
      <input 
        required type="number" placeholder="Monto" value={monto} 
        onChange={(e) => setMonto(e.target.value)} 
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
      />
      
      <input 
        required type="text" placeholder="Descripción" value={descripcion} 
        onChange={(e) => setDescripcion(e.target.value)} 
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
      />
      
      <select 
        required value={categoriaId} 
        onChange={(e) => setCategoriaId(e.target.value)} 
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
      >
        <option value="">Seleccionar categoría...</option>
        {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
      </select>

      <div className="flex gap-2">
        <button disabled={cargando} type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg py-2.5 font-bold transition">
          {cargando ? 'Guardando...' : (gastoEditando ? 'Actualizar' : 'Confirmar')}
        </button>
        {gastoEditando && (
          <button type="button" onClick={onCancelar} className="px-4 text-slate-500 hover:text-white transition">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}