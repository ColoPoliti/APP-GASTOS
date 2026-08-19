import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen dark:bg-slate-950 bg-slate-100 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md dark:bg-slate-900/40 border bg-white dark:border-slate-900 border-slate-300 rounded p-8 shadow">
        <h2 className="text-3xl  mb-6 text-cyan bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black text-center">
          {esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Email:</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 rounded-full outline-none focus:border-indigo-500 text-slate-200"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Contraseña:</label>
            <div className="relative flex items-center">
              {/* Ícono de candado a la izquierda */}
              <span className="absolute left-3.5 text-slate-500 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faLock} />
              </span>

              {/* Input con tipo dinámico (password o text) y padding a ambos lados */}
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-10 rounded-full outline-none focus:border-indigo-500 text-slate-200"
                placeholder="••••••••"
              />

              {/* Botón del ojito a la derecha */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none flex items-center"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            </div>

            {/* Campos extra que solo se muestran si está en modo Registro */}
            {esRegistro && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500">Apodo o Nombre:</label>
                  <input
                    type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre"
                    className="w-full bg-white border border-slate-800 p-2.5 rounded-full outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500">Celular:</label>
                  <input
                    type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    placeholder="1122334455"
                    className="w-full bg-white border border-slate-800 p-2.5 rounded-full outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}



            <button type="submit" className="w-full font-bold py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-cyan-600 hover:to-purple-600 text-white  px-4 rounded-lg transition-all duration-300">
              {esRegistro ? 'Registrarme' : 'Ingresar'}
            </button>
        </form>

        <button onClick={() => setEsRegistro(!esRegistro)} className="w-full mt-4 text-xs dark:text-cyan-400 text-cyan-700 underline">
          {esRegistro ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
        </button>
      </div>
    </div>
  );
}