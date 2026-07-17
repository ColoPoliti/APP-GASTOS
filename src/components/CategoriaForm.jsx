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

    return (
        <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
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
        </section>
    );
}