import React from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';

export default function ModalInvitacion({ invitacion, onClose, onAceptada, onRechazada }) {
  // Usamos 'sesion' que es como lo manejas en el resto de tus componentes
  const { sesion, actualizarHogar } = useUser();

  if (!invitacion) return null;

  const aceptarInvitacion = async () => {
    try {
      const userId = sesion?.user?.id;
      if (!userId) {
        alert("No se encontró una sesión activa.");
        return;
      }

      // 1. Actualizamos el estado de la invitación a 'aceptada'
      const { error: errorInv } = await supabase
        .from('invitaciones')
        .update({ estado: 'aceptada' })
        .eq('id', invitacion.id);

      if (errorInv) throw errorInv;

      // 2. Actualizamos el perfil del usuario actual para asociarlo al nuevo hogar_id usando el userId correcto
      const { error: errorPerfil } = await supabase
        .from('perfiles')
        .update({ hogar_id: invitacion.hogar_id })
        .eq('id', userId);

      if (errorPerfil) throw errorPerfil;

      // 3. Actualizamos el contexto y localStorage localmente
      actualizarHogar(invitacion.hogar_id, invitacion.hogar_nombre || invitacion.hogares?.codigo);

      if (onAceptada) onAceptada();
      window.location.reload();
      
    } catch (err) {
      console.error("Error al aceptar la invitación:", err);
      alert("Hubo un error al aceptar la invitación.");
    }
  };

  const rechazarInvitacion = async () => {
    try {
      const { error } = await supabase
        .from('invitaciones')
        .update({ estado: 'rechazada' })
        .eq('id', invitacion.id);

      if (error) throw error;

      if (onRechazada) onRechazada();
      onClose();
    } catch (err) {
      console.error("Error capturado:", err);
      alert("Hubo un error al rechazar la invitación.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 max-w-sm w-full text-white space-y-4">
        <h2 className="text-lg font-bold">¡Invitación a Bolsillo!</h2>
        <p className="text-slate-400 text-sm">
          Te invitaron a unirte al bolsillo: <span className="text-indigo-400 font-bold">{invitacion.hogar_nombre || invitacion.hogares?.codigo || 'Compartido'}</span>
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button 
            onClick={aceptarInvitacion}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Aceptar
          </button>
          <button 
            onClick={rechazarInvitacion}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Rechazar
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
}