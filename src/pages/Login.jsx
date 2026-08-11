import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (esRegistro) {
      // 1. Registro del usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) { 
        alert(authError.message); 
        return; 
      }

      if (authData.user) {
        // 2. Actualizamos el perfil creado automáticamente por el trigger con el nombre y el teléfono
        const { error: perfilError } = await supabase
          .from('perfiles')
          .update({ 
            nombre: nombre, 
            telefono: telefono 
          })
          .eq('id', authData.user.id);

        if (perfilError) {
          console.error("Error al actualizar perfil:", perfilError.message);
        }

        // 3. Buscamos si hay una invitación pendiente para este email
        const { data: invitacion } = await supabase
          .from('invitaciones')
          .select('hogar_id, id')
          .eq('email_invitado', email.toLowerCase())
          .eq('estado', 'pendiente')
          .maybeSingle();

        // 4. Si hay invitación, vinculamos el hogar_id además del nombre y teléfono
        if (invitacion) {
          await supabase
            .from('perfiles')
            .update({ hogar_id: invitacion.hogar_id })
            .eq('id', authData.user.id);

          // 5. Marcamos la invitación como aceptada
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
          
          {/* Campos extra que solo se muestran si está en modo Registro */}
          {esRegistro && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500">Apodo o Nombre:</label>
                <input 
                  type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre"
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500">Celular:</label>
                <input 
                  type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  placeholder="1122334455"
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}

         

          <button type="submit" className="w-full font-bold py-3 bg-emerald-600 rounded-lg hover:bg-emerald-500">
            {esRegistro ? 'Registrarme' : 'Ingresar'}
          </button>
        </form>

        <button onClick={() => setEsRegistro(!esRegistro)} className="w-full mt-4 text-xs text-cyan-400 underline">
          {esRegistro ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
        </button>
      </div>
    </div>
  );
}