/* GS Documentos v73 - corrección transversal de renderizado PDF.
   Se carga después del index oficial v72 para no retroceder ninguna lógica de campo. */
(()=>{
  'use strict';
  if(globalThis.__GS_DOCS_V73_RENDER_FIX__) return;
  globalThis.__GS_DOCS_V73_RENDER_FIX__=true;

  makePDF=async function(doc){
    const cfg=pdfMap[doc];
    if(!cfg) throw new Error('Documento PDF no configurado: '+doc);

    const source=await PDFDocument.load(
      b64ToUint8(cfg.b()),
      {ignoreEncryption:true,updateMetadata:false}
    );
    const form=source.getForm();
    const helv=await source.embedFont(PDFLib.StandardFonts.Helvetica);
    const values=data();

    for(const [pdfName,id] of Object.entries(cfg.fields)){
      try{
        const f=form.getField(pdfName);
        const val=sanitizePdfText(values[id]||'');
        if(typeof f.setText==='function') f.setText(val);
        else if(typeof f.select==='function') f.select(val);
        try{
          if(typeof f.defaultUpdateAppearances==='function') f.defaultUpdateAppearances(helv);
        }catch(_){}
      }catch(e){
        console.warn('GS v73 · campo PDF',doc,pdfName,e);
      }
    }

    try{
      form.updateFieldAppearances(helv);
    }catch(e){
      console.warn('GS v73 · apariencias PDF',doc,e);
    }

    form.flatten();

    const out=await PDFDocument.create();
    const pages=await out.embedPdf(source,source.getPageIndices());
    for(const bg of pages){
      const page=out.addPage([bg.width,bg.height]);
      page.drawPage(bg,{x:0,y:0,width:bg.width,height:bg.height});
    }

    await insertPdfSignatures(out,doc);
    return await out.save({useObjectStreams:false,addDefaultPage:false});
  };

  const makeTDv72=makeTD;
  makeTD=async function(rec){
    const bytes=await makeTDv72(rec);
    const pdf=await PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false});
    try{
      const form=pdf.getForm();
      const helv=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
      try{form.updateFieldAppearances(helv)}catch(_){}
      form.flatten();
    }catch(e){
      console.warn('GS v73 · TD flatten',e);
      throw e;
    }
    return await pdf.save({useObjectStreams:false,addDefaultPage:false});
  };

  console.info('GS Documentos v73 · render PDF estable activo');
})();
