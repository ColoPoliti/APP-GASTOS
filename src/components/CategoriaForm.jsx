import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function CategoriaForm({ hogarId, categoriaEditando, onGuardar, onCancelar, onEliminar }) {
    const [nombre, setNombre] = useState('');
    const [color, setColor] = useState('#6366f1');

    useEffect(() => {
        if (categoriaEditando) {
            setNombre(categoriaEditando.nombre);
            setColor(categoriaEditando.color || '#6366f1');
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
        onGuardar(); 
    };

    // Si hay una categoría editándose, envolvemos el formulario en un Modal
    const contenidoFormulario = (
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
            <h3 className="text-sm font-bold uppercase mb-3 text-indigo-400">
                {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <form onSubmit={manejarSubmit} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Nombre categoría"
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 uppercase text-white outline-none focus:border-indigo-500" 
                />
                <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)} 
                    className="w-10 h-10 cursor-pointer bg-transparent" 
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 rounded-lg font-bold">
                    {categoriaEditando ? '✅' : '➕'}
                </button>
                
                {categoriaEditando && (
                    <>
                        <button type="button" onClick={onCancelar} className="bg-slate-700 text-white px-3 rounded-lg">X</button>
                        <button type="button" onClick={() => onEliminar(categoriaEditando.id)} className="bg-rose-600 text-white px-3 rounded-lg">🗑️</button>
                    </>
                )}
            </form>
        </div>
    );

    // Si está editando, mostramos el modal flotante. Si no, se renderiza normal en su lugar.
    if (categoriaEditando) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                    
                    {/* Botón de cierre superior */}
                    <button 
                        type="button"
                        onClick={onCancelar}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg font-bold"
                    >
                        ✕
                    </button>

                    <h3 className="text-base font-bold uppercase mb-4 text-white">Editar Categoría</h3>
                    
                    <form onSubmit={manejarSubmit} className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Nombre categoría"
                            value={nombre} 
                            onChange={(e) => setNombre(e.target.value)} 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 uppercase text-white outline-none focus:border-indigo-500" 
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
                            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold transition-colors">
                                Actualizar
                            </button>
                            <button type="button" onClick={() => onEliminar(categoriaEditando.id)} className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-4 rounded-lg font-bold transition-colors border border-rose-900">
                                🗑️
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return contenidoFormulario;
}