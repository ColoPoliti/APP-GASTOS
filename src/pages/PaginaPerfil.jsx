import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext.jsx';
import { FaUser, FaPhone, FaLock, FaSave, FaArrowLeft, FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";

export default function PaginaPerfil() {
  const navigate = useNavigate();
  const { refrescarPerfil } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Validar formato de celular argentino antes de guardar
    const telefonoLimpiado = telefono.trim().replace(/^\+/, ''); 
    const regexCelular = /^549[0-9]{10}$/; 

    if (!regexCelular.test(telefonoLimpiado)) {
      setMensajeFeedback({ 
        texto: 'Por favor, ingresá un celular válido con formato argentino (Ej: 5491122334455). Código de área sin 0 y número sin 15.', 
        error: true 
      });
      return;
    }

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

      const { error: errorPerfil } = await supabase
        .from('perfiles')
        .update({
          nombre: nombreTrim,
          telefono: telefonoLimpiado
        })
        .eq('id', userId);

      if (errorPerfil) throw errorPerfil;

      if (nuevaPassword) {
        const { error: errorAuth } = await supabase.auth.updateUser({
          password: nuevaPassword
        });
        if (errorAuth) throw errorAuth;
        setNuevaPassword('');
        setConfirmarPassword('');
      }

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
      <div className="fixed inset-0 z-50 flex items-center justify-center dark:bg-slate-950 bg-slate-50">
        <p className="dark:text-slate-400 text-slate-600 font-medium text-lg">Cargando tus datos de perfil...</p>
      </div>
    );
  }

  return (

    <div className="fixed inset-0 z-50 dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-900 flex flex-col overflow-y-auto">
      
      {/* Barra superior de navegación interna */}
      <div className="w-full fixed border-b border-slate-200 z-50 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between shadowshrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          <FaArrowLeft /> Volver al Dashboard
        </button>
        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold hidden sm:block">CONFIGURACIÓN DE CUENTA</span>
      </div>

      {/* Contenedor principal en formato panel de ancho completo */}
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-slate-950">
        
        {/* Panel Lateral Izquierdo */}
        <div className="md:col-span-4 lg:col-span-3 bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 dark:from-cyan-950 dark:via-indigo-950 dark:to-purple-950 mt-11 p-4 sm:p-8 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
          <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center dark:text-indigo-400 text-white text-base sm:text-xl md:mb-6 shadow-inner shrink-0">
              <FaShieldAlt />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white md:mb-2">Mi Perfil</h2>
              <p className="text-xs sm:text-sm dark:text-slate-400 text-white leading-relaxed hidden md:block">
                Administrá la información personal de tu cuenta y los datos de contacto utilizados para la gestión del hogar y cobros.
              </p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-slate-800/60 hidden md:block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white dark:text-slate-500 block mb-1">SESIÓN SEGURA</span>
            <p className="text-xs dark:text-slate-400 text-white truncate">Conectado como: <span className="dark:text-indigo-400 text-pink-300 font-bold"> {email}</span></p>
          </div>
        </div>

        {/* Panel Derecho con el Formulario */}
        <div className="md:col-span-8 lg:col-span-9 p-4 sm:p-12 max-w-4xl">
          
          {mensajeFeedback.texto && (
            <div className={`p-4 mb-6 rounded-2xl text-sm font-medium ${
              mensajeFeedback.error 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {mensajeFeedback.texto}
            </div>
          )}

          <form onSubmit={handleActualizarPerfil} className="space-y-6 sm:mt-12 mt-2">

            {/* Email (Solo lectura) */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">
                CORREO ELECTRÓNICO (NO MODIFICABLE)
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 text-slate-500 px-4 py-3.5 rounded-full text-sm cursor-not-allowed"
              />
            </div>

            {/* Grid para Nombre y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Nombre */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  NOMBRE DE USUARIO
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Mariano"
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white pl-11 pr-4 py-3.5 rounded-full text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Celular */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  CELULAR (WHATSAPP)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <FaPhone />
                  </span>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="5491122334455"
                    pattern="^(\+?549)?[0-9]{10}$"
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white pl-11 pr-4 py-3.5 rounded-full text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block px-1">Formato: 549 + área (sin 0) + número (sin 15)</span>
              </div>

            </div>

            <hr className="border-slate-200 dark:border-slate-800 my-6" />

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Cambiar Contraseña</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Completá estos campos únicamente si querés modificar tu contraseña de acceso actual.
              </p>
            </div>

            {/* Grid para Contraseñas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Nueva Contraseña */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  NUEVA CONTRASEÑA
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <FaLock />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white pl-11 pr-11 py-3.5 rounded-full text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none flex items-center"
                  >
                    <FaIconWrapper icon={showPassword ? FaEyeSlash : FaEye} />
                  </button>
                </div>
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  CONFIRMAR CONTRASEÑA
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <FaLock />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repetí la contraseña"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white pl-11 pr-11 py-3.5 rounded-full text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none flex items-center"
                  >
                    <FaIconWrapper icon={showConfirmPassword ? FaEyeSlash : FaEye} />
                  </button>
                </div>
              </div>

            </div>

            {/* Botón Guardar */}
            <div className="pt-4 flex justify-end pb-32">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <FaSave /> {saving ? 'Guardando cambios...' : 'Guardar Cambios'}
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

function FaIconWrapper({ icon: Icon }) {
  return <Icon />;
}