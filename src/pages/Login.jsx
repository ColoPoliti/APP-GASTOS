import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (esRegistro) {
      // 1. Registro del usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) { alert(authError.message); return; }

      if (authData.user) {
        // 2. Buscamos si hay una invitación pendiente para este email
        const { data: invitacion } = await supabase
          .from('invitaciones')
          .select('hogar_id, id')
          .eq('email_invitado', email.toLowerCase())
          .eq('estado', 'pendiente')
          .single();

        // 3. Creamos el perfil (con el hogar_id de la invitación si existe)
        await supabase.from('perfiles').insert([
          { 
            id: authData.user.id, 
            nombre: email.split('@')[0],
            hogar_id: invitacion ? invitacion.hogar_id : null // Si hay invitación, le asigna el hogar
          }
        ]);

        // 4. Si usamos invitación, la marcamos como aceptada
        if (invitacion) {
          await supabase
            .from('invitaciones')
            .update({ estado: 'aceptada' })
            .eq('id', invitacion.id);
        }
      }
    } else {
      // Lógica de Login normal
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Error al ingresar: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-black mb-6 text-center">
          {esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500">Email:</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500">Contraseña:</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg outline-none focus:border-indigo-500"
            />
          </div>

          <button type="submit" className="w-full font-bold py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500">
            {esRegistro ? 'Registrarme' : 'Ingresar'}
          </button>
        </form>

        <button onClick={() => setEsRegistro(!esRegistro)} className="w-full mt-4 text-xs text-indigo-400 underline">
          {esRegistro ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
        </button>
      </div>
    </div>
  );
}