import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import HistorialGastos from './HistorialGastos';
import GastoForm from './GastoForm';
import CategoriaForm from './CategoriaForm';
import TransferenciaForm from './TransferenciaForm';
import { FaFolder, FaPen, FaChevronLeft, FaChevronRight } from "react-icons/fa";
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
    const [categoriaActual, setCategoriaActual] = useState(0);

    // Estados para la paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const gastosPorPagina = 5;

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

    // 1. Filtramos por la solapa activa
    const gastosFiltrados = tabActiva === 'todos'
        ? gastos
        : gastos.filter(g => (g.perfiles?.nombre || g.perfiles?.email || 'Invitado') === tabActiva);

    // 2. Ordenamos del más nuevo al más viejo
    const gastosOrdenados = [...gastosFiltrados].sort((a, b) => {
        return new Date(b.created_at || b.fecha || 0) - new Date(a.created_at || a.fecha || 0);
    });

    // 3. Cálculos de Paginación seguros
    const totalPaginas = Math.max(1, Math.ceil(gastosOrdenados.length / gastosPorPagina));
    const paginaSegura = Math.min(paginaActual, totalPaginas);
    
    const indiceUltimoGasto = paginaSegura * gastosPorPagina;
    const indicePrimerGasto = indiceUltimoGasto - gastosPorPagina;
    const gastosPaginados = gastosOrdenados.slice(indicePrimerGasto, indiceUltimoGasto);

    const nombresUsuarios = [...new Set(gastos.map(g => g.perfiles?.nombre || g.perfiles?.email || 'Invitado'))];

    const cambiarTab = (nuevoTab) => {
        setTabActiva(nuevoTab);
        setPaginaActual(1);
    };

    const moverCarrusel = (direccion) => {
        if (categorias.length === 0) return;
        const nuevoIndice = categoriaActual + direccion;
        if (nuevoIndice < 0 || nuevoIndice >= categorias.length) return;
        irACategoria(nuevoIndice);
    };

    const irACategoria = (index) => {
        setCategoriaActual(index);
        const carrusel = document.getElementById('categorias-carrusel');
        if (!carrusel) return;
        const tarjeta = carrusel.children[index];
        if (tarjeta) {
            tarjeta.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    const detectarScrollCarrusel = (e) => {
        if (window.innerWidth >= 640) return;
        const carrusel = e.currentTarget;
        const tarjetas = carrusel.children;
        if (!tarjetas.length) return;
        const primeraTarjeta = tarjetas[0];
        const anchoTarjeta = primeraTarjeta.offsetWidth + 12;
        const nuevoIndice = Math.round(carrusel.scrollLeft / anchoTarjeta);
        setCategoriaActual(Math.max(0, Math.min(nuevoIndice, categorias.length - 1)));
    };

    return (
        <div className="w-full max-w-full overflow-x-hidden space-y-8 sm:space-y-10 box-border">
            {/* Formularios: Categoría y Gasto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full max-w-full">
                <div className="w-full min-w-0">
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

                <div className="w-full min-w-0">
                    <GastoForm
                        categorias={categorias}
                        gastoEditando={gastoEditando}
                        hogarId={hogarId}
                        sesionId={sesion?.user?.id}
                        onGuardar={() => { setGastoEditando(null); traerGastos(); }}
                        onCancelar={() => setGastoEditando(null)}
                    />
                </div>
            </div>

            {/* Listado de Categorías (Carrusel) */}
            <div className="space-y-3 w-full max-w-full">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FaFolder className="text-indigo-400" size={14} /> Categorías
                </h3>

                <div className="relative w-full max-w-full">
                    {categorias.length > 1 && (
                        <button
                            type="button"
                            onClick={() => moverCarrusel(-1)}
                            disabled={categoriaActual === 0}
                            className={`sm:hidden absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/90 border border-slate-600 text-white text-2xl shadow-lg transition-all ${
                                categoriaActual === 0 ? 'opacity-30' : 'opacity-100 active:scale-90'
                            }`}
                        >
                            ‹
                        </button>
                    )}

                    <div
                        id="categorias-carrusel"
                        onScroll={detectarScrollCarrusel}
                        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 pb-2 w-full max-w-full sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:overflow-visible sm:pb-0"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {categorias.map((cat) => {
                            const total = gastos.filter(g => g.categoria_id === cat.id).reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0);
                            return (
                                <div
                                    key={cat.id}
                                    className="p-4 border rounded-xl relative group flex-none w-[72vw] max-w-[260px] sm:w-auto sm:flex-auto snap-center box-border"
                                    style={obtenerEstiloCategoria(cat, theme, true)}
                                >
                                    <span className="block text-[10px] uppercase font-bold opacity-80 truncate pr-6">{cat.nombre}</span>
                                    <div className="text-xl font-black mt-1">${total.toLocaleString('es-AR')}</div>
                                    <button
                                        type="button"
                                        onClick={() => setCategoriaEditando(cat)}
                                        className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-400"
                                    >
                                        <FaPen size={12} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {categorias.length > 1 && (
                        <button
                            type="button"
                            onClick={() => moverCarrusel(1)}
                            disabled={categoriaActual === categorias.length - 1}
                            className={`sm:hidden absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/90 border border-slate-600 text-white text-2xl shadow-lg transition-all ${
                                categoriaActual === categorias.length - 1 ? 'opacity-30' : 'opacity-100 active:scale-90'
                            }`}
                        >
                            ›
                        </button>
                    )}
                </div>

                {categorias.length > 1 && (
                    <div className="flex sm:hidden justify-center items-center gap-1.5 mt-2">
                        {categorias.map((cat, index) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => irACategoria(index)}
                                aria-label={`Ir a categoría ${index + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    categoriaActual === index ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-600'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Historial de Gastos, Pestañas y Paginación */}
            <div className="space-y-4 w-full max-w-full">
                {/* Pestañas (Tabs) */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 w-full max-w-full" style={{ scrollbarWidth: 'none' }}>
                    <button
                        onClick={() => cambiarTab('todos')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2 ${tabActiva === 'todos' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                        <span>Todos</span> 
                        <span className={`px-2 py-0.5 rounded-full text-xs ${tabActiva === 'todos' ? 'bg-pink-600 text-white' : 'bg-pink-800/50 text-slate-300'}`}>
                            {gastos.length}
                        </span>
                    </button>
                    {nombresUsuarios.map(nombre => {
                        const cant = gastos.filter(g => (g.perfiles?.nombre || g.perfiles?.email || 'Invitado') === nombre).length;
                        return (
                            <button
                                key={nombre}
                                onClick={() => cambiarTab(nombre)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2 ${tabActiva === nombre ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                            >
                                <span>{nombre}</span> 
                                <span className={`px-2 py-0.5 rounded-full text-xs ${tabActiva === nombre ? 'bg-pink-600 text-white' : 'bg-pink-800/50 text-slate-300'}`}>
                                    {cant}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Listado de Gastos Paginados */}
                <div className="w-full max-w-full overflow-x-auto">
                    <HistorialGastos
                        gastos={gastosPaginados}
                        sesionId={sesion?.user?.id}
                        onEditar={(gasto) => setGastoEditando(gasto)}
                        onEliminar={(gasto) => eliminarGasto(gasto)}
                    />
                </div>

                {/* Controles de Paginación */}
                <div className="flex justify-between items-center pt-2 px-1 shadow-lg bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/65 w-full box-border">
                    <button
                        onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                        disabled={paginaSegura <= 1}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg transition-all"
                    >
                        <FaChevronLeft size={10} /> Anterior
                    </button>
                    
                    <span className="text-xs text-slate-400 font-medium text-center">
                        Página <strong className="text-white font-bold">{paginaSegura}</strong> de <strong className="text-white font-bold">{totalPaginas}</strong>
                        <span className="hidden sm:inline text-slate-500 ml-2">({gastosFiltrados.length} gastos)</span>
                    </span>

                    <button
                        onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                        disabled={paginaSegura >= totalPaginas}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg transition-all"
                    >
                        Siguiente <FaChevronRight size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
}