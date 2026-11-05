/* GS Documentos v78 - memoria segura
   Problema: localStorage (~5 MB) se llenaba porque las firmas (imágenes) se guardaban
   repetidas: en cada registro, en el estado de la jornada y en el registro abierto.
   Solución (sin perder datos):
   1) Cada imagen grande se guarda UNA sola vez en GS_DOCS_FIRMAS_V1 y el resto queda como referencia "sig:ID".
      Al leer, las referencias se expanden, así el resto de la app ve exactamente los mismos datos de siempre.
   2) La base TXT se guarda en formato compacto (sin repetir los nombres de columna).
   3) Las firmas nuevas se normalizan a 800 px de ancho (suficiente para el PDF).
   4) Medidor de memoria + aviso con acciones claras antes de que se llene. */
(()=>{
  'use strict';
  if(globalThis.__GS_DOCS_V78_STORAGE__) return;
  globalThis.__GS_DOCS_V78_STORAGE__=true;

  const REC='GS_DOCS_REGISTROS_V1', APP='GS_DOCS_V49', TXT='GS_DOCS_TXT_BASE_V1', SIGS='GS_DOCS_FIRMAS_V1';
  const LIMIT=5000000;                    // caracteres que el navegador permite (~5 MB)
  const SIG_MAX_W=800;
  const proto=Storage.prototype, rawSet=proto.setItem, rawGet=proto.getItem, rawRemove=proto.removeItem;
  const LS=globalThis.localStorage;
  const DATA_RE=/"data:image\/[a-z+.\-]+;base64,[A-Za-z0-9+\/=]{1500,}"/g;
  const REF_RE=/"sig:([a-z0-9]{4,30})"/g;

  function hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return s.length.toString(36)+h.toString(36)}
  function isQuota(e){return !!e&&(e.name==='QuotaExceededError'||e.code===22||e.code===1014||/quota/i.test(String(e.message||'')))}

  /* ---------- almacén de firmas (una copia por imagen) ---------- */
  let mapRaw=null,mapObj={},rev=new Map();
  function rebuildRev(){rev=new Map();for(const id of Object.keys(mapObj)){const v=mapObj[id];if(typeof v==='string')rev.set(v,id)}}
  function readMap(){
    let raw; try{raw=rawGet.call(LS,SIGS)||'{}'}catch(_){raw='{}'}
    if(raw!==mapRaw){try{mapObj=JSON.parse(raw)}catch(_){mapObj={}} mapRaw=raw;rebuildRev()}
    return mapObj;
  }
  function writeMap(obj){const raw=JSON.stringify(obj);rawSet.call(LS,SIGS,raw);mapRaw=raw;mapObj=obj;rebuildRev()}
  /* misma imagen => mismo id, aunque se haya reducido de tamaño */
  function idOf(s){readMap();return rev.get(s)||hash(s)}

  function expand(str){
    if(!str||str.indexOf('"sig:')<0) return str;
    const map=readMap();
    return str.replace(REF_RE,(m,id)=>map[id]?'"'+map[id]+'"':m);
  }
  function compress(str){
    if(!str||str.indexOf('"data:image/')<0) return {text:str,pending:null};
    const pending={};let any=false;
    const text=str.replace(DATA_RE,m=>{const s=m.slice(1,-1),id=idOf(s);pending[id]=s;any=true;return '"sig:'+id+'"'});
    return any?{text,pending}:{text:str,pending:null};
  }
  /* devuelve el texto a guardar; si no hay espacio ni para la copia única, devuelve el original */
  function packSigs(str){
    const c=compress(str);
    if(!c.pending) return str;
    const map=readMap(),add={};
    for(const id of Object.keys(c.pending)) if(!map[id]) add[id]=c.pending[id];
    if(Object.keys(add).length){
      try{writeMap({...map,...add})}catch(e){return str}
    }
    return c.text;
  }

  /* ---------- base TXT compacta ---------- */
  function packTxt(json){
    try{
      const rows=JSON.parse(json);
      if(!Array.isArray(rows)||rows.length<10||typeof rows[0]!=='object'||!rows[0]) return json;
      const keys=Object.keys(rows[0]),ks=keys.slice().sort().join('|');
      for(const r of rows){if(!r||typeof r!=='object'||Object.keys(r).slice().sort().join('|')!==ks) return json}
      return JSON.stringify({h:keys,r:rows.map(r=>keys.map(k=>r[k]))});
    }catch(_){return json}
  }
  function unpackTxt(v){
    if(!v||v.charCodeAt(0)!==123||!v.startsWith('{"h":')) return v;
    try{const o=JSON.parse(v);return JSON.stringify(o.r.map(a=>Object.fromEntries(o.h.map((k,i)=>[k,a[i]]))))}catch(_){return v}
  }

  /* ---------- Storage con ahorro y aviso ---------- */
  proto.setItem=function(k,v){
    if(this!==LS||typeof k!=='string'||k.indexOf('GS_DOCS')!==0) return rawSet.call(this,k,v);
    let val=String(v);
    try{
      if(k===REC||k===APP) val=packSigs(val);
      else if(k===TXT) val=packTxt(val);
    }catch(e){console.warn('GS Documentos v78',e)}
    try{rawSet.call(this,k,val)}
    catch(e){
      if(isQuota(e)){
        showFull(true);
        const err=new Error('Memoria del celular llena. Tus datos están a salvo: toca «Reducir firmas» o exporta la jornada.');
        err.name='QuotaExceededError';throw err;
      }
      throw e;
    }
    scheduleMeter();
  };
  proto.getItem=function(k){
    const v=rawGet.call(this,k);
    if(this!==LS||typeof k!=='string') return v;
    if(k===REC||k===APP) return expand(v);
    if(k===TXT) return unpackTxt(v);
    return v;
  };

  /* ---------- medidor ---------- */
  function usedChars(){let n=0;try{for(let i=0;i<LS.length;i++){const k=LS.key(i);n+=k.length+(rawGet.call(LS,k)||'').length}}catch(_){}return n}
  function breakdown(){
    const g=k=>{try{return (rawGet.call(LS,k)||'').length}catch(_){return 0}};
    return {registros:g(REC),estado:g(APP),firmas:g(SIGS),txt:g(TXT)};
  }
  let meterTimer=null,pill=null,warned=false;
  function scheduleMeter(){clearTimeout(meterTimer);meterTimer=setTimeout(updateMeter,1200)}
  function updateMeter(){
    const pct=Math.min(100,Math.round(usedChars()*100/LIMIT));
    globalThis.GS_MEMORIA_PCT=pct;
    if(pct<60){if(pill)pill.style.display='none';warned=false;return pct}
    if(!pill){
      pill=document.createElement('button');pill.type='button';pill.id='gsMemPill';
      pill.style.cssText='position:fixed;left:10px;bottom:76px;z-index:9998;border:0;border-radius:99px;padding:8px 14px;font:700 13px system-ui,sans-serif;color:#fff;box-shadow:0 4px 14px #0004;cursor:pointer';
      pill.onclick=()=>showFull(false);
      document.body.appendChild(pill);
    }
    pill.style.display='block';pill.style.background=pct>=85?'#C62828':'#E65100';
    pill.textContent='Memoria '+pct+'%'+(pct>=85?' · actuar':'');
    if(pct>=80&&!warned){warned=true;try{const t=document.querySelector('#toast');if(t){t.textContent='Memoria '+pct+'%: toca el aviso naranja para liberar espacio';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),4500)}}catch(_){}}
    return pct;
  }

  /* ---------- reducir imágenes de firma (siempre escribe valores más pequeños) ---------- */
  function shrink(dataUrl){
    return new Promise(res=>{
      const img=new Image();
      img.onload=()=>{
        try{
          if(img.width<=SIG_MAX_W&&dataUrl.length<30000){res(dataUrl);return}
          const w=Math.min(SIG_MAX_W,img.width),h=Math.max(1,Math.round(img.height*w/img.width));
          const c=document.createElement('canvas');c.width=w;c.height=h;
          const x=c.getContext('2d');x.clearRect(0,0,w,h);x.drawImage(img,0,0,w,h);
          const out=c.toDataURL('image/png');
          res(out.length<dataUrl.length?out:dataUrl);
        }catch(_){res(dataUrl)}
      };
      img.onerror=()=>res(dataUrl);img.src=dataUrl;
    });
  }
  function collect(str,set){if(!str)return;(str.match(DATA_RE)||[]).forEach(m=>set.add(m.slice(1,-1)))}
  async function compactNow(){
    const before=usedChars();
    const recRaw=rawGet.call(LS,REC)||'',appRaw=rawGet.call(LS,APP)||'',map=readMap();
    const urls=new Set();collect(recRaw,urls);collect(appRaw,urls);Object.values(map).forEach(v=>{if(typeof v==='string'&&v.startsWith('data:image/'))urls.add(v)});
    const repl=new Map();
    for(const u of urls){const s=await shrink(u);if(s!==u)repl.set(u,s)}
    if(repl.size){
      const swap=str=>str.replace(DATA_RE,m=>{const s=m.slice(1,-1);return repl.has(s)?'"'+repl.get(s)+'"':m});
      const newMap={};for(const id of Object.keys(map)){const v=map[id];newMap[id]=repl.has(v)?repl.get(v):v}
      if(recRaw)try{rawSet.call(LS,REC,swap(recRaw))}catch(e){console.warn(e)}
      if(appRaw)try{rawSet.call(LS,APP,swap(appRaw))}catch(e){console.warn(e)}
      try{writeMap(newMap)}catch(e){console.warn(e)}
      try{ /* estado en memoria */
        const fix=o=>{if(!o||typeof o!=='object')return;for(const k of Object.keys(o)){const v=o[k];if(typeof v==='string'&&repl.has(v))o[k]=repl.get(v);else if(v&&typeof v==='object')fix(v)}};
        if(typeof state!=='undefined'){fix(state.signatures);fix(state.currentRecord);fix(state.registration)}
      }catch(_){}
    }
    migrate();
    const after=usedChars();
    updateMeter();
    return {before,after,freed:Math.max(0,before-after)};
  }

  /* ---------- migración (nunca necesita espacio neto: mueve por tandas y acorta enseguida) ---------- */
  function migrateSigs(){
    for(let guard=0;guard<80;guard++){
      const rec=rawGet.call(LS,REC)||'',app=rawGet.call(LS,APP)||'';
      const uniq=new Set();
      for(const str of [rec,app]) (str.match(DATA_RE)||[]).forEach(m=>uniq.add(m.slice(1,-1)));
      if(!uniq.size) return;
      const map=readMap(),items=[...uniq];
      const known=items.filter(x=>map[idOf(x)]===x),fresh=items.filter(x=>map[idOf(x)]!==x);
      let batch=fresh.slice(),ok=!fresh.length;
      while(batch.length){
        try{const add={};batch.forEach(x=>{add[idOf(x)]=x});writeMap({...map,...add});ok=true;break}
        catch(e){batch=batch.slice(0,Math.floor(batch.length/2))}
      }
      if(!ok&&!known.length) return;                 // sin espacio: primero reducir firmas
      const done=new Set(known.concat(ok?batch:[]));
      const swap=str=>str.replace(DATA_RE,m=>{const x=m.slice(1,-1);return done.has(x)?'"sig:'+idOf(x)+'"':m});
      const nrec=swap(rec),napp=swap(app);
      if(nrec!==rec) rawSet.call(LS,REC,nrec);
      if(napp!==app) rawSet.call(LS,APP,napp);
      if(done.size===items.length) return;
    }
  }
  function migrate(){
    try{
      migrateSigs();
      const t=rawGet.call(LS,TXT);
      if(t&&t.charCodeAt(0)===91){const out=packTxt(t);if(out!==t)rawSet.call(LS,TXT,out)}
      /* limpiar firmas que ya nadie usa */
      const map=readMap(),ids=Object.keys(map);
      if(ids.length){
        const used=new Set(),scan=x=>{if(!x)return;let m;REF_RE.lastIndex=0;while((m=REF_RE.exec(x)))used.add(m[1])};
        scan(rawGet.call(LS,REC));scan(rawGet.call(LS,APP));
        const keep={};let drop=0;for(const id of ids){if(used.has(id))keep[id]=map[id];else drop++}
        if(drop)writeMap(keep);
      }
    }catch(e){console.warn('GS Documentos v78 migración',e)}
  }

  /* ---------- ventana de ayuda ---------- */
  let modal=null;
  function showFull(isFull){
    if(modal)return;
    const b=breakdown(),pct=updateMeter()||0,kb=n=>Math.round(n*2/1024)+' KB';
    modal=document.createElement('div');
    modal.style.cssText='position:fixed;inset:0;z-index:99999;background:#0009;display:grid;place-items:center;padding:18px';
    modal.innerHTML=`<div style="max-width:420px;width:100%;background:#fff;color:#12345a;border-radius:22px;padding:22px;font-family:system-ui,sans-serif;max-height:90vh;overflow:auto">
      <h2 style="margin:0 0 6px;font-size:21px">${isFull?'La memoria del celular se llenó':'La memoria se está llenando ('+pct+'%)'}</h2>
      <p style="margin:0 0 12px;line-height:1.45;color:#42586e"><b>Tus registros están a salvo.</b> No borres los datos del navegador ni cierres la jornada sin exportar.</p>
      <p style="margin:0 0 12px;font-size:13px;color:#66788a">Registros ${kb(b.registros)} · Estado ${kb(b.estado)} · Firmas ${kb(b.firmas)} · Base TXT ${kb(b.txt)}</p>
      <div id="gsM78msg" style="font-weight:700;margin:0 0 10px;min-height:20px"></div>
      <button id="gsM78a" style="display:block;width:100%;padding:14px;border:0;border-radius:14px;background:#ff6600;color:#14181d;font:700 15px system-ui;margin-bottom:8px">Reducir tamaño de firmas</button>
      <button id="gsM78b" style="display:block;width:100%;padding:14px;border:1px solid #c1c7ce;border-radius:14px;background:#fff;color:#12345a;font:700 15px system-ui;margin-bottom:8px">Exportar jornada (Excel + JSON)</button>
      <p style="margin:8px 0 12px;font-size:13px;line-height:1.4;color:#42586e">Después de exportar y generar el paquete de documentos de los registros completos (ahí quedan las firmas), puedes tocar «Quitar base TXT»: la puedes volver a cargar cuando quieras.</p>
      <button id="gsM78c" style="display:block;width:100%;padding:12px;border:0;border-radius:14px;background:#eef4fa;color:#12345a;font:700 15px system-ui">Cerrar</button></div>`;
    document.body.appendChild(modal);
    const msg=modal.querySelector('#gsM78msg'),close=()=>{modal.remove();modal=null};
    modal.querySelector('#gsM78c').onclick=close;
    modal.querySelector('#gsM78a').onclick=async e=>{
      e.target.disabled=true;e.target.textContent='Reduciendo…';
      try{const r=await compactNow();msg.textContent=r.freed>20000?'Listo: se liberaron '+Math.round(r.freed*2/1024)+' KB. Ya puedes seguir.':'Las firmas ya estaban optimizadas. Exporta la jornada y quita la base TXT.'}
      catch(err){msg.textContent='No se pudo reducir: '+err.message}
      e.target.textContent='Reducir tamaño de firmas';e.target.disabled=false;
    };
    modal.querySelector('#gsM78b').onclick=async()=>{
      try{if(typeof exportJornada==='function'){close();await exportJornada()}else msg.textContent='Abre la pantalla Registros para exportar.'}
      catch(err){msg.textContent='No se pudo exportar: '+err.message}
    };
  }

  /* ---------- firmas nuevas: 800 px de ancho ---------- */
  try{
    if(typeof normalizeSignatureDataURL==='function'){
      const orig=normalizeSignatureDataURL;
      normalizeSignatureDataURL=async function(src){const out=await orig(src);try{return await shrink(out)}catch(_){return out}};
    }
  }catch(e){console.warn('GS Documentos v78 firma',e)}

  globalThis.GS_MEMORIA={used:usedChars,breakdown,compact:compactNow,migrate,update:updateMeter};
  const boot=()=>{migrate();const pct=updateMeter();if(pct>=55)compactNow().catch(()=>{})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,800));else setTimeout(boot,800);
})();
