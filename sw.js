const CACHE_NAME = 'gs-documentos-cache-v29';
const APP_SHELL = [
  './index.html?v=gsdoc-v29',
  './manifest.json?v=gsdoc-v29',
  './icon-192.png?v=gsdoc-v29',
  './icon-512.png?v=gsdoc-v29',
  './icon-180.png?v=gsdoc-v29'
];
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL).catch(() => undefined)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.searchParams.get('clear') === '1') {
    event.respondWith(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => fetch(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html?v=gsdoc-v29'))));
});
