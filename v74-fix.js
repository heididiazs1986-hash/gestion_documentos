/* GS Documentos v74 - corrección integral de generación, persistencia y exportación.
   Base: v73/main. APPLUS es el único aliado operativo. */
(()=>{
  'use strict';
  if(globalThis.__GS_DOCS_V74_FIX__) return;
  globalThis.__GS_DOCS_V74_FIX__=true;

  const VERSION='v74';
  const APPLUS='APPLUS NORCONTROL COLOMBIA LTDA';

  function log(...a){console.info('GS Documentos',VERSION,...a)}
  function warn(...a){console.warn('GS Documentos',VERSION,...a)}

  function forceApplus(){
    try{
      state.jornada=state.jornada||{};
      state.registration=state.registration||{};
      state.jornada.contrato='APPLUS';
      state.jornada.contratista=APPLUS;
      state.registration.contrato='APPLUS';
      state.registration.contratista=APPLUS;
      if(state.currentRecord){
        state.currentRecord.contrato='APPLUS';
        state.currentRecord.contratista=APPLUS;
      }
    }catch(e){warn('No fue posible fijar APPLUS',e)}
  }

  function removeContractorControls(){
    try{
      document.querySelectorAll('label,legend,.field-label,.reg-field label').forEach(el=>{
        if(!/contratista|aliado\s+estrat[eé]gico/i.test(el.textContent||''))return;
        const host=el.closest('.reg-field,.field,.form-row,.input-group,.card-row')||el.parentElement;
        if(host)host.style.display='none';
      });
      document.querySelectorAll('[id],[name]').forEach(el=>{
        const key=((el.id||'')+' '+(el.getAttribute('name')||'')).toLowerCase();
        if(/contratista|selector.*aliado|aliado.*selector/.test(key)){
          const host=el.closest('.reg-field,.field,.form-row,.input-group')||el;
          host.style.display='none';
        }
      });
    }catch(e){warn('Control contratista',e)}
  }

  forceApplus();

  try{
    if(pdfMap?.E1?.fields){
      Object.keys(pdfMap.E1.fields).forEach(k=>{
        if(/_2$/.test(k)||/propietario/i.test(k)&&!/Solicitante propietario predio/i.test(k)) delete pdfMap.E1.fields[k];
      });
      Object.assign(pdfMap.E1.fields,{
        '3 Tipo documento':'cm_tipo_doc',
        '7 departamento':'cm_depto',
        '3 Localidad':'cm_localidad',
        '4 Municipio':'cm_mpio',
        '5 departamento':'cm_depto',
        '6 Dirección del predio':'cm_dir_radica',
        'Coordenada X':'e1_coord_x',
        'Coordenada Y':'e1_coord_y',
        '8 Indicaciones de acceso al predio':'e1_indicaciones',
        '2 Distancia actual del predio a la red más cercana metros':'e1_distancia_red',
        '3 Número de transformador poste o elemento de la red eléctrica más cercano':'e1_num_transformador',
        '1 Nombre del proyecto':'cm_nombre_proyecto',
        'No de solicitud':'e1_no_solicitud',
        '2 Fecha de solicitud de servicio':'cm_fecha_solicitud_fmt'
      });
    }
    if(pdfMap?.E6?.fields){
      delete pdfMap.E6.fields['text_31fhzy'];
      delete pdfMap.E6.fields['text_32eksb'];
      delete pdfMap.E6.fields['text_28aaym'];
      Object.assign(pdfMap.E6.fields,{
        'text_1xogj':'cm_nombre_proyecto',
        'text_2gqcv':'cm_dir_radica',
        'text_18ovuf':'cm_fecha_solicitud_fmt',
        'text_27bpxy':'cm_nombre',
        'text_30sznp':'cm_retie_constructor',
        'text_329o6m':'cm_celular'
      });
    }
  }catch(e){warn('Mapeo de plantillas',e)}

  function v74Data(){
    const v={...(typeof data==='function'?data():{})};
    v._empresa_inmel=APPLUS;
    v._empresa_applus=APPLUS;
    v._empresa=APPLUS;
    v._aliado=APPLUS;
    return v;
  }

  function setPdfField(form,name,value,font){
    try{
      const f=form.getField(name);
      const val=sanitizePdfText(value??'');
      if(typeof f.setText==='function') f.setText(val);
      else if(typeof f.select==='function' && val) f.select(val);
      if(font&&typeof f.defaultUpdateAppearances==='function'){
        try{f.defaultUpdateAppearances(font)}catch(_){}
      }
      return true;
    }catch(_){return false}
  }

  async function patchRetieResolutionYear(pdf){
    try{
      const page=pdf.getPages()[0]; if(!page)return;
      page.drawRectangle({x:128,y:371,width:66,height:18,color:PDFLib.rgb(1,1,1)});
      const font=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
      page.drawText('02/04/2024',{x:132,y:376,size:10,font,color:PDFLib.rgb(0,0,0)});
    }catch(e){warn('Año RETIE',e)}
  }

  makePDF=async function(doc){
    const cfg=pdfMap[doc];
    if(!cfg)throw new Error('Documento PDF no configurado: '+doc);
    const bytes=b64ToUint8(cfg.b());
    if(!bytes?.length)throw new Error('Plantilla vacía: '+doc);
    const pdf=await PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false});
    const form=pdf.getForm();
    const helv=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    const values=v74Data();
    for(const [pdfName,id] of Object.entries(cfg.fields||{})) setPdfField(form,pdfName,values[id]??'',helv);
    try{form.updateFieldAppearances(helv)}catch(e){warn('Apariencias',doc,e)}
    if(doc==='RETIE')await patchRetieResolutionYear(pdf);
    await insertPdfSignatures(pdf,doc);
    return await pdf.save({useObjectStreams:false,addDefaultPage:false,updateFieldAppearances:false});
  };

  function setTextAny(form,names,val,helv,size){
    for(const name of names){
      try{
        const f=form.getTextField(name);
        try{f.acroField.dict.delete(PDFLib.PDFName.of('MaxLen'))}catch(_){}
        f.setText(sanitizePdfText(val??''));
        if(size)try{f.setFontSize(size)}catch(_){}
        try{f.defaultUpdateAppearances(helv)}catch(_){}
        return true;
      }catch(_){}
    }
    return false;
  }
  function setCheckAny(form,names,on){
    for(const name of names){
      try{const f=form.getCheckBox(name);on?f.check():f.uncheck();return true}catch(_){}
    }
    return false;
  }
  async function getTdTemplate(){
    try{
      const r=await fetch('./templates/Constancia_TD_base64.txt?v=gsdoc-v74',{cache:'no-store'});
      if(r.ok){const txt=(await r.text()).replace(/\s+/g,'');if(txt.length>1000)return txt}
    }catch(e){warn('TD externo',e)}
    if(typeof BASE64_TD!=='undefined'&&BASE64_TD)return BASE64_TD;
    throw new Error('No se encontró la plantilla TD');
  }
  function fitImageRect(img,box){
    const ir=img.width/img.height, br=box.width/box.height;
    let width=box.width,height=box.height;
    if(ir>br)height=width/ir;else width=height*ir;
    return {x:box.x+(box.width-width)/2,y:box.y+(box.height-height)/2,width,height};
  }

  makeTD=async function(recArg){
    const rec=recArg||state.currentRecord||state.registration||{};
    const pdf=await PDFDocument.load(b64ToUint8(await getTdTemplate()),{ignoreEncryption:true,updateMetadata:false});
    const form=pdf.getForm();
    const helv=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    const hall=typeof tdHallazgos==='function'?tdHallazgos(rec):(rec.estado_tecnico||[]).join(' | ');
    setTextAny(form,['orden_ro'],rec.orden_ro,helv);
    setTextAny(form,['localidad'],rec.localidad,helv);
    setTextAny(form,['sector'],rec.sector,helv);
    setTextAny(form,['usuario','nombre'],rec.nombres,helv);
    setTextAny(form,['cedula','identificacion'],rec.identificacion,helv);
    setTextAny(form,['direccion'],rec.direccion,helv);
    setTextAny(form,['contacto'],rec.contacto,helv);
    setTextAny(form,['observaciones','hallazgos'],hall,helv,hall.length>420?7.5:(hall.length>260?8.5:10));
    const docs=rec.documentos_pendientes||[];
    const docMap=[
      [['checkbox_132o3x','docL0'],'Cédula del propietario'],
      [['checkbox_145n8r','docL1'],'Formato de solicitud (E1)'],
      [['checkbox_153e0d','docL2'],'Recibo técnico (E6)'],
      [['checkbox_163z1w','docL3'],'Doc. Electricista'],
      [['checkbox_176v2v','docM0'],'Aceptación de requisitos'],
      [['checkbox_189y7k','docM1'],'Declaración juramentada'],
      [['checkbox_190h1k','docM2'],'Esquema eléctrico'],
      [['checkbox_208g6g','docM3'],'RETIE']
    ];
    for(const [names,label] of docMap)setCheckAny(form,names,docs.includes(label));
    setCheckAny(form,['checkbox_216j8r','ec_particular'],rec.esquema_particular==='Sí');
    setCheckAny(form,['checkbox_222y0c','ec_contrato'],rec.esquema_particular!=='Sí');
    setTextAny(form,['text_232y0c','aut_nombre'],rec.nombres,helv);
    setTextAny(form,['text_245p3i','aut_identificacion'],rec.identificacion,helv);
    setTextAny(form,['text_275h9f','firma_usuario_nombre'],rec.nombres,helv);
    setTextAny(form,['text_289o8f','firma_usuario_cc'],rec.identificacion,helv);
    setTextAny(form,['text_291t9n','firma_tecnico_nombre'],state.jornada?.tecnico_nombre||'',helv);
    setTextAny(form,['text_301t3m','firma_tecnico_cc'],state.jornada?.tecnico_cedula||'',helv);
    setTextAny(form,['text_318x6q','fecha_registro'],rec.fecha_registro||todayISO(),helv);
    setTextAny(form,['text_331i7n','id_registro'],String(rec.id_registro||'').slice(0,16),helv);
    try{form.updateFieldAppearances(helv)}catch(e){warn('Apariencias TD',e)}
    const page=pdf.getPages()[0];
    for(const [kind,box] of Object.entries({solicitante:{x:29,y:91,width:238,height:63},tecnico:{x:304,y:92,width:239,height:63}})){
      const src=state.signatures?.[kind]; if(!src)continue;
      try{const img=await pdf.embedPng(dataUrlToUint8(src));page.drawImage(img,fitImageRect(img,box))}catch(e){warn('Firma TD',kind,e)}
    }
    return await pdf.save({useObjectStreams:false,addDefaultPage:false,updateFieldAppearances:false});
  };

  function cloneRecord(r){
    return {...r,
      elementos_externos:[...(r.elementos_externos||[])],
      estado_tecnico:[...(r.estado_tecnico||[])],
      documentos_pendientes:[...(r.documentos_pendientes||[])],
      condiciones_seguridad:[...(r.condiciones_seguridad||[])],
      contrato:'APPLUS',contratista:APPLUS
    };
  }

  saveRegistration=function(){
    try{
      forceApplus();
      if(!validateRegistration())return false;
      const src=state.registration||{};
      src.nombres=titleCaseWords(src.nombres||'');
      src.sector=titleCaseWords(src.sector||'');
      src.direccion=normalizeAddress(src.direccion||'');
      src.contacto=cleanContact(src.contacto||'');
      const all=records();
      const dup=all.find(x=>String(x.orden_ro||'')===String(src.orden_ro||'')&&x.id_registro!==state.currentRecord?.id_registro);
      if(dup){alert('⚠️ Orden RO duplicada\n\nLa Orden RO '+src.orden_ro+' ya fue registrada.');state.regStep=0;renderRegistration();return false}
      const r=cloneRecord(src);
      r.id_registro=state.currentRecord?.id_registro||r.id_registro||makeUUID();
      r.fecha_hora_creacion=state.currentRecord?.fecha_hora_creacion||r.fecha_hora_creacion||new Date().toISOString();
      r.fecha_hora_actualizacion=new Date().toISOString();
      r.rol=state.role;
      r.estado_sync='PENDIENTE';
      const ix=all.findIndex(x=>x.id_registro===r.id_registro);
      if(ix>=0)all[ix]=r;else all.push(r);
      saveRecords(all);
      const verify=records();
      if(!verify.some(x=>x.id_registro===r.id_registro))throw new Error('No fue posible verificar el registro guardado');
      state.currentRecord=r;
      state.registration=cloneRecord(r);
      applyRegistrationToDocs(r);
      const ss=document.querySelector('#savedSummary');
      if(ss)ss.innerHTML=`<strong>${escapeText(r.nombres)}</strong><br>RO: ${escapeText(r.orden_ro||'—')}<br>${escapeText(r.direccion)} · ${escapeText(r.localidad)} / ${escapeText(r.sector)}`;
      save();
      show('saved');
      toast('✅ Registro guardado correctamente');
      return true;
    }catch(e){console.error(e);toast('Error guardando registro: '+e.message);return false}
  };

  jornadaRows=function(){return [...records()].sort((a,b)=>String(a.fecha_hora_creacion||a.fecha_registro||'').localeCompare(String(b.fecha_hora_creacion||b.fecha_registro||'')))};

  const V74_EXPORT_COLUMNS=[
    ['id_registro','ID registro'],['orden_ro','Orden RO'],['fecha_registro','Fecha de registro'],['fecha_hora_creacion','Fecha/hora creación'],
    ['nombres','Nombres'],['identificacion','Identificación'],['contacto','Contacto'],['direccion','Dirección'],['localidad','Localidad'],['sector','Sector/Barrio'],
    ['tipo_zona','Tipo zona'],['tipo_poblacion','Tipo de población'],['documento_propiedad','Documento de propiedad'],['documentos_pendientes','Documentos pendientes'],
    ['condiciones_seguridad','Condiciones de seguridad'],['esquema_particular','Esquema particular'],['esquema_contrato','Esquema contrato'],['requiere_redes','Requiere de redes'],
    ['tipo_material','Tipo material predio'],['plantas','Plantas'],['requiere_muro','Requiere muro/Pilar'],['garrawall','Requiere uso de Garrawall'],['arriostre','Requiere uso de arriostre'],
    ['requiere_interna','Requiere instalación interna'],['requiere_externa','Requiere instalación externa'],['elementos_externos','Elementos requeridos de instalación externa'],
    ['estado_tecnico','Estado técnico'],['observaciones','Observaciones'],['latitud','Latitud (Y)'],['longitud','Longitud (X)'],['precision','Precisión (m)'],['estado_sync','Estado sync']
  ];
  buildExcelBytes=function(rows){
    const known=new Set(V74_EXPORT_COLUMNS.map(x=>x[0]));
    const extra=[];
    for(const r of rows)for(const k of Object.keys(r||{}))if(!known.has(k)&&!['contrato','contratista'].includes(k)&&!extra.includes(k))extra.push(k);
    const cols=[...V74_EXPORT_COLUMNS,...extra.map(k=>[k,k])];
    const flat=rows.map(r=>Object.fromEntries(cols.map(([k,label])=>[label,Array.isArray(r[k])?r[k].join(' | '):(r[k]??'')])));
    const headers=cols.map(x=>x[1]);
    const ws=XLSX.utils.json_to_sheet(flat,{header:headers});
    ws['!cols']=cols.map(([k,label])=>({wch:Math.min(55,Math.max(12,label.length+2,['observaciones','estado_tecnico','condiciones_seguridad','documentos_pendientes','elementos_externos'].includes(k)?42:18))}));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Registros');
    return XLSX.write(wb,{bookType:'xlsx',type:'array'});
  };

  exportJornada=async function(){
    const rows=jornadaRows();
    if(!rows.length){toast('No hay registros para exportar');return false}
    const dup=duplicateROs(rows);if(dup.length){alert('⚠️ Orden RO duplicada\n\nCorrige antes de exportar:\n'+dup.join('\n'));return false}
    try{
      const sectors=rows.map(r=>r.sector).filter(Boolean),sectorName=sectors.length&&sectors.every(x=>x===sectors[0])?sectors[0]:'Varios_sectores';
      const safe=safeFilePart(sectorName),date=todayISO();
      const excelName=`Recibo_tecnico_${safe}_${date}.xlsx`,jsonName=`GS_Registro_${safe}_${date}.json`;
      const payload={app:'GS Documentos',version:VERSION,generated_at:new Date().toISOString(),sharepoint_list:'Registro_Recibos técnicos',total:rows.length,registros:rows.map(r=>typeof jsonRecord==='function'?jsonRecord(r):r)};
      await downloadBlob(new Blob([buildExcelBytes(rows)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),excelName);
      await downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),jsonName);
      localStorage.setItem('GS_DOCS_LAST_EXPORT_V1',new Date().toISOString());
      toast(`✅ Jornada exportada completa: ${rows.length} registros`);
      renderRecordsScreen();return true;
    }catch(e){console.error(e);toast('No fue posible exportar: '+e.message);return false}
  };

  closeJornada=async function(){
    const rows=jornadaRows();if(!rows.length)return toast('No hay registros para cerrar');
    const ok=await exportJornada();if(!ok)return;
    if(confirm('¿Confirmas que verificaste el Excel y el JSON descargados?\n\nAceptar limpiará los registros operativos del dispositivo.')){
      localStorage.removeItem(recordsKey);localStorage.removeItem(txtKey);localStorage.removeItem(appKey);toast('Jornada cerrada y datos operativos limpiados');setTimeout(()=>location.reload(),500)
    }
  };

  generateZip=async function(){
    try{
      forceApplus();
      if(!validateRequired()){show('form');return false}
      updateKpis();
      const zip=new JSZip(),sel=state.selected.length?[...state.selected]:[],rec=state.currentRecord||state.registration||{};
      const errors=[];
      try{zip.file(typeof tdFileName==='function'?tdFileName(rec):'TD_Constancia_Inspeccion.pdf',await makeTD(rec))}catch(e){errors.push('TD: '+e.message);warn('TD',e)}
      for(const d of sel){
        try{if(pdfMap[d])zip.file(`${d}.pdf`,await makePDF(d));else if(d==='EC')zip.file('EC_Esquema_constructivo.docx',await makeEC())}
        catch(e){errors.push(d+': '+e.message);warn('Documento '+d,e)}
      }
      if(sel.includes('EC')&&!zip.file('EC_Esquema_constructivo.docx')){try{zip.file('EC_Esquema_constructivo.docx',await makeEC())}catch(e){errors.push('EC: '+e.message)}}
      if(Object.values(state.materials?.qty||{}).some(q=>Number(q)>0)){try{zip.file('Materiales.xlsx',makeMaterials())}catch(e){errors.push('Materiales: '+e.message)}}
      if(state.supports?.length){const folder=zip.folder('SOPORTES');for(const f of state.supports){try{folder.file(f.name,await f.arrayBuffer())}catch(e){errors.push('Soporte '+f.name+': '+e.message)}}}
      if(errors.length)zip.file('ERRORES_GENERACION.txt',errors.join('\n'));
      const blob=await zip.generateAsync({type:'blob'}),name=cleanName(v74Data().cm_nombre||rec.nombres||'GS_Documentos')+'.zip';
      await downloadBlob(blob,name);
      if(typeof markTDIndividual==='function')try{markTDIndividual()}catch(_){}
      toast(errors.length?`ZIP generado con ${errors.length} advertencia(s)`:'✅ ZIP generado correctamente');
      return true;
    }catch(e){console.error(e);toast('Error generando: '+e.message);return false}
  };

  function rebindButtons(){
    const s=document.querySelector('#saveRegister');if(s)s.onclick=saveRegistration;
    const e=document.querySelector('#exportJornada');if(e)e.onclick=exportJornada;
    const c=document.querySelector('#closeJornada');if(c)c.onclick=closeJornada;
    const g=document.querySelector('#genZip');if(g)g.onclick=generateZip;
  }

  try{
    const originalRenderRegistration=renderRegistration;
    renderRegistration=function(){const r=originalRenderRegistration.apply(this,arguments);forceApplus();removeContractorControls();rebindButtons();return r};
  }catch(e){warn('Wrapper registro',e)}
  try{
    const originalRenderRecords=renderRecordsScreen;
    renderRecordsScreen=function(){const r=originalRenderRecords.apply(this,arguments);rebindButtons();return r};
  }catch(e){warn('Wrapper registros',e)}

  removeContractorControls();rebindButtons();
  const observer=new MutationObserver(()=>{forceApplus();removeContractorControls();rebindButtons()});
  observer.observe(document.body,{subtree:true,childList:true});
  log('activo · persistencia, Excel, PDF y APPLUS corregidos');
})();