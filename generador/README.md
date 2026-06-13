# generador — POC de monturas paramétricas (Replicad → STEP/STL)

Demuestra el camino completo **JavaScript → STEP + STL** usando [Replicad](https://replicad.xyz),
que corre el kernel B-rep de OpenCASCADE (el mismo de CadQuery) en JS. Así el STEP
es **exacto**, no una conversión de malla con pérdida.

## Por qué Replicad y no Three.js "crudo"

- Three.js modela **mallas** (triángulos) → ideal para el probador y la
  previsualización, malo como fuente de geometría para fabricar.
- Pasar una malla a STEP da un archivo facetado (enorme, malo para CNC) o requiere
  re-ajuste de superficies (con pérdida, software caro).
- Replicad modela en **B-rep** y *además* tesela a malla para mostrar con Three.js.
  Una sola fuente paramétrica → preview Three.js + STEP + STL.

## Archivos

- `frame.mjs` — montura paramétrica → `frame.step` + `frame.stl` (parámetros fijos).
- `medidas.mjs` — landmarks de FaceMesh → medidas en mm (DP, anchos) usando el iris
  como escala; `paramsFromMeasurements()` las mapea a parámetros de montura.
- `frame-desde-rostro.mjs` — cadena completa: landmarks → medidas → STEP/STL ajustado.

## Correr

```bash
cd generador
npm install replicad replicad-opencascadejs
node frame.mjs               # demo con parámetros fijos
node medidas.mjs             # medidas desde landmarks (datos sintéticos)
node frame-desde-rostro.mjs  # cadena completa: rostro → STEP ajustado al rostro
```

Los `*.step` (fabricación/CNC) y `*.stl` (impresión 3D) quedan en esta carpeta (no
se versionan). En producción los landmarks vienen del probador y el tamaño del
frame, de la cámara.

> Base del motor. Falta: familias de estilo, varillas (temples) con bisagra, ranura
> del lente, export del contorno 2D del lente en formato OMA/VCA para la viseladora,
> y validar las medidas contra fittings reales (la DP por cámara 2D es estimación).
