import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "../context/UserContext";
import toast, { Toaster } from "react-hot-toast";
import { FaExclamationTriangle, FaCrown } from "react-icons/fa";

export default function SetupHogar({ userId, onHogarSet }) {
  const { actualizarHogar } = useUser();
  const navigate = useNavigate();
  const [tempHogar, setTempHogar] = useState("");
  const [loading, setLoading] = useState(false);
  const [misHogares, setMisHogares] = useState([]);
  const [existe, setExiste] = useState(null);

  // Estado para la opción de importar categorías
  const [hogarOrigenCategorias, setHogarOrigenCategorias] = useState("");

  // Estado para las vaquitas creadas por el usuario
  const [misVaquitas, setMisVaquitas] = useState([]);

  // 1. Verificar si el hogar existe al escribir manualmente
  useEffect(() => {
    if (tempHogar.length < 3) {
      setExiste(null);
      return;
    }

    const esHogarExistente = misHogares.some(
      (h) => h.codigo === tempHogar.toUpperCase(),
    );
    if (esHogarExistente) {
      setExiste(true);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("hogares")
        .select("id")
        .eq("codigo", tempHogar.toUpperCase())
        .maybeSingle();
      setExiste(!!data);
    }, 300);

    return () => clearTimeout(timer);
  }, [tempHogar, misHogares]);

  // 2. Cargar hogares propios y hogares de invitaciones ya aceptadas (con el creador_id para validar la corona)
  useEffect(() => {
    const fetchMisHogares = async () => {
      if (!userId) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: creados } = await supabase
        .from("hogares")
        .select("id, codigo, creador_id")
        .eq("creador_id", userId);

      const { data: invitacionesAceptadas } = await supabase
        .from("invitaciones")
        .select("hogares(id, codigo, creador_id)")
        .eq("email_invitado", user.email)
        .eq("estado", "aceptada");

      const listaRaw = [
        ...(creados || []),
        ...(invitacionesAceptadas
          ?.map((i) => i.hogares)
          .filter((h) => h !== null) || []),
      ];

      const listaUnica = Array.from(
        new Map(listaRaw.map((hogar) => [hogar.id, hogar])).values(),
      );

      setMisHogares(listaUnica);
    };
    fetchMisHogares();
  }, [userId]);

  // 2.1 Cargar las vaquitas creadas por el usuario actual
  useEffect(() => {
    const fetchMisVaquitas = async () => {
      if (!userId) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vaquitasCreadas } = await supabase
        .from("vaquitas")
        .select("id, titulo, creador_id, estado, created_at")
        .eq("creador_id", userId);

      setMisVaquitas(vaquitasCreadas || []);
    };
    fetchMisVaquitas();
  }, [userId]);

  // 3. Crear Hogar e importar categorías si seleccionó una procedencia
  const handleCrearHogar = async (nombreHogar) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const codigoHogar = nombreHogar.toUpperCase();

      // Creamos el nuevo hogar
      const { data: nuevoHogar, error } = await supabase
        .from("hogares")
        .insert([{ codigo: codigoHogar, creador_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Si el usuario eligió un hogar para importar categorías
      if (hogarOrigenCategorias) {
        // Traemos las categorías del hogar viejo
        const { data: categoriasViejas, error: errCatFetch } = await supabase
          .from("categorias")
          .select("nombre, color")
          .eq("hogar_id", hogarOrigenCategorias);

        if (!errCatFetch && categoriasViejas && categoriasViejas.length > 0) {
          // Preparamos el array para el nuevo hogar
          const categoriasNuevas = categoriasViejas.map((cat) => ({
            nombre: cat.nombre,
            color: cat.color || "#6366f1",
            hogar_id: nuevoHogar.id,
          }));

          // Las insertamos de una sola vez
          const { error: errCatInsert } = await supabase
            .from("categorias")
            .insert(categoriasNuevas);

          if (errCatInsert)
            console.error("Error al clonar categorías:", errCatInsert);
        }
      }

      await supabase
        .from("perfiles")
        .update({ hogar_id: nuevoHogar.id })
        .eq("id", user.id);

      actualizarHogar(nuevoHogar.id, codigoHogar);

      setMisHogares((prev) => [...prev, nuevoHogar]);
      setTempHogar("");
      setHogarOrigenCategorias("");
      if (onHogarSet) onHogarSet(nuevoHogar.id, codigoHogar);

      toast.success("¡Bolsillo creado correctamente!");
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el Bolsillo");
    } finally {
      setLoading(false);
    }
  };

  // 4. Unirse a Hogar existente
  const handleUnirseHogar = async () => {
    setLoading(true);
    try {
      const codigoHogar = tempHogar.toUpperCase();
      const { data: hogar } = await supabase
        .from("hogares")
        .select("id, codigo")
        .eq("codigo", codigoHogar)
        .single();

      if (hogar) {
        await supabase
          .from("perfiles")
          .update({ hogar_id: hogar.id })
          .eq("id", userId);

        actualizarHogar(hogar.id, hogar.codigo);

        if (onHogarSet) onHogarSet(hogar.id, hogar.codigo);
        toast.success(`Te uniste al Bolsillo ${hogar.codigo}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al unirse al Bolsillo");
    } finally {
      setLoading(false);
    }
  };

  // 5. Eliminar Hogar validando antes de mostrar confirmación
  const confirmarEliminarHogar = async () => {
    setLoading(true);
    const { data: hogarInfo, error: fetchError } = await supabase
      .from("hogares")
      .select("id, creador_id")
      .eq("codigo", tempHogar.toUpperCase())
      .single();

    setLoading(false);

    if (fetchError || !hogarInfo) {
      toast.error("No se pudo verificar la propiedad del Bolsillo.");
      return;
    }

    if (hogarInfo.creador_id !== userId) {
      toast(
        (t) => (
          <span className="flex items-center gap-2 text-amber-300 font-medium text-m">
            <FaExclamationTriangle className="text-amber-400 text-base shrink-0" />
            Solo el creador de este Bolsillo puede eliminarlo.
          </span>
        ),
        {
          style: {
            background: "#451a03",
            color: "#fde047",
            border: "1px solid #b45309",
          },
        },
      );
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-m text-slate-200 font-medium">
            ¿Estás seguro? Esto borrará el Bolsillo y todos sus datos
            permanentemente.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                ejecutarEliminacionHogar(hogarInfo.id);
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
        style: {
          background: "#1e293b",
          color: "#f8fafc",
          border: "1px solid #334155",
          maxWidth: "350px",
        },
      },
    );
  };

  const ejecutarEliminacionHogar = async (hogarId) => {
    setLoading(true);
    try {
      const { error: hogarError } = await supabase
        .from("hogares")
        .delete()
        .eq("id", hogarId);

      if (hogarError) throw hogarError;

      actualizarHogar(null, null);

      setMisHogares((prev) => prev.filter((h) => h.id !== hogarId));
      setTempHogar("");
      setExiste(false);

      toast.success("Bolsillo eliminado correctamente.");
    } catch (err) {
      console.error("Error detallado al eliminar:", err);
      toast.error("Error al intentar eliminar el Bolsillo.");
    } finally {
      setLoading(false);
    }
  };

  // Verificamos si el bolsillo tipeado/seleccionado actual pertenece al usuario actual
  const hogarActualObj = misHogares.find(
    (h) => h.codigo === tempHogar.toUpperCase(),
  );
  const esMiCreacion = hogarActualObj && hogarActualObj.creador_id === userId;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-200 dark:bg-slate-950 dark:text-white text-slate-950 overflow-y-auto">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f8fafc",
            border: "1px solid #334155",
          },
        }}
      />

      <div className="relative z-[9991] max-w-4xl w-full space-y-6 my-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold">¡Bienvenido!</h2>
          <p className="dark:text-slate-400 text-sm mt-1">
            Configurá tu Bolsillo o gestioná tus vaquitas:
          </p>
        </div>

        {/* CONTENEDOR DE DOS CARDS LADO A LADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* CARD 1: TU LÓGICA DE BOLSILLOS INTACTA */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border dark:border-slate-800 text-center shadow-lg h-full flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Bolsillos</h2>
              <p className="dark:text-slate-400 mb-6 text-sm">
                Seleccioná o creá tu Bolsillo para continuar:
              </p>

              <input
                className="w-full p-3 mb-4 bg-white dark:bg-slate-950 dark:text-white text-slate-950 font-semibold border border-slate-700 rounded-full uppercase tracking-wider focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Código de Bolsillo"
                value={tempHogar}
                onChange={(e) => setTempHogar(e.target.value.toUpperCase())}
              />

              {misHogares.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-6 justify-center">
                  {misHogares.map((hogar) => {
                    const esCreador = hogar.creador_id === userId;
                    return (
                      <div
                        key={hogar.id}
                        className="relative inline-block mt-2"
                      >
                        {/* Coronita flotando afuera del badge, arriba a la derecha */}
                        {esCreador && (
                          <div
                            className="absolute -top-2.5 -right-1.5 z-10 bg-amber-500 text-slate-950 rounded-full p-1 shadow-md border border-slate-900 flex items-center justify-center"
                            title="Sos el creador de este Bolsillo"
                          >
                            <FaCrown size={10} className="fill-current" />
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setTempHogar(hogar.codigo);
                            setExiste(true);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-800 dark:bg-indigo-800 text-slate-300 rounded-full text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors border border-slate-700 block"
                        >
                          {hogar.codigo}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {tempHogar.length >= 3 && (
                <div className="mb-5 text-sm space-y-2">
                  {existe ? (
                    <div className="p-3 dark:bg-emerald-950/40 bg-emerald-500 border border-emerald-600/50 rounded-lg dark:text-emerald-400 text-emerald-900 font-bold flex items-center justify-center gap-2">
                      <i className="fa fa-check-circle text-base"></i> ¡El
                      Bolsillo existe! Podés unirte.
                    </div>
                  ) : (
                    <div className="p-3 dark:bg-amber-950/40 bg-amber-500 border border-amber-600/50 rounded-lg dark:text-amber-400 text-amber-800 font-bold flex items-center justify-center gap-2">
                      <i className="fa fa-exclamation-triangle text-base"></i>{" "}
                      El Bolsillo no existe. Podés crearlo.
                    </div>
                  )}

                  {existe && esMiCreacion && (
                    <div className="py-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 uppercase tracking-wide">
                      <FaCrown size={12} className="text-amber-400 shrink-0" />
                      Este bolsillo lo creaste vos
                    </div>
                  )}
                </div>
              )}

              {tempHogar.length >= 3 && !existe && misHogares.length > 0 && (
                <div className="mb-4 text-left">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Importar categorías desde (opcional):
                  </label>
                  <select
                    value={hogarOrigenCategorias}
                    onChange={(e) => setHogarOrigenCategorias(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 dark:text-white text-slate-950 border border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">No importar (empezar de cero)</option>
                    {misHogares.map((h) => (
                      <option key={h.id} value={h.id}>
                        Bolsillo: {h.codigo}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={
                  existe ? handleUnirseHogar : () => handleCrearHogar(tempHogar)
                }
                disabled={loading || tempHogar.length < 3}
                className={`w-full p-3 rounded-lg font-bold text-white transition-colors disabled:opacity-50 shadow-lg ${
                  existe
                    ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                }`}
              >
                {loading
                  ? "Procesando..."
                  : existe
                    ? "Unirse al Bolsillo"
                    : "Crear nuevo Bolsillo"}
              </button>

              {existe && esMiCreacion && (
                <button
                  onClick={confirmarEliminarHogar}
                  className="w-full mt-4 p-2 dark:text-rose-400 text-rose-900 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors underline"
                >
                  <i className="fa fa-trash"></i> Eliminar este Bolsillo
                </button>
              )}
            </div>
          </div>

          {/* CARD 2: NUEVA CARD EXCLUSIVA PARA VAQUITAS (VACÍA / LISTA PARA TU LÓGICA) */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border dark:border-slate-800 text-center shadow-lg h-full flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Vaquitas</h2>
              <p className="dark:text-slate-400 mb-6 text-sm">
                Gestioná tus vaquitas de gastos compartidos:
              </p>

              {misVaquitas.length > 0 ? (
                <div className="space-y-2 mb-6 text-left">
                  {misVaquitas.map((v) => (
                    <button
                      key={v.id}
                      onClick={() =>
                        navigate("/vaquitas", { state: { vaquita: v } })
                      }
                      className="w-full p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="text-amber-400 font-bold text-sm truncate">
                        🐷 {v.titulo}
                      </span>
                      <span className="text-slate-400 text-xs shrink-0">
                        Entrar →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed dark:border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                  <p>No tenés vaquitas creadas todavía.</p>
                  <span className="mt-2 text-[10px] opacity-70">
                    Creá una para empezar a dividir gastos.
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/vaquitas")}
              className="w-full p-3 rounded-lg font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-sm mt-6 transition-all shadow-md shadow-orange-600/20"
            >
              Crear nueva Vaquita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
