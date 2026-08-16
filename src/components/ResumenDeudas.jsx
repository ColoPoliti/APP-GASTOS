import React, { useState, useEffect } from 'react';
import { calcularDeudas } from '../utils/gastosUtils';
import { supabase } from '../supabaseClient';
import { FaWhatsapp } from "react-icons/fa";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsClapping, faFaceSmileBeam } from '@fortawesome/free-solid-svg-icons';

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

      {/* Contenedor principal en Grid (1 columna) */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

        {/* Columna 1: ¿Quién le debe a quién? */}
        <section className="p-5 border dark:border-slate-800 border-slate-400 bg-white shadow dark:bg-slate-900/60 backdrop-blur-sm flex flex-col justify-between shadow rounded-2xl">
          <div>
            <div className="space-y-3 ">
              {mensajesDeuda.map((mensaje, index) => {
                const estaSaldado = mensaje.includes("Todo está saldado") || mensaje.includes("No hay") || mensaje.includes("Necesitás");

                return (
                  <div key={index} className="mb-4">
                    {estaSaldado ? (
                      <div className="dark:bg-emerald-600/40 text-center bg-emerald-600 border border-emerald-800 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center gap-3">
                        {/* Icono animado con un pequeño rebote */}
                        <div className="flex gap-2 text-white dark:text-emerald-200 md:text-3xl text-xl animate-bounce">
                          <FontAwesomeIcon icon={faHandsClapping} />
                          <FontAwesomeIcon icon={faFaceSmileBeam} />
                        </div>

                        <h1 className="md:text-3xl text-xl  font-black dark:text-slate-200 text-white">
                          {mensaje}
                        </h1>
                      </div>
                    ) : (
                      (() => {
                        const partes = mensaje.split(" debe pagar ");
                        const deudor = partes[0];
                        const resto = partes[1]?.split(" a ") || ["", ""];
                        const monto = resto[0];
                        const acreedor = resto[1];

                        return (
                          <div className="dark:bg-slate-900/80 bg-white shadow  border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg gap-4">

                            {/* Info de Deudor / Acreedor */}
                            <div className="flex items-center space-x-3 overflow-hidden w-full sm:w-auto">
                              {/* Avatar o iniciales del deudor */}
                              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold flex-shrink-0">
                                {deudor ? deudor.charAt(0) : "?"}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-wider dark:text-slate-400 text-slate-950 font-semibold">Deuda pendiente</p>
                                <p className="dark:text-slate-400 text-slate-950 font-medium text-sm sm:text-lg truncate">
                                  <span className="font-bold dark:text-white text-slate-950">{deudor}</span> le debe a <span className="font-bold dark:text-white text-slate-950">{acreedor}</span>
                                </p>
                              </div>
                            </div>

                            {/* Monto y Botón de WhatsApp adaptados */}
                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                              {/* El Badge del monto a la derecha, adaptado para celular */}
                              <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-lg sm:text-2xl font-black shadow-inner">
                                {monto}
                              </div>

                              <button
                                onClick={() => handleCobrarPorWhatsApp(mensaje)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-emerald-900/30 hover:scale-105 flex-shrink-0"
                                title={`Cobrar a ${deudor} por WhatsApp`}
                              >
                                <FaWhatsapp className="w-5 h-5 text-white" />
                              </button>
                            </div>

                          </div>
                        );
                      })()
                    )}
                  </div>
                );
              })}

              {/* Grilla de totales por usuario (1 columna en cel, 2 columnas en pantallas sm en adelante) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {Object.entries(totalesPorUsuario).map(([nombre, total]) => (
                  <div key={nombre} className="dark:bg-slate-950/60 bg-white border border-slate-800/80 p-3.5 flex flex-col justify-center rounded-2xl relative">
                    <div className="flex items-center space-x-2 mb-1">
                      {/* Círculo con la inicial del usuario */}
                      <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                        {nombre.charAt(0)}
                      </div>
                      <span className="text-[11px] uppercase font-bold dark:text-slate-400 text-slate-950 tracking-wider truncate">
                        {nombre}
                      </span>
                    </div>

                    <span className="text-xl font-bold dark:text-slate-400 text-slate-950 mt-1">
                      ${total.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}