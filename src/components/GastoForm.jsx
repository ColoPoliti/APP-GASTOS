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
      hogar_id: hogarId,        
      pagado_por: sesionId      
    };

    try {
        if (gastoEditando) {
            const { error } = await supabase.from('gastos').update(payload).eq('id', gastoEditando.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('gastos').insert([payload]);
            if (error) throw error;
        }
        
        onGuardar();
        setMonto('');
        setDescripcion('');
        setCategoriaId('');
    } catch (error) {
        console.error("Error detallado de Supabase:", error);
        alert("Error al guardar: " + error.message);
    } finally {
        setCargando(false);
    }
  };

  // Estructura interna del formulario
  const contenidoFormulario = (
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

  // Si se está editando un gasto, envolvemos el formulario en un modal flotante
  if (gastoEditando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
          
          {/* Botón de cierre superior (X) */}
          <button 
            type="button"
            onClick={onCancelar}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg font-bold"
          >
            ✕
          </button>

          <h3 className="text-base font-bold uppercase mb-4 text-white">Editar Gasto</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              required type="number" placeholder="Monto" value={monto} 
              onChange={(e) => setMonto(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600" 
            />
            
            <input 
              required type="text" placeholder="Descripción" value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600" 
            />
            
            <select 
              required value={categoriaId} 
              onChange={(e) => setCategoriaId(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600"
            >
              <option value="">Seleccionar categoría...</option>
              {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
            </select>

            <div className="flex gap-2 pt-2">
              <button disabled={cargando} type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg py-3 font-bold transition text-white shadow-lg shadow-indigo-600/30">
                {cargando ? 'Guardando...' : 'Actualizar Gasto'}
              </button>
              <button type="button" onClick={onCancelar} className="px-4 py-3 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition font-bold">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return contenidoFormulario;
}