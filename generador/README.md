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

## Correr

```bash
cd generador
npm install replicad replicad-opencascadejs
node frame.mjs
```

Genera `frame.step` (fabricación/CNC) y `frame.stl` (impresión 3D). Los parámetros
(DP, ancho/alto de lente, puente…) están al inicio de `frame.mjs`; en producción
vienen de la medición facial del probador.

> Esta es la base del motor de generación. Falta: familias de estilo, varillas
> (temples) con bisagra, ranura del lente y export del contorno 2D del lente en
> formato OMA/VCA para la viseladora.
