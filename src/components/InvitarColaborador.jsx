import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function InvitarColaborador({ hogarId }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvitar = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);

    const { error } = await supabase
      .from('invitaciones')
      .insert([
        { 
          hogar_id: hogarId, 
          email_invitado: email.toLowerCase(),
          estado: 'pendiente' 
        }
      ]);

    if (error) {
      alert("Error al enviar invitación: " + error.message);
    } else {
      alert("¡Invitación enviada a " + email + "!");
      setEmail('');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleInvitar} className="p-4 bg-slate-900 rounded-xl border border-slate-700">
      <h3 className="text-white font-bold mb-2">Invitar a alguien</h3>
      <input 
        type="email"
        className="w-full p-2 mb-2 bg-slate-950 text-white border border-slate-700 rounded-lg"
        placeholder="Email del colaborador"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button 
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white p-2 rounded-lg font-bold hover:bg-indigo-500"
      >
        {loading ? 'Enviando...' : 'Enviar invitación'}
      </button>
    </form>
  );
}