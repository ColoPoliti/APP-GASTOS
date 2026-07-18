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
                .select('*, hogares(codigo)') // Aquí es donde hacemos el JOIN
                .eq('email_invitado', sesion.user.email)
                .eq('estado', 'pendiente');

            console.log("Datos de la invitación:", data); // <-- MIRÁ ESTO EN LA CONSOLA

            setInvitacionPendiente(data && data.length > 0 ? data[0] : null);
        }
        setCargandoInvitacion(false);
    };
    const fetchGastos = async (hogarIdActivo) => {
  if (!hogarIdActivo) return;

  const { data, error } = await supabase
    .from('gastos')
    .select(`
      id, 
      monto, 
      descripcion, 
      pagado_por, 
      hogar_id, 
      categorias (nombre), 
      perfiles (nombre)
    `)
    .eq('hogar_id', hogarIdActivo) // <--- ESTO FILTRA EN LA BASE
    .order('created_at', { ascending: false });

  if (error) console.error("Error cargando gastos:", error);
  else setGastos(data || []);
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
        const baseStyle = { backgroundColor: `${color}20`, color: color, border: `1px solid ${color}50` };
        return conBordeIzquierdo ? { ...baseStyle, borderLeftWidth: '7px', borderLeftColor: color } : baseStyle;
    };

    const gastosFiltrados = tabActiva === 'todos'
        ? gastos
        : gastos.filter(g => (g.perfiles?.nombre || g.perfiles?.email || 'Invitado') === tabActiva);

    const nombresUsuarios = [...new Set(gastos.map(g => g.perfiles?.nombre || g.perfiles?.email || 'Invitado'))];

    // --- Control de flujo de renderizado ---
    if (loading) return <div className="flex h-screen items-center justify-center text-white">Cargando...</div>;
    if (!sesion) return <div className="p-10 text-white">Debes iniciar sesión</div>;

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-white transition-colors duration-300 pb-20">
            <div className="max-w-6xl mx-auto px-4 py-6">

                {/* ESTRUCTURA CONDICIONAL PRIORITARIA */}
                {invitacionPendiente ? (
                    <div className="mb-8 p-8 bg-indigo-900/30 border border-indigo-500/50 rounded-2xl text-center">
                        <h2 className="text-white text-2xl font-bold mb-4">¡Tenés una invitación!</h2>
                        <p className="text-indigo-200 mb-6">Te invitaron a unirte al hogar: <strong>{invitacionPendiente.hogares?.codigo}</strong></p>
                        <AceptarInvitacion 
    invitacion={invitacionPendiente} 
    onAceptado={() => {
        // Esto fuerza al contexto a recargar todo desde cero
        window.location.reload(); 
    }} 
/>
                    </div>
                ) : !hogarId ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl text-slate-100 font-bold mb-6">Aún no pertenecés a ningún hogar</h2>
                        <SetupHogar
                            userId={sesion.user.id}
                            onHogarSet={() => window.location.reload()}
                        />
                    </div>
                ) : (
                    <>
                        <h1 className="text-4xl font-black mb-10 text-slate-100">¡Hola, {nombreUsuario}!</h1>
                        <p className="text-slate-400 mb-6">Estás gestionando el hogar: <span className="font-bold text-indigo-400">{nombreHogar}</span></p>

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
                                    onGuardar={() => { traerCategorias(); setCategoriaEditando(null); }}
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
                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-400 mb-4">Invitar colaborador</h3>
                                    <InvitarColaborador hogarId={hogarId} />
                                </div>
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