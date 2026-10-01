/* GS Documentos v77 - plantillas aprobadas + persistencia + generación estable */
(()=>{
  'use strict';
  if(globalThis.__GS_DOCS_V77_FIX__) return;
  globalThis.__GS_DOCS_V77_FIX__=true;

  const VERSION='v77';
  const APPLUS='APPLUS NORCONTROL COLOMBIA LTDA';
  const tplCache={};

  function log(...a){console.info('GS Documentos',VERSION,...a)}
  function warn(...a){console.warn('GS Documentos',VERSION,...a)}
  function cleanB64(s){return String(s||'').replace(/\s+/g,'')}

  async function fetchText(path){
    const r=await fetch(path+'?v=gsdoc-v77',{cache:'no-store'});
    if(!r.ok) throw new Error('No se pudo cargar '+path+' ('+r.status+')');
    return await r.text();
  }

  async function loadTemplate(name){
    if(tplCache[name]) return tplCache[name];
    let b64='';
    if(name==='E1'){
      const parts=[];
      for(let i=1;i<=13;i++){
        const p=String(i).padStart(2,'0');
        parts.push(cleanB64(await fetchText('./templates/base64/E1.part'+p+'.txt')));
      }
      b64=parts.join('');
    }else{
      const file=name==='EC'?'EC_APPLUS':name;
      b64=cleanB64(await fetchText('./templates/base64/'+file+'.txt'));
    }
    if(!b64 || b64.length<1000) throw new Error('Plantilla '+name+' vacía o incompleta');
    tplCache[name]=b64;
    return b64;
  }


  function gs77TitleCase(s){
    try{return typeof titleCaseWords==='function'?titleCaseWords(s):String(s||'').trim().toLowerCase().replace(/(^|\\s)\\S/g,m=>m.toUpperCase())}
    catch(_){return String(s||'').trim()}
  }

  function gs77StartJornada(){
    const nameEl=document.getElementById('jornada_nombre');
    const nombre=String(nameEl?.value||'').trim();
    if(typeof records==='function' && records().length){
      alert('Hay una jornada anterior pendiente de exportar. Debes cerrarla antes de iniciar una nueva.');
      if(typeof show==='function')show('records');
      return;
    }
    if(!nombre){
      if(typeof toast==='function')toast('Escribe el nombre completo del técnico / gestor');
      nameEl?.focus();
      return;
    }
    if(!state.signatures?.tecnico){
      if(typeof toast==='function')toast('Falta la firma del técnico');
      return;
    }
    state.jornada=state.jornada||{};
    state.jornada.active=true;
    state.jornada.tecnico_nombre=gs77TitleCase(nombre);
    state.jornada.nombre_tecnico=state.jornada.tecnico_nombre;
    state.jornada.tecnico_cedula='';
    state.jornada.cedula_tecnico='';
    state.jornada.inicio=new Date().toISOString();
    if(typeof save==='function')save();
    if(typeof show==='function')show('register');
    if(typeof toast==='function')toast('Jornada iniciada');
  }

  function gs77BindStart(){
    const n=document.getElementById('jornada_nombre');
    if(n){
      n.placeholder='Nombres y apellidos completos';
      const label=n.closest('.reg-field')?.querySelector('label');
      if(label)label.innerHTML='Nombre completo del técnico / gestor <span class="req">*</span>';
      if(n.dataset.gs77Name!=='1'){
        n.dataset.gs77Name='1';
        n.addEventListener('input',()=>{
          state.jornada=state.jornada||{};
          state.jornada.tecnico_nombre=n.value;
          state.jornada.nombre_tecnico=n.value;
          if(typeof save==='function')save();
          gs77ApplyRetieTech();
        });
      }
    }
    const ced=document.getElementById('jornada_cedula');
    if(ced){
      const host=ced.closest('.reg-field')||ced.parentElement;
      if(host)host.style.display='none';
      ced.required=false;
      ced.value='';
    }
    const b=document.getElementById('jornadaStart');
    if(b && b.dataset.gs77Bound!=='1'){
      const fresh=b.cloneNode(true);
      fresh.dataset.gs77Bound='1';
      b.replaceWith(fresh);
      fresh.addEventListener('click',ev=>{ev.preventDefault();ev.stopImmediatePropagation();gs77StartJornada()});
    }
  }

  function gs77TechName(){
    return gs77TitleCase(
      document.getElementById('jornada_nombre')?.value ||
      state.jornada?.tecnico_nombre ||
      state.jornada?.nombre_tecnico ||
      ''
    );
  }

  function gs77SerialFromMatricula(value,ced,prefix){
    let cur=String(value||'').trim();
    if(prefix && cur.startsWith(prefix))cur=cur.slice(prefix.length);
    else if(cur.includes('-'))cur=cur.slice(cur.lastIndexOf('-')+1);
    let digits=cur.replace(/\\D/g,'');
    if(ced && digits.startsWith(ced))digits=digits.slice(ced.length);
    return digits.slice(0,30);
  }

  function gs77SyncMatricula({keepSerial=true}={}){
    const id=document.getElementById('retie_const_identificacion');
    const mat=document.getElementById('cm_retie_matricula');
    if(!id||!mat)return;
    const ced=String(id.value||'').replace(/\\D/g,'').slice(0,20);
    if(id.value!==ced)id.value=ced;
    const oldPrefix=mat.dataset.gs77Prefix||'';
    const serial=keepSerial?gs77SerialFromMatricula(mat.value,ced,oldPrefix):'';
    const prefix=ced?ced+'-':'';
    mat.dataset.gs77Prefix=prefix;
    const wanted=prefix+(ced?serial:'');
    if(mat.value!==wanted)mat.value=wanted;
    mat.readOnly=false;
    mat.inputMode='numeric';
    mat.placeholder=ced?'Escribe el serial después del guion':'Primero escribe la cédula';
    state.jornada=state.jornada||{};
    state.jornada.tecnico_cedula=ced;
    state.jornada.cedula_tecnico=ced;
    if(typeof save==='function')save();
  }

  function gs77ApplyRetieTech(){
    const techName=gs77TechName();
    const name=document.getElementById('cm_retie_constructor');
    if(name){
      name.value=techName;
      name.readOnly=true;
      name.placeholder='Tomado del inicio de jornada';
      const lab=name.closest('.field,.reg-field')?.querySelector('label');
      if(lab)lab.textContent='Nombre del técnico (desde inicio de jornada) *';
    }
    const id=document.getElementById('retie_const_identificacion');
    if(id){
      id.readOnly=false;
      id.inputMode='numeric';
      id.placeholder='Cédula del técnico';
      const lab=id.closest('.field,.reg-field')?.querySelector('label');
      if(lab)lab.textContent='Identificación del técnico (cédula) *';
      if(id.dataset.gs77Bound!=='1'){
        id.dataset.gs77Bound='1';
        id.addEventListener('input',()=>{
          const before=String(id.value||'');
          id.value=before.replace(/\\D/g,'').slice(0,20);
          gs77SyncMatricula({keepSerial:true});
        });
      }
    }
    const mat=document.getElementById('cm_retie_matricula');
    if(mat){
      const lab=mat.closest('.field,.reg-field')?.querySelector('label');
      if(lab)lab.textContent='Matrícula profesional (cédula - serial) *';
      if(mat.dataset.gs77Bound!=='1'){
        mat.dataset.gs77Bound='1';
        mat.addEventListener('focus',()=>{gs77SyncMatricula({keepSerial:true});try{mat.setSelectionRange(mat.value.length,mat.value.length)}catch(_){ }});
        mat.addEventListener('click',()=>{const p=mat.dataset.gs77Prefix||'';try{if((mat.selectionStart||0)<p.length)mat.setSelectionRange(mat.value.length,mat.value.length)}catch(_){ }});
        mat.addEventListener('keydown',ev=>{
          const p=mat.dataset.gs77Prefix||'';
          const pos=mat.selectionStart||0;
          if((ev.key==='Backspace'||ev.key==='Delete')&&pos<=p.length){ev.preventDefault();try{mat.setSelectionRange(mat.value.length,mat.value.length)}catch(_){ }}
        });
        mat.addEventListener('input',()=>{
          const ced=String(document.getElementById('retie_const_identificacion')?.value||'').replace(/\\D/g,'');
          const prefix=ced?ced+'-':'';
          let serial=gs77SerialFromMatricula(mat.value,ced,prefix);
          mat.dataset.gs77Prefix=prefix;
          mat.value=prefix+(ced?serial:'');
          try{mat.setSelectionRange(mat.value.length,mat.value.length)}catch(_){}
          if(typeof save==='function')save();
        });
      }
      if(!mat.parentElement?.querySelector('.gs77-mat-help')){
        const help=document.createElement('small');
        help.className='gs77-mat-help';
        help.textContent='La app agrega automáticamente la cédula y el guion. Ejemplo: 1012431790-89873.';
        mat.insertAdjacentElement('afterend',help);
      }
    }
    gs77SyncMatricula({keepSerial:true});
  }

  function gs77DecorateJornada(){
    gs77BindStart();
    const card=document.querySelector('#jornada .registration-card');
    if(!card)return;
    if(!document.getElementById('gs77-manual-style')){
      const st=document.createElement('style');st.id='gs77-manual-style';
      st.textContent=`
        #jornada .registration-card{border:1px solid #e2e2e3;border-radius:22px;background:#fefeff;box-shadow:0 12px 30px rgba(35,58,82,.08)}
        #jornada .gs77-start-banner{display:flex;align-items:center;gap:13px;border:1px solid #ffd2ba;background:linear-gradient(135deg,#fff3eb,#fff);border-radius:18px;padding:15px 16px;margin:0 0 16px}
        #jornada .gs77-start-icon{width:46px;height:46px;border-radius:15px;background:#ff6600;color:#fff;display:grid;place-items:center;font-size:22px;flex:0 0 auto}
        #jornada .gs77-start-banner b{display:block;color:#17385e;font:700 19px "Open Sans",system-ui}
        #jornada .gs77-start-banner span{color:#6a7b8d;font:500 13px Manrope,system-ui}
        #jornadaStart{background:#ff6600!important;border-color:#ff6600!important;color:white!important}
        .gs77-mat-help{display:block;margin-top:6px;color:#65778a;font:500 12px Manrope,system-ui;line-height:1.35}
        #cm_retie_constructor[readonly]{background:#f3f3f4!important;color:#35495e}
      `;document.head.appendChild(st);
    }
    if(!card.querySelector('.gs77-start-banner')){
      const h=card.querySelector('h2'),p=card.querySelector('p.help');
      if(h)h.style.display='none';if(p)p.style.display='none';
      const banner=document.createElement('div');banner.className='gs77-start-banner';
      banner.innerHTML='<div class="gs77-start-icon">📄</div><div><b>Inicio de jornada</b><span>Escribe tu nombre completo y captura la firma. La cédula se solicitará únicamente al diligenciar RETIE.</span></div>';
      card.insertBefore(banner,card.firstChild);
    }
  }

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
    }catch(e){warn('APPLUS',e)}
  }

  function hideContractor(){
    try{
      document.querySelectorAll('label,legend,.field-label,.reg-field label').forEach(el=>{
        if(!/contratista|aliado\s+estrat[eé]gico/i.test(el.textContent||'')) return;
        const host=el.closest('.reg-field,.field,.form-row,.input-group,.card-row')||el.parentElement;
        if(host) host.style.display='none';
      });
      document.querySelectorAll('[id],[name]').forEach(el=>{
        const k=((el.id||'')+' '+(el.getAttribute('name')||'')).toLowerCase();
        if(/contratista|selector.*aliado|aliado.*selector/.test(k)){
          const host=el.closest('.reg-field,.field,.form-row,.input-group')||el;
          host.style.display='none';
        }
      });
    }catch(e){warn('hideContractor',e)}
  }

  function bindIndependentGarrawall(){
    try{
      document.querySelectorAll('[data-seg]').forEach(seg=>{
        const key=seg.dataset.seg;
        if(key!=='garrawall'&&key!=='arriostre') return;
        seg.querySelectorAll('button').forEach(btn=>{
          if(btn.dataset.gsV77Independent==='1') return;
          const fresh=btn.cloneNode(true);
          fresh.dataset.gsV77Independent='1';
          btn.replaceWith(fresh);
          fresh.addEventListener('click',ev=>{
            ev.preventDefault();
            ev.stopImmediatePropagation();
            state.registration=state.registration||{};
            state.registration[key]=fresh.dataset.value;
            save();
            renderRegistration();
          });
        });
      });
    }catch(e){warn('Garrawall/arriostre',e)}
  }

  forceApplus();

  const PDF_MAPS={
    E1:{
      "1 Nombre o Razón Social":"cm_nombre",
      "3 Tipo documento":"cm_tipo_doc",
      "4 Número de Documento":"cm_num_doc",
      "5 Dirección de quien radica":"cm_dir_radica",
      "6 MunicipioLocalidad":"cm_mpio",
      "7 departamento":"cm_depto",
      "8 Celular":"cm_celular",
      "10 Correo electrónico":"sol_correo",
      "3 Localidad":"cm_localidad",
      "4 Municipio":"cm_mpio",
      "5 departamento":"cm_depto",
      "6 Dirección del predio":"pred_direccion",
      "Coordenada X":"e1_coord_x",
      "Coordenada Y":"e1_coord_y",
      "8 Indicaciones de acceso al predio":"e1_indicaciones",
      "2 Distancia actual del predio a la red más cercana metros":"e1_distancia_red",
      "3 Número de transformador poste o elemento de la red eléctrica más cercano":"e1_num_transformador",
      "1 Nombre del proyecto":"cm_nombre_proyecto",
      "2 Fecha de solicitud de servicio":"cm_fecha_ddmmaaaa",
      "Tipo de uso":"e1_tipo_uso",
      "Estrato":"e1_estrato",
      "No de solicitud":"_orden_ro_e1",
      "Red electrica cercana":"e1_red_cercana"
    },
    E6:{
      "text_1xogj":"cm_nombre_proyecto",
      "text_2gqcv":"pred_direccion",
      "text_18ovuf":"cm_fecha_ddmmaaaa",
      "text_27bpxy":"cm_nombre",
      "text_30sznp":"_tecnico_nombre",
      "text_329o6m":"cm_celular",
      "text_19wprf":"e1_no_solicitud"
    },
    AR:{
      "text_1lojj":"ar_sector_pdf",
      "text_2tgsw":"ar_localidad_pdf",
      "text_3kjbx":"ar_alcaldia_pdf",
      "text_4mqvb":"pred_direccion",
      "text_6prgm":"cm_nombre",
      "text_7jdiv":"cm_num_doc",
      "text_8ptdj":"cm_fecha_dia",
      "text_9ujpp":"cm_fecha_mes",
      "text_10ipyf":"cm_fecha_anio"
    },
    DJ:{
      "Nombre solicitante":"cm_nombre",
      "Identificacion":"cm_tipo_doc",
      "NumIdentificacion":"cm_num_doc",
      "Domicilio":"dj_ciudad_dom",
      "Direccion":"pred_direccion",
      "Descripcion":"dj_descripcion",
      "Fechapropiedad":"dj_fecha_pose_ddmmaaaa",
      "LugarDom":"dj_ciudad_dom",
      "Posesion":"dj_posesion",
      "LugarFirma":"pred_mpio",
      "FechaFirma":"cm_fecha_ddmmaaaa",
      "Solicitante Firma":"cm_nombre"
    },
    RETIE:{
      "retie_constructor":"cm_retie_constructor",
      "retie_const_identificacion":"retie_const_identificacion",
      "text_4vafa":"retie_decl_num",
      "retie_prof_constructor":"retie_prof_constructor",
      "retie_matricula_const":"cm_retie_matricula",
      "retie_consejo":"retie_consejo",
      "retie_direccion":"cm_dir_radica",
      "retie_municipio":"pred_mpio",
      "retie_departamento":"pred_depto",
      "retie_fecha_construccion":"retie_fecha_construccion_ddmmaaaa",
      "retie_solicitante":"cm_nombre",
      "retie_identificacion":"cm_num_doc",
      "retie_dia":"cm_fecha_dia",
      "retie_mes":"cm_fecha_mes",
      "retie_año":"cm_fecha_anio",
      "retie_ciudad":"retie_ciudad_firma",
      "retie_dir_constructor":"retie_dir_constructor",
      "retie_cel_constructor":"retie_cel_constructor",
      "retie_correo_constructor":"retie_correo_constructor"
    }
  };

  function appData(){
    const v={...(typeof data==='function'?data():(typeof recogerDatos==='function'?recogerDatos():{}))};
    const rec=state.currentRecord||state.registration||{};
    v._empresa=APPLUS; v._aliado=APPLUS; v._empresa_applus=APPLUS; v._empresa_inmel=APPLUS;
    v.pred_direccion=v.pred_direccion||rec.direccion||v.cm_dir_radica||'';
    v.ar_sector_pdf=v.ar_sector_pdf||rec.sector||v.cm_sector||'';
    v.ar_localidad_pdf=v.ar_localidad_pdf||rec.localidad||v.cm_localidad||'';
    v.ar_alcaldia_pdf=v.ar_alcaldia_pdf||v.cm_mpio||rec.municipio||rec.localidad||'';
    v._orden_ro_e1=String(rec.orden_ro||rec.Orden_RO||rec.ro||v.e1_no_solicitud||'').trim();
    const techName=gs77TechName();
    const retieId=String(document.getElementById('retie_const_identificacion')?.value||v.retie_const_identificacion||state.jornada?.tecnico_cedula||'').replace(/\\D/g,'');
    let mat=String(document.getElementById('cm_retie_matricula')?.value||v.cm_retie_matricula||'').trim();
    if(retieId){
      const serial=gs77SerialFromMatricula(mat,retieId,retieId+'-');
      mat=retieId+'-'+serial;
    }
    v.cm_retie_constructor=techName||v.cm_retie_constructor||'';
    v.retie_const_identificacion=retieId;
    v.cm_retie_matricula=mat;
    v._tecnico_nombre=techName||state.jornada?.gestor_nombre||'';
    v._tecnico_cedula=retieId;
    return v;
  }

  function setFieldSafe(form,name,val,font){
    try{
      const f=form.getField(name);
      const s=sanitizePdfText?sanitizePdfText(val??''):String(val??'');
      if(typeof f.setText==='function') f.setText(s);
      else if(typeof f.select==='function' && s) f.select(s);
      else if(typeof f.check==='function') (s&&s!=='0'&&s.toLowerCase()!=='no'&&s!=='false')?f.check():f.uncheck();
      try{if(font&&typeof f.defaultUpdateAppearances==='function')f.defaultUpdateAppearances(font)}catch(_){}
      return true;
    }catch(_){return false}
  }

  async function fillPdf(name){
    const b64=await loadTemplate(name);
    const bytes=b64ToUint8?b64ToUint8(b64):base64ToBytes(b64);
    const pdf=await PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false});
    const form=pdf.getForm();
    const helv=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    const vals=appData();
    const map=PDF_MAPS[name]||{};
    for(const [field,key] of Object.entries(map)) setFieldSafe(form,field,vals[key]??'',helv);

    if(name==='E1'){
      try{
        const rg=form.getRadioGroup("2 tipo persona"), val=vals.e1_tipo_persona;
        if(val){const opts=rg.getOptions();const idx=["Natural","Jurídica"].indexOf(val);if(idx>=0&&opts[idx])rg.select(opts[idx])}
      }catch(_){}
      try{
        const rg=form.getRadioGroup("1 zona"), val=vals.e1_zona;
        if(val){const opts=rg.getOptions();const idx=["Urbana","Rural"].indexOf(val);if(idx>=0&&opts[idx])rg.select(opts[idx])}
      }catch(_){}
    }

    try{form.updateFieldAppearances(helv)}catch(e){warn('apariencias '+name,e)}
    if(typeof insertPdfSignatures==='function') await insertPdfSignatures(pdf,name);
    else if(typeof aplicarFirmasPdf==='function') await aplicarFirmasPdf(pdf,name);

    return await pdf.save({useObjectStreams:false,addDefaultPage:false,updateFieldAppearances:false});
  }

  makePDF=async function(doc){return await fillPdf(doc)};

  async function makeECv77(){
    const b64=await loadTemplate('EC');
    if(typeof JSZip==='undefined') throw new Error('JSZip no disponible para EC');
    const bytes=b64ToUint8?b64ToUint8(b64):base64ToBytes(b64);
    const zip=await JSZip.loadAsync(bytes);
    let documentXml=await zip.file('word/document.xml').async('string');
    const rows=typeof obtenerFilasCuadroCargas==='function'?obtenerFilasCuadroCargas():[];
    if(typeof crearTablaCargasWordXml==='function'){
      const tableXml=crearTablaCargasWordXml(rows);
      const markers=['{{CUADRO_CARGAS}}','«CUADRO_CARGAS_DINAMICO_APP»'];
      let replaced=false;
      for(const marker of markers){
        const idx=documentXml.indexOf(marker);
        if(idx<0) continue;
        const pStart=documentXml.lastIndexOf('<w:p',idx);
        const pEnd=documentXml.indexOf('</w:p>',idx);
        if(pStart>=0&&pEnd>=0){
          documentXml=documentXml.slice(0,pStart)+tableXml+documentXml.slice(pEnd+6);
          replaced=true;
          break;
        }
      }
      if(!replaced) throw new Error('No se encontró el marcador del cuadro de cargas en EC');
    }
    zip.file('word/document.xml',documentXml);
    return await zip.generateAsync({type:'uint8array'});
  }

  makeEC=makeECv77;

  function setTextAny(form,names,val,helv,size){
    for(const name of names){
      try{
        const f=form.getTextField(name);
        try{f.acroField.dict.delete(PDFLib.PDFName.of('MaxLen'))}catch(_){}
        f.setText(sanitizePdfText?sanitizePdfText(val??''):String(val??''));
        if(size)try{f.setFontSize(size)}catch(_){}
        try{f.defaultUpdateAppearances(helv)}catch(_){}
        return true;
      }catch(_){}
    }
    return false;
  }
  function setCheckAny(form,names,on){
    for(const name of names){try{const f=form.getCheckBox(name);on?f.check():f.uncheck();return true}catch(_){}}
    return false;
  }
  function fitImageRect(img,box){
    const ir=img.width/img.height,br=box.width/box.height;let width=box.width,height=box.height;
    if(ir>br)height=width/ir;else width=height*ir;
    return{x:box.x+(box.width-width)/2,y:box.y+(box.height-height)/2,width,height};
  }

  makeTD=async function(recArg){
    const rec=recArg||state.currentRecord||state.registration||{};
    const b64=await loadTemplate('TD');
    const bytes=b64ToUint8?b64ToUint8(b64):base64ToBytes(b64);
    const pdf=await PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false});
    const form=pdf.getForm(), helv=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
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
    try{form.updateFieldAppearances(helv)}catch(e){warn('TD appearances',e)}

    const page=pdf.getPages()[0];
    for(const [kind,box] of Object.entries({solicitante:{x:29,y:91,width:238,height:63},tecnico:{x:304,y:92,width:239,height:63}})){
      const src=state.signatures?.[kind]; if(!src) continue;
      try{const img=await pdf.embedPng(dataUrlToUint8(src));page.drawImage(img,fitImageRect(img,box))}catch(e){warn('firma TD '+kind,e)}
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
      if(!validateRegistration()) return false;
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
      r.rol=state.role;r.estado_sync='PENDIENTE';
      const ix=all.findIndex(x=>x.id_registro===r.id_registro);
      if(ix>=0) all[ix]=r; else all.push(r);
      saveRecords(all);
      const verify=records();
      const stored=verify.find(x=>x.id_registro===r.id_registro);
      if(!stored) throw new Error('No fue posible verificar el registro guardado');
      state.currentRecord=stored;
      state.registration=cloneRecord(stored);
      applyRegistrationToDocs(stored);
      save();
      const ss=document.querySelector('#savedSummary');
      if(ss) ss.innerHTML=`<strong>${escapeText(stored.nombres)}</strong><br>RO: ${escapeText(stored.orden_ro||'—')}<br>${escapeText(stored.direccion)} · ${escapeText(stored.localidad)} / ${escapeText(stored.sector)}`;
      show('saved');toast('✅ Registro guardado correctamente');
      return true;
    }catch(e){console.error(e);toast('Error guardando registro: '+e.message);return false}
  };

  jornadaRows=function(){return [...records()].sort((a,b)=>String(a.fecha_hora_creacion||a.fecha_registro||'').localeCompare(String(b.fecha_hora_creacion||b.fecha_registro||'')))};

  const EXPORT_COLUMNS=[
    ['id_registro','ID registro'],['orden_ro','Orden RO'],['fecha_registro','Fecha de registro'],['fecha_hora_creacion','Fecha/hora creación'],
    ['nombres','Nombres'],['identificacion','Identificación'],['contacto','Contacto'],['direccion','Dirección'],['localidad','Localidad'],['sector','Sector/Barrio'],
    ['tipo_zona','Tipo zona'],['tipo_poblacion','Tipo de población'],['documento_propiedad','Documento de propiedad'],['documentos_pendientes','Documentos pendientes'],
    ['condiciones_seguridad','Condiciones de seguridad'],['esquema_particular','Esquema particular'],['esquema_contrato','Esquema contrato'],['requiere_redes','Requiere de redes'],
    ['tipo_material','Tipo material predio'],['plantas','Plantas'],['requiere_muro','Requiere muro/Pilar'],['garrawall','Requiere uso de Garrawall'],['arriostre','Requiere uso de arriostre'],
    ['requiere_interna','Requiere instalación interna'],['requiere_externa','Requiere instalación externa'],['elementos_externos','Elementos requeridos de instalación externa'],
    ['estado_tecnico','Estado técnico'],['observaciones','Observaciones'],['latitud','Latitud (Y)'],['longitud','Longitud (X)'],['precision','Precisión (m)'],['estado_sync','Estado sync']
  ];

  buildExcelBytes=function(rows){
    const known=new Set(EXPORT_COLUMNS.map(x=>x[0])),extra=[];
    for(const r of rows) for(const k of Object.keys(r||{})) if(!known.has(k)&&!['contrato','contratista'].includes(k)&&!extra.includes(k)) extra.push(k);
    const cols=[...EXPORT_COLUMNS,...extra.map(k=>[k,k])];
    const flat=rows.map(r=>Object.fromEntries(cols.map(([k,label])=>[label,Array.isArray(r[k])?r[k].join(' | '):(r[k]??'')])));
    const headers=cols.map(x=>x[1]),ws=XLSX.utils.json_to_sheet(flat,{header:headers});
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
      await downloadBlob(new Blob([buildExcelBytes(rows)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`Recibo_tecnico_${safe}_${date}.xlsx`);
      const payload={app:'GS Documentos',version:VERSION,generated_at:new Date().toISOString(),total:rows.length,registros:rows.map(r=>typeof jsonRecord==='function'?jsonRecord(r):r)};
      await downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),`GS_Registro_${safe}_${date}.json`);
      localStorage.setItem('GS_DOCS_LAST_EXPORT_V1',new Date().toISOString());
      toast(`✅ Jornada exportada completa: ${rows.length} registros`);renderRecordsScreen();return true;
    }catch(e){console.error(e);toast('No fue posible exportar: '+e.message);return false}
  };

  closeJornada=async function(){
    const rows=jornadaRows();if(!rows.length)return toast('No hay registros para cerrar');
    const ok=await exportJornada();if(!ok)return;
    if(confirm('¿Confirmas que verificaste el Excel y el JSON descargados?\n\nAceptar limpiará los registros operativos del dispositivo.')){
      localStorage.removeItem(recordsKey);localStorage.removeItem(txtKey);localStorage.removeItem(appKey);toast('Jornada cerrada y datos operativos limpiados');setTimeout(()=>location.reload(),500);
    }
  };

  generateZip=async function(){
    try{
      forceApplus();
      if(!validateRequired()){show('form');return false}
      updateKpis();
      const zip=new JSZip(),sel=state.selected.length?[...state.selected]:[],rec=state.currentRecord||state.registration||{},errors=[];
      if(sel.includes('E1')){
        const ro=String(rec.orden_ro||rec.Orden_RO||rec.ro||appData().e1_no_solicitud||'').trim();
        if(!ro){
          toast('El E1 requiere Orden RO. Este dato llena “No de solicitud” en la página 2.');
          try{show('register')}catch(_){}
          const roInput=document.querySelector('[data-key="orden_ro"],#orden_ro,input[name="orden_ro"]');
          roInput?.focus();
          return false;
        }
      }
      try{zip.file(typeof tdFileName==='function'?tdFileName(rec):'TD_Constancia_Inspeccion.pdf',await makeTD(rec))}catch(e){errors.push('TD: '+e.message);warn('TD',e)}
      for(const d of sel){
        try{
          if(['E1','E6','AR','DJ','RETIE'].includes(d)) zip.file(`${d}.pdf`,await makePDF(d));
          else if(d==='EC') zip.file('EC_Esquema_constructivo.docx',await makeECv77());
        }catch(e){errors.push(d+': '+e.message);warn(d,e)}
      }
      if(Object.values(state.materials?.qty||{}).some(q=>Number(q)>0)){try{zip.file('Materiales.xlsx',makeMaterials())}catch(e){errors.push('Materiales: '+e.message)}}
      if(state.supports?.length){const folder=zip.folder('SOPORTES');for(const f of state.supports){try{folder.file(f.name,await f.arrayBuffer())}catch(e){errors.push('Soporte '+f.name+': '+e.message)}}}
      if(errors.length) zip.file('ERRORES_GENERACION.txt',errors.join('\n'));
      const blob=await zip.generateAsync({type:'blob'}),name=cleanName(appData().cm_nombre||rec.nombres||'GS_Documentos')+'.zip';
      await downloadBlob(blob,name);
      toast(errors.length?`ZIP generado con ${errors.length} advertencia(s)`:'✅ ZIP generado correctamente');
      return true;
    }catch(e){console.error(e);toast('Error generando: '+e.message);return false}
  };

  function bindFreshButton(id,handler){
    const old=document.querySelector('#'+id);
    if(!old||old.dataset.gsV77Bound==='1') return;
    const btn=old.cloneNode(true);
    btn.dataset.gsV77Bound='1';
    old.replaceWith(btn);
    btn.addEventListener('click',ev=>{
      ev.preventDefault();
      ev.stopImmediatePropagation();
      Promise.resolve(handler()).catch(e=>{console.error(e);toast('Error: '+e.message)});
    });
  }
  function rebind(){
    bindFreshButton('saveRegister',saveRegistration);
    bindFreshButton('exportJornada',exportJornada);
    bindFreshButton('closeJornada',closeJornada);
    bindFreshButton('genZip',generateZip);
  }

  try{
    const originalRenderRegistration=renderRegistration;
    renderRegistration=function(){const r=originalRenderRegistration.apply(this,arguments);forceApplus();gs77DecorateJornada();gs77ApplyRetieTech();gs77DecorateJornada();gs77ApplyRetieTech();hideContractor();bindIndependentGarrawall();rebind();return r};
  }catch(e){warn('renderRegistration',e)}
  try{
    const originalRenderRecords=renderRecordsScreen;
    renderRecordsScreen=function(){const r=originalRenderRecords.apply(this,arguments);rebind();return r};
  }catch(e){warn('renderRecords',e)}

  hideContractor();bindIndependentGarrawall();rebind();
  const observer=new MutationObserver(()=>{forceApplus();gs77DecorateJornada();gs77ApplyRetieTech();hideContractor();bindIndependentGarrawall();rebind()});
  observer.observe(document.body,{subtree:true,childList:true});

  Promise.allSettled(['E1','AR','E6','RETIE','DJ','TD','EC'].map(loadTemplate)).then(rs=>{
    const bad=rs.filter(x=>x.status==='rejected');
    if(bad.length) warn('Plantillas con error',bad);
    else log('plantillas aprobadas listas');
  });
  log('activo · v77 · E1 Orden RO obligatorio en No de solicitud');
})();