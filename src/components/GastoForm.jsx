import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaPlus, FaTrash, FaTimes } from "react-icons/fa";
import toast from 'react-hot-toast';

export default function GastoForm({ gastoEditando, categorias, onGuardar, onCancelar, hogarId, sesionId }) {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [cargando, setCargando] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (gastoEditando) {
      setMonto(gastoEditando.monto);
      setDescripcion(gastoEditando.descripcion);
      setCategoriaId(gastoEditando.categoria_id);
      setIsOpen(true);
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
        toast.success('¡Gasto actualizado con éxito!', { position: 'bottom-center' });
      } else {
        const { error } = await supabase.from('gastos').insert([payload]);
        if (error) throw error;
        toast.success('¡Gasto guardado con éxito!', { position: 'bottom-center' });
      }

      onGuardar();
      setMonto('');
      setDescripcion('');
      setCategoriaId('');
      setIsOpen(false);
    } catch (error) {
      console.error("Error detallado de Supabase:", error);
      toast.error("Error al guardar: " + error.message, { position: 'bottom-center' });
    } finally {
      setCargando(false);
    }
  };

  const cerrarModal = () => {
    setIsOpen(false);
    if (onCancelar) onCancelar();
  };

  return (
    <>
      {!gastoEditando && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <span><FaPlus /></span> Cargar Nuevo Gasto
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center dark:bg-black/60 bg-white/20 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-sm dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">

            <button
              type="button"
              onClick={cerrarModal}
              className="absolute top-3 right-3 dark:text-slate-400 text-slate-400 dark:hover:text-white hover:text-slate-950 transition-colors p-1"
            >
              <FaTimes className="w-4 h-4" />
            </button>

            <h3 className="text-sm sm:text-base font-bold uppercase mb-3 text-slate-950 dark:text-white tracking-wider">
              {gastoEditando ? 'Editar Gasto' : 'Cargar Nuevo Gasto'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 ml-3 uppercase">Monto</label>
                <input
                  required
                  type="number"
                  step="any"
                  placeholder="Ej: 5000"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-white border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 ml-3 uppercase">Descripción</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Supermercado"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-white border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 ml-3 uppercase">Categoría</label>
                <select
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-white border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  disabled={cargando}
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 rounded-xl py-2.5 text-sm font-bold transition text-white shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  {cargando ? 'Guardando...' : (gastoEditando ? 'Actualizar' : 'Confirmar')}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={cargando}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition text-sm font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}