import React from 'react';
import { supabase } from '../supabaseClient.js';
import { useUser } from '../context/UserContext.jsx';
import toast from 'react-hot-toast';

export default function AceptarInvitacion({ invitacion, onAceptada, onPosponer }) {
  const { refrescarPerfil } = useUser();

    const aceptar = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!invitacion.hogar_id) {
                throw new Error("El objeto invitación no trae un hogar_id válido.");
            }

            // 1. Update de la tabla perfiles
            const { error: errorPerfil } = await supabase
                .from('perfiles')
                .update({ hogar_id: invitacion.hogar_id })
                .eq('id', user.id);
            if (errorPerfil) throw errorPerfil;

            // 2. Update de la tabla invitaciones
            await supabase.from('invitaciones').update({ estado: 'aceptada' }).eq('id', invitacion.id);

            // 3. ¡EL TRUCO!: Refrescar el contexto ANTES de recargar
            await refrescarPerfil(); 

            toast.success('¡Te uniste al hogar con éxito!', { position: 'bottom-center' });

            if (onAceptada) onAceptada();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error("Error capturado:", error);
            toast.error("Error al guardar: " + error.message, { position: 'bottom-center' });
        }
    };

    const rechazar = async () => {
        try {
            const { error } = await supabase
                .from('invitaciones')
                .update({ estado: 'rechazada' })
                .eq('id', invitacion.id);

            if (error) throw error;

            toast.success('Invitación rechazada.', { position: 'bottom-center' });

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error("Error capturado:", error);
            toast.error("Error al rechazar la invitación: " + error.message, { position: 'bottom-center' });
        }
    };

    const posponer = () => {
        if (onPosponer) {
            onPosponer();
        }
    };

    return (
        <div className="flex flex-col gap-2 pt-2">
            <button 
                onClick={aceptar}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
                ¡Aceptar y unirme al hogar!
            </button>
            <button 
                onClick={rechazar}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
                Rechazar
            </button>
            <button 
                onClick={posponer}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
                Más tarde
            </button>
        </div>
    );
}