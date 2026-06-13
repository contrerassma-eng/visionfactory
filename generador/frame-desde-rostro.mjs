// Cadena completa: landmarks faciales -> medidas en mm -> parámetros -> STEP/STL.
// Demuestra el "ajuste al rostro": la montura sale dimensionada con la DP y los
// anchos medidos, no con valores fijos.
//
// Uso:  node frame-desde-rostro.mjs

import { writeFileSync } from "node:fs";
import { initOpenCascade, buildFrame } from "./frame.mjs";
import {
  computeMeasurements,
  paramsFromMeasurements,
  sampleLandmarks,
} from "./medidas.mjs";

async function main() {
  await initOpenCascade();

  // En producción: landmarks reales del probador + tamaño del frame de la cámara.
  const measurements = computeMeasurements(sampleLandmarks(), 640, 480);
  const params = paramsFromMeasurements(measurements);
  console.log("Medidas faciales:", measurements);
  console.log("Parámetros de montura:", params);

  const frame = buildFrame(params);
  writeFileSync(
    "frame-rostro.step",
    Buffer.from(await frame.blobSTEP().arrayBuffer())
  );
  writeFileSync(
    "frame-rostro.stl",
    Buffer.from(await frame.blobSTL().arrayBuffer())
  );
  console.log("OK -> frame-rostro.step y frame-rostro.stl (ajustado al rostro)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
