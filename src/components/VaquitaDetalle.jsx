import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "../context/UserContext";
import {
  FaArrowLeft,
  FaUserPlus,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaMoneyBillWave,
} from "react-icons/fa";
import toast from "react-hot-toast";

export default function VaquitaDetalle({ vaquita, onVolver }) {
  const { sesion } = useUser();
  const [participantes, setParticipantes] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [emailInvitado, setEmailInvitado] = useState("");

  // Estado para el formulario de nuevo gasto
  const [descripcionGasto, setDescripcionGasto] = useState("");
  const [montoGasto, setMontoGasto] = useState("");
  const [loadingGasto, setLoadingGasto] = useState(false);
  const [loadingInvitar, setLoadingInvitar] = useState(false);

  // Cargar participantes y gastos de esta vaquita de forma independiente
  const cargarDatosVaquita = async () => {
    try {
      // 1. Traer los participantes de la vaquita
      const { data: partData, error: partError } = await supabase
        .from("vaquita_participantes")
        .select("*")
        .eq("vaquita_id", vaquita.id);

      if (partError) throw partError;

      // 2. Buscar los perfiles de esos usuarios por separado para evitar errores de join
      let participantesConPerfil = [];
      if (partData && partData.length > 0) {
        const userIds = partData.map((p) => p.usuario_id);
        const { data: perfilesData, error: perfilesError } = await supabase
          .from("perfiles")
          .select("id, email")
          .in("id", userIds);

        if (perfilesError) throw perfilesError;

        // Combinamos la info manualmente
        participantesConPerfil = partData.map((p) => {
          const perfil = perfilesData?.find((per) => per.id === p.usuario_id);
          return {
            ...p,
            perfiles: perfil || { email: "Usuario" },
          };
        });
      }

      // VALIDACIÓN DE SEGURIDAD: Verificar si el usuario actual sigue participando
      const sigoParticipando = participantesConPerfil.some(
        (p) => p.usuario_id === sesion?.user?.id,
      );

      if (!sigoParticipando && vaquita.creador_id !== sesion?.user?.id) {
        toast.error("Ya no formás parte de esta vaquita, amiguito.", {
          position: "bottom-center",
        });
        onVolver();
        return;
      }

      setParticipantes(participantesConPerfil);

      // 3. Traer los gastos de la vaquita
      const { data: gastosData, error: gastosError } = await supabase
        .from("vaquita_gastos")
        .select("*")
        .eq("vaquita_id", vaquita.id)
        .order("created_at", { ascending: false });

      if (gastosError) throw gastosError;
      setGastos(gastosData || []);
    } catch (err) {
      console.error("Error detallado al cargar vaquita:", err);
      toast.error("Error al sincronizar: " + (err.message || "desconocido"));
    }
  };

  useEffect(() => {
    if (vaquita?.id) {
      cargarDatosVaquita();
    }
  }, [vaquita]);

  // Invitar a alguien a la vaquita
  const handleInvitar = async (e) => {
    e.preventDefault();
    if (!emailInvitado.trim()) return;

    setLoadingInvitar(true);
    const emailLimpiado = emailInvitado.trim().toLowerCase();

    try {
      // 1. Buscar si existe el usuario en la tabla perfiles
      const { data: perfilData, error: perfilError } = await supabase
        .from("perfiles")
        .select("id, email")
        .eq("email", emailLimpiado)
        .maybeSingle();

      if (perfilError) throw perfilError;

      if (!perfilData) {
        toast.error(
          "El usuario con ese correo no está registrado en la app, crack.",
          { position: "bottom-center" },
        );
        setLoadingInvitar(false);
        return;
      }

      // 2. Verificar si ya es participante
      const yaParticipa = participantes.some(
        (p) => p.usuario_id === perfilData.id,
      );
      if (yaParticipa) {
        toast("⚠️ Este usuario ya forma parte de la vaquita.", {
          position: "bottom-center",
        });
        setLoadingInvitar(false);
        return;
      }

      // 3. Insertar como participante
      const { error: insertError } = await supabase
        .from("vaquita_participantes")
        .insert([{ vaquita_id: vaquita.id, usuario_id: perfilData.id }]);

      if (insertError) throw insertError;

      toast.success("¡Colaborador sumado con éxito a la vaquita!", {
        position: "bottom-center",
      });
      setEmailInvitado("");
      cargarDatosVaquita();
    } catch (err) {
      console.error("Error al invitar:", err);
      toast.error("No se pudo sumar al usuario: " + err.message);
    } finally {
      setLoadingInvitar(false);
    }
  };

  // Eliminar un participante (Solo el creador puede quitar integrantes y sus gastos)
  const handleEliminarParticipante = async (
    participanteId,
    usuarioIdParticipante,
  ) => {
    const esCreador = vaquita.creador_id === sesion?.user?.id;

    if (!esCreador) {
      toast.error(
        "Solo el creador de la vaquita puede quitar integrantes, crack.",
      );
      return;
    }

    try {
      // 1. Borrar los gastos que este usuario había cargado en esta vaquita
      const { error: errorGastos } = await supabase
        .from("vaquita_gastos")
        .delete()
        .eq("vaquita_id", vaquita.id)
        .eq("usuario_id", usuarioIdParticipante);

      if (errorGastos) throw errorGastos;

      // 2. Borrar al participante de la tabla de relaciones
      const { error: errorParticipante } = await supabase
        .from("vaquita_participantes")
        .delete()
        .eq("id", participanteId);

      if (errorParticipante) throw errorParticipante;

      toast.success("Integrante y sus gastos removidos de la vaquita", {
        position: "bottom-center",
      });
      cargarDatosVaquita();
    } catch (err) {
      console.error("Error al remover participante y sus gastos:", err);
      toast.error("No se pudo completar la acción");
    }
  };

  // Agregar un gasto
  const handleAgregarGasto = async (e) => {
    e.preventDefault();
    if (!descripcionGasto.trim() || !montoGasto) return;

    // Doble chequeo defensivo antes de insertar
    const soyParticipanteActivo = participantes.some(
      (p) => p.usuario_id === sesion?.user?.id,
    );
    if (!soyParticipanteActivo && vaquita.creador_id !== sesion?.user?.id) {
      toast.error("No podés agregar gastos porque ya no formás parte.");
      onVolver();
      return;
    }

    setLoadingGasto(true);
    try {
      const { error } = await supabase.from("vaquita_gastos").insert([
        {
          vaquita_id: vaquita.id,
          usuario_id: sesion?.user?.id,
          descripcion: descripcionGasto.trim(),
          monto: parseFloat(montoGasto),
        },
      ]);

      if (error) throw error;

      toast.success("¡Gasto registrado!", { position: "bottom-center" });
      setDescripcionGasto("");
      setMontoGasto("");
      cargarDatosVaquita();
    } catch (err) {
      console.error("Error al guardar gasto:", err);
      toast.error("Error al registrar el gasto.");
    } finally {
      setLoadingGasto(false);
    }
  };

  // Eliminar un gasto
  const handleEliminarGasto = async (gastoId) => {
    try {
      const { error } = await supabase
        .from("vaquita_gastos")
        .delete()
        .eq("id", gastoId);

      if (error) throw error;
      toast.success("Gasto eliminado", { position: "bottom-center" });
      cargarDatosVaquita();
    } catch (err) {
      console.error("Error al borrar gasto:", err);
      toast.error("No se pudo borrar el gasto");
    }
  };

  // --- MATEMÁTICA DE LA VAQUITA (CUENTAS CLARAS BLINDADA) ---
  const totalGeneral = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  const cantParticipantes = participantes.length || 1;
  const porCabeza = totalGeneral / cantParticipantes;

  // Inicializar aportes exclusivamente con los participantes actuales
  const aportesPorUsuario = {};
  participantes.forEach((p) => {
    aportesPorUsuario[p.usuario_id] = 0;
  });

  // Sumar solo los gastos de usuarios que sigan participando activamente
  gastos.forEach((g) => {
    if (aportesPorUsuario[g.usuario_id] !== undefined) {
      aportesPorUsuario[g.usuario_id] += Number(g.monto);
    }
  });

  // Balances (Lo que puso menos lo que le tocaba)
  const balances = participantes.map((p) => {
    const puesto = aportesPorUsuario[p.usuario_id] || 0;
    const diferencia = puesto - porCabeza;
    return {
      usuario_id: p.usuario_id,
      email: p.perfiles?.email || "Usuario",
      puesto,
      diferencia,
    };
  });

  const esCreadorVaquita = vaquita.creador_id === sesion?.user?.id;

  return (
    <div className="w-full relative pt-16">
      {/* Cabecera fija (fixed) para asegurar que se quede arriba sí o sí */}
      <div
        className="fixed top-16 z-30 bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
        style={{ width: "-webkit-fill-available" }}
      >
        <button
          onClick={onVolver}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
        >
          <FaArrowLeft />
          <span>Volver a Mis Vaquitas</span>
        </button>
        <h2 className="text-lg font-black text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
          {vaquita.titulo}
        </h2>
      </div>

      <div className="w-full max-w-6xl mx-auto p-4 mt-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Participantes y Carga de Gastos */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sección Integrantes e Invitar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                <span>Integrantes</span>
                <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg">
                  {participantes.length}
                </span>
              </h3>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {participantes.map((p) => {
                  const esMiPropiaFila = p.usuario_id === sesion?.user?.id;

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <span className="truncate mr-2">
                        {p.perfiles?.email || "Participante"}
                        {p.usuario_id === vaquita.creador_id && (
                          <span className="text-[10px] text-amber-500 block font-bold">
                            Creador
                          </span>
                        )}
                      </span>

                      {esCreadorVaquita && !esMiPropiaFila && (
                        <button
                          onClick={() =>
                            handleEliminarParticipante(p.id, p.usuario_id)
                          }
                          className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                          title="Quitar integrante y sus gastos"
                        >
                          <FaTrash size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleInvitar}
                className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2"
              >
                <label className="block text-xs font-bold text-slate-400 uppercase">
                  Invitar por correo
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="amigo@email.com"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                    value={emailInvitado}
                    onChange={(e) => setEmailInvitado(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loadingInvitar}
                    className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    title="Sumar integrante"
                  >
                    <FaUserPlus size={14} />
                  </button>
                </div>
              </form>
            </div>

            {/* Formulario Cargar Gasto */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Cargar tu gasto
              </h3>

              <form onSubmit={handleAgregarGasto} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Carne, Carbón, Uber..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                    value={descripcionGasto}
                    onChange={(e) => setDescripcionGasto(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                    value={montoGasto}
                    onChange={(e) => setMontoGasto(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingGasto}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold p-3 rounded-xl transition-all shadow-md shadow-orange-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FaPlus size={12} />
                  <span>{loadingGasto ? "Guardando..." : "Agregar Gasto"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Columna Derecha: Resumen de Gastos y Balances */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta de Totales */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-lg shadow-xl border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Total Gastado en la Vaquita
                </p>
                <h3 className="text-3xl font-black text-amber-400">
                  ${totalGeneral.toLocaleString()}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Le toca a cada uno
                </p>
                <h3 className="text-xl font-bold text-white">
                  $
                  {porCabeza.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </h3>
              </div>
            </div>

            {/* Listado de Gastos Cargados */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Historial de gastos de la juntada
              </h3>

              {gastos.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Todavía no se cargó ningún gasto.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {gastos.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          {g.descripcion}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(g.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-amber-500 text-sm">
                          ${Number(g.monto).toLocaleString()}
                        </span>
                        {g.usuario_id === sesion?.user?.id && (
                          <button
                            onClick={() => handleEliminarGasto(g.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Borrar gasto"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cuentas Claras / Balance Final */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FaMoneyBillWave className="text-amber-500" />
                <span>Balances (¿Quién le paga a quién?)</span>
              </h3>

              <div className="space-y-3">
                {balances.map((b) => {
                  const estaAlDia = Math.abs(b.diferencia) < 1;
                  const leTienenQueDar = b.diferencia > 0;

                  return (
                    <div
                      key={b.usuario_id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          {b.email}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Puso: ${b.puesto.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        {estaAlDia ? (
                          <span className="bg-emerald-500/10 text-emerald-500 font-bold px-3 py-1 rounded-lg flex items-center gap-1">
                            <FaCheckCircle /> No debe NADA
                          </span>
                        ) : leTienenQueDar ? (
                          <span className="bg-amber-500/10 text-amber-500 font-bold px-3 py-1 rounded-lg">
                            Le deben: +$
                            {b.diferencia.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="bg-red-500/10 text-red-500 font-bold px-3 py-1 rounded-lg">
                            Tiene que poner: $
                            {Math.abs(b.diferencia).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
