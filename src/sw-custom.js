// src/sw-custom.js

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
    icon: '/pwa-192x192.png', // Asegurate de tener este ícono en tu carpeta public
    badge: '/pwa-192x192.png',
    data: {
      url: data.url || '/' // A dónde redirigir al hacer clic en la notificación
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
      // Si la app ya está abierta en una pestaña, la enfoca y la lleva a la URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no está abierta, abre una ventana nueva con la URL correspondiente
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});