// Service Worker para ZyloFM PWA
const CACHE_NAME = 'zylofm-v1';
const OFFLINE_URL = '/offline.html';

// Recursos a cachear
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/og-image.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('ZyloFM SW: Cacheando recursos');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.log('ZyloFM SW: Error al cachear:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Estrategia de caché: Network First con fallback a caché
self.addEventListener('fetch', (event) => {
  // Ignorar requests que no son GET
  if (event.request.method !== 'GET') return;

  // Ignorar requests de API y auth
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.includes('_next')) {
    return;
  }

  // Ignorar streams de audio
  if (
    event.request.url.includes('.m3u8') ||
    event.request.url.includes('.ts') ||
    event.request.url.includes('.mp3') ||
    event.request.url.includes('stream')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, cachearla
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, buscar en caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si es navegación y no hay caché, mostrar página offline
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
