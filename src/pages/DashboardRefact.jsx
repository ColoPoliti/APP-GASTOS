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
import AceptarInvitacion from '../components/AceptarInvitacion';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
    const { loading, sesion, hogarId, nombreUsuario, nombreHogar } = useUser();
    const [cargandoInvitacion, setCargandoInvitacion] = useState(true);
    const [invitacionPendiente, setInvitacionPendiente] = useState(null);
    const [tabActiva, setTabActiva] = useState('todos');
    const [gastos, setGastos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [categoriaEditando, setCategoriaEditando] = useState(null);
    const [gastoEditando, setGastoEditando] = useState(null);

    const verificarInvitaciones = async () => {
        setCargandoInvitacion(true);
        if (sesion?.user?.email) {
            const { data, error } = await supabase
                .from('invitaciones')
                .select('*, hogares(codigo)')
                .eq('email_invitado', sesion.user.email)
                .eq('estado', 'pendiente');

            setInvitacionPendiente(data && data.length > 0 ? data[0] : null);
        }
        setCargandoInvitacion(false);
    };

    useEffect(() => {
        const verificarInvitaciones = async () => {
            if (!sesion?.user?.email) {
                setCargandoInvitacion(false);
                return;
            }

            setCargandoInvitacion(true);
            const { data, error } = await supabase
                .from('invitaciones')
                .select('*, hogares(codigo)')
                .eq('email_invitado', sesion.user.email)
                .eq('estado', 'pendiente');

            if (data && data.length > 0) {
                setInvitacionPendiente(data[0]);
            } else {
                setInvitacionPendiente(null);
            }
            setCargandoInvitacion(false);
        };

        verificarInvitaciones();
    }, [sesion]);

    // --- Lógica de datos ---
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

    useEffect(() => {
        if (hogarId) {
            traerCategorias();
            traerGastos();
        }
    }, [hogarId]);

    const iniciarEdicion = (gasto) => setGastoEditando(gasto);

    const eliminarGasto = async (gasto) => {
        if (!window.confirm("¿Seguro querés eliminar este gasto?")) return;
        const { error } = await supabase.from('gastos').delete().eq('id', gasto.id);
        if (error) alert("Error al eliminar: " + error.message);
        else traerGastos();
    };

    const obtenerEstiloCategoria = (categoria, conBordeIzquierdo = false) => {
        const color = categoria?.color || '#6366f1';
        
        if (conBordeIzquierdo) {
            return {
                backgroundColor: `${color}20`,
                color: color,
                borderTop: `1px solid ${color}50`,
                borderRight: `1px solid ${color}50`,
                borderBottom: `1px solid ${color}50`,
                borderLeft: `7px solid ${color}`
            };
        }

        return {
            backgroundColor: `${color}20`,
            color: color,
            border: `1px solid ${color}50`
        };
    };

    const gastosFiltrados = tabActiva === 'todos'
        ? gastos
        : gastos.filter(g => (g.perfiles?.nombre || g.perfiles?.email || 'Invitado') === tabActiva);

    const nombresUsuarios = [...new Set(gastos.map(g => g.perfiles?.nombre || g.perfiles?.email || 'Invitado'))];

  
    if (cargandoInvitacion || loading) {
        return (
            <div className="min-h-screen dark:bg-slate-950 bg-white flex items-center justify-center text-slate-400">
                Cargando...
            </div>
        );
    }

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-white text-dark transition-colors pt-16 duration-300 pb-20 relative">
            
            {/* 🛑 MODAL DE INVITACIÓN PENDIENTE (BLOQUEA LA PANTALLA ANTES DE TODO) */}
            {invitacionPendiente && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-2xl p-6 shadow-2xl text-center space-y-6 my-auto">
                        <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                            ✉️
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold mb-2">¡Tenés una invitación!</h2>
                            <p className="text-slate-300 text-sm">
                                Te invitaron a unirte al hogar: <strong className="text-indigo-400">{invitacionPendiente.hogares?.codigo}</strong>
                            </p>
                        </div>
                        <div className="pt-2">
                            <AceptarInvitacion
                                invitacion={invitacionPendiente}
                                onAceptado={() => {
                                    window.location.reload();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-6xl mx-auto px-4 py-6">

                {/* ESTRUCTURA CONDICIONAL SECUNDARIA (SI NO TIENE HOGAR) */}
                {!hogarId ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl text-slate-100 font-bold mb-6">Aún no pertenecés a ningún hogar</h2>
                        <SetupHogar
                            userId={sesion.user.id}
                            onHogarSet={() => window.location.reload()}
                        />
                    </div>
                ) : (
                    <>
                        <h1 className="text-4xl font-black mb-10 text-dark dark:text-slate-100">¡Hola, {nombreUsuario}!</h1>
                        <p className="text-slate-400 mb-6">Estás gestionando el hogar: <span className="font-bold text-indigo-400">{nombreHogar}</span></p>
                            <div className="mb-12">
                                <InvitarColaborador hogarId={hogarId} />
                            </div>

                        <ResumenDeudas gastos={gastos} />

                        <section className="mt-6 mb-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {categorias.map(cat => {
                                const total = gastos.filter(g => g.categoria_id === cat.id).reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0);
                                return (
                                    <div key={cat.id} className="p-4 border rounded-xl relative group" style={obtenerEstiloCategoria(cat, true)}>
                                        <span className="block text-[10px] uppercase font-bold opacity-80">{cat.nombre}</span>
                                        <div className="text-2xl font-black font-mono">${total.toLocaleString('es-AR')}</div>
                                        <button onClick={() => setCategoriaEditando(cat)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                                            <FaPen size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-5 space-y-8">
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
                                <GastoForm
                                    categorias={categorias}
                                    gastoEditando={gastoEditando}
                                    hogarId={hogarId}
                                    sesionId={sesion?.user?.id}
                                    onGuardar={() => { setGastoEditando(null); traerGastos(); }}
                                    onCancelar={() => setGastoEditando(null)}
                                />
                                {/* <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-400 mb-4">Invitar colaborador</h3>
                                    <InvitarColaborador hogarId={hogarId} />
                                </div> */}
                            </div>

                            <div className="md:col-span-7">
                                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
                                    onEditar={(gasto) => iniciarEdicion(gasto)}
                                    onEliminar={(gasto) => eliminarGasto(gasto)}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}