import React from 'react';
import { supabase } from '../supabaseClient.js';
import { useUser } from '../context/UserContext.jsx';


export default function AceptarInvitacion({ invitacion }) {
  const { refrescarPerfil } = useUser(); // 2. USALO

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

            window.location.reload();
        } catch (error) {
            console.error("Error capturado:", error);
            alert("Error al guardar: " + error.message);
        }
    };
    return (
        <button 
            onClick={aceptar}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
        >
            ¡Aceptar y unirme al hogar!
        </button>
    );
}