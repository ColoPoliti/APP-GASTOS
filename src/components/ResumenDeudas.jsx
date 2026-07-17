import React from 'react';
import { calcularDeudas } from '../utils/gastosUtils';

export default function ResumenDeudas({ gastos }) {
  const mensajesDeuda = calcularDeudas(gastos);
   const totalesPorUsuario = gastos.reduce((acc, gasto) => {
    const nombre = gasto.perfiles?.nombre || gasto.perfiles?.email || 'Invitado';
    acc[nombre] = (acc[nombre] || 0) + parseFloat(gasto.monto);
    return acc;
  }, {});


  return (
    <><section className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
              ¿Quién le debe a quién?
          </h3>

          <div className="space-y-2">
              {mensajesDeuda.map((mensaje, index) => (
                  <div key={index} className="flex items-center gap-3 text-white font-medium">
                      <span className="text-xl">💳</span>
                      <p className="text-lg">{mensaje}</p>
                  </div>
              ))}
          </div>

      </section><section className="mt-6 p-5 border border-slate-800 rounded-xl mb-9">
              <h3 className="text-sm font-bold text-indigo-400 uppercase mb-4">
                  Gastos por usuario
              </h3>
              <div className="grid grid-cols-2 gap-4">
                  {Object.entries(totalesPorUsuario).map(([nombre, total]) => (
                      <div key={nombre} className="bg-slate-900 border border-slate-800/50 p-4 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                              {nombre}
                          </p>
                          <div className="text-xl font-black font-mono text-white mt-1">
                              ${total.toLocaleString('es-AR')}
                          </div>
                      </div>
                  ))}
              </div>
          </section></>
  );
}