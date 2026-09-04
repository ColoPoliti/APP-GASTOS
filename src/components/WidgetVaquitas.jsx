import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useUser } from "../context/UserContext";
import { FaPiggyBank, FaUsers, FaArrowRight } from "react-icons/fa";

export default function WidgetVaquitas({ onSeleccionarVaquita }) {
  const { sesion } = useUser();
  const [vaquitasAbiertas, setVaquitasAbiertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const traerResumenVaquitas = async () => {
      try {
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
          .eq("estado", "abierta")
          .order("created_at", { ascending: false })
          .limit(3); // Mostramos las 3 más recientes en el dashboard

        if (error) throw error;
        setVaquitasAbiertas(data || []);
      } catch (err) {
        console.error("Error al cargar resumen de vaquitas:", err);
      } finally {
        setLoading(false);
      }
    };

    if (sesion) {
      traerResumenVaquitas();
    }
  }, [sesion]);

  if (loading) return null;
  if (vaquitasAbiertas.length === 0) return null; // Si no hay abiertas, no muestra nada para no molestar

  return (
    <div className="mb-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg">
            <FaPiggyBank />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Vaquitas Activas 🐷
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vaquitasAbiertas.map((v) => (
          <div
            key={v.id}
            onClick={() => onSeleccionarVaquita(v)}
            className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-500/10 text-amber-500">
                  {v.estado}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-500 transition-colors line-clamp-1">
                {v.titulo}
              </h4>
            </div>

            <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FaUsers size={12} />
                {v.vaquita_participantes?.length || 1}
              </span>
              <span className="font-bold text-amber-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Ver <FaArrowRight size={10} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
