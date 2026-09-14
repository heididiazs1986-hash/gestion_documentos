const CACHE='gs-docs-v60';
const CORE=['./','./index.html','./manifest.json','./gs-docs-icon-192.png','./gs-docs-icon-512.png','./templates/Constancia_TD.pdf','./v60-hotfix.js'];
const REMOTE=['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js','https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];
const HOTFIX='<script src="./v60-hotfix.js?v=gsdoc-v60"></script>';

self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await c.addAll(CORE);
  await Promise.allSettled(REMOTE.map(async u=>{try{const r=await fetch(u,{mode:'cors'});if(r&&r.ok)await c.put(u,r.clone())}catch(_){}}));
  await self.skipWaiting();
})()));

self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));

async function pageWithHotfix(request){
  let response;
  try{response=await fetch(request,{cache:'no-store'});}catch(_){response=await caches.match('./index.html');}
  if(!response)return new Response('Sin conexión',{status:503});
  let html=await response.text();
  if(!html.includes('v60-hotfix.js'))html=html.replace('</body>',HOTFIX+'\n</body>');
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  headers.set('cache-control','no-store');
  headers.delete('content-length');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  const isAppPage=e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/');
  if(isAppPage){e.respondWith(pageWithHotfix(e.request));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    const copy=resp.clone();
    caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
    return resp;
  }).catch(()=>caches.match(e.request))));
});
