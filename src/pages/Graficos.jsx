// src/pages/Graficos.jsx
import { useState, useEffect } from 'react';
import TanqueCard from '../components/TanqueCard';
import SkeletonBox from '../components/SkeletonBox'; // Asegurate de tenerlo

export default function Graficos() {
  const [loading, setLoading] = useState(true);
  const [niveles, setNiveles] = useState([]);

  useEffect(() => {
    // Simulamos una llamada a API
    setTimeout(() => {
      setNiveles([80, 15, 90]);
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-8">Panel de Líquidos</h1>
      
      <div className="flex gap-8 justify-center flex-wrap">

        {loading ? (
          [1, 2, 3].map((i) => <TanqueCard key={i} loading={true} />)
        ) : (
          // Cuando termina de cargar, mapeamos los datos reales
          niveles.map((nivel, index) => (
            <TanqueCard 
              key={index} 
              numero={index + 1} 
              nivel={nivel} 
              loading={false}
            />
          ))
        )}
      </div>
    </div>
  );
}