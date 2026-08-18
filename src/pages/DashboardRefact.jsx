import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useUser } from "../context/UserContext.jsx";
import { useTheme } from '../context/ThemeContext.jsx';
import ResumenDeudas from '../components/ResumenDeudas';
import GestionGastos from '../components/GestionGastos';
import SetupHogar from '../components/SetupHogar';
import InvitarColaborador from '../components/InvitarColaborador';
import AceptarInvitacion from '../components/AceptarInvitacion';
import ModalInvitacion from '../components/ModalInvitacion';
import { FaPlusCircle } from 'react-icons/fa';

export default function Dashboard() {
    const { loading, sesion, hogarId, nombreUsuario, nombreHogar, actualizarHogar } = useUser();
    const { theme } = useTheme();

    const [cargandoDatosHogar, setCargandoDatosHogar] = useState(false);
    const [invitacionPendiente, setInvitacionPendiente] = useState(null);
    const [verificandoInvitacion, setVerificandoInvitacion] = useState(true);
    const [mostrarModalInvitacion, setMostrarModalInvitacion] = useState(false);
    const [gastos, setGastos] = useState([]);
    const [transferencias, setTransferencias] = useState([]);

    // Verificamos la invitación una sola vez de forma optimizada
    useEffect(() => {
        let isMounted = true;

        const verificarInvitaciones = async () => {
            if (!sesion?.user?.email) {
                if (isMounted) setVerificandoInvitacion(false);
                return;
            }

            try {
                const { data } = await supabase
                    .from('invitaciones')
                    .select('*, hogares(codigo)')
                    .eq('email_invitado', sesion.user.email)
                    .eq('estado', 'pendiente');

                if (isMounted) {
                    if (data && data.length > 0) {
                        setInvitacionPendiente(data[0]);
                        setMostrarModalInvitacion(true); // Abre el modal automáticamente al arrancar si hay pendiente
                    } else {
                        setInvitacionPendiente(null);
                        setMostrarModalInvitacion(false);
                    }
                }
            } catch (error) {
                console.error("Error al verificar invitaciones:", error);
            } finally {
                if (isMounted) {
                    setVerificandoInvitacion(false);
                }
            }
        };

        verificarInvitaciones();

        return () => {
            isMounted = false;
        };
    }, [sesion]);

    const traerDatosHogar = async () => {
        if (!hogarId) return;

        setCargandoDatosHogar(true);

        const [resGastos, resTransfers] = await Promise.all([
            supabase.from('gastos').select(`*, categorias (*), perfiles (*)`).eq('hogar_id', hogarId),
            supabase.from('transferencias').select('*').eq('hogar_id', hogarId)
        ]);

        setGastos(resGastos.data || []);
        if (!resTransfers.error) {
            setTransferencias(resTransfers.data || []);
        }

        setCargandoDatosHogar(false);
    };

    // Efecto para datos iniciales y Canal de Tiempo Real aislado por hogarId
    useEffect(() => {
        if (!hogarId) return;

        traerDatosHogar();

        const channel = supabase
            .channel(`gastos-cambios-${hogarId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'gastos'
                },
                (payload) => {
                    const hogarAfectadoNew = payload.new?.hogar_id;
                    const hogarAfectadoOld = payload.old?.hogar_id;

                    if (hogarAfectadoNew === hogarId || hogarAfectadoOld === hogarId) {
                        traerDatosHogar();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [hogarId]);

    // Si está cargando el usuario o verificando si hay invitación, mantenemos un único retorno limpio
    if (loading || verificandoInvitacion) {
        return null; 
    }

    // Si no tiene hogar seleccionado y tampoco hay una invitación pendiente que atender
    if (!hogarId && !invitacionPendiente) {
        return (
            <SetupHogar 
                userId={sesion?.user?.id} 
                onHogarSet={(id, codigo) => {
                    actualizarHogar(id, codigo);
                }} 
            />
        );
    }

    return (
        <div className="min-h-screen dark:bg-slate-950 bg-slate-100 text-dark transition-colors pt-16 duration-300 pb-20 relative">

            {/* MODAL DE INVITACIÓN (Se oculta al cancelar pero la invitación y notificación quedan vivas) */}
            {invitacionPendiente && mostrarModalInvitacion && (
                <ModalInvitacion
                    invitacion={invitacionPendiente}
                    onClose={() => setMostrarModalInvitacion(false)}
                    onAceptada={() => {
                        window.location.reload();
                    }}
                />
            )}

            <div className="max-w-6xl mx-auto px-4 py-6">
                {cargandoDatosHogar ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Sincronizando bolsillo...</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <h1 className="text-3xl font-black mb-1 text-dark dark:text-slate-100">¡Hola, {nombreUsuario}!</h1>
                                    <p className="dark:text-slate-400 text-slate-950 text-sm">Estás gestionando el bolsillo: <span className="font-bold text-indigo-400">{nombreHogar}</span></p>
                                </div>

                                <div className="w-full md:w-auto">
                                    <InvitarColaborador hogarId={hogarId} />
                                </div>
                            </div>

                            <hr className="border-slate-800 my-6" />

                            <ResumenDeudas gastos={gastos} transferencias={transferencias} />
                        </div>

                        {gastos.length === 0 && (
                            <div className="mt-12 text-center">
                                <Link
                                    to="/gestion-gastos"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5"
                                >
                                    <FaPlusCircle size={20} />
                                    EMPEZAR A CARGAR GASTOS
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}