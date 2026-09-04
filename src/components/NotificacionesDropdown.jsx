import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "../context/UserContext";
import ModalInvitacion from "./ModalInvitacion";
import { FaBell } from "react-icons/fa";

export default function NotificacionesDropdown() {
  const userContext = useUser();

  const userId =
    userContext?.user?.id ||
    userContext?.sesion?.user?.id ||
    userContext?.usuario?.id ||
    userContext?.id;

  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [invitacionSeleccionada, setInvitacionSeleccionada] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false);
      }
    };
    if (mostrarDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mostrarDropdown]);

  const cargarNotificaciones = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("*")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setNotificaciones(data);
        setNoLeidas(data.some((n) => !n.leido));
      }
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!userId) return;

    cargarNotificaciones();

    const channelName = `notificaciones_usuario_${userId}_${Math.random()}`;
    const canalUnificado = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `usuario_id=eq.${userId}`,
        },
        () => {
          if (isMounted) {
            cargarNotificaciones();
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(canalUnificado);
    };
  }, [userId]);

  const abrirDropdown = async () => {
    const nuevoEstadoDropdown = !mostrarDropdown;
    setMostrarDropdown(nuevoEstadoDropdown);

    if (nuevoEstadoDropdown && noLeidas && userId) {
      const idsNoLeidas = notificaciones
        .filter((n) => !n.leido)
        .map((n) => n.id);

      if (idsNoLeidas.length === 0) return;

      setNoLeidas(false);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));

      try {
        const { error } = await supabase
          .from("notificaciones")
          .update({ leido: true })
          .in("id", idsNoLeidas);

        if (error) {
          console.error(
            "❌ Error de Supabase al marcar leídas:",
            error.message,
          );
          cargarNotificaciones();
        }
      } catch (err) {
        console.error("❌ Error inesperado al marcar leídas:", err);
      }
    }
  };

  const handleClicNotificacion = async (notif) => {
    if (notif.invitacion_id) {
      try {
        const { data, error } = await supabase
          .from("invitaciones")
          .select("*, hogares(codigo)")
          .eq("id", notif.invitacion_id)
          .single();

        if (error) throw error;

        if (data && data.estado === "pendiente") {
          setMostrarDropdown(false);
          setInvitacionSeleccionada(data);
        } else {
          alert(
            "Esta invitación ya fue aceptada, rechazada o ya no se encuentra pendiente.",
          );
        }
      } catch (err) {
        console.error("Error al buscar la invitación:", err);
        alert("No se pudo recuperar la invitación.");
      }
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <style>{`
        @keyframes bellIntermittentShake {
          0%, 75%, 100% {
            transform: rotate(0deg);
          }
          78% {
            transform: rotate(12deg);
          }
          82% {
            transform: rotate(-12deg);
          }
          86% {
            transform: rotate(8deg);
          }
          90% {
            transform: rotate(-8deg);
          }
          94% {
            transform: rotate(4deg);
          }
          98% {
            transform: rotate(0deg);
          }
        }
        .animate-bell-lapsos {
          animation: bellIntermittentShake 4s ease-in-out infinite;
        }
      `}</style>

      <button
        onClick={abrirDropdown}
        className="relative text-white hover:opacity-80 focus:outline-none flex items-center justify-center p-1 cursor-pointer"
        aria-label="Notificaciones"
      >
        <FaBell
          className={`text-xl md:text-2xl ${
            noLeidas ? "animate-bell-lapsos text-amber-400" : ""
          }`}
        />

        {noLeidas && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-purple-800 rounded-full animate-pulse border border-white"></span>
        )}
      </button>

      {mostrarDropdown && (
        <div className="fixed left-1/2 -translate-x-1/2 top-16 w-[90vw] max-w-[340px] sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-auto sm:mt-3 sm:w-80 dark:bg-slate-900 bg-white dark:border dark:border-slate-700 border border-slate-300 shadow-2xl z-50 text-white rounded-2xl overflow-hidden">
          <div className="p-3 font-semibold border-b dark:border-slate-800 border-slate-300 dark:text-cyan-300 text-slate-600 text-sm">
            Notificaciones
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-4 text-sm dark:text-slate-400 text-slate-950 text-center">
                No tenés notificaciones nuevas
              </div>
            ) : (
              notificaciones.map((notif) => {
                const esInvitacion = !!notif.invitacion_id;
                const textoFinal = notif.mensaje;

                return (
                  <div
                    key={notif.id}
                    onClick={() =>
                      esInvitacion && handleClicNotificacion(notif)
                    }
                    className={`p-3 text-xs md:text-sm border-b dark:border-slate-800 border-slate-300 transition-colors ${
                      !notif.leido
                        ? "bg-indigo-950/40 dark:text-slate-400 text-slate-950 "
                        : "dark:text-slate-300 text-slate-950"
                    } ${
                      esInvitacion
                        ? "cursor-pointer hover:bg-indigo-900/40 hover:text-white"
                        : ""
                    }`}
                  >
                    <p className="dark:text-white text-slate-800">
                      {textoFinal}
                    </p>

                    {esInvitacion && (
                      <span className="text-[11px] text-indigo-400 font-semibold mt-1 block underline">
                        👉 Gestionar invitación
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {invitacionSeleccionada && (
        <ModalInvitacion
          invitacion={invitacionSeleccionada}
          onClose={() => setInvitacionSeleccionada(null)}
          onAceptada={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
