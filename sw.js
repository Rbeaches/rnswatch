const CACHE_NAME = 'rnswatch-v1';
const ASSETS = [
  './',
  './index.html',
  './shop.html',
  './search.html',
  './repair.html',
  './track.html',
  './contact.html',
  './cart.html',
  './account.html',
  './login.html',
  './css/style.css',
  './js/main.js',
  './manifest.json'
];

// I-install at i-cache ang lahat ng assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Linisin ang lumang cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Cache-first strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});