import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { GiTakeMyMoney } from "react-icons/gi";

export default function TransferenciaForm({ hogarId, sesionId, miembros = [], onGuardar }) {
  const [monto, setMonto] = useState('');
  const [recibidoPor, setRecibidoPor] = useState('');
  const [cargando, setCargando] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Filtrar los miembros para que el usuario pueda elegir a quién le transfiere (excluyéndose a sí mismo)
  const otrosMiembros = miembros.filter(m => m.id !== sesionId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || !recibidoPor) return;
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
      onGuardar(); // Refrescar los datos en el padre
    } catch (error) {
      console.error("Error al registrar la transferencia:", error);
      alert("Hubo un error al registrar la transferencia: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* Botón para abrir el modal */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
      >
        <span><GiTakeMyMoney /></span> Registrar Transferencia
      </button>

      {/* Modal flotante */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Botón de cierre */}
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg font-bold"
            >
              ✕
            </button>

            <h3 className="text-base font-bold uppercase mb-4 text-white">
              Registrar Transferencia
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase font-semibold">¿A quién le transferiste?</label>
                <select 
                  required 
                  value={recibidoPor} 
                  onChange={(e) => setRecibidoPor(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Seleccionar destinatario...</option>
                  {otrosMiembros.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre || m.email || 'Miembro'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase font-semibold">Monto</label>
                <input 
                  required 
                  type="number" 
                  step="0.01"
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
                  disabled={cargando} 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg py-3 font-bold transition text-white shadow-lg shadow-emerald-600/30"
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