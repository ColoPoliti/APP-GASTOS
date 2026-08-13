import { FaPen, FaTrash, FaLock } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { obtenerEstiloCategoriaComun, obtenerEstiloCategoria } from "../utils/gastosUtils";
import { obtenerColorTextoIdeal } from '../utils/colorUtils';

export default function HistorialGastos({ gastos, sesionId, onEditar, onEliminar }) {
  // ¡Acá está la magia que faltaba! Declaramos el theme para que la línea 29 no explote
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
            className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex justify-between items-center transition-all hover:border-indigo-500/50 shadow-sm"
          >
            <div>
              <span 
                className="text-[14px] px-2.5 py-0.5 rounded-md uppercase font-bold border inline-block" 
                style={obtenerEstiloCategoriaComun (gasto.categorias, theme)}
              >
                {gasto.categorias?.nombre || 'Sin categoría'}
              </span>
              <p className="text-sm mt-1 text-slate-900 dark:text-slate-300">
                {gasto.descripcion}
                <span className="text-[10px] text-slate-500 ml-2 italic">
                  - {gasto.perfiles?.nombre || 'Invitado'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="font-bold text-2xl text-slate-900 dark:text-white">
                ${parseFloat(gasto.monto).toLocaleString('es-AR')}
              </div>
              
              {esPropietario ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEditar(gasto)} 
                    className="text-slate-500 hover:text-indigo-400 p-1 transition-colors"
                  >
                    <FaPen />
                  </button>
                  <button 
                    onClick={() => onEliminar(gasto)} 
                    className="text-slate-500 hover:text-rose-500 p-1 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-700 text-xs">
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