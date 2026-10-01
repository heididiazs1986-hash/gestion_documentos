from pathlib import Path
import base64
import hashlib
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
T = ROOT / "templates"

EXPECTED = {
    "AR.pdf": "7629a219a135cf70c57b9ffd9506b61462bfbab28802a2f4fa9e865bbdbd7e03",
    "E6.pdf": "8be5c4c32341af916019d413a074098c1f60cd9114c46d698b7ee562fadf842b",
    "DJ.pdf": "827ef98190c5e30d87639954ba9edb83bc8386516504759f2a7bd23efc1d06e3",
    "RETIE.pdf": "1cc3192257071116079a5a64f92f99175b13fbcfaa97f165c4f8482fc08a1bb9",
    "Constancia_TD.pdf": "71bd53b915c83d47bc6f1c3069bb45ec7c09ba2e642b7cd9f3f8252c26bb9679",
    "EC_APPLUS.docx": "c72a95df2600f5839a64f07bfd354480d0fc49b3c6fd63fa8ec1a35b67f03019",
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

for name, expected in EXPECTED.items():
    path = T / name
    if not path.exists():
        raise SystemExit(f"Falta plantilla {name}")
    actual = sha(path)
    if actual != expected:
        raise SystemExit(f"Plantilla {name} no coincide: {actual}")

parts = [T / "E1" / f"part-{i:02d}.b64" for i in range(1, 36)]
if not all(p.exists() for p in parts):
    raise SystemExit("Faltan fragmentos E1")
e1_b64 = "".join(p.read_text(encoding="utf-8").strip() for p in parts)
e1 = base64.b64decode(e1_b64, validate=True)
if hashlib.sha256(e1).hexdigest() != "0ad04784833a97253341a023bb25293ef9ee0da0cf65a42712190473d263225b":
    raise SystemExit("E1 reconstruido no coincide con la plantilla aprobada")
if not e1.startswith(b"%PDF-"):
    raise SystemExit("E1 reconstruido no es PDF")

for name in ["AR.pdf","E6.pdf","DJ.pdf","RETIE.pdf","Constancia_TD.pdf"]:
    if not (T/name).read_bytes().startswith(b"%PDF-"):
        raise SystemExit(f"{name} no es PDF")

with zipfile.ZipFile(T/"EC_APPLUS.docx") as z:
    xml = z.read("word/document.xml").decode("utf-8")
    for token in ["{{FECHA}}","{{PROPIETARIO}}","{{IDENTIFICACION}}","{{DIRECCION}}","{{MUNICIPIO}}","{{ELECTRICISTA}}","{{MATRICULA}}","{{CUADRO_CARGAS}}"]:
        if token not in xml:
            raise SystemExit(f"EC sin marcador {token}")

code_parts=[T/"v75-code"/f"part-{i:02d}.jsfrag" for i in range(6)]
if not all(p.exists() for p in code_parts):
    raise SystemExit("Faltan módulos del fix v75")
code=b"".join(p.read_bytes() for p in code_parts)
for marker in [b"makePDF=async",b"makeTD=async",b"makeEC=async",b"saveRegistration=function",b"buildExcelBytes=function",b"generateZip=async"]:
    if marker not in code:
        raise SystemExit(f"Fix v75 incompleto: falta {marker!r}")
with tempfile.NamedTemporaryFile(suffix=".js",delete=False) as f:
    f.write(code)
    tmp=f.name
subprocess.run(["node","--check",tmp],check=True)

print("OK: plantillas aprobadas, E1 reconstruido, EC y runtime v75 validados")
