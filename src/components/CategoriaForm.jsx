import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaPlus } from "react-icons/fa";

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

        if (categoriaEditando) {
            await supabase.from('categorias').update(datos).eq('id', categoriaEditando.id);
        } else {
            await supabase.from('categorias').insert([datos]);
        }

        setNombre('');
        setColor('#6366f1');
        setIsOpen(false);
        onGuardar(); 
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
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                    <span><FaPlus /></span> Nueva Categoría
                </button>
            )}

            {/* Modal que solo se muestra si isOpen es true */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        
                        {/* Botón de cierre superior */}
                        <button 
                            type="button"
                            onClick={cerrarModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg font-bold"
                        >
                            ✕
                        </button>

                        <h3 className="text-base font-bold uppercase mb-4 text-white">
                            {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h3>
                        
                        <form onSubmit={manejarSubmit} className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Nombre categoría"
                                value={nombre} 
                                onChange={(e) => setNombre(e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 uppercase text-white outline-none focus:border-indigo-500" 
                                autoFocus
                            />
                            
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-400">Color de etiqueta:</span>
                                <input 
                                    type="color" 
                                    value={color} 
                                    onChange={(e) => setColor(e.target.value)} 
                                    className="w-10 h-10 cursor-pointer bg-transparent rounded-lg" 
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold transition-colors"
                                >
                                    {categoriaEditando ? 'Actualizar' : 'Guardar'}
                                </button>

                                {categoriaEditando && (
                                    <button 
                                        type="button" 
                                        onClick={() => onEliminar(categoriaEditando.id)} 
                                        className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-4 rounded-lg font-bold transition-colors border border-rose-900"
                                    >
                                        🗑️
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