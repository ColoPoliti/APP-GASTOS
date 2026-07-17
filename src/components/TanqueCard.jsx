
import { useMemo } from 'react';
import ReactLiquidGauge from './ReactLiquidGauge';
import SkeletonBox from './SkeletonBox'; // Asegurate de tenerlo

export default function TanqueCard({ numero, nivel, loading }) {
  
  const color = useMemo(() => {
    if (nivel < 30) return '#ef4444';
    if (nivel < 70) return '#eab308';
    return '#22c55e';
  }, [nivel]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 transition-colors duration-500 p-6 rounded-2xl shadow-lg flex flex-col items-center">
      {loading ? (
        <SkeletonBox className="h-6 w-24 mb-4" />
      ) : (
        <h2 className="text-lg font-bold text-gray-400 mb-4">Tanque {numero}</h2>
      )}
      
      {loading ? (

      <SkeletonBox className="h-[200px] w-[200px] rounded-full my-2" />
      ) : (
        <ReactLiquidGauge 
          value={nivel} 
          gradient={true}
          stroke="#1f2937" 
          circleColor="gray"
          startColor={color}
          stopColor={color}
        />
      )}
      
      <div className="mt-4 font-bold text-gray-400 text-xl">
        {loading ? <SkeletonBox className="h-6 w-12" /> : `${nivel}%`}
      </div>
    </div>
  );
}