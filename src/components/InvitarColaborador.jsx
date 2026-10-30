import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "../context/UserContext";
import { FaUserPlus, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

export default function InvitarColaborador({ hogarId }) {
  const { sesion } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvitar = async (e) => {
    e.preventDefault();
    if (!email) return;

    const emailIngresado = email.trim().toLowerCase();
    const emailActual = sesion?.user?.email?.trim()?.toLowerCase();

    // 1. Validamos que no se invite a sí mismo
    if (emailActual && emailIngresado === emailActual) {
      toast.error("No podés invitarte a tu propio bolsillo, crack.", {
        position: "bottom-center",
      });
      return;
    }

    setLoading(true);

    // 1.1. Solo el creador del bolsillo puede invitar colaboradores
    const { data: hogarData, error: hogarError } = await supabase
      .from("hogares")
      .select("id, creador_id")
      .eq("id", hogarId)
      .single();

    if (hogarError || !hogarData) {
      toast.error("No se pudo verificar el bolsillo.", {
        position: "bottom-center",
      });
      setLoading(false);
      return;
    }

    const esCreador = String(hogarData.creador_id || "").trim() === String(sesion?.user?.id || "").trim();

    if (!esCreador) {
      toast.error(
        "Solo el creador de este bolsillo puede invitar colaboradores.",
        {
          position: "bottom-center",
        },
      );
      setLoading(false);
      return;
    }

    try {
      // 1.5. RESTRICCIÓN FASE 1: Validar que el hogar no tenga ya 2 o más miembros
      const { count, error: countError } = await supabase
        .from("perfiles")
        .select("*", { count: "exact", head: true })
        .eq("hogar_id", hogarId);

      if (countError) throw countError;

      if (count >= 2) {
        toast.error(
          "Este bolsillo ya tiene el límite de 2 integrantes para esta versión, crack. ¡Pronto se viene la Fase 2 para más personas!",
          {
            position: "bottom-center",
            style: { background: "#1e293b", color: "#fff" },
          },
        );
        setLoading(false);
        return;
      }

      // 2. Verificamos si ya existe un perfil con ese email y si ya pertenece a este hogar
      const { data: perfilExistente, error: errorPerfilCheck } = await supabase
        .from("perfiles")
        .select("id, hogar_id")
        .eq("email", emailIngresado)
        .maybeSingle();

      if (errorPerfilCheck) throw errorPerfilCheck;

      // Si el usuario ya está registrado y su hogar_id coincide con el actual
      if (perfilExistente && perfilExistente.hogar_id === hogarId) {
        toast("⚠️ El usuario ya pertenece a este bolsillo.", {
          position: "bottom-center",
          style: { background: "#334155", color: "#fff" },
        });
        setLoading(false);
        return;
      }

      // 3. Insertamos la invitación si pasó las validaciones
      const { data: invData, error: invError } = await supabase
        .from("invitaciones")
        .insert([
          {
            hogar_id: hogarId,
            email_invitado: emailIngresado,
            estado: "pendiente",
          },
        ])
        .select()
        .single();

      if (invError) throw invError;

      // 4. Si el usuario existe pero está en otro hogar (o sin hogar), le generamos su notificación
      if (perfilExistente) {
        const { data: hogarData } = await supabase
          .from("hogares")
          .select("codigo")
          .eq("id", hogarId)
          .single();

        await supabase.from("notificaciones").insert({
          usuario_id: perfilExistente.id,
          mensaje: `Te invitaron al bolsillo: ${hogarData?.codigo || "Bolsillo"}`,
          invitacion_id: invData.id,
        });
      }

      toast.success("¡Invitación enviada a " + email + "!", {
        position: "bottom-center",
      });
      setEmail("");
      setIsOpen(false);
    } catch (err) {
      console.error("Error al enviar invitación:", err);
      toast.error("Error al enviar invitación: " + err.message, {
        position: "bottom-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tarjeta compacta optimizada para celular y escritorio */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900/40 border dark:border-slate-800  p-3.5 mb-4 backdrop-blur-sm shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-lg">
            <FaUserPlus size={18} />
          </div>
          <div className="mr-6">
            <h4 className="text-sm font-semibold dark:text-white text-slate-800">
              Invitar colaborador
            </h4>
            <p className="text-xs text-slate-400">
              Sumá a alguien a este bolsillo
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition shadow-lg shadow-cyan-900/20 cursor-pointer flex items-center gap-1.5"
          title="Invitar colaborador"
        >
          <FaUserPlus size={12} />
          <span>Invitar</span>
        </button>
      </div>

      {/* Modal flotante */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center dark:bg-black/80 bg-black/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-md dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl p-6 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <FaTimes size={18} />
            </button>

            <h3 className="dark:text-white text-slate-950 font-bold text-xl mb-4">
              Invitar a alguien
            </h3>

            <form onSubmit={handleInvitar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  className="w-full p-3 dark:bg-slate-950 bg-white dark:text-white text-slate-900 border border-slate-700 rounded-full focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="colaborador@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 bg-slate-800 text-slate-300 p-3 rounded-lg font-bold hover:bg-slate-700 transition-colors cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50 cursor-pointer text-sm"
                >
                  {loading ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
