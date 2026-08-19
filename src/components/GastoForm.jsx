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

  // Cada vez que 'gastoEditando' cambie, el formulario se autorellena y abre el modal
  useEffect(() => {
    if (gastoEditando) {
      setMonto(gastoEditando.monto);
      setDescripcion(gastoEditando.descripcion);
      setCategoriaId(gastoEditando.categoria_id);
      setIsOpen(true); // Se abre automáticamente al editar
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
      setIsOpen(false); // Cierra el modal al guardar con éxito
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
      {/* Botón para abrir el modal de Nuevo Gasto (si no se está editando) */}
      {!gastoEditando && (
        <button
  onClick={() => setIsOpen(true)}
  className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
>
  <span><FaPlus /></span> Cargar Nuevo Gasto
</button>
      )}

      {/* Modal que solo se muestra si isOpen es true */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center dark:bg-black/60 bg-white/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-md dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-2xl p-6 shadow relative animate-in fade-in zoom-in duration-200">

            {/* Botón de cierre superior (X) */}
            <button
              type="button"
              onClick={cerrarModal}
              className="absolute top-4 right-4 dark:text-slate-400 text-slate-400 dark:hover:text-white hover:text-slate-950 transition-colors text-lg font-bold"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold uppercase mb-4 text-slate-950 dark:text-white">
              {gastoEditando ? 'Editar Gasto' : 'Cargar Nuevo Gasto'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                type="number"
                placeholder="Monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full dark:bg-slate-950 bg-white border border-slate-800 rounded-full p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                autoFocus
              />

              <input
                required
                type="text"
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full dark:bg-slate-950 bg-white border border-slate-800 rounded-full p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />

              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full dark:bg-slate-950 bg-white border border-slate-800 rounded-full p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              >
                <option value="">Seleccionar categoría...</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>

              <div className="flex gap-2 pt-2">
                <button
                  disabled={cargando}
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg py-3 font-bold transition text-white shadow-lg shadow-cyan-600/30 disabled:opacity-50"
                >
                  {cargando ? 'Guardando...' : (gastoEditando ? 'Actualizar Gasto' : 'Confirmar')}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={cargando}
                  className="px-4 py-3 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition font-bold"
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