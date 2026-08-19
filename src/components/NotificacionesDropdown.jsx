import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import ModalInvitacion from './ModalInvitacion';
import { FaBell } from "react-icons/fa";

export default function NotificacionesDropdown() {
    const { sesion } = useUser();
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(false);
    const [mostrarDropdown, setMostrarDropdown] = useState(false);
    const [invitacionSeleccionada, setInvitacionSeleccionada] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMostrarDropdown(false);
            }
        };
        if (mostrarDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mostrarDropdown]);

    useEffect(() => {
        let isMounted = true;
        const userId = sesion?.user?.id;
        
        if (!userId) return;

        const cargarNotificaciones = async () => {
            try {
                const { data, error } = await supabase
                    .from('notificaciones')
                    .select('*')
                    .eq('usuario_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;

                if (isMounted && data) {
                    setNotificaciones(data);
                    setNoLeidas(data.some(n => !n.leido));
                }
            } catch (err) {
                console.error("Error al cargar notificaciones:", err);
            }
        };

        cargarNotificaciones();

        const canal = supabase
            .channel(`public:notificaciones:usuario_id=eq.${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificaciones',
                    filter: `usuario_id=eq.${userId}`,
                },
                (payload) => {
                    if (isMounted) {
                        setNotificaciones((prev) => [payload.new, ...prev]);
                        setNoLeidas(true);
                    }
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(canal);
        };
    }, [sesion?.user?.id]);

    const abrirDropdown = async () => {
        setMostrarDropdown(!mostrarDropdown);
        if (!noLeidas || !sesion?.user?.id) return;

        setNoLeidas(false);
        
        // Actualizar el estado visual al instante
        setNotificaciones(prev => 
            prev.map(n => ({ ...n, leido: true }))
        );

        try {
            await supabase
                .from('notificaciones')
                .update({ leido: true })
                .eq('usuario_id', sesion.user.id)
                .eq('leido', false);
        } catch (err) {
            console.error("Error al marcar leídas:", err);
        }
    };

    const handleClicNotificacion = async (notif) => {
        if (notif.invitacion_id) {
            try {
                const { data, error } = await supabase
                    .from('invitaciones')
                    .select('*, hogares(codigo)')
                    .eq('id', notif.invitacion_id)
                    .single();

                if (error) throw error;

                if (data && data.estado === 'pendiente') {
                    setMostrarDropdown(false);
                    setInvitacionSeleccionada(data);
                } else {
                    alert("Esta invitación ya fue aceptada, rechazada o ya no se encuentra pendiente.");
                }
            } catch (err) {
                console.error("Error al buscar la invitación:", err);
                alert("No se pudo recuperar la invitación.");
            }
        }
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                onClick={abrirDropdown}
                className="relative text-white hover:opacity-80 focus:outline-none"
            >
                <FaBell className="text-xl md:text-2xl" />
                
                {noLeidas && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse border border-white"></span>
                )}
            </button>

            {mostrarDropdown && (
                <div className="absolute right-0 mt-4 w-72 md:w-80 dark:bg-slate-900 bg-white dark:border dark:border-slate-700 border border-slate-300 shadow z-50 text-white">
                    <div className="p-3 font-semibold border-b dark:border-slate-800 border-slate-300 dark:text-cyan-300 text-slate-500  text-sm">
                        Notificaciones
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notificaciones.length === 0 ? (
                            <div className="p-4 text-sm dark:text-slate-400 text-slate-950 text-center">
                                No tenés notificaciones nuevas
                            </div>
                        ) : (
                            notificaciones.map((notif) => {
                                const esInvitacion = !!notif.invitacion_id;
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => esInvitacion && handleClicNotificacion(notif)}
                                        className={`p-3 text-xs md:text-sm border-b dark:border-slate-800 border-slate-300 transition-colors ${
                                            !notif.leido ? 'bg-indigo-950/40 dark:text-slate-400 text-slate-950 ' : 'dark:text-slate-300  text-slate-950'
                                        } ${esInvitacion ? 'cursor-pointer hover:bg-indigo-900/40 hover:text-white' : ''}`}
                                    >
                                        <p className="dark:text-white text-slate-800">{notif.mensaje}</p>
                                        {esInvitacion && (
                                            <span className="text-[11px] text-indigo-400 font-semibold mt-1 block underline">
                                                👉 Gestionar invitación
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-500 mt-1 block">
                                            {new Date(notif.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {invitacionSeleccionada && (
                <ModalInvitacion
                    invitacion={invitacionSeleccionada}
                    onClose={() => setInvitacionSeleccionada(null)}
                    onAceptada={() => {
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}