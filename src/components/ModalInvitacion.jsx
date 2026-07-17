import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ModalInvitacion({ userEmail, onAceptada }) {
  const [invitacion, setInvitacion] = useState(null);

  useEffect(() => {
    const buscarInvitacion = async () => {
      const { data } = await supabase
        .from('invitaciones')
        .select('*, hogares(codigo)')
        .eq('email_invitado', userEmail)
        .eq('estado', 'pendiente')
        .single();
      
      setInvitacion(data);
    };
    buscarInvitacion();
  }, [userEmail]);

  const aceptarInvitacion = async () => {
    // 1. Actualizar el perfil del usuario con el nuevo hogar_id
    await supabase
      .from('perfiles')
      .update({ hogar_id: invitacion.hogar_id })
      .eq('email', userEmail);

    // 2. Marcar invitación como aceptada
    await supabase
      .from('invitaciones')
      .update({ estado: 'aceptada' })
      .eq('id', invitacion.id);

    onAceptada();
  };

  if (!invitacion) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 max-w-sm w-full">
        <h2 className="text-white text-lg font-bold mb-2">¡Nueva Invitación!</h2>
        <p className="text-slate-400 text-sm mb-4">
          Te invitaron a unirte al hogar: <span className="text-indigo-400 font-bold">{invitacion.hogares.codigo}</span>
        </p>
        <button 
          onClick={aceptarInvitacion}
          className="w-full bg-indigo-600 text-white p-2 rounded-lg font-bold"
        >
          Aceptar y unirse
        </button>
      </div>
    </div>
  );
}