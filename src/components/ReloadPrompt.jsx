import React, { useEffect, useState } from 'react';

export default function ReloadPrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        if (reg.waiting) {
          setNeedRefresh(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 max-w-sm bg-slate-900 border border-indigo-500/50 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🚀</span>
        <div className="flex-1">
          <h4 className="font-bold text-sm text-pink-500">¡Nueva versión disponible!</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Hay mejoras nuevas en GatillarApp. Actualizá para disfrutar la última versión, amiguito.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={updateServiceWorker}
              className="flex-1 bg-pink-600 hover:bg-pink-500 active:scale-95 text-xs font-semibold py-2 px-3 rounded-xl transition shadow-lg shadow-pink-900/30 cursor-pointer"
            >
              Actualizar ahora
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2 px-3 rounded-xl transition cursor-pointer"
            >
              Después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}