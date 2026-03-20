const CACHE = 'debloat-v1';
const FILES = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});

// Handle notification messages posted from the app
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SHOW_NOTIF') {
    const { title, body, icon, badge, tag } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icon-192.png',
      badge: badge || '/icon-192.png',
      tag: tag || 'debloat-reminder',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        { action: 'open', title: '✅ Open app' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});

// Handle notification click — open the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
