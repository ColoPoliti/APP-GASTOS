// src/components/PushManager.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PUBLIC_VAPID_KEY = 'BOVNiqjnBymGf_OfPC280wgQ5mHfVq80GwzFA4kePW-xhaDsbFAEXq5Blcfwa1FqyZazOz52Hk1gtLIhanz-KWA';

export default function PushManager() {
  const { sesion, hogarId } = useUser();
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false); // Estado para ocultar el cartel si le da a la X

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkExistingSubscription();
    }
  }, []);

  async function checkExistingSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      setSubscription(existingSub);
    } catch (error) {
      console.error('Error al chequear suscripción existente:', error);
    }
  }

  async function subscribeUser() {
    if (!PUBLIC_VAPID_KEY || PUBLIC_VAPID_KEY === 'TU_CLAVE_PUBLICA_VAPID_AQUI') {
      alert('¡Falta configurar la Clave Pública VAPID en el código, amiguito!');
      return;
    }

    if (!sesion?.user?.id) {
      alert('Tenés que iniciar sesión para activar las notificaciones.');
      return;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== 'granted') {
        alert('Permiso de notificaciones denegado.');
        setLoading(false);
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      setSubscription(sub);

      try {
        await fetch('/api/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub,
            userId: sesion.user.id,
            hogarId: hogarId || 'default'
          }),
        });
      } catch (fetchError) {
        console.warn('Aviso: No se pudo guardar en el backend local (estás en npm run dev), pero la suscripción local se hizo.', fetchError);
      }

      alert('¡Notificaciones activadas con éxito! 🎉');
    } catch (error) {
      console.error('Error al intentar suscribir:', error);
      alert('Hubo un error al activar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }

  // Si no está soportado, si ya está suscripto (y querés que no moleste), o si lo cerró con la X, no mostramos nada
  if (!isSupported || dismissed) {
    return null;
  }

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white max-w-sm shadow-xl relative">
      {/* Botón de la X para cerrar */}
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        title="Cerrar"
      >
        ✕
      </button>

      <h3 className="font-bold text-sm mb-1 text-pink-500 pr-6">Notificaciones de GatillarApp 🏡</h3>
      
      {subscription ? (
        <p className="text-xs text-emerald-400 mt-2">
          ✓ Este dispositivo está recibiendo alertas de gastos.
        </p>
      ) : (
        <div>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            Activá las alertas para enterarte al instante cuando alguien cargue un gasto en tu hogar.
          </p>
          <button
            onClick={subscribeUser}
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-500 active:scale-95 disabled:opacity-50 text-xs font-semibold py-2.5 px-3 rounded-xl transition shadow-lg shadow-pink-900/30"
          >
            {loading ? 'Activando...' : 'Activar Notificaciones Push'}
          </button>
        </div>
      )}
    </div>
  );
}