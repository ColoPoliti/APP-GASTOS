
// Línea obligatoria para que Workbox / Vite PWA no tire error en el build de Vercel
import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST || []);

// Escucha cuando llega una notificación push desde el servidor
self.addEventListener('push', function (event) {
  if (!event.data) return;

  const data = event.data.json();
  
  const title = data.title || 'GatillarApp 💸';
  const options = {
    body: data.body || 'Hay una nueva actividad en tu hogar.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Maneja el evento cuando el usuario hace clic en la notificación flotante del celular
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Permite que el botón de actualizar fuerce el cambio de versión de inmediato
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});