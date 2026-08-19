import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaPlus, FaTrash, FaTimes } from "react-icons/fa";
import toast from 'react-hot-toast';

export default function CategoriaForm({ hogarId, categoriaEditando, onGuardar, onCancelar, onEliminar }) {
    const [nombre, setNombre] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (categoriaEditando) {
            setNombre(categoriaEditando.nombre);
            setColor(categoriaEditando.color || '#6366f1');
            setIsOpen(true); // Se abre automáticamente si estamos editando
        } else {
            setNombre('');
            setColor('#6366f1');
        }
    }, [categoriaEditando]);

    const manejarSubmit = async (e) => {
        e.preventDefault();
        if (!nombre) return;

        const datos = { nombre: nombre.toUpperCase(), hogar_id: hogarId, color };

        try {
            if (categoriaEditando) {
                const { error } = await supabase.from('categorias').update(datos).eq('id', categoriaEditando.id);
                if (error) throw error;
                toast.success('¡Categoría actualizada con éxito!', { position: 'bottom-center' });
            } else {
                const { error } = await supabase.from('categorias').insert([datos]);
                if (error) throw error;
                toast.success('¡Categoría creada con éxito!', { position: 'bottom-center' });
            }

            setNombre('');
            setColor('#6366f1');
            setIsOpen(false);
            onGuardar();
        } catch (error) {
            console.error("Error al guardar categoría:", error);
            toast.error("Error al guardar categoría: " + error.message, { position: 'bottom-center' });
        }
    };

    const cerrarModal = () => {
        setIsOpen(false);
        if (onCancelar) onCancelar();
    };

    return (
        <>
            {/* Botón para abrir el modal de Nueva Categoría (si no se está editando) */}
            {!categoriaEditando && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                    <span><FaPlus /></span> Nueva Categoría
                </button>
            )}

            {/* Modal que solo se muestra si isOpen es true */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center dark:bg-black/60 bg-white/20 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md dark:bg-slate-900 bg-white border border-slate-200  dark:border-slate-800 rounded-2xl p-6 shadow relative animate-in fade-in zoom-in duration-200">

                        {/* Botón de cierre superior */}
                        <button
                            type="button"
                            onClick={cerrarModal}
                            className="absolute top-4 right-4 dark:text-slate-400 text-slate-400 dark:hover:text-white hover:text-slate-900 transition-colors text-lg font-bold"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>

                        <h3 className="text-base font-bold uppercase mb-4 text-slate-900 dark:text-white">
                            {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h3>

                        <form onSubmit={manejarSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre categoría"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full dark:bg-slate-950 bg-white border border-slate-800 rounded-full p-2.5 uppercase text-slate-700 dark:text-white outline-none focus:border-indigo-500"
                                autoFocus
                            />

                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-400">Color de etiqueta:</span>

                                {/* Contenedor circular que corta lo que sobresale */}
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700 flex items-center justify-center cursor-pointer bg-slate-900">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-14 h-14 -m-2 cursor-crosshair bg-transparent border-none p-0"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-m hover:bg-indigo-500 text-white py-3 rounded-lg  text-m font-bold transition-colors"
                                >
                                    {categoriaEditando ? 'Actualizar' : 'Guardar'}
                                </button>

                                {categoriaEditando && (
                                    <button
                                        type="button"
                                        onClick={() => onEliminar(categoriaEditando.id)}
                                        className="bg-red-700 hover:bg-red-500 text-white hover:text-white px-4 rounded-lg font-bold transition-colors"
                                    >
                                        <FaTrash className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}