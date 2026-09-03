import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "../context/UserContext";
import { FaPiggyBank, FaPlus, FaTimes, FaUsers } from "react-icons/fa";
import toast from "react-hot-toast";
import VaquitaDetalle from "./VaquitaDetalle"; // <--- 1. Importamos el detalle

export default function VaquitasManager() {
  const { sesion } = useUser();
  const [vaquitas, setVaquitas] = useState([]);
  const [vaquitaSeleccionada, setVaquitaSeleccionada] = useState(null); // <--- 2. Estado para ver el detalle
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Cargar las vaquitas del usuario
  const traerVaquitas = async () => {
    try {
      setFetching(true);
      const userId = sesion?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("vaquitas")
        .select(
          `
          *,
          vaquita_participantes (
            usuario_id
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVaquitas(data || []);
    } catch (err) {
      console.error("Error al cargar vaquitas:", err);
      toast.error("No se pudieron cargar las vaquitas");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (sesion) {
      traerVaquitas();
    }
  }, [sesion]);

  // Crear una nueva vaquita
  const handleCrearVaquita = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setLoading(true);
    try {
      const userId = sesion?.user?.id;

      // 1. Insertar la vaquita
      const { data: vaquitaData, error: vaquitaError } = await supabase
        .from("vaquitas")
        .insert([
          { titulo: titulo.trim(), creador_id: userId, estado: "abierta" },
        ])
        .select()
        .single();

      if (vaquitaError) throw vaquitaError;

      // 2. Auto-agregarse como participante inicial
      const { error: partError } = await supabase
        .from("vaquita_participantes")
        .insert([{ vaquita_id: vaquitaData.id, usuario_id: userId }]);

      if (partError) throw partError;

      toast.success("¡Vaquita creada con éxito!", {
        position: "bottom-center",
      });
      setTitulo("");
      setIsOpenModal(false);
      traerVaquitas();
    } catch (err) {
      console.error("Error al crear vaquita:", err);
      toast.error("Error al crear la vaquita: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. SI HAY UNA VAQUITA SELECCIONADA, MOSTRAMOS SU DETALLE
  if (vaquitaSeleccionada) {
    return (
      <VaquitaDetalle
        vaquita={vaquitaSeleccionada}
        onVolver={() => {
          setVaquitaSeleccionada(null);
          traerVaquitas();
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
            <FaPiggyBank />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Hagamos una Vaquita
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gastos grupales, asados y juntadas sin vueltas
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpenModal(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-orange-600/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
        >
          <FaPlus />
          <span>Nueva Vaquita</span>
        </button>
      </div>

      {/* Listado de Vaquitas */}
      {fetching ? (
        <div className="text-center py-12 text-slate-400">
          Cargando vaquitas...
        </div>
      ) : vaquitas.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-slate-400 mb-4">
            No tenés ninguna vaquita creada todavía.
          </p>
          <button
            onClick={() => setIsOpenModal(true)}
            className="text-amber-500 font-bold hover:underline"
          >
            ¡Creá la primera ahora!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vaquitas.map((v) => (
            <div
              key={v.id}
              onClick={() => setVaquitaSeleccionada(v)} // <--- Aquí activamos el detalle al hacer clic
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${v.estado === "abierta" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"}`}
                  >
                    {v.estado}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  {v.titulo}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 text-slate-400 text-xs">
                <span className="flex items-center gap-1.5">
                  <FaUsers size={14} />
                  {v.vaquita_participantes?.length || 1} participantes
                </span>
                <span className="font-bold text-amber-500 group-hover:translate-x-1 transition-transform">
                  Ver detalles &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Crear Vaquita */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsOpenModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <FaTimes size={18} />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Crear nueva Vaquita
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Dale un motivo claro para que todos sepan de qué es la juntada.
            </p>

            <form onSubmit={handleCrearVaquita} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Motivo / Título
                </label>
                <input
                  type="text"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-amber-500 text-sm"
                  placeholder="Ej: Asado de fin de semana, Cumple de Juan..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="w-1/2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-3.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-amber-500 text-white p-3.5 rounded-xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 cursor-pointer text-sm shadow-lg shadow-amber-500/20"
                >
                  {loading ? "Creando..." : "Crear Vaquita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
