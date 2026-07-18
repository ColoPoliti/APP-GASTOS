import { FaPen, FaTrash, FaLock } from "react-icons/fa";
import { obtenerEstiloCategoria } from "../utils/gastosUtils";

export default function HistorialGastos({ gastos, sesionId, onEditar, onEliminar }) {
  
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
        // Aseguramos la comparación de IDs
        const esPropietario = String(gasto.pagado_por) === String(sesionId);

        return (
          <div 
            key={gasto.id} 
            className="dark:bg-slate-900/20 border border-slate-900 p-4 rounded-xl flex justify-between items-center transition-all hover:border-indigo-500/50"
          >
            <div>
              <span 
                className="text-[14px] px-2 py-0.5 rounded-md uppercase font-bold border" 
                style={obtenerEstiloCategoria(gasto.categorias)}
              >
                {gasto.categorias?.nombre || 'Sin categoría'}
              </span>
              <p className="text-sm mt-1 text-slate-300">
                {gasto.descripcion}
                <span className="text-[10px] text-slate-500 ml-2 italic">
                  - {gasto.perfiles?.nombre || 'Invitado'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="font-bold text-2xl font-mono text-white">
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
                <span className="text-slate-700 text-xs">
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