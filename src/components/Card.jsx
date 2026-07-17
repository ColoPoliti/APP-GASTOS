// src/components/Card.jsx
import SkeletonBox from './SkeletonBox'; // El que hicimos antes

export default function Card({ title, children, loading }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
      {loading ? (
        // --- ESTADO DE CARGA (ESQUELETO) ---
        <div className="animate-pulse space-y-4">
          <SkeletonBox className="h-6 w-1/3" /> {/* Título en esqueleto */}
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-5/6" />
          </div>
        </div>
      ) : (
        // --- ESTADO REAL (CONTENIDO) ---
        <div>
          <h3 className="text-lg font-bold mb-4 dark:text-white">{title}</h3>
          <div>{children}</div>
        </div>
      )}
    </div>
  );
}