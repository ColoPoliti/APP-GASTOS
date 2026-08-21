import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext.jsx';
import { FaUser, FaPhone, FaLock, FaSave, FaArrowLeft } from "react-icons/fa";

export default function PaginaPerfil() {
  const navigate = useNavigate();
  const { refrescarPerfil } = useUser(); // <-- 1. Usamos refrescarPerfil que ya viene de tu context
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mensajeFeedback, setMensajeFeedback] = useState({ texto: '', error: false });

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatosPerfil = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error("No hay una sesión activa.");

        const userId = session.user.id;
        setEmail(session.user.email || '');

        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('nombre, telefono')
          .eq('id', userId)
          .single();

        if (perfilError) throw perfilError;

        if (perfil) {
          setNombre(perfil.nombre || '');
          setTelefono(perfil.telefono || '');
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error.message);
        setMensajeFeedback({ texto: `Error al cargar datos: ${error.message}`, error: true });
      } finally {
        setLoading(false);
      }
    };

    cargarDatosPerfil();
  }, []);

  const handleActualizarPerfil = async (e) => {
    e.preventDefault();
    setMensajeFeedback({ texto: '', error: false });

    if (nuevaPassword && nuevaPassword !== confirmarPassword) {
      setMensajeFeedback({ texto: 'Las contraseñas nuevas no coinciden.', error: true });
      return;
    }

    if (nuevaPassword && nuevaPassword.length < 6) {
      setMensajeFeedback({ texto: 'La contraseña debe tener al menos 6 caracteres.', error: true });
      return;
    }

    setSaving(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("No hay una sesión activa.");

      const userId = session.user.id;
      const nombreTrim = nombre.trim();

      // 1. Actualizar en la tabla 'perfiles' de Supabase
      const { error: errorPerfil } = await supabase
        .from('perfiles')
        .update({
          nombre: nombreTrim,
          telefono: telefono.trim()
        })
        .eq('id', userId);

      if (errorPerfil) throw errorPerfil;

      // 2. Actualizar contraseña si corresponde
      if (nuevaPassword) {
        const { error: errorAuth } = await supabase.auth.updateUser({
          password: nuevaPassword
        });
        if (errorAuth) throw errorAuth;
        setNuevaPassword('');
        setConfirmarPassword('');
      }

      // 3. ¡AQUÍ ESTÁ LA CLAVE! Forzamos la actualización del contexto al instante
      if (refrescarPerfil) {
        await refrescarPerfil();
      }

      setMensajeFeedback({ texto: '¡Tus datos se actualizaron correctamente! 🎉', error: false });
    } catch (error) {
      console.error("Error al guardar:", error.message);
      setMensajeFeedback({ texto: `Error al guardar: ${error.message}`, error: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full my-12 text-center">
        <p className="dark:text-slate-400 text-slate-600 font-medium">Cargando tus datos de perfil...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto my-6 px-4 space-y-6">
      
      {/* Botón para volver atrás usando React Router */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
      >
        <FaArrowLeft /> Volver
      </button>

      <div className="dark:bg-slate-900/90 bg-white border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
        
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mi Perfil</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Actualiza tu nombre de usuario, número de celular o contraseña de acceso.
          </p>
        </div>

        {mensajeFeedback.texto && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${
            mensajeFeedback.error 
              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' 
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}>
            {mensajeFeedback.texto}
          </div>
        )}

        <form onSubmit={handleActualizarPerfil} className="space-y-5">

          {/* Email (Solo lectura por seguridad) */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Correo Electrónico (No modificable)
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-500 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed"
            />
          </div>

          {/* Nombre / Username */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Nombre de Usuario
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <FaUser />
              </span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Mariano"
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Celular / Teléfono */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Celular (para cobros por WhatsApp)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <FaPhone />
              </span>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 54911..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800 my-4" />

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Completá los campos de abajo únicamente si querés cambiar tu contraseña actual:
          </p>

          {/* Nueva Contraseña */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Nueva Contraseña
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <FaLock />
              </span>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <FaLock />
              </span>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repetí la contraseña"
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <FaSave /> {saving ? 'Guardando cambios...' : 'Guardar Cambios'}
          </button>

        </form>

      </div>
    </div>
  );
}