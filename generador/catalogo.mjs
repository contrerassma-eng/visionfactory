// Genera el catálogo completo de estilos, todos ajustados a las mismas medidas
// faciales, y exporta STEP + STL por estilo.
//
// Uso:  node catalogo.mjs

import { writeFileSync } from "node:fs";
import { initOpenCascade } from "./frame.mjs";
import {
  computeMeasurements,
  paramsFromMeasurements,
  sampleLandmarks,
} from "./medidas.mjs";
import { STYLES, buildFrameWithStyle } from "./estilos.mjs";

async function main() {
  await initOpenCascade();

  const p = paramsFromMeasurements(
    computeMeasurements(sampleLandmarks(), 640, 480)
  );
  console.log("Parámetros (ajustados al rostro):", p);

  for (const name of Object.keys(STYLES)) {
    try {
      const shape = buildFrameWithStyle(name, p);
      const file = `montura-${name}`;
      writeFileSync(
        `${file}.step`,
        Buffer.from(await shape.blobSTEP().arrayBuffer())
      );
      writeFileSync(
        `${file}.stl`,
        Buffer.from(await shape.blobSTL().arrayBuffer())
      );
      console.log(`OK   ${name}  ->  ${file}.step / .stl`);
    } catch (e) {
      console.error(`FAIL ${name}: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
