import React, { useState, useEffect } from 'react';
import { calcularDeudas } from '../utils/gastosUtils';
import { supabase } from '../supabaseClient';

export default function ResumenDeudas({ gastos, transferencias }) {
  const [perfiles, setPerfiles] = useState([]);
  const mensajesDeuda = calcularDeudas(gastos, transferencias);

  // Cargamos los perfiles directamente desde Supabase para tener los teléfonos siempre a mano
  useEffect(() => {
    async function fetchPerfiles() {
      const { data, error } = await supabase.from('perfiles').select('*');
      if (!error && data) {
        setPerfiles(data);
      }
    }
    fetchPerfiles();
  }, []);

  const handleCobrarPorWhatsApp = (mensajeDeudaTexto) => {
    const nombreDeudor = mensajeDeudaTexto.split(" ")[0].trim();

    console.log("Perfiles cargados en ResumenDeudas:", perfiles);
    console.log("Buscando deudor:", nombreDeudor);

    // Buscamos al usuario que coincida con el nombre
    const deudorEncontrado = perfiles.find(p => 
      p.nombre?.trim().toLowerCase() === nombreDeudor.toLowerCase() || 
      p.email?.toLowerCase().includes(nombreDeudor.toLowerCase())
    );

    const telefono = deudorEncontrado?.telefono;

    if (!telefono) {
      alert(`No encontramos un celular registrado para "${nombreDeudor}". Verificá que la columna 'telefono' tenga datos en la tabla perfiles.`);
      return;
    }

    const mensaje = `Hola *${deudorEncontrado.nombre || nombreDeudor}*, ESTO ES UNA PRUEBA DE LA APPP-GASTOS, paso a recordarte: "${mensajeDeudaTexto}". ¡Cuando puedas avísame! 💸`;
    const mensajeCodificado = encodeURIComponent(mensaje);

    window.open(`https://wa.me/${telefono}?text=${mensajeCodificado}`, '_blank');
  };
  
  const totalesPorUsuario = gastos.reduce((acc, gasto) => {
    const nombre = gasto.perfiles?.nombre || gasto.perfiles?.email || 'Invitado';
    acc[nombre] = (acc[nombre] || 0) + parseFloat(gasto.monto);
    return acc;
  }, {});

return (
    <div className="w-full my-6 space-y-6">
      
      {/* Contenedor principal en Grid (2 columnas en pantallas medianas/grandes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Columna 1: ¿Quién le debe a quién? */}
        <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span>💳</span> Estado de Deudas
            </h3>

            <div className="space-y-3">
              {mensajesDeuda.map((mensaje, index) => {
                const estaSaldado = mensaje.includes("Todo está saldado") || mensaje.includes("No hay");

                return (
                  <div key={index} className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <h1 className="text-xl font-black text-slate-200  pr-2">{mensaje}</h1>

                    {!estaSaldado && (
                      <button 
                        onClick={() => handleCobrarPorWhatsApp(mensaje)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1 transition-colors shadow-md flex-shrink-0"
                      >
                        <span>💬 Cobrar</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Columna 2: Gastos por usuario */}
        <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-lg">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>📊</span> Consumo Total por Usuario
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(totalesPorUsuario).map(([nombre, total]) => (
              <div key={nombre} className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
                  {nombre}
                </span>
                <span className="text-xl font-black text-white mt-1">
                  ${total.toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}