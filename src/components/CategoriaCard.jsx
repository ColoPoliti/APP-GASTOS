// src/components/CategoriaCard.jsx
import SkeletonBox from './SkeletonBox';

export default function CategoriaCard({ nombre, total, estilo, loading }) {
  if (loading) {
    return <SkeletonBox className="h-24 w-full rounded-lg" />;
  }

  return (
    <div className="p-4 border" style={estilo}>
      <span className="block text-[10px] uppercase font-bold opacity-80">{nombre}</span>
      <div className="text-2xl font-black font-mono">
        ${total.toLocaleString('es-AR')}
      </div>
    </div>
  );
}