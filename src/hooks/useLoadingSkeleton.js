import { useState, useEffect } from 'react';

export function useLoadingSkeleton(realLoading, minDelay = 1000) {
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (!realLoading) {
      // Si la carga real terminó, esperamos el tiempo mínimo antes de quitar el skeleton
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, minDelay);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [realLoading, minDelay]);

  return showSkeleton;
}