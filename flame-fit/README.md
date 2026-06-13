# flame-fit — medición y ajuste a medida (I+D)

Extraer datos del rostro del cliente (con su consentimiento) → medidas para
fabricar monturas a medida y un **oclusor de cabeza por persona** (arregla las
orejas/varillas en el probador).

| Endpoint | Qué hace | Estado |
|---|---|---|
| `GET /` + `POST /reconstruct` | Sube una **foto** → corre MICA → devuelve `mesh.ply` | ✅ Correr en el env MICA |
| `POST /measure` | Landmarks (478) → medidas en mm (DP, ancho facial, puente, alto) | ✅ Sin licencia |
| `POST /measure-mesh` | Sube malla FLAME (`.obj`/`.ply`) → medidas mm + dims de cabeza | ✅ Sin licencia |
| `POST /fit` | (alias) usar `/reconstruct` | ⛔ |

## Correr el servicio

```bash
cd flame-fit
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
python adapter.py        # demo: corre el adapter con una malla sintética
```

## Escáner web (foto → mesh.ply) ← lo pedido

`/reconstruct` envuelve tu MICA. **Corre el servicio DENTRO del entorno MICA**
(para que use su Python y dependencias):

```bash
conda activate MICA
pip install fastapi uvicorn python-multipart     # una vez, en el env MICA
export MICA_DIR=~/MICA
cd ~/visionfactory/flame-fit                     # clona el repo si no lo tienes
uvicorn app:app --host 0.0.0.0 --port 8000
```
Abre **http://localhost:8000/** → sube tu foto → descarga `mesh.ply`.

- Personal/pruebas: así, en tu WSL (CPU, ~1 min/foto).
- Producción/clientes: hospédalo en un **servidor con GPU** (Replicate, Modal,
  RunPod, HuggingFace GPU Spaces, o una VM g4/g5) → rápido y escalable.

⚠️ Un servicio público que procesa caras de clientes = uso **comercial** de
FLAME/MICA (licencia) **y** datos biométricos (consentimiento, borrado, Ley 21.719).

## Pipeline FLAME recomendado (foto → cabeza 3D métrica)

El camino que **sí funciona** es usar **MICA** (reconstrucción FLAME métrica, en mm
reales — ideal para medir), offline, y luego pasar su malla por nuestro adapter:

1. Clonar MICA: <https://github.com/Zielon/MICA> (código abierto).
2. **Descargar los pesos** (FLAME `generic_model.pkl` + pesos MICA) tras registrarte
   y **aceptar la licencia** en <https://flame.is.tue.mpg.de>.
   > ⚠️ Licencia **NO comercial**. La gestión/licencia comercial es responsabilidad
   > del usuario (así acordado). Yo no descargo ni incluyo esos pesos aquí.
3. Correr MICA sobre una foto → te da una **malla FLAME** (`.obj`/`.ply`, 5023
   vértices, escala métrica).
4. Pasar esa malla por `adapter.py` o `POST /measure-mesh` → **medidas en mm** +
   exportar **oclusor** (`export_occluder`) para usar en el probador.

Alternativa: **DECA/EMOCA** (similar; DECA no es métrico, hay que escalar con la DP).

## Conectar con el probador
- Las **medidas** alimentan el generador paramétrico (curvas/ángulos a medida).
- El **oclusor** (malla de cabeza simplificada) reemplaza el elipsoide actual →
  las varillas se ocultan exactamente tras *esa* oreja.

## Pendiente al integrar
- Fijar en `adapter.FLAME_IDX` los índices de vértices FLAME (pupilas, sienes,
  orejas) desde el landmark embedding de FLAME para las medidas por-punto.
- (Opcional) ajuste FLAME desde landmarks sin redes, usando solo `generic_model.pkl`.

## Privacidad
Cara/medidas = **datos personales sensibles**. Recolectar solo con consentimiento
explícito; minimizar almacenamiento. Ver `../docs/roadmap.md` (Ley 19.628 / 21.719).
