/* GS Documentos v60 · descarga directa + ajuste Aliado TD */
(() => {
  'use strict';

  const VERSION = 'v60';

  function ensureDownloadStatus() {
    const screen = document.querySelector('#generate .card');
    if (!screen) return null;
    let box = document.querySelector('#zipDownloadStatus');
    if (!box) {
      box = document.createElement('div');
      box.id = 'zipDownloadStatus';
      box.hidden = true;
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      const actions = screen.querySelector('.actions');
      if (actions) screen.insertBefore(box, actions);
      else screen.appendChild(box);
    }
    return box;
  }

  function installStyles() {
    if (document.querySelector('#gs-v60-style')) return;
    const style = document.createElement('style');
    style.id = 'gs-v60-style';
    style.textContent = `
      #zipDownloadStatus{
        margin:14px 0 4px;padding:12px 14px;border-radius:12px;
        border:1px solid rgba(26,129,72,.28);background:rgba(26,129,72,.09);
        color:var(--text,#17324a);font-size:.94rem;line-height:1.35;font-weight:650;
      }
      #zipDownloadStatus strong{font-weight:800}
    `;
    document.head.appendChild(style);
  }

  function showDownloaded(name) {
    const box = ensureDownloadStatus();
    if (box) {
      box.hidden = false;
      box.innerHTML = `✅ ZIP descargado: <strong>${escapeText(String(name || 'archivo.zip'))}</strong><br><span style="font-weight:500">Revisa la carpeta Descargas del celular.</span>`;
    }
    try { toast(`✅ ZIP descargado: ${name}`, 6500); } catch (_) {}
  }

  function cleanGenerateScreen() {
    const screen = document.querySelector('#generate');
    if (!screen) return;

    const retry = document.querySelector('#retryLastFile');
    if (retry) retry.remove();

    screen.querySelectorAll('button').forEach(btn => {
      const text = (btn.textContent || '').toLowerCase();
      if (text.includes('compartir') || text.includes('guardar último zip')) btn.remove();
    });

    const help = screen.querySelector('p.help');
    const helpText = 'Se generará y descargará el ZIP individual del usuario con la Constancia TD y los documentos seleccionados. Al finalizar verás aquí el nombre del archivo descargado.';
    if (help && help.textContent !== helpText) help.textContent = helpText;

    const gen = document.querySelector('#genZip');
    if (gen && gen.textContent !== 'Generar ZIP') gen.textContent = 'Generar ZIP';
    ensureDownloadStatus();
  }

  // V60: postprocesa la Constancia TD de v59 sin tocar la lógica técnica.
  async function fixTdAlly(bytes, recArg) {
    try {
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const page = pdf.getPages()[0];
      const form = pdf.getForm();
      const rec = recArg || state.currentRecord || state.registration || {};
      const allyText = (rec.contrato || state.jornada?.contrato) === 'INMEL' ? 'INMEL' : 'APPLUS+';
      const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
      const ink = PDFLib.rgb(.10,.16,.20);
      const white = PDFLib.rgb(1,1,1);

      const wrap = (txt, width, size) => {
        const words = String(txt || '').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
        const lines = [];
        let line = [];
        for (const word of words) {
          const candidate = [...line, word].join(' ');
          if (line.length && font.widthOfTextAtSize(candidate, size) > width) {
            lines.push(line);
            line = [word];
          } else line.push(word);
        }
        if (line.length) lines.push(line);
        return lines;
      };

      const drawJustifiedLines = (lines, x, y, width, size, lineHeight) => {
        lines.forEach((words, i) => {
          const last = i === lines.length - 1;
          if (last || words.length < 2) {
            page.drawText(words.join(' '), {x, y:y-i*lineHeight, size, font, color:ink});
            return;
          }
          const wordsWidth = words.reduce((sum,w)=>sum+font.widthOfTextAtSize(w,size),0);
          const gap = (width - wordsWidth) / (words.length - 1);
          let cx = x;
          for (const word of words) {
            page.drawText(word,{x:cx,y:y-i*lineHeight,size,font,color:ink});
            cx += font.widthOfTextAtSize(word,size) + gap;
          }
        });
        return y - lines.length * lineHeight;
      };

      // Limpiar únicamente el cuerpo legal redibujado por v59.
      page.drawRectangle({x:28,y:349,width:540,height:79,color:white});

      const size = 6.65, lineHeight = 9.3, x = 30, width = 535;
      const auth1 = 'Declaro conocer la información relacionada con el tratamiento de mis datos personales y, en cumplimiento del artículo 15 de la Constitución Política de Colombia, la Ley Estatutaria 1581 de 2012 y sus normas reglamentarias, en especial el Decreto 1074 de 2015, autorizo de manera previa, expresa e informada su recolección, almacenamiento, uso, circulación y demás operaciones necesarias para la gestión de la visita, caracterización del predio, normalización de la medida, gestión documental, radicación y demás actividades asociadas al proyecto ENERGÍA SEGURA PARA TODOS - ESPT,';
      const auth2 = 'Declaro conocer mis derechos de conocer, actualizar, rectificar y solicitar información sobre mis datos personales; solicitar prueba de la autorización otorgada; presentar consultas o reclamos; y, cuando legalmente proceda, revocar la autorización o solicitar la supresión de mis datos. La información será tratada conforme a las políticas de tratamiento de datos personales aplicables y únicamente para las finalidades informadas.';

      let y = 420;
      y = drawJustifiedLines(wrap(auth1,width,size),x,y,width,size,lineHeight) - 0.5;

      const tail = 'desarrollado por ENEL y su aliado estratégico';
      page.drawText(tail,{x,y,size,font,color:ink});
      const tailWidth = font.widthOfTextAtSize(tail,size);

      try {
        const ally = form.getTextField('aut_aliado');
        ally.setText(allyText);
        ally.setFontSize(7.3);
        ally.enableReadOnly();
        const widget = ally.acroField.getWidgets()[0];
        if (widget) {
          const fieldX = Math.min(x + tailWidth + 4, 505);
          widget.setRectangle({x:fieldX,y:y-2.2,width:58,height:10.5});
        }
      } catch (e) { console.warn('v60 aliado TD', e); }

      y -= lineHeight + 3;
      drawJustifiedLines(wrap(auth2,width,size),x,y,width,size,lineHeight);
      try { form.updateFieldAppearances(); } catch (_) {}
      return await pdf.save();
    } catch (e) {
      console.warn('v60 TD', e);
      return bytes;
    }
  }

  try {
    const originalMakeTD = makeTD;
    makeTD = async function(rec) {
      const target = rec || state.currentRecord || state.registration;
      const bytes = await originalMakeTD(target);
      return await fixTdAlly(bytes, target);
    };
  } catch (e) { console.warn('v60 makeTD', e); }

  async function generateZipDownloadOnly() {
    try {
      if (!validateRequired()) { show('form'); return; }
      updateKpis();
      const zip = new JSZip();
      const sel = state.selected.length ? state.selected : [];
      const rec = state.currentRecord || state.registration;

      zip.file(tdFileName(rec), await makeTD(rec));
      for (const d of sel) {
        if (pdfMap[d]) zip.file(`${d}.pdf`, await makePDF(d));
      }
      if (sel.includes('EC')) zip.file('EC_Esquema_constructivo.docx', await makeEC());
      if (state.supports?.length) {
        const folder = zip.folder('SOPORTES');
        for (const f of state.supports) folder.file(f.name, await f.arrayBuffer());
      }

      const blob = await zip.generateAsync({type:'blob'});
      const name = cleanName(data().cm_nombre) + '.zip';
      downloadBlob(blob, name);
      try { markTDIndividual(); } catch (_) {}
      showDownloaded(name);
    } catch (e) {
      console.error(e);
      try { toast('Error generando: ' + e.message, 6000); } catch (_) {}
    }
  }

  function bindDownloadOnly() {
    cleanGenerateScreen();
    const old = document.querySelector('#genZip');
    if (!old || old.dataset.v60 === '1') return;

    // El clon elimina cualquier listener anterior asociado al flujo de compartir.
    const btn = old.cloneNode(true);
    btn.dataset.v60 = '1';
    btn.textContent = 'Generar ZIP';
    old.replaceWith(btn);
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      generateZipDownloadOnly();
    });

    try { generateZip = generateZipDownloadOnly; } catch (_) {}
  }

  function applyV60() {
    installStyles();
    cleanGenerateScreen();
    bindDownloadOnly();
  }

  applyV60();
  const observer = new MutationObserver(() => {
    cleanGenerateScreen();
    bindDownloadOnly();
  });
  observer.observe(document.body,{childList:true,subtree:true});

  console.info('GS Documentos', VERSION, 'activo');
})();
