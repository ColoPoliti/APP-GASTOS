import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { useUser } from "../context/UserContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import ResumenDeudas from "../components/ResumenDeudas";
import GestionGastos from "../components/GestionGastos";
import SetupHogar from "../components/SetupHogar";
import InvitarColaborador from "../components/InvitarColaborador";
import AceptarInvitacion from "../components/AceptarInvitacion";
import { FaPlusCircle } from "react-icons/fa";

export default function Dashboard() {
  const {
    loading,
    hogarId,
    nombreUsuario,
    nombreHogar,
    invitacionPendiente,
    gastos = [],
    transferencias = [],
    traerDatosHogar,
  } = useUser();
  const { theme } = useTheme();

  // Sincronización en tiempo real atada estrictamente al hogarId actual
  useEffect(() => {
    if (!hogarId) return;

    // Aseguramos tener los datos frescos al montar o cambiar de hogar
    if (typeof traerDatosHogar === "function") {
      traerDatosHogar();
    }

    const channel = supabase
      .channel(`gastos-cambios-${hogarId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gastos",
        },
        (payload) => {
          const hogarAfectadoNew = payload.new?.hogar_id;
          const hogarAfectadoOld = payload.old?.hogar_id;

          if (
            (hogarAfectadoNew === hogarId || hogarAfectadoOld === hogarId) &&
            typeof traerDatosHogar === "function"
          ) {
            traerDatosHogar();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hogarId]);

  // Si el usuario general sigue cargando, no mostramos nada
  if (loading) return null;

  // Aseguramos de forma segura que gastos sea un array para evitar errores de .length
  const listaGastos = Array.isArray(gastos) ? gastos : [];
  const listaTransferencias = Array.isArray(transferencias)
    ? transferencias
    : [];

  return (
    // Agregamos overflow-x-hidden aquí para cortar cualquier desborde lateral en celulares
    <div className="min-h-screen dark:bg-slate-950 bg-slate-100 text-dark transition-colors sm:pt-16 pt-8 duration-300 pb-20 relative overflow-x-hidden w-full">
      {invitacionPendiente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-2xl p-6 shadow-2xl text-center space-y-6 my-auto">
            <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✉️
            </div>
            <div>
              <h2 className="text-white text-xl font-bold mb-2">
                ¡Tenés una invitación!
              </h2>
              <p className="text-slate-300 text-sm">
                Te invitaron a unirte al hogar:{" "}
                <strong className="text-indigo-400">
                  {invitacionPendiente.hogares?.codigo}
                </strong>
              </p>
            </div>
            <div className="pt-2">
              <AceptarInvitacion
                invitacion={invitacionPendiente}
                onAceptado={() => {
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ajustamos los márgenes internos para que no empujen el ancho en pantallas chicas */}
      <div className="max-w-6xl mx-auto px-4 py-6 w-full box-border">
        <div className="mb-10 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="w-full md:w-auto overflow-hidden">
              <h1 className="sm:text-3xl text-lg font-black mb-1 mt-1 sm:mt-12 text-dark dark:text-slate-100 break-words">
                ¡Hola, {nombreUsuario}!
              </h1>
              <p className="dark:text-slate-400 text-slate-950 text-sm break-words">
                Estás gestionando el bolsillo:{" "}
                <span className="font-bold dark:text-cyan-400 text-purple-600">
                  {nombreHogar}
                </span>
              </p>
            </div>

            <div className="w-full md:w-auto">
              <InvitarColaborador hogarId={hogarId} />
            </div>
          </div>

          <hr className="border-slate-800 my-6" />

          <ResumenDeudas
            gastos={listaGastos}
            transferencias={listaTransferencias}
          />
        </div>

        {listaGastos.length === 0 && (
          <div className="mt-12 text-center w-full">
            <Link
              to="/gestion-gastos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-cyan-400 hover:bg-cyan-700 text-white font-bold py-4 px-8 rounded-2xl shadow shadow-cyan-600/20 transition-all transform hover:-translate-y-0.5"
            >
              <FaPlusCircle size={20} />
              EMPEZAR A CARGAR GASTOS
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
