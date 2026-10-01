/* GS Documentos v75 loader */
(async()=>{
  'use strict';
  if(globalThis.__GS_DOCS_V75_LOADING__||globalThis.__GS_DOCS_V75_FIX__) return;
  globalThis.__GS_DOCS_V75_LOADING__=true;
  try{
    const parts=[];
    for(let i=0;i<6;i++){
      const name=String(i).padStart(2,'0');
      const r=await fetch(`./templates/v75-code/part-${name}.jsfrag?v=gsdoc-v75`,{cache:'no-store'});
      if(!r.ok) throw new Error(`No se pudo cargar el módulo v75 ${name} (${r.status})`);
      parts.push(await r.text());
    }
    (0,eval)(parts.join(''));
  }catch(e){
    console.error('GS Documentos v75 no pudo iniciar',e);
    try{toast('No fue posible iniciar la corrección v75: '+e.message,7000)}catch(_){}
  }finally{
    globalThis.__GS_DOCS_V75_LOADING__=false;
  }
})();