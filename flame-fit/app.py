"""
VisionFactory — servicio de medición / ajuste a medida (POC, I+D).

  /measure       -> landmarks (478, MediaPipe) -> medidas en mm. Sin licencia.
  /measure-mesh  -> sube una malla FLAME (.obj de MICA/DECA) -> medidas en mm + bbox.
  /fit           -> foto -> FLAME (pipeline MICA). Requiere pesos con licencia
                    NO comercial que descarga el usuario (ver README).

Ejecutar:  uvicorn app:app --reload
"""
from __future__ import annotations

import glob
import math
import os
import pathlib
import subprocess
import sys
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

app = FastAPI(title="VisionFactory Fit", version="0.3.0")
# Carpeta de MICA (para /reconstruct). Ejecuta uvicorn DENTRO del env MICA.
MICA_DIR = os.environ.get("MICA_DIR", os.path.expanduser("~/MICA"))

HVID_MM = 11.7  # diámetro horizontal del iris: patrón de escala poblacional

IRIS_R_C, IRIS_R_RING = 468, (469, 470, 471, 472)
IRIS_L_C, IRIS_L_RING = 473, (474, 475, 476, 477)
FACE_R, FACE_L = 234, 454
MIDLINE = 168


class Landmark(BaseModel):
    x: float
    y: float
    z: float = 0.0


class MeasureReq(BaseModel):
    image_width: int
    image_height: int
    landmarks: list[Landmark]  # 478 puntos MediaPipe (normalizados 0..1)


def _px(lms, i, w, h):
    return (lms[i].x * w, lms[i].y * h)


def _dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _iris_diameter(lms, c, ring, w, h):
    cc = _px(lms, c, w, h)
    return 2 * sum(_dist(cc, _px(lms, i, w, h)) for i in ring) / len(ring)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/measure")
def measure(req: MeasureReq):
    """Medidas en mm desde landmarks (mismo cálculo que el probador web)."""
    lms, w, h = req.landmarks, req.image_width, req.image_height
    if len(lms) < 478:
        raise HTTPException(400, "Se esperan 478 landmarks (MediaPipe refine_landmarks).")

    iris_px = (
        _iris_diameter(lms, IRIS_R_C, IRIS_R_RING, w, h)
        + _iris_diameter(lms, IRIS_L_C, IRIS_L_RING, w, h)
    ) / 2
    mm = HVID_MM / iris_px

    def D(a, b):
        return _dist(_px(lms, a, w, h), _px(lms, b, w, h)) * mm

    mid_x = _px(lms, MIDLINE, w, h)[0]
    return {
        "mm_por_px": round(mm, 4),
        "dp_mm": round(D(IRIS_R_C, IRIS_L_C), 1),
        "dp_mono_der_mm": round(abs(_px(lms, IRIS_R_C, w, h)[0] - mid_x) * mm, 1),
        "dp_mono_izq_mm": round(abs(_px(lms, IRIS_L_C, w, h)[0] - mid_x) * mm, 1),
        "ancho_facial_mm": round(D(FACE_R, FACE_L), 1),
        "puente_mm": round(D(133, 362), 1),
        "alto_cara_mm": round(D(10, 152), 1),
    }


@app.post("/measure-mesh")
async def measure_mesh(file: UploadFile = File(...)):
    """Sube una malla FLAME (.obj/.ply de MICA/DECA) y devuelve medidas en mm."""
    from adapter import load_mesh, measurements_mm  # import perezoso (trimesh)

    suffix = os.path.splitext(file.filename or "mesh.obj")[1] or ".obj"
    data = await file.read()
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(data)
        path = f.name
    try:
        mesh = load_mesh(path)
        return measurements_mm(mesh.vertices)
    finally:
        os.unlink(path)


@app.get("/", response_class=HTMLResponse)
def home():
    """Página simple: subir foto -> generar mesh.ply (corre MICA por detrás)."""
    return """<!doctype html><meta charset=utf-8>
<title>VisionFactory · Escáner 3D</title>
<body style="font-family:sans-serif;max-width:560px;margin:40px auto">
<h2>Escanear cara → cabeza 3D (MICA)</h2>
<form method=post action=/reconstruct enctype=multipart/form-data>
  <input type=file name=file accept="image/*" required>
  <button>Generar mesh.ply</button>
</form>
<p style="color:#666">Foto frontal, buena luz, una sola cara. En CPU tarda ~1 min.</p>
</body>"""


@app.post("/reconstruct")
async def reconstruct(file: UploadFile = File(...)):
    """Sube una foto -> corre MICA -> devuelve mesh.ply (FLAME). Requiere ejecutar
    el servicio en el entorno MICA y MICA_DIR apuntando a la carpeta de MICA."""
    mica = pathlib.Path(MICA_DIR)
    if not (mica / "demo.py").exists():
        raise HTTPException(500, f"No encuentro MICA en {MICA_DIR}. Define la variable MICA_DIR.")
    indir = mica / "demo" / "input"
    outdir = mica / "demo" / "output"
    indir.mkdir(parents=True, exist_ok=True)
    for p in indir.glob("*"):
        if p.is_file():
            p.unlink()
    suffix = pathlib.Path(file.filename or "face.jpg").suffix or ".jpg"
    (indir / f"webface{suffix}").write_bytes(await file.read())

    r = subprocess.run([sys.executable, "demo.py"], cwd=str(mica),
                       capture_output=True, text=True)
    meshes = sorted(glob.glob(str(outdir / "webface" / "*.ply")))
    if not meshes:
        log = (r.stderr or r.stdout or "")[-1500:]
        raise HTTPException(500, f"MICA no generó malla.\n{log}")
    return FileResponse(meshes[0], media_type="application/octet-stream", filename="mesh.ply")


@app.post("/fit")
def fit():
    """Foto -> FLAME. Recomendado: correr MICA offline (ver README) y luego usar
    /measure-mesh con la malla resultante.

    Bloqueado aquí: MICA/FLAME requieren pesos con licencia NO comercial que se
    descargan tras registro en https://flame.is.tue.mpg.de.
    """
    raise HTTPException(
        501,
        "Usa MICA offline para foto->FLAME (ver README) y luego /measure-mesh.",
    )
