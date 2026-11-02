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
  FaExchangeAlt,
  FaTimes,
  FaStar,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { calcularSplitVaquita } from "../utils/vaquitaUtils";

export default function VaquitaDetalle({ vaquita, onVolver }) {
  const { sesion } = useUser();
  const [participantes, setParticipantes] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [emailInvitado, setEmailInvitado] = useState("");

  // Estado para el formulario de nuevo gasto
  const [descripcionGasto, setDescripcionGasto] = useState("");
  const [montoGasto, setMontoGasto] = useState("");
  const [usuarioIdGasto, setUsuarioIdGasto] = useState(sesion?.user?.id);
  const [loadingGasto, setLoadingGasto] = useState(false);
  const [loadingParticipante, setLoadingParticipante] = useState(false);

  // Controla qué modal está abierto en mobile: "gasto" | "integrante" | null
  const [modalAbierto, setModalAbierto] = useState(null);

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
        const userIds = partData
          .map((p) => p.usuario_id)
          .filter((id) => id); // Evitar nulls en participantes agregados por nombre
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
            perfiles: perfil || { email: p.nombre || "Usuario" },
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

  // Agregar un integrante a la vaquita (directo, sin necesidad de invitación)
  // Podés agregarlo por correo (usuario registrado) o por nombre (sin registro)
  const handleAgregarParticipante = async (e) => {
    e.preventDefault();
    const emailLimpiado = emailInvitado.trim().toLowerCase();
    if (!emailLimpiado) return;

    const esEmail = emailLimpiado.includes("@");
    setLoadingParticipante(true);

    try {
      let insertData;

      if (esEmail) {
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
          setLoadingParticipante(false);
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
          setLoadingParticipante(false);
          return;
        }

        insertData = [{ vaquita_id: vaquita.id, usuario_id: perfilData.id }];
      } else {
        // 3. Agregar por nombre libre, sin necesidad de registro ni invitación
        insertData = [{ vaquita_id: vaquita.id, nombre: emailLimpiado }];
      }

      // 4. Insertar como participante
      const { error: insertError } = await supabase
        .from("vaquita_participantes")
        .insert(insertData);

      if (insertError) throw insertError;

      toast.success("¡Integrante agregado con éxito a la vaquita!", {
        position: "bottom-center",
      });
      setEmailInvitado("");
      setModalAbierto(null);
      cargarDatosVaquita();
    } catch (err) {
      console.error("Error al agregar integrante:", err);
      toast.error("No se pudo sumar al usuario: " + err.message);
    } finally {
      setLoadingParticipante(false);
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
      // (solo si tiene usuario_id, ej: los agregados por nombre no tienen gastos)
      if (usuarioIdParticipante) {
        const { error: errorGastos } = await supabase
          .from("vaquita_gastos")
          .delete()
          .eq("vaquita_id", vaquita.id)
          .eq("usuario_id", usuarioIdParticipante);

        if (errorGastos) throw errorGastos;
      }

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
      const opcionGasto = opcionesGasto.find((o) => o.id === usuarioIdGasto);
      const usuarioIdGastoReal =
        opcionGasto?.usuario_id || sesion?.user?.id;

      const { error } = await supabase.from("vaquita_gastos").insert([
        {
          vaquita_id: vaquita.id,
          usuario_id: usuarioIdGastoReal,
          descripcion: descripcionGasto.trim(),
          monto: parseFloat(montoGasto),
        },
      ]);

      if (error) throw error;

      toast.success("¡Gasto registrado!", { position: "bottom-center" });
      setDescripcionGasto("");
      setMontoGasto("");
      setModalAbierto(null);
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

  // --- MATEMÁTICA DE LA VAQUITA (TOTAL / CUOTA / BALANCES / DEUDAS) ---
  const {
    totalGeneral,
    porCabeza,
    cantParticipantes,
    balances,
    deudas,
  } = calcularSplitVaquita(gastos, participantes);

  const miBalance = balances.find(
    (b) => b.usuario_id === sesion?.user?.id,
  );

  const opcionesGasto = [
    ...(sesion?.user?.id
      ? [
        {
          id: sesion.user.id,
          label: `Yo (${sesion.user.email || "participante"})`,
          usuario_id: sesion.user.id,
        },
      ]
      : []),
    ...participantes
      .filter((p) => p.usuario_id && p.usuario_id !== sesion?.user?.id)
      .map((p) => ({
        id: p.usuario_id,
        label: p.perfiles?.email || p.nombre || "Participante",
        usuario_id: p.usuario_id,
      })),
    ...participantes
      .filter((p) => !p.usuario_id && p.nombre)
      .map((p) => ({
        id: p.id,
        label: p.nombre,
        usuario_id: p.id, // Se asocia al participante agregado por nombre
      })),
  ];

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
        <div className="flex items-center gap-2 min-w-0 max-w-[55%] sm:max-w-md">
          <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
            <FaStar size={8} /> PRO
          </span>
          <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
            {vaquita.titulo}
          </h2>
        </div>
      </div>

      {/* Acciones rápidas solo en mobile: abren modales con el formulario */}
      <div className="lg:hidden w-full max-w-6xl mx-auto px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setModalAbierto("gasto")}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold p-4 rounded-xl transition-all shadow-md shadow-orange-600/20 cursor-pointer"
          >
            <FaPlus size={14} />
            <span>Cargar Gasto</span>
          </button>
          <button
            onClick={() => setModalAbierto("integrante")}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <FaUserPlus size={14} />
            <span>Sumar Integrante</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto p-4 mt-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Participantes y Carga de Gastos */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            {/* Sección Integrantes e Invitar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                <span>Integrantes</span>
                <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg">
                  {participantes.length}
                </span>
              </h3>

              <div className="space-y-2">
                {participantes.map((p) => {
                  const esMiPropiaFila = p.usuario_id === sesion?.user?.id;

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <span className="truncate mr-2">
                        {p.nombre || p.perfiles?.email || "Participante"}
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

              {/* En mobile el alta de integrantes se hace desde el botón que abre el modal */}
              <div className="hidden lg:block">
              <form
                onSubmit={handleAgregarParticipante}
                className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2"
              >
                <label className="block text-xs font-bold text-slate-400 uppercase">
                  Sumar integrante
                </label>
                <p className="text-[11px] text-slate-400">
                  Agregá a alguien directamente a la vaquita, sin necesidad de
                  enviarle invitación.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="amigo@email.com o nombre"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                    value={emailInvitado}
                    onChange={(e) => setEmailInvitado(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loadingParticipante}
                    className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    title="Sumar integrante"
                  >
                    <FaUserPlus size={14} />
                  </button>
                </div>
              </form>
              </div>
            </div>

            {/* Formulario Cargar Gasto: en mobile se gestiona con el botón que abre el modal */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    ¿Quién pagó?
                  </label>
                  <select
                    value={usuarioIdGasto || sesion?.user?.id}
                    onChange={(e) => setUsuarioIdGasto(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  >
                    {opcionesGasto.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
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
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            {/* Tarjeta de Totales */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-lg shadow-xl border-4 border-amber-400 flex flex-col sm:flex-row justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Total Gastado en la Vaquita
                </p>
                <h3 className="text-5xl font-black text-amber-400">
                  ${totalGeneral.toLocaleString()}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Le toca a cada uno
                </p>
                <h3 className="text-2xl font-bold text-white">
                  $
                  {porCabeza.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </h3>
              </div>
            </div>

            {/* Contexto del split: cuántos dividen y cuánto le toca al usuario actual */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Dividido entre {cantParticipantes} integrante
                {cantParticipantes === 1 ? "" : "s"}
              </span>
              <span className="font-bold text-slate-800 dark:text-white">
                {miBalance ? (
                  miBalance.diferencia > 0 ? (
                    <span className="text-amber-500">
                      Le deben: +$
                      {miBalance.diferencia.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  ) : miBalance.diferencia < 0 ? (
                    <span className="text-red-500">
                      Tiene que pagar: $
                      {Math.abs(miBalance.diferencia).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 },
                      )}
                    </span>
                  ) : (
                    <span className="text-emerald-500">
                      No debe NADA, quedó al día. 🎉
                    </span>
                  )
                ) : (
                  <span className="text-slate-400">Sin participantes aún</span>
                )}
              </span>
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
                <div className="space-y-2">
                  {gastos.map((g) => {
                    const pagador = participantes.find(
                      (p) =>
                        p.usuario_id === g.usuario_id ||
                        (p.usuario_id == null && p.id === g.usuario_id),
                    );
                    const labelPagador =
                      pagador?.perfiles?.email ||
                      pagador?.nombre ||
                      "Participante";

                    return (
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
                          <span className="text-[10px] text-slate-400 font-bold">
                            Pagó: {labelPagador}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-amber-500 text-sm">
                            ${Number(g.monto).toLocaleString()}
                          </span>
                          {(g.usuario_id === sesion?.user?.id ||
                            esCreadorVaquita) && (
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
                    );
                  })}
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
                  const esMiFila = b.usuario_id === sesion?.user?.id;

                  return (
                    <div
                      key={b.usuario_id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-2xl border text-xs gap-3 sm:gap-0 ${esMiFila
                        ? "bg-amber-50 dark:bg-slate-900 border-amber-300 dark:border-slate-700"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800"
                        }`}
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white break-all">
                          {b.email}
                          {esMiFila && (
                            <span className="text-[10px] text-amber-500 font-bold uppercase ml-1">
                              Vos
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-400 mt-0.5">
                          Puso: ${b.puesto.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex justify-start sm:justify-end">
                        {estaAlDia ? (
                          <span className="bg-emerald-500/10 text-emerald-500 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs">
                            <FaCheckCircle /> No debe NADA
                          </span>
                        ) : leTienenQueDar ? (
                          <span className="bg-amber-500/10 text-amber-500 font-bold px-3 py-1.5 rounded-xl text-xs">
                            Le deben: +$
                            {b.diferencia.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="bg-red-500/10 text-red-500 font-bold px-3 py-1.5 rounded-xl text-xs">
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

              {/* Quién le debe a quién (deudas entre participantes) */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 mb-3">
                  <FaExchangeAlt className="text-amber-500" />
                  <span>Quién le debe a quién</span>
                </h4>

                {deudas.length === 0 ? (
                  <p className="text-xs text-emerald-500 font-bold text-center py-3">
                    ¡Estamos todos al día!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {deudas.map((d, idx) => {
                      const involucrado = [
                        d.deudor_id,
                        d.acreedor_id,
                      ].includes(sesion?.user?.id);

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${involucrado
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800"
                            }`}
                        >
                          <p className="text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-slate-800 dark:text-white">
                              {d.deudor_email}
                            </span>{" "}
                            le debe{" "}
                            <span className="font-black text-amber-500">
                              $
                              {d.monto.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </span>{" "}
                            a{" "}
                            <span className="font-bold text-slate-800 dark:text-white">
                              {d.acreedor_email}
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Cargar Gasto (mobile) */}
      {modalAbierto === "gasto" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setModalAbierto(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <FaTimes className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pr-6">
              Cargar Gasto
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

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  ¿Quién pagó?
                </label>
                <select
                  value={usuarioIdGasto || sesion?.user?.id}
                  onChange={(e) => setUsuarioIdGasto(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                >
                  {opcionesGasto.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
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
      )}

      {/* Modal para Sumar Integrante (mobile) */}
      {modalAbierto === "integrante" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setModalAbierto(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <FaTimes className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 pr-6">
              Sumar Integrante
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Agregá a alguien directamente a la vaquita, sin necesidad de enviarle
              invitación.
            </p>

            <form
              onSubmit={handleAgregarParticipante}
              className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2"
            >
              <label className="block text-xs font-bold text-slate-400 uppercase">
                Sumar integrante
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="amigo@email.com o nombre"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  value={emailInvitado}
                  onChange={(e) => setEmailInvitado(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loadingParticipante}
                  className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  title="Sumar integrante"
                >
                  <FaUserPlus size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
