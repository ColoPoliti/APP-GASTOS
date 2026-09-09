// src/components/GestionGastos.jsx
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient.js";
import HistorialGastos from "./HistorialGastos";
import GastoForm from "./GastoForm";
import CategoriaForm from "./CategoriaForm";
import TransferenciaForm from "./TransferenciaForm";
import { BsGripVertical } from "react-icons/bs";
import { FaFolder, FaPen, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { obtenerEstiloCategoria } from "../utils/gastosUtils";
import { useTheme } from "../context/ThemeContext.jsx";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import toast from "react-hot-toast";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function TarjetaCategoria({ cat, total, theme, setCategoriaEditando }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...obtenerEstiloCategoria(cat, theme, true) }}
      className="p-4 border rounded-xl relative group flex-none w-[72vw] max-w-[260px] sm:w-full sm:max-w-none snap-center box-border shadow-sm bg-white dark:bg-slate-900"
    >
      <div
        {...attributes}
        {...listeners}
        className="hidden sm:flex absolute top-0 left-0 bottom-0 w-10 items-center justify-center text-slate-400 hover:text-indigo-400 cursor-grab active:cursor-grabbing rounded-l-xl z-10"
        title="Arrastrar para mover (solo PC)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </div>

      <div className="pl-2 sm:pl-6 pr-6">
        <span className="block text-[10px] uppercase font-bold opacity-80 truncate">
          {cat.nombre}
        </span>
        <div className="text-xl font-black mt-1">
          ${total.toLocaleString("es-AR")}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCategoriaEditando(cat)}
        className="absolute top-2 right-2 opacity-100  sm:group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-400 cursor-pointer z-20"
      >
        <FaPen size={12} />
      </button>
    </div>
  );
}
export default function GestionGastos({ hogarId, sesion }) {
  const { theme } = useTheme();
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [transferencias, setTransferencias] = useState([]);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [tabActiva, setTabActiva] = useState("todos");

  const [paginaActual, setPaginaActual] = useState(1);
  const gastosPorPagina = 5;

  // Estado para el indicador activo del carrusel en mobile
  const [indiceActivoCarrusel, setIndiceActivoCarrusel] = useState(0);
  const carruselRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const traerCategorias = async () => {
    if (!hogarId) return;
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .eq("hogar_id", hogarId);
    setCategorias(data || []);
  };

  const traerGastos = async () => {
    if (!hogarId) return;
    const { data } = await supabase
      .from("gastos")
      .select(`*, categorias (*), perfiles (*)`)
      .eq("hogar_id", hogarId);
    setGastos(data || []);
  };

  const traerMiembros = async () => {
    if (!hogarId) return;
    const { data } = await supabase
      .from("perfiles")
      .select("*")
      .eq("hogar_id", hogarId);
    setMiembros(data || []);
  };

  const traerTransferencias = async () => {
    if (!hogarId) return;
    const { data } = await supabase
      .from("transferencias")
      .select("*")
      .eq("hogar_id", hogarId);
    setTransferencias(data || []);
  };

  useEffect(() => {
    if (hogarId) {
      traerCategorias();
      traerGastos();
      traerMiembros();
      traerTransferencias();
    }
  }, [hogarId]);

  // Manejar el scroll del carrusel para actualizar los indicadores en mobile
  const handleScrollCarrusel = () => {
    if (carruselRef.current) {
      const scrollLeft = carruselRef.current.scrollLeft;
      const cardWidth = carruselRef.current.firstChild?.clientWidth || 220;
      const nuevoIndice = Math.round(scrollLeft / cardWidth);
      setIndiceActivoCarrusel(nuevoIndice);
    }
  };

  const moverCarrusel = (direccion) => {
    if (carruselRef.current) {
      const cardWidth =
        (carruselRef.current.firstChild?.clientWidth || 220) + 12; // ancho + gap
      carruselRef.current.scrollBy({
        left: direccion === "izquierda" ? -cardWidth : cardWidth,
        behavior: "smooth",
      });
    }
  };

  const eliminarTransferencia = async (id) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-200 font-medium">
            ¿Estás seguro de que querés eliminar esta transferencia?
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const { error } = await supabase
                  .from("transferencias")
                  .delete()
                  .eq("id", id);
                if (error) {
                  toast.error("Error al eliminar: " + error.message, {
                    position: "bottom-center",
                  });
                } else {
                  toast.success("Transferencia eliminada con éxito", {
                    position: "bottom-center",
                  });
                  traerTransferencias();
                }
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "bottom-center" },
    );
  };

  const eliminarGasto = async (gasto) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm dark:text-slate-950 text-white font-medium">
            ¿Estás seguro de que querés eliminar este gasto?
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const { error } = await supabase
                  .from("gastos")
                  .delete()
                  .eq("id", gasto.id);
                if (error) {
                  toast.error("Error al eliminar: " + error.message, {
                    position: "bottom-center",
                  });
                } else {
                  toast.success("Gasto eliminado con éxito", {
                    position: "bottom-center",
                  });
                  traerGastos();
                }
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "bottom-center" },
    );
  };

  const gastosFiltrados =
    tabActiva === "todos"
      ? gastos
      : gastos.filter(
          (g) =>
            (g.perfiles?.nombre || g.perfiles?.email || "Invitado") ===
            tabActiva,
        );

  const gastosOrdenados = [...gastosFiltrados].sort((a, b) => {
    return (
      new Date(b.created_at || b.fecha || 0) -
      new Date(a.created_at || a.fecha || 0)
    );
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(gastosOrdenados.length / gastosPorPagina),
  );
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const indiceUltimoGasto = paginaSegura * gastosPorPagina;
  const indicePrimerGasto = indiceUltimoGasto - gastosPorPagina;
  const gastosPaginados = gastosOrdenados.slice(
    indicePrimerGasto,
    indiceUltimoGasto,
  );

  const nombresUsuarios = [
    ...new Set(
      gastos.map((g) => g.perfiles?.nombre || g.perfiles?.email || "Invitado"),
    ),
  ];

  const cambiarTab = (nuevoTab) => {
    setTabActiva(nuevoTab);
    setPaginaActual(1);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategorias((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-8 sm:space-y-10 box-border">
      {/* Formularios: Categoría y Gasto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full max-w-full">
        <div className="w-full min-w-0">
          <CategoriaForm
            hogarId={hogarId}
            categoriaEditando={categoriaEditando}
            onGuardar={() => {
              traerCategorias();
              traerGastos();
              setCategoriaEditando(null);
            }}
            onCancelar={() => setCategoriaEditando(null)}
            onEliminar={async (id) => {
              toast(
                (t) => (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm dark:text-slate-950 text-white font-medium">
                      ¿Estás seguro de que querés eliminar esta categoría?
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          toast.dismiss(t.id);
                          const { error } = await supabase
                            .from("categorias")
                            .delete()
                            .eq("id", id);
                          if (error) {
                            toast.error("Error al eliminar: " + error.message, {
                              position: "bottom-center",
                            });
                          } else {
                            toast.success("Categoría eliminada con éxito", {
                              position: "bottom-center",
                            });
                            setCategoriaEditando(null);
                            traerCategorias();
                            traerGastos();
                          }
                        }}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Sí, eliminar
                      </button>
                    </div>
                  </div>
                ),
                { duration: Infinity, position: "bottom-center" },
              );
            }}
          />
        </div>

        <div className="w-full min-w-0">
          <GastoForm
            categorias={categorias}
            gastoEditando={gastoEditando}
            hogarId={hogarId}
            sesionId={sesion?.user?.id}
            onGuardar={() => {
              setGastoEditando(null);
              traerGastos();
            }}
            onCancelar={() => setGastoEditando(null)}
          />
        </div>
      </div>

      {/* Listado de Categorías con Carrusel y Controles para Mobile */}
      <div className="space-y-3 w-full max-w-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <FaFolder className="text-indigo-400" size={14} /> Categorías
          </h3>
          <span className="hidden sm:inline text-[10px] text-slate-400 italic">
            💡 Mantené presionado y arrastrá desde el borde izquierdo ⠿
          </span>
        </div>

        <div className="relative w-full max-w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categorias.map((c) => c.id)}
              strategy={rectSortingStrategy} // <-- Usamos la estrategia de grilla
            >
              <div
                ref={carruselRef}
                onScroll={handleScrollCarrusel}
                id="categorias-carrusel"
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 pb-2 w-full max-w-full sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:overflow-visible sm:pb-0"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {categorias.map((cat) => {
                  const total = gastos
                    .filter((g) => g.categoria_id === cat.id)
                    .reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0);
                  return (
                    <TarjetaCategoria
                      key={cat.id}
                      cat={cat}
                      total={total}
                      theme={theme}
                      setCategoriaEditando={setCategoriaEditando}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          {/* Flechas de navegación exclusivas para Mobile */}
          <div className="flex sm:hidden justify-between items-center mt-2 px-1">
            <button
              type="button"
              onClick={() => moverCarrusel("izquierda")}
              className="p-2 bg-slate-800 text-slate-200 rounded-full hover:bg-slate-700 transition-colors shadow cursor-pointer"
            >
              <FaChevronLeft size={12} />
            </button>

            {/* Indicadores de posición (puntos) en mobile */}
            <div className="flex gap-1.5 items-center">
              {categorias.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === indiceActivoCarrusel
                      ? "w-4 bg-indigo-500"
                      : "w-1.5 bg-slate-600"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => moverCarrusel("derecha")}
              className="p-2 bg-slate-800 text-slate-200 rounded-full hover:bg-slate-700 transition-colors shadow cursor-pointer "
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Historial de Gastos, Pestañas y Paginación */}
      <div className="space-y-4 w-full max-w-full">
        <div
          className="flex gap-2 mb-4 overflow-x-auto pb-2 w-full max-w-full"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            onClick={() => cambiarTab("todos")}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer ${tabActiva === "todos" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
          >
            <span>Todos</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${tabActiva === "todos" ? "bg-pink-600 text-white" : "bg-pink-800/50 text-slate-300"}`}
            >
              {gastos.length}
            </span>
          </button>
          {nombresUsuarios.map((nombre) => {
            const cant = gastos.filter(
              (g) =>
                (g.perfiles?.nombre || g.perfiles?.email || "Invitado") ===
                nombre,
            ).length;
            return (
              <button
                key={nombre}
                onClick={() => cambiarTab(nombre)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer ${tabActiva === nombre ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}
              >
                <span>{nombre}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${tabActiva === nombre ? "bg-pink-600 text-white" : "bg-pink-800/50 text-slate-300"}`}
                >
                  {cant}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-full max-w-full overflow-x-auto">
          <HistorialGastos
            gastos={gastosPaginados}
            sesionId={sesion?.user?.id}
            onEditar={(gasto) => setGastoEditando(gasto)}
            onEliminar={(gasto) => eliminarGasto(gasto)}
          />
        </div>

        {/* Paginación con flechas e indicadores visibles en mobile y escritorio */}
        <div className="flex justify-between items-center pt-2 px-1 shadow-lg bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/65 w-full box-border">
          <button
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaSegura <= 1}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            <FaChevronLeft size={10} /> Anterior
          </button>

          <span className="text-xs text-slate-400 font-medium text-center">
            Página{" "}
            <strong className="text-white font-bold">{paginaSegura}</strong> de{" "}
            <strong className="text-white font-bold">{totalPaginas}</strong>
            <span className="text-slate-500 ml-2">
              ({gastosFiltrados.length} gastos)
            </span>
          </span>

          <button
            onClick={() =>
              setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
            }
            disabled={paginaSegura >= totalPaginas}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Siguiente <FaChevronRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
