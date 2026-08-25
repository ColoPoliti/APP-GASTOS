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
    console.log("Iniciando submit...");

    try {
      if (esRegistro) {
        // Validar formato de celular argentino (ej: 5491122334455)
        const telefonoLimpidio = telefono.trim().replace(/^\+/, ''); // saca el + si lo pusieron
        const regexCelular = /^549[0-9]{10}$/; // 549 seguido de 10 dígitos exactos

        if (!regexCelular.test(telefonoLimpidio)) {
          alert("Por favor, ingresá un celular válido con formato argentino (Ej: 5491122334455). Código de área sin 0 y número sin 15.");
          return;
        }

        console.log("Registrando usuario en Auth con metadatos...");
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre: nombre,
              telefono: telefonoLimpidio
            }
          }
        });

        if (authError) {
          alert("Error al registrarse: " + authError.message);
          return;
        }

        if (authData.user) {
          console.log("Usuario creado con ID:", authData.user.id);

          // Esperamos un segundo a que el trigger del servidor cree el perfil
          await new Promise(resolve => setTimeout(resolve, 800));

          // Verificamos si hay una invitación pendiente para este email
          const { data: invitacion } = await supabase
            .from('invitaciones')
            .select('hogar_id, id')
            .eq('email_invitado', email.toLowerCase())
            .eq('estado', 'pendiente')
            .maybeSingle();

          if (invitacion) {
            await supabase
              .from('perfiles')
              .update({ hogar_id: invitacion.hogar_id })
              .eq('id', authData.user.id);

            await supabase
              .from('invitaciones')
              .update({ estado: 'aceptada' })
              .eq('id', invitacion.id);
          }
          
          alert("¡Registro completado con éxito! Ya podés ingresar.");
          setEsRegistro(false); // Pasamos a la vista de login
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          alert("Error al ingresar: " + error.message);
        }
      }
    } catch (err) {
      console.error("Excepción atrapada en handleSubmit:", err);
      alert("Ocurrió un error inesperado: " + err.message);
    }
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-slate-100 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md dark:bg-slate-900/40 border bg-white dark:border-slate-900 border-slate-300 rounded p-8 shadow">
        <h2 className="text-3xl mb-6 text-cyan bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black text-center">
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
              <span className="absolute left-3.5 text-slate-500 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full dark:bg-slate-950 bg-white border border-slate-800 py-2.5 pl-10 pr-10 rounded-full outline-none focus:border-indigo-500 text-slate-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none flex items-center"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {esRegistro && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500">Apodo o Nombre:</label>
                <input
                  type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre"
                  className="w-full bg-white border border-slate-800 p-2.5 rounded-full outline-none focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Celular (Ej: 5491122334455):</label>
                <input
                  type="tel" 
                  required 
                  value={telefono} 
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="5491122334455"
                  pattern="^(\+?549)?[0-9]{10}$"
                  className="w-full bg-white border border-slate-800 p-2.5 rounded-full outline-none focus:border-indigo-500 text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block px-3">Formato: 549 + área (sin 0) + número (sin 15)</span>
              </div>
            </>
          )}

          <button type="submit" className="w-full font-bold py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-cyan-600 hover:to-purple-600 text-white px-4 rounded-lg transition-all duration-300">
            {esRegistro ? 'Registrarme' : 'Ingresar'}
          </button>
        </form>

        <button type="button" onClick={() => setEsRegistro(!esRegistro)} className="w-full mt-4 text-xs dark:text-cyan-400 text-cyan-700 underline">
          {esRegistro ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
        </button>
      </div>
    </div>
  );
}