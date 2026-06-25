const CACHE_NAME = 'ri-hub-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/fonts/tabler-icons.woff2'
];

// INSTALL — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH — serve from cache, fallback to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// PUSH NOTIFICATIONS
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'R&I Hub';
  const options = {
    body: data.body || 'Tenés una nueva notificación.',
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
    tag: data.tag || 'ri-hub',
    renotify: true,
    data: { url: data.url || './' },
    actions: data.actions || [
      { action: 'open', title: 'Ver ahora' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// NOTIFICATION CLICK
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data.url || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const existing = clientList.find(c => c.url.includes('index.html') && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// BACKGROUND SYNC (para cuando recupera conexión)
self.addEventListener('sync', e => {
  if (e.tag === 'sync-payments') {
    e.waitUntil(syncPayments());
  }
});

async function syncPayments() {
  // Aquí irá la sincronización con Oracle API en el Paso 3
  console.log('[SW] Background sync: payments');
}
