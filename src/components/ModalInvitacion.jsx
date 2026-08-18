import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';

export default function ModalInvitacion({ invitacion, onClose, onAceptada }) {
  const { user, actualizarHogar } = useUser();

  if (!invitacion) return null;

  const aceptarInvitacion = async () => {
    try {
      // 1. Actualizamos el estado de la invitación a 'aceptada'
      const { error: errorInv } = await supabase
        .from('invitaciones')
        .update({ estado: 'aceptada' })
        .eq('id', invitacion.id);

      if (errorInv) throw errorInv;

      // 2. Actualizamos el perfil del usuario actual para asociarlo al nuevo hogar_id
      if (user?.id && invitacion.hogar_id) {
        const { error: errorPerfil } = await supabase
          .from('perfiles')
          .update({ hogar_id: invitacion.hogar_id })
          .eq('id', user.id);

        if (errorPerfil) throw errorPerfil;

        // 3. Actualizamos el contexto y localStorage localmente
        actualizarHogar(invitacion.hogar_id, invitacion.hogar_nombre || invitacion.hogares?.codigo);
      }

      if (onAceptada) onAceptada();
      window.location.reload();
      
    } catch (err) {
      console.error("Error al aceptar la invitación:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 max-w-sm w-full text-white space-y-4">
        <h2 className="text-lg font-bold">¡Invitación a Bolsillo!</h2>
        <p className="text-slate-400 text-sm">
          Te invitaron a unirte al bolsillo: <span className="text-indigo-400 font-bold">{invitacion.hogar_nombre || invitacion.hogares?.codigo || 'Compartido'}</span>
        </p>
        <div className="flex gap-2 pt-2">
          <button 
            onClick={aceptarInvitacion}
            className="flex-1 bg-indigo-600 text-white p-2 rounded-lg font-bold hover:bg-indigo-500 transition-colors"
          >
            Aceptar
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-slate-800 text-slate-300 p-2 rounded-lg font-bold hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}