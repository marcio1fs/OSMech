const CACHE_NAME = 'osmech-v1';
const OFFLINE_URL = '/offline.html';

// Arquivos para cachear na instalação
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching offline page');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Estratégia de cache: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar requisições não-GET
  if (request.method !== 'GET') return;

  // Ignorar requisições da API (sempre rede)
  // Ignorar requisições de extensões do navegador
  if (request.url.startsWith('chrome-extension://') || 
      request.url.startsWith('moz-extension://') ||
      request.url.startsWith('safari-extension://')) {
    return;
  }

  if (request.url.includes('/api/')) {
    return event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'Você está offline' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
  }

  // Para assets estáticos, usar Cache First
  if (request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Adicionar try/catch para evitar erros de cache
                try {
                  cache.put(request, responseToCache);
                } catch (error) {
                  console.warn('Cache put error:', error);
                }
              });
            return response;
          });
        })
    );
    return;
  }

  // Para navegação, usar Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(request, responseToCache));
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se for navegação, retornar página offline
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nova notificação do OSMech',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('OSMech', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((windowClients) => {
          // Verificar se já tem uma aba aberta
          for (const client of windowClients) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          // Abrir nova aba
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Background Sync (para operações offline)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-os') {
    event.waitUntil(syncServiceOrders());
  }
});

async function syncServiceOrders() {
  // Implementar sincronização de OS criadas offline
  console.log('[SW] Syncing service orders...');
}
