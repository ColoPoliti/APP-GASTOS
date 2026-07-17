import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import { useUser } from "../context/UserContext.jsx";
import { useTheme } from '../context/ThemeContext.jsx';
import HistorialGastos from '../components/HistorialGastos';
import GastoForm from '../components/GastoForm';
import CategoriaForm from '../components/CategoriaForm';
import ResumenDeudas from '../components/ResumenDeudas';
import { FaPen } from "react-icons/fa";
import SetupHogar from '../components/SetupHogar';
import InvitarColaborador from '../components/InvitarColaborador';


export default function Dashboard() {
    // Usamos solo UserContext como fuente de verdad
    const { loading, sesion, hogarId, setHogarId, nombreUsuario, nombreHogar } = useUser();
    const { esModoOscuro } = useTheme();
    const [tabActiva, setTabActiva] = useState('todos');
    const [gastos, setGastos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [categoriaEditando, setCategoriaEditando] = useState(null);
    const [gastoEditando, setGastoEditando] = useState(null);

    const iniciarEdicion = (gasto) => {
        setGastoEditando(gasto);
    };

    const eliminarGasto = async (gasto) => {
        if (!window.confirm("¿Seguro querés eliminar este gasto?")) return;

        const { error } = await supabase
            .from('gastos')
            .delete()
            .eq('id', gasto.id);

        if (error) {
            console.error("Error al eliminar:", error);
            alert("Error al eliminar: " + error.message);
        } else {
            traerGastos();
        }
    };

    const gastosFiltrados = tabActiva === 'todos'
        ? gastos
        : gastos.filter(g => (g.perfiles?.nombre || g.perfiles?.email || 'Invitado') === tabActiva);

    useEffect(() => {
        if (hogarId) {
            traerCategorias();
            traerGastos();
            traerNombreHogar();
        }
    }, [hogarId]);

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

    const obtenerEstiloCategoria = (categoria, conBordeIzquierdo = false) => {
        const color = categoria?.color || '#6366f1';
        const baseStyle = { backgroundColor: `${color}20`, color: color, border: `1px solid ${color}50` };
        return conBordeIzquierdo ? { ...baseStyle, borderLeftWidth: '7px', borderLeftColor: color } : baseStyle;
    };

    const traerNombreHogar = async () => {
        if (!hogarId) return;
        const { data, error } = await supabase
            .from('hogares') // O la tabla donde tengas el nombre
            .select('nombre')
            .eq('id', hogarId)
            .single();

        if (data) setNombreHogar(data.nombre);
    };
    const nombresUsuarios = [...new Set(gastos.map(g => g.perfiles?.nombre || g.perfiles?.email || 'Invitado'))];

    if (loading) return <div>Cargando...</div>;
    if (!sesion) return <div>Debes iniciar sesión</div>;

    if (sesion && !hogarId) {
        return (
            <SetupHogar
                userId={sesion.user.id}
                onHogarSet={(nuevoId) => setHogarId(nuevoId)}
            />
        );
    }

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-white transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <h1 className="text-4xl font-black mb-10">¡Hola, {nombreUsuario}!</h1>
                <p>Estás gestionando el hogar: {nombreHogar}</p>
                <ResumenDeudas gastos={gastos} />

                <section className="mt-6 mb-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {categorias.map(cat => {
                        const total = gastos.filter(g => g.categoria_id === cat.id).reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0);
                        const estilo = obtenerEstiloCategoria(cat, true);
                        return (
                            <div key={cat.id} className="p-4 border rounded-xl relative group" style={estilo}>
                                <span className="block text-[10px] uppercase font-bold opacity-80">{cat.nombre}</span>
                                <div className="text-2xl font-black font-mono">${total.toLocaleString('es-AR')}</div>
                                <button onClick={() => setCategoriaEditando(cat)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FaPen size={12} />
                                </button>
                            </div>
                        );
                    })}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-10">
                    <div className="md:col-span-5 space-y-8">
                        <CategoriaForm
                            hogarId={hogarId}
                            categoriaEditando={categoriaEditando}
                            onGuardar={() => {
                                traerCategorias();
                                setCategoriaEditando(null);
                            }}
                            onCancelar={() => setCategoriaEditando(null)}
                            onEliminar={async (id) => {
                                if (!window.confirm("¿Seguro querés eliminar esta categoría?")) return;
                                await supabase.from('categorias').delete().eq('id', id);
                                traerCategorias();
                                traerGastos();
                                setCategoriaEditando(null);
                            }}
                        />
                        <GastoForm
                            categorias={categorias}
                            gastoEditando={gastoEditando}
                            hogarId={hogarId}
                            sesionId={sesion?.user?.id}
                            onGuardar={() => {
                                setGastoEditando(null);
                                traerGastos();
                            }}
                            onCancelar={() => setGastoEditando(null)}
                        />
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                            <h3 className="text-sm font-bold text-slate-400 mb-4">Invitar colaborador</h3>
                            <InvitarColaborador hogarId={hogarId} />
                        </div>
                    </div>
                    <div className="md:col-span-7">
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setTabActiva('todos')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold ${tabActiva === 'todos' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                            >
                                Todos
                            </button>
                            {nombresUsuarios.map(nombre => (
                                <button
                                    key={nombre}
                                    onClick={() => setTabActiva(nombre)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold ${tabActiva === nombre ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                >
                                    {nombre}
                                </button>
                            ))}
                        </div>
                        <HistorialGastos
                            gastos={gastosFiltrados}
                            sesionId={sesion?.user?.id}
                            onEditar={(gasto) => iniciarEdicion(gasto)}
                            onEliminar={(gasto) => eliminarGasto(gasto)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}