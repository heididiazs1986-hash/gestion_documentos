const CACHE_NAME = "gs-documentos-cache-v4";

const APP_SHELL = [
  "./",
  "./index.html?v=gsdoc-v4",
  "./manifest.json?v=gsdoc-v4",
  "./icon-192.png?v=gsdoc-v4",
  "./icon-512.png?v=gsdoc-v4"
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Navegación principal: primero red para que Vercel entregue la versión nueva.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html?v=gsdoc-v4", copy));
          return response;
        })
        .catch(() => caches.match("./index.html?v=gsdoc-v4") || caches.match("./"))
    );
    return;
  }

  // Archivos del mismo origen: red primero, caché como respaldo offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
