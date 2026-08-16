import { FaPen, FaTrash, FaLock } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { obtenerEstiloCategoriaComun } from "../utils/gastosUtils";

export default function HistorialGastos({ gastos, sesionId, onEditar, onEliminar }) {
  const { theme } = useTheme();
  
  if (!gastos || gastos.length === 0) {
    return (
      <p className="text-center text-slate-500 py-10">
        No hay gastos registrados en este hogar.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {gastos.map((gasto) => {
        const esPropietario = String(gasto.pagado_por) === String(sesionId);

        return (
          <div 
            key={gasto.id} 
            className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all hover:border-indigo-500/50 shadow-sm"
          >
            {/* Contenedor izquierdo: Categoría y Descripción */}
            <div className="w-full md:w-auto overflow-hidden">
              <span 
                className="text-[12px] md:text-[14px] px-2.5 py-0.5 rounded-md uppercase font-bold border inline-block truncate max-w-full" 
                style={obtenerEstiloCategoriaComun(gasto.categorias, theme)}
              >
                {gasto.categorias?.nombre || 'Sin categoría'}
              </span>
              <p className="text-sm mt-1 text-slate-900 dark:text-slate-300 break-words">
                {gasto.descripcion}
                <span className="text-[10px] text-slate-500 ml-2 italic">
                  - {gasto.perfiles?.nombre || 'Invitado'}
                </span>
              </p>
            </div>

            {/* Contenedor derecho: Monto y Botones (Abajo en celular, al lado en compu) */}
            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/60">
              <div className="font-bold text-xl md:text-2xl text-slate-900 dark:text-white">
                ${parseFloat(gasto.monto).toLocaleString('es-AR')}
              </div>
              
              {esPropietario ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => onEditar(gasto)} 
                    className="text-slate-400 hover:text-indigo-400 p-1.5 transition-colors"
                    aria-label="Editar gasto"
                  >
                    <FaPen size={14} />
                  </button>
                  <button 
                    onClick={() => onEliminar(gasto)} 
                    className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors"
                    aria-label="Eliminar gasto"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-700 text-xs p-1">
                  <FaLock />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}