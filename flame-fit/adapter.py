"""
Adapter: malla FLAME (5023 vértices, escala métrica) -> medidas en mm + oclusor
para el probador. La reconstrucción foto->FLAME se hace con MICA o DECA (ver
README); este módulo toma la malla resultante y deriva datos para hacer a medida.

Demo (sin pesos, solo verifica que corre):  python adapter.py
"""
from __future__ import annotations

import numpy as np
import trimesh

MM = 1.0  # MICA exporta la malla en mm (verificado con malla real)

# Índices de vértices FLAME (topología fija de 5023). Deben fijarse desde el
# landmark embedding de FLAME que descargues bajo licencia. Mientras estén vacíos,
# se usan solo las medidas por bounding box (que ya son útiles y métricas).
FLAME_IDX: dict[str, int] = {
    # "pupila_der": ..., "pupila_izq": ...,
    # "sien_der": ..., "sien_izq": ...,
    # "oreja_der": ..., "oreja_izq": ...,
}


def load_mesh(path: str) -> trimesh.Trimesh:
    m = trimesh.load(path, process=False)
    if isinstance(m, trimesh.Scene):
        m = trimesh.util.concatenate(tuple(m.geometry.values()))
    return m


def measurements_mm(verts: np.ndarray, idx: dict | None = None) -> dict:
    """Medidas en mm desde la malla FLAME (asume metros)."""
    idx = idx if idx is not None else FLAME_IDX
    v = np.asarray(verts, dtype=float)
    lo, hi = v.min(axis=0), v.max(axis=0)
    out = {
        "cabeza_ancho_mm": round(float(hi[0] - lo[0]) * MM, 1),
        "cabeza_alto_mm": round(float(hi[1] - lo[1]) * MM, 1),
        "cabeza_prof_mm": round(float(hi[2] - lo[2]) * MM, 1),
    }

    def d(a, b):
        return round(float(np.linalg.norm(v[idx[a]] - v[idx[b]])) * MM, 1)

    if {"pupila_der", "pupila_izq"} <= idx.keys():
        out["dp_mm"] = d("pupila_der", "pupila_izq")
    if {"sien_der", "sien_izq"} <= idx.keys():
        out["sien_a_sien_mm"] = d("sien_der", "sien_izq")
    if {"oreja_der", "oreja_izq"} <= idx.keys():
        out["oreja_a_oreja_mm"] = d("oreja_der", "oreja_izq")
    return out


def export_occluder(mesh: trimesh.Trimesh, out_path: str, target_faces: int = 1500) -> str:
    """Exporta una cabeza simplificada como oclusor (OBJ) para el probador."""
    m = mesh
    if len(m.faces) > target_faces:
        try:
            m = m.simplify_quadric_decimation(target_faces)
        except Exception:
            pass  # si no hay backend de decimación, exporta completa
    m.export(out_path)
    return out_path


def _demo() -> None:
    # Esfera ~ tamaño cabeza (180 mm) solo para verificar el pipeline.
    s = trimesh.creation.icosphere(subdivisions=3, radius=0.09)
    print("vértices:", len(s.vertices))
    print("medidas:", measurements_mm(s.vertices))
    print("oclusor:", export_occluder(s, "/tmp/occluder_demo.obj"))


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        mesh = load_mesh(sys.argv[1])          # p.ej. salida de MICA: mesh.ply
        print("vértices:", len(mesh.vertices))
        print("medidas:", measurements_mm(mesh.vertices))
        print("oclusor:", export_occluder(mesh, "occluder.obj"))
    else:
        _demo()
