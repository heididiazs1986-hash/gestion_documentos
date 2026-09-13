/* GS Documentos v55 · ajuste operativo 2026-09-13 */
(() => {
  'use strict';

  const VISIBLE_EXTERNAL_ELEMENTS = new Set([
    'Acometida',
    'Ducto 1" Galv.',
    'Celda',
    'Interruptor',
    'Sistema puesta a tierra'
  ]);

  const uniq = values => [...new Set((values || []).filter(Boolean))];
  const splitObservation = value => String(value || '')
    .split(/\s*\|\s*|\r?\n+/)
    .map(v => v.trim())
    .filter(Boolean);

  function normalizeObservationForRecord(rec) {
    if (!rec) return;
    const technical = Array.isArray(rec.estado_tecnico) ? rec.estado_tecnico : [];
    const allTechnical = typeof TECH_STATUS !== 'undefined' ? new Set(TECH_STATUS) : new Set(technical);
    const manual = splitObservation(rec.observaciones).filter(v => !allTechnical.has(v));
    rec.observaciones = uniq([...technical, ...manual]).join(' | ');
  }

  function sanitizeExternalElements(rec) {
    if (!rec) return;
    rec.elementos_externos = (Array.isArray(rec.elementos_externos) ? rec.elementos_externos : [])
      .filter(v => VISIBLE_EXTERNAL_ELEMENTS.has(v));
  }

  try {
    updateTechnicalObservation = function(oldStatuses, newStatuses) {
      const rec = state?.registration;
      if (!rec) return;
      const allTechnical = typeof TECH_STATUS !== 'undefined' ? new Set(TECH_STATUS) : new Set([...(oldStatuses || []), ...(newStatuses || [])]);
      const manual = splitObservation(rec.observaciones).filter(v => !allTechnical.has(v));
      rec.observaciones = uniq([...(newStatuses || []), ...manual]).join(' | ');
    };
  } catch (e) { console.warn('v55 observaciones', e); }

  try {
    tdHallazgos = function(rec) {
      const parts = [];
      sanitizeExternalElements(rec);
      const elements = Array.isArray(rec?.elementos_externos) ? rec.elementos_externos : [];
      if (rec?.requiere_externa === 'Sí' && elements.length) {
        parts.push('Elementos requeridos de instalación externa: ' + elements.join(', ') + '.');
      }
      const technical = Array.isArray(rec?.estado_tecnico) ? rec.estado_tecnico : [];
      const allTechnical = typeof TECH_STATUS !== 'undefined' ? new Set(TECH_STATUS) : new Set(technical);
      const manual = splitObservation(rec?.observaciones).filter(v => !allTechnical.has(v));
      parts.push(...technical, ...manual);
      return uniq(parts).join(' | ');
    };
  } catch (e) { console.warn('v55 hallazgos', e); }

  try {
    const originalDownloadBlob = downloadBlob;
    downloadBlob = function(blob, filename) {
      let name = String(filename || '');
      const m = name.match(/^Recibo_tecnico_(.+)_(\d{4}-\d{2}-\d{2})\.xlsx$/i);
      if (m) {
        const sector = m[1].replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
        name = `Reporte de ${sector} ${m[2]}.xlsx`;
      }
      return originalDownloadBlob(blob, name);
    };
  } catch (e) { console.warn('v55 nombre reporte', e); }

  function copyRecord(rec) {
    const out = { ...rec };
    for (const k of ['elementos_externos','estado_tecnico','documentos_pendientes','condiciones_seguridad']) {
      out[k] = Array.isArray(rec?.[k]) ? [...rec[k]] : [];
    }
    return out;
  }

  function editRecordByRO(ro) {
    try {
      const rec = records().find(r => String(r.orden_ro || '') === String(ro || ''));
      if (!rec) return toast('No fue posible localizar el registro');
      state.registration = copyRecord(rec);
      sanitizeExternalElements(state.registration);
      normalizeObservationForRecord(state.registration);
      state.currentRecord = rec;
      state.regStep = 0;
      try { applyRegistrationToDocs(rec); } catch (_) {}
      try { renderRegistration(); } catch (_) {}
      try { save(); } catch (_) {}
      show('register');
      toast('Registro cargado para edición');
    } catch (e) {
      console.error(e);
      toast('No fue posible abrir el registro para edición');
    }
  }

  function enhancedSaveRegistration() {
    if (!validateRegistration()) return;
    sanitizeExternalElements(state.registration);
    normalizeObservationForRecord(state.registration);
    state.registration.nombres = titleCaseWords(state.registration.nombres);
    state.registration.sector = titleCaseWords(state.registration.sector);
    state.registration.direccion = normalizeAddress(state.registration.direccion);
    state.registration.contacto = cleanContact(state.registration.contacto);

    const all = records();
    const currentId = state.currentRecord?.id_registro || state.registration?.id_registro || '';
    const duplicate = all.some(x => x.orden_ro === state.registration.orden_ro && x.id_registro !== currentId);
    if (duplicate) {
      alert('⚠️ Orden RO duplicada\n\nLa Orden RO ' + state.registration.orden_ro + ' ya fue registrada en esta jornada.\nVerifique el número antes de continuar.');
      state.regStep = 0;
      renderRegistration();
      return;
    }

    const idx = currentId ? all.findIndex(x => x.id_registro === currentId) : -1;
    const existing = idx >= 0 ? all[idx] : {};
    const now = new Date().toISOString();
    const r = {
      ...existing,
      ...state.registration,
      elementos_externos: [...(state.registration.elementos_externos || [])],
      estado_tecnico: [...(state.registration.estado_tecnico || [])],
      documentos_pendientes: [...(state.registration.documentos_pendientes || [])],
      condiciones_seguridad: [...(state.registration.condiciones_seguridad || [])],
      id_registro: idx >= 0 ? existing.id_registro : makeUUID(),
      fecha_hora_creacion: idx >= 0 ? (existing.fecha_hora_creacion || now) : now,
      fecha_hora_actualizacion: now,
      rol: state.role,
      estado_sync: 'PENDIENTE'
    };

    if (idx >= 0) all[idx] = r; else all.push(r);
    localStorage.setItem(recordsKey, JSON.stringify(all));
    state.currentRecord = r;
    state.registration = copyRecord(r);
    applyRegistrationToDocs(r);
    const ss = document.querySelector('#savedSummary');
    if (ss) {
      const place = r.municipio
        ? (r.municipio === 'Bogotá' ? `Bogotá / ${r.localidad || '—'}` : r.municipio)
        : (r.localidad || '—');
      ss.innerHTML = `<strong>${escapeText(r.nombres || '')}</strong><br>RO: ${escapeText(r.orden_ro || '—')}<br>${escapeText(r.direccion || '')} · ${escapeText(place)} · ${escapeText(r.sector || '')}`;
    }
    save();
    show('saved');
    if (idx >= 0) toast('Registro actualizado');
  }

  function decorateRecords() {
    const host = document.querySelector('#recordsHost');
    if (!host) return;
    host.querySelectorAll('.record-row').forEach(row => {
      if (row.dataset.editReady === '1') return;
      const text = row.textContent || '';
      const match = text.match(/\bRO\s+([^·\s]+)/i);
      if (!match) return;
      row.dataset.editReady = '1';
      const actions = document.createElement('div');
      actions.className = 'record-row-actions';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'record-edit-btn';
      btn.textContent = '✏️ Editar';
      btn.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        editRecordByRO(match[1]);
      });
      actions.appendChild(btn);
      row.appendChild(actions);
    });
  }

  function fixSavedActions() {
    const screen = document.querySelector('#saved');
    if (!screen) return;
    const yes = document.querySelector('#yesDocs');
    const next = document.querySelector('#noDocs');
    const recordsBtn = document.querySelector('#savedRecords');
    if (yes) yes.textContent = '📄 Realizar documentos';
    if (next) next.textContent = '＋ Guardar y nuevo registro';
    if (recordsBtn) recordsBtn.textContent = '📋 Ver registros / exportar';
    screen.querySelectorAll('button').forEach(btn => {
      if ([yes, next, recordsBtn].includes(btn)) return;
      const t = (btn.textContent || '').toLowerCase();
      if (t.includes('cerrar jornada') || t.includes('solo registro') || t.includes('ir a exportar')) {
        btn.style.display = 'none';
      }
    });
  }

  function installVisualAdjustments() {
    if (document.querySelector('#gs-v55-hotfix-style')) return;
    const style = document.createElement('style');
    style.id = 'gs-v55-hotfix-style';
    style.textContent = `
      #saved .card{padding:18px 16px!important}
      #saved .actions{display:grid!important;grid-template-columns:1fr!important;gap:9px!important;margin-top:14px!important}
      #saved .actions .btn{min-height:48px!important;margin:0!important;font-size:15px!important;font-weight:700!important}
      #saved h2{margin:8px 0 6px!important}
      #saved p.help{margin:0 0 12px!important;line-height:1.35!important}
      #savedSummary{padding:12px 14px!important;line-height:1.35!important}
      .record-row{position:relative;padding:12px 13px!important}
      .record-row-actions{display:flex;justify-content:flex-end;margin-top:9px}
      .record-edit-btn{border:1px solid var(--line,#d7e0e8);background:var(--soft,#f3f7fb);color:var(--ink,#17324a);border-radius:10px;padding:8px 12px;font:inherit;font-size:12px;font-weight:750;cursor:pointer}
      .reg-field textarea#reg_observaciones{min-height:150px!important}
      @media(max-width:720px){#saved .card{padding:16px 12px!important}.record-edit-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  async function compactTreatmentData(bytes) {
    try {
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const page = pdf.getPages()[0];
      const form = pdf.getForm();
      try {
        const field = form.getTextField('hallazgos');
        field.setFontSize(10);
        form.updateFieldAppearances();
      } catch (_) {}

      const rec = state.currentRecord || state.registration || {};
      const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const white = PDFLib.rgb(1,1,1);
      const ink = PDFLib.rgb(0.08,0.12,0.17);
      const line = PDFLib.rgb(0.72,0.78,0.84);
      const ally = state.jornada?.contrato === 'INMEL' ? 'INMEL' : 'APPLUS+';

      const wrap = (text, maxW, fs) => {
        const words = String(text || '').split(/\s+/).filter(Boolean), lines = [];
        let current = '';
        for (const word of words) {
          const test = current ? current + ' ' + word : word;
          if (font.widthOfTextAtSize(test, fs) <= maxW) current = test;
          else { if (current) lines.push(current); current = word; }
        }
        if (current) lines.push(current);
        return lines;
      };

      page.drawRectangle({x:30,y:292,width:550,height:170,color:white});
      const legal1 = `Yo, ${rec.nombres || ''}, con C.C. No. ${rec.identificacion || ''}, en calidad de titular propietario del predio, declaro conocer la información relacionada con el tratamiento de mis datos personales y, en cumplimiento del artículo 15 de la Constitución Política de Colombia, la Ley Estatutaria 1581 de 2012 y sus normas reglamentarias, autorizo de manera previa, expresa e informada su recolección, almacenamiento, uso, circulación y demás operaciones necesarias para la gestión de la visita, caracterización del predio, normalización de la medida, gestión documental, radicación y demás actividades asociadas al proyecto ENERGÍA SEGURA PARA TODOS - ESPT, desarrollado por ENEL.`;
      const legal2 = 'Declaro conocer mis derechos de conocer, actualizar, rectificar y solicitar información sobre mis datos personales; solicitar prueba de la autorización otorgada; presentar consultas o reclamos; y, cuando legalmente proceda, revocar la autorización o solicitar la supresión de mis datos. La información será tratada conforme a las políticas de tratamiento de datos personales aplicables y únicamente para las finalidades informadas.';
      let y = 445;
      for (const para of [legal1, legal2]) {
        for (const l of wrap(para, 548, 7.35)) {
          page.drawText(l,{x:31,y,size:7.35,font,color:ink});
          y -= 8.75;
        }
        y -= 4;
      }
      page.drawRectangle({x:474,y:299,width:100,height:20,color:white,borderColor:line,borderWidth:.7});
      const allyW = fontBold.widthOfTextAtSize(ally, 8.2);
      page.drawText(ally,{x:474+(100-allyW)/2,y:305,size:8.2,font:fontBold,color:ink});
      return await pdf.save();
    } catch (e) {
      console.warn('v55 TD compacto', e);
      return bytes;
    }
  }

  try {
    const originalMakeTD = makeTD;
    makeTD = async function() {
      const bytes = await originalMakeTD();
      return compactTreatmentData(bytes);
    };
  } catch (e) { console.warn('v55 TD', e); }

  function applyHotfix() {
    try {
      sanitizeExternalElements(state?.registration);
      normalizeObservationForRecord(state?.registration);
      if (state?.currentRecord) normalizeObservationForRecord(state.currentRecord);
    } catch (_) {}
    installVisualAdjustments();
    fixSavedActions();
    try {
      const saveBtn = document.querySelector('#saveRegister');
      if (saveBtn) saveBtn.onclick = enhancedSaveRegistration;
    } catch (_) {}
    try {
      const originalRenderRecords = renderRecordsScreen;
      if (!originalRenderRecords.__gsV55Hotfix) {
        const wrapped = function() {
          const result = originalRenderRecords.apply(this, arguments);
          queueMicrotask(decorateRecords);
          return result;
        };
        wrapped.__gsV55Hotfix = true;
        renderRecordsScreen = wrapped;
      }
    } catch (_) {}
    decorateRecords();
    try { save(); } catch (_) {}
  }

  applyHotfix();
  const observer = new MutationObserver(() => {
    fixSavedActions();
    decorateRecords();
  });
  observer.observe(document.body, {childList:true, subtree:true});
})();
