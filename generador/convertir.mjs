// Convierte un STEP (B-rep) a STL (malla) usando el kernel OpenCASCADE de replicad,
// para poder cargar modelos CAD reales en el probador web (Three.js).
//
// Uso:  node convertir.mjs <entrada.step> <salida.stl> [tolerancia]

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { setOC, importSTEP } from "replicad";

const require = createRequire(import.meta.url);
const ocWasm = require.resolve("replicad-opencascadejs/src/replicad_single.wasm");
globalThis.__dirname = dirname(ocWasm);
globalThis.require = require;
const ocModule = require("replicad-opencascadejs/src/replicad_single.js");
const opencascade = ocModule.default ?? ocModule;

const [, , inPath, outPath, tolArg, angArg] = process.argv;
const tolerance = tolArg ? parseFloat(tolArg) : 0.1;
const angularTolerance = angArg ? parseFloat(angArg) : 0.3;

async function main() {
  const OC = await opencascade({ locateFile: () => ocWasm });
  setOC(OC);

  const buf = readFileSync(inPath);
  const result = await importSTEP(new Blob([buf]));
  const shapes = Array.isArray(result) ? result : [result];
  console.log("Sólidos importados:", shapes.length);

  // Fusiona todos los sólidos en una sola malla.
  let shape = shapes[0];
  for (let i = 1; i < shapes.length; i++) {
    try { shape = shape.fuse(shapes[i]); } catch { /* deja el principal si falla */ }
  }

  const bbox = shape.boundingBox;
  console.log("BBox (mm aprox):",
    bbox.bounds.map((p) => p.map((n) => +n.toFixed(1))));

  const stl = await shape.blobSTL({ tolerance, angularTolerance });
  writeFileSync(outPath, Buffer.from(await stl.arrayBuffer()));
  console.log("OK ->", outPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
