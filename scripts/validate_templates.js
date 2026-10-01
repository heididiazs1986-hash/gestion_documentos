const fs=require('fs');
const path=require('path');
const {PDFDocument}=require('pdf-lib');
const JSZip=require('jszip');
const ROOT=path.resolve(__dirname,'..');
const B=path.join(ROOT,'templates','base64');
const clean=s=>String(s).replace(/\s+/g,'');
const read=n=>clean(fs.readFileSync(path.join(B,n),'utf8'));
function bytes(b64){return Buffer.from(b64,'base64')}
async function pdf(name,b64,required){
  const raw=bytes(b64);
  if(raw.subarray(0,4).toString()!=='%PDF') throw new Error(name+': no es PDF');
  const doc=await PDFDocument.load(raw,{ignoreEncryption:true,updateMetadata:false});
  const form=doc.getForm();
  const names=new Set(form.getFields().map(f=>f.getName()));
  const missing=required.filter(x=>!names.has(x));
  if(missing.length) throw new Error(name+': faltan campos: '+missing.join(', '));
  console.log('OK',name,'páginas',doc.getPageCount(),'campos',names.size);
}
(async()=>{
  let e1=''; for(let i=1;i<=13;i++)e1+=read('E1.part'+String(i).padStart(2,'0')+'.txt');
  await pdf('E1',e1,['1 Nombre o Razón Social','4 Número de Documento','3 Localidad','4 Municipio','6 Dirección del predio','signature_480n0a']);
  await pdf('AR',read('AR.txt'),['text_1lojj','text_2tgsw','text_3kjbx','text_4mqvb','text_6prgm','text_7jdiv','text_8ptdj','text_9ujpp','text_10ipyf','signature_126y9t']);
  await pdf('E6',read('E6.txt'),['text_1xogj','text_2gqcv','text_18ovuf','text_27bpxy','text_30sznp','text_329o6m','signature_337f0v']);
  await pdf('DJ',read('DJ.txt'),['Nombre solicitante','NumIdentificacion','Direccion','Descripcion','FechaFirma','signature_131z3s']);
  await pdf('RETIE',read('RETIE.txt'),['retie_constructor','retie_direccion','retie_municipio','retie_departamento','retie_fecha_construccion','signature_206h5k']);
  await pdf('TD',read('TD.txt'),['orden_ro','localidad','sector','usuario','observaciones','Firma usuario','Firma tecnico']);
  const ecRaw=bytes(read('EC_APPLUS.txt'));
  if(ecRaw[0]!==0x50||ecRaw[1]!==0x4b)throw new Error('EC: no es DOCX/ZIP');
  const z=await JSZip.loadAsync(ecRaw);
  const xml=await z.file('word/document.xml').async('string');
  if(!xml.includes('{{CUADRO_CARGAS}}'))throw new Error('EC: falta marcador {{CUADRO_CARGAS}}');
  console.log('OK EC plantilla DOCX y marcador');
  console.log('VALIDACIÓN V76 COMPLETA');
})().catch(e=>{console.error(e);process.exit(1)});