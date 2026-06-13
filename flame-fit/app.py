"""
VisionFactory — servicio de medición / ajuste a medida (POC, I+D).

Dos niveles:
  /measure  -> medidas faciales en mm desde landmarks (iris como escala). FUNCIONA YA.
  /fit      -> ajuste FLAME (malla de cabeza completa + forma) desde foto. Requiere
               pesos con licencia NO comercial (ver README). Stub por ahora.

Ejecutar:  uvicorn app:app --reload
"""
from __future__ import annotations

import math

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="VisionFactory Fit", version="0.1.0")

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


@app.post("/fit")
def fit():
    """Ajuste FLAME desde imagen -> malla de cabeza + forma + medidas precisas.

    Pipeline previsto:
      1. Detección/recorte de cara.
      2. Regresor (MICA para identidad/forma, DECA/EMOCA para expresión/detalle)
         -> parámetros FLAME.
      3. FLAME -> malla 5023 vértices (cabeza completa, con orejas).
      4. Derivar medidas (DP, sien-a-sien, posición de oreja, puente) + exportar
         malla como oclusor por persona.

    Bloqueado: los pesos de FLAME/MICA/DECA son de licencia NO comercial y deben
    descargarse tras registro en https://flame.is.tue.mpg.de (ver README).
    """
    raise HTTPException(
        501,
        "Ajuste FLAME no implementado: faltan pesos con licencia (ver README).",
    )
