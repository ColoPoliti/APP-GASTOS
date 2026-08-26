import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

export default function ListaTransferencias({ transferencias = [], miembros = [], sesionId, onTransferenciaEliminada }) {
    const [cargandoId, setCargandoId] = useState(null);

    // Función para buscar el nombre de un usuario por su ID
    const obtenerNombreMiembro = (id) => {
        const miembro = miembros.find(m => m.id === id);
        return miembro ? (miembro.nombre || miembro.email) : 'Usuario desconocido';
    };

    const handleEliminar = (transferenciaId) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-sm dark:bg-white text-white  dark:text-slate-950 font-medium">
                    ¿Estás seguro de que querés eliminar esta transferencia? 
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            await ejecutarEliminacion(transferenciaId);
                        }}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Sí, eliminar
                    </button>
                </div>
            </div>
        ), {
            duration: Infinity, // Se queda abierto hasta que elijas una opción
            position: 'bottom-center'
        });
    };

    const ejecutarEliminacion = async (transferenciaId) => {
        setCargandoId(transferenciaId);
        try {
            const { error } = await supabase
                .from('transferencias')
                .delete()
                .eq('id', transferenciaId);

            if (error) throw error;

            toast.success("¡Transferencia eliminada con éxito!", { position: 'bottom-center' });

            if (onTransferenciaEliminada) {
                onTransferenciaEliminada();
            }
        } catch (error) {
            console.error("Error al eliminar la transferencia:", error);
            toast.error("No se pudo eliminar la transferencia: " + error.message, { position: 'bottom-center' });
        } finally {
            setCargandoId(null);
        }
    };

    if (!transferencias || transferencias.length === 0) {
        return (
            <div className="dark:bg-slate-900/60 bg-white border border-slate-800 p-6 rounded-2xl text-center shadow-md">
                <p className="text-slate-400 text-sm">No hay transferencias registradas todavía.</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
                Historial de Transferencias
            </h3>
            
            <div className="space-y-3">
                {transferencias.map((t) => {
                    const nombreEnvia = obtenerNombreMiembro(t.enviado_por);
                    const nombreRecibe = obtenerNombreMiembro(t.recibido_por);
                    const fechaFormateada = new Date(t.fecha).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });

                    const puedeBorrar = t.enviado_por === sesionId;

                    return (
                        <div 
                            key={t.id} 
                            className="dark:bg-slate-900/80 bg-white border dark:border-slate-800 border-slate-100 p-4 rounded-xl shadow flex items-center justify-between gap-4 transition-all"
                        >
                            {/* Icono y detalle */}
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-full dark:bg-emerald-600/20 bg-emerald-600 border border-emerald-500/30 flex items-center justify-center dark:text-emerald-400 text-white font-bold flex-shrink-0">
                                    <FontAwesomeIcon icon={faExchangeAlt} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        {fechaFormateada}
                                    </p>
                                    <p className="text-sm sm:text-base font-medium text-slate-950 dark:text-slate-200 truncate">
                                        <span className="font-bold text-slate-900 dark:text-white">{nombreEnvia}</span> le transfirió a <span className="font-bold text-slate-900 dark:text-white">{nombreRecibe}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Monto y Botón Borrar */}
                            <div className="flex items-center space-x-4 flex-shrink-0">
                                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    ${parseFloat(t.monto).toLocaleString('es-AR')}
                                </span>

                                {puedeBorrar && (
                                    <button
                                        onClick={() => handleEliminar(t.id)}
                                        disabled={cargandoId === t.id}
                                        className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                                        title="Eliminar transferencia"
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}