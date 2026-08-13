import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import HistorialGastos from './HistorialGastos';
import GastoForm from './GastoForm';
import CategoriaForm from './CategoriaForm';
import TransferenciaForm from './TransferenciaForm';
import { FaFolder, FaPen } from "react-icons/fa";
import { obtenerEstiloCategoria } from "../utils/gastosUtils";
import { useTheme } from '../context/ThemeContext.jsx';

export default function GestionGastos({ hogarId, sesion }) {
    const { theme } = useTheme();
    const [gastos, setGastos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [miembros, setMiembros] = useState([]);
    const [transferencias, setTransferencias] = useState([]);
    const [categoriaEditando, setCategoriaEditando] = useState(null);
    const [gastoEditando, setGastoEditando] = useState(null);
    const [tabActiva, setTabActiva] = useState('todos');

    const traerCategorias = async () => {
        if (!hogarId) return;
        const { data } = await supabase.from('categorias').select('*').eq('hogar_id', hogarId);
        setCategorias(data || []);
    };

    const traerGastos = async () => {
        if (!hogarId) return;
        const { data } = await supabase.from('gastos').select(`*, categorias (*), perfiles (*)`).eq('hogar_id', hogarId);
        setGastos(data || []);
    };

    const traerMiembros = async () => {
        if (!hogarId) return;
        const { data } = await supabase.from('perfiles').select('*').eq('hogar_id', hogarId);
        setMiembros(data || []);
    };

    const traerTransferencias = async () => {
        if (!hogarId) return;
        const { data } = await supabase.from('transferencias').select('*').eq('hogar_id', hogarId);
        setTransferencias(data || []);
    };

    useEffect(() => {
        if (hogarId) {
            traerCategorias();
            traerGastos();
            traerMiembros();
            traerTransferencias();
        }
    }, [hogarId]);

    const eliminarTransferencia = async (id) => {
        if (!window.confirm("¿Seguro querés eliminar esta transferencia?")) return;
        const { error } = await supabase.from('transferencias').delete().eq('id', id);
        if (error) alert("Error al eliminar: " + error.message);
        else traerTransferencias();
    };

    const eliminarGasto = async (gasto) => {
        if (!window.confirm("¿Seguro querés eliminar este gasto?")) return;
        const { error } = await supabase.from('gastos').delete().eq('id', gasto.id);
        if (error) alert("Error al eliminar: " + error.message);
        else traerGastos();
    };

    const gastosFiltrados = tabActiva === 'todos'
        ? gastos
        : gastos.filter(g => (g.perfiles?.nombre || g.perfiles?.email || 'Invitado') === tabActiva);

    const nombresUsuarios = [...new Set(gastos.map(g => g.perfiles?.nombre || g.perfiles?.email || 'Invitado'))];

    return (
        <div className="space-y-10">
            {/* Formularios: Categoría, Gasto y Transferencia */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="w-full">
                    <CategoriaForm
                        hogarId={hogarId}
                        categoriaEditando={categoriaEditando}
                        onGuardar={() => {
                            traerCategorias();
                            traerGastos();
                            setCategoriaEditando(null);
                        }}
                        onCancelar={() => setCategoriaEditando(null)}
                        onEliminar={async (id) => {
                            if (!window.confirm("¿Seguro querés eliminar esta categoría?")) return;
                            await supabase.from('categorias').delete().eq('id', id);
                            traerCategorias(); traerGastos(); setCategoriaEditando(null);
                        }}
                    />
                </div>

                <div className="w-full">
                    <GastoForm
                        categorias={categorias}
                        gastoEditando={gastoEditando}
                        hogarId={hogarId}
                        sesionId={sesion?.user?.id}
                        onGuardar={() => { setGastoEditando(null); traerGastos(); }}
                        onCancelar={() => setGastoEditando(null)}
                    />
                </div>

                <div className="w-full">
                    <TransferenciaForm
                        hogarId={hogarId}
                        sesionId={sesion?.user?.id}
                        miembros={miembros}
                        onGuardar={() => traerTransferencias()}
                    />
                </div>
            </div>

            {/* Listado de Categorías */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FaFolder className="text-indigo-400" size={14} /> Categorías
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                    {categorias.map(cat => {
                        const total = gastos.filter(g => g.categoria_id === cat.id).reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0);
                        return (
                            <div key={cat.id} className="p-4 border rounded-xl relative group w-full" style={obtenerEstiloCategoria(cat, theme, true)}>
                                <span className="block text-[10px] uppercase font-bold opacity-80 truncate">{cat.nombre}</span>
                                <div className="text-xl font-black mt-1">${total.toLocaleString('es-AR')}</div>
                                <button onClick={() => setCategoriaEditando(cat)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                                    <FaPen size={12} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Historial de Gastos y Pestañas */}
            <div className="space-y-4">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    <button
                        onClick={() => setTabActiva('todos')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${tabActiva === 'todos' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                        Todos
                    </button>
                    {nombresUsuarios.map(nombre => (
                        <button
                            key={nombre}
                            onClick={() => setTabActiva(nombre)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${tabActiva === nombre ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                        >
                            {nombre}
                        </button>
                    ))}
                </div>

                <HistorialGastos
                    gastos={gastosFiltrados}
                    sesionId={sesion?.user?.id}
                    onEditar={(gasto) => setGastoEditando(gasto)}
                    onEliminar={(gasto) => eliminarGasto(gasto)}
                />
            </div>

            {/* Listado de Transferencias */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
                    Transferencias Registradas
                </h3>
                {transferencias.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm mb-2">
                        <div>
                            <span className="text-slate-400 block text-xs">Fecha: {new Date(t.fecha).toLocaleDateString()}</span>
                            <span className="text-white font-medium">Monto: <strong className="text-emerald-400">${Number(t.monto).toLocaleString('es-AR')}</strong></span>
                        </div>
                        {t.enviado_por === sesion?.user?.id && (
                            <button
                                onClick={() => eliminarTransferencia(t.id)}
                                className="text-red-400 hover:text-red-300 transition-colors text-xs font-bold"
                            >
                                Eliminar
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}