// POC: genera una montura paramétrica y la exporta a STEP + STL desde JavaScript.
// Demuestra que el camino web/Three.js -> fabricación NO requiere convertir mallas:
// Replicad usa el kernel B-rep de OpenCASCADE, así que el STEP es exacto.
//
// En producción los parámetros (DP, anchos, alturas) vienen de la medición facial
// del probador. Aquí van fijos para la demostración.
//
// Uso:  npm install replicad replicad-opencascadejs && node frame.mjs

import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { setOC, drawRoundedRectangle } from "replicad";

// El loader de OpenCASCADE es un módulo Emscripten estilo CommonJS: referencia
// __dirname y require como globales al instanciarse. Corriendo desde ESM hay que
// exponerlos en globalThis antes de invocarlo.
const require = createRequire(import.meta.url);
const ocWasm = require.resolve("replicad-opencascadejs/src/replicad_single.wasm");
globalThis.__dirname = dirname(ocWasm);
globalThis.require = require;

const ocModule = require("replicad-opencascadejs/src/replicad_single.js");
const opencascade = ocModule.default ?? ocModule;

async function initOpenCascade() {
  const wasmPath = require.resolve(
    "replicad-opencascadejs/src/replicad_single.wasm"
  );
  const OC = await opencascade({ locateFile: () => wasmPath });
  setOC(OC);
}

// --- Parámetros en mm (vendrán de la medición facial) ---
const params = {
  pd: 62, // distancia pupilar -> separación entre centros de aro
  lensWidth: 50,
  lensHeight: 38,
  bridgeWidth: 18,
  rimThickness: 4,
  frontDepth: 6, // grosor frente-atrás del frente
  cornerRadius: 10,
};

function rim(p) {
  const innerR = Math.min(p.cornerRadius, p.lensHeight / 2 - 0.01);
  const outer = drawRoundedRectangle(
    p.lensWidth + 2 * p.rimThickness,
    p.lensHeight + 2 * p.rimThickness,
    innerR + p.rimThickness
  );
  const inner = drawRoundedRectangle(p.lensWidth, p.lensHeight, innerR);
  return outer.cut(inner).sketchOnPlane().extrude(p.frontDepth);
}

function buildFrame(p) {
  const dx = p.pd / 2; // centro de cada aro a media DP del eje
  const rimR = rim(p).translate([dx, 0, 0]);
  const rimL = rim(p).translate([-dx, 0, 0]);

  // Puente: barra superior que solapa ambos aros (el solape garantiza un sólido
  // único y bien conectado al fusionar).
  const bridge = drawRoundedRectangle(p.bridgeWidth, 6, 3)
    .sketchOnPlane()
    .extrude(p.frontDepth)
    .translate([0, p.lensHeight / 2 - 4, 0]);

  return rimR.fuse(rimL).fuse(bridge);
}

async function main() {
  await initOpenCascade();
  const frame = buildFrame(params);

  const step = await frame.blobSTEP().arrayBuffer();
  writeFileSync("frame.step", Buffer.from(step));

  const stl = await frame.blobSTL().arrayBuffer();
  writeFileSync("frame.stl", Buffer.from(stl));

  console.log("OK -> frame.step y frame.stl generados");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
