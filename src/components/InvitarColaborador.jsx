import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FaUserPlus, FaTimes } from "react-icons/fa";
import toast from 'react-hot-toast';

export default function InvitarColaborador({ hogarId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvitar = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);

    try {
      // 1. Insertamos la invitación y traemos su ID con .select().single()
      const { data: invData, error: invError } = await supabase
        .from('invitaciones')
        .insert([
          { 
            hogar_id: hogarId, 
            email_invitado: email.toLowerCase(),
            estado: 'pendiente' 
          }
        ])
        .select()
        .single();

      if (invError) throw invError;

      // 2. Buscamos si el usuario ya tiene perfil registrado en la app
      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      // 3. Si el usuario existe, le generamos su notificación con el enlace vinculado
      if (perfilData) {
        const { data: hogarData } = await supabase
          .from('hogares')
          .select('codigo')
          .eq('id', hogarId)
          .single();

        await supabase
          .from('notificaciones')
          .insert({
            usuario_id: perfilData.id,
            mensaje: `Te invitaron al bolsillo: ${hogarData?.codigo || 'Bolsillo'}`,
            invitacion_id: invData.id // ¡Acá va el link clave!
          });
      }

      toast.success("¡Invitación enviada a " + email + "!", { position: 'bottom-center' });
      setEmail('');
      setIsOpen(false);
    } catch (err) {
      console.error("Error al enviar invitación:", err);
      toast.error("Error al enviar invitación: " + err.message, { position: 'bottom-center' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-xl font-bold dark:text-white text-indigo-600">Invitar colaborador</span>

      <button 
        onClick={() => setIsOpen(true)}
        className="dark:bg-indigo-600/20 bg-indigo-600/20 border border-indigo-500/50 dark:border-indigo-500/50 dark:text-indigo-400 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white p-3 font-bold transition-all flex items-center justify-center gap-2"
        title="Invitar colaborador"
      >
        <FaUserPlus size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center dark:bg-black/80 bg-white/20  backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-md dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-200  rounded-2xl p-6 shadow relative my-auto">
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <FaTimes size={18} />
            </button>

            <h3 className="dark:text-white text-slate-950 font-bold text-xl mb-4">Invitar a alguien</h3>
            
            <form onSubmit={handleInvitar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo electrónico</label>
                <input 
                  type="email"
                  className="w-full p-3 dark:bg-slate-950 bg-white text-white border border-slate-700 rounded-full focus:outline-none focus:border-indigo-500"
                  placeholder="colaborador@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 bg-slate-800 text-slate-300 p-3 rounded-lg font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}