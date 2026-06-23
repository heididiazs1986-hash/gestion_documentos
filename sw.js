const CACHE_NAME = "gs-documentos-cache-v34";
const APP_SHELL = ["/", "/index.html?v=gsdoc-v34", "/manifest.json?v=gsdoc-v34", "/icon-192.png?v=gsdoc-v34", "/icon-512.png?v=gsdoc-v34"];
self.addEventListener("message", e=>{ if(e.data&&e.data.type==="SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("install", e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL).catch(()=>undefined))); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch", e=>{ if(e.request.method!=="GET") return; const u=new URL(e.request.url); if(u.origin!==self.location.origin) return; e.respondWith(fetch(e.request).then(r=>{ const copy=r.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)); return r; }).catch(()=>caches.match(e.request).then(c=>c||caches.match("/index.html?v=gsdoc-v34")))); });
