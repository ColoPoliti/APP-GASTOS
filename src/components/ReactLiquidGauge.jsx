import ReactLiquidGauge from 'react-liquid-gauge';
import { useMemo } from 'react';

export default function LiquidProgress({ value }) {
  
  // Definimos el color base según el nivel
  const color = useMemo(() => {
    if (value < 30) return '#ef4444'; // Rojo
    if (value < 70) return '#eab308'; // Amarillo
    return '#51B1B0';                 // Verde
  }, [value]);

  return (
    <ReactLiquidGauge
      key={value} // Esto fuerza la re-renderización y mantiene la animación activa
      value={value}
      width={200}
      height={200}
      gradient={true}
      gradientStops={[
        {
          key: '0%',
          stopColor: color,
          stopOpacity: 1,
        },
        {
          key: '100%',
          stopColor: color,
          stopOpacity: 1,
        }
      ]}
      // Mantenemos estas propiedades explícitas para la animación
      riseAnimation={true}
      waveAnimation={true}
      waveFrequency={1}
      waveAmplitude={4}
      circleStyle={{
        fill: '#1f2937'
      }}
      textRenderer={(props) => (
        <tspan style={{ fontWeight: 'bold', fontSize: '25px',}}>
          {`${Math.round(props.value)}%`}
        </tspan>
      )}
    />
  );
}