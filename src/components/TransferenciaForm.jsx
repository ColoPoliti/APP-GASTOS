import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { GiTakeMyMoney } from "react-icons/gi";
import toast from 'react-hot-toast';

export default function TransferenciaForm({
  hogarId,
  sesionId,
  miembros = [],
  destinatarioPreseleccionado = '',
  onGuardar
}) {
  const [monto, setMonto] = useState('');
  const [recibidoPor, setRecibidoPor] = useState(destinatarioPreseleccionado || '');
  const [cargando, setCargando] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  useEffect(() => {
    async function obtenerUsuario() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error obteniendo usuario autenticado:', error);
        return;
      }
      setUsuarioActual(user);
    }
    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (destinatarioPreseleccionado) {
      setRecibidoPor(destinatarioPreseleccionado);
    }
  }, [destinatarioPreseleccionado]);

  const otrosMiembros = useMemo(() => {
    if (!usuarioActual) return [];

    return miembros.filter((miembro) => {
      const perteneceAlHogar =
        !hogarId ||
        miembro.hogar_id === hogarId ||
        miembro.hogarId === hogarId ||
        (!miembro.hogar_id && !miembro.hogarId);

      if (!perteneceAlHogar) return false;

      const esUsuarioActual =
        String(miembro.id || '').trim() === String(usuarioActual.id || '').trim() ||
        String(miembro.user_id || '').trim() === String(usuarioActual.id || '').trim() ||
        String(miembro.uid || '').trim() === String(usuarioActual.id || '').trim();

      if (esUsuarioActual) return false;

      return true;
    });
  }, [miembros, hogarId, usuarioActual]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!monto || !recibidoPor) return;

    if (usuarioActual && String(recibidoPor).trim() === String(usuarioActual.id).trim()) {
      toast.error("No te podés registrar una transferencia a vos mismo.", { position: 'bottom-center' });
      return;
    }

    if (sesionId && String(recibidoPor).trim() === String(sesionId).trim()) {
      toast.error("No te podés registrar una transferencia a vos mismo.", { position: 'bottom-center' });
      return;
    }

    const destinatarioValido = otrosMiembros.some(
      (miembro) => String(miembro.id).trim() === String(recibidoPor).trim()
    );

    if (!destinatarioValido) {
      toast.error("El destinatario seleccionado no pertenece a este hogar.", { position: 'bottom-center' });
      return;
    }

    setCargando(true);

    const payload = {
      monto: parseFloat(monto),
      hogar_id: hogarId,
      enviado_por: sesionId,
      recibido_por: recibidoPor,
      fecha: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('transferencias').insert([payload]);
      if (error) throw error;

      toast.success("¡Transferencia registrada con éxito!", { position: 'bottom-center' });

      setMonto('');
      setRecibidoPor('');
      setIsOpen(false);

      if (onGuardar) onGuardar();
    } catch (error) {
      console.error("Error al registrar la transferencia:", error);
      toast.error("Hubo un error al registrar la transferencia: " + error.message, { position: 'bottom-center' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
      >
        <span><GiTakeMyMoney /></span>
        Registrar Transferencia
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-white/20 dark:bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border dark:border-slate-800 border-slate-200 rounded-t-2xl sm:rounded-2xl p-6 shadow relative animate-in fade-in zoom-in duration-200">
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg font-bold z-10 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-base font-bold uppercase mb-4 text-slate-950 dark:text-white">
              Registrar Transferencia
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase font-semibold">
                  ¿A quién le transferiste?
                </label>
                <select
                  required
                  value={recibidoPor}
                  onChange={(e) => setRecibidoPor(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-white border border-slate-800 rounded-full p-2.5 dark:text-white text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Seleccionar destinatario...</option>
                  {otrosMiembros.map((miembro) => (
                    <option key={miembro.id} value={miembro.id}>
                      {miembro.nombre || miembro.email || 'Miembro'}
                    </option>
                  ))}
                </select>

                {usuarioActual && otrosMiembros.length === 0 && (
                  <p className="text-xs text-amber-400 mt-2">
                    No hay otros miembros disponibles en este hogar.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase font-semibold">
                  Monto
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 15000"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full dark:bg-slate-950 bg-white border border-slate-800 rounded-full p-2.5 dark:text-white text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <p className="text-xs text-slate-500">
                Esta transferencia quedará registrada para descontar de los saldos pendientes entre los miembros del hogar.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  disabled={cargando || otrosMiembros.length === 0}
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg py-3 font-bold transition text-white shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  {cargando ? 'Guardando...' : 'Confirmar Transferencia'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}