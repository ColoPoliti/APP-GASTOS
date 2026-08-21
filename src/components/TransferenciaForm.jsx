import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { GiTakeMyMoney } from "react-icons/gi";

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
      alert("No te podés registrar una transferencia a vos mismo, amiguito.");
      return;
    }

    if (sesionId && String(recibidoPor).trim() === String(sesionId).trim()) {
      alert("No te podés registrar una transferencia a vos mismo, amiguito.");
      return;
    }

    const destinatarioValido = otrosMiembros.some(
      (miembro) => String(miembro.id).trim() === String(recibidoPor).trim()
    );

    if (!destinatarioValido) {
      alert("El destinatario seleccionado no pertenece a este hogar.");
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

      setMonto('');
      setRecibidoPor('');
      setIsOpen(false);

      if (onGuardar) onGuardar();
    } catch (error) {
      console.error("Error al registrar la transferencia:", error);
      alert("Hubo un error al registrar la transferencia: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
      >
        <span><GiTakeMyMoney /></span>
        Registrar Transferencia
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg font-bold z-10"
            >
              ✕
            </button>

            <h3 className="text-base font-bold uppercase mb-4 text-white">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <p className="text-xs text-slate-500">
                Esta transferencia quedará registrada para descontar de los saldos pendientes entre los miembros del hogar.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  disabled={cargando || otrosMiembros.length === 0}
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg py-3 font-bold transition text-white shadow-lg shadow-emerald-600/30"
                >
                  {cargando ? 'Guardando...' : 'Confirmar Transferencia'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition font-bold"
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