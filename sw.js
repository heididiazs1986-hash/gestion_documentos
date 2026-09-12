const CACHE='gs-docs-v53-1';
const CORE=['./','./index.html','./manifest.json','./gs-docs-icon-192.png','./gs-docs-icon-512.png','./templates/Constancia_TD.pdf'];
const REMOTE=['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js','https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(CORE);await Promise.allSettled(REMOTE.map(async u=>{try{const r=await fetch(u,{mode:'cors'});if(r&&r.ok)await c.put(u,r.clone())}catch(_){}}));await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return resp}).catch(()=>{if(e.request.mode==='navigate')return caches.match('./index.html');return caches.match(e.request)})))});
