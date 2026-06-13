// Familias de estilo de montura. Cada estilo define la APERTURA del lente (2D)
// centrada en el origen; los asimétricos reciben el lado (+1 derecha, -1 izquierda).
// El aro se obtiene engrosando la apertura (offset) y restando la apertura.
//
// Diseños propios en categorías de estilo genéricas (no protegibles). El ajuste a
// medida lo da paramsFromMeasurements (medidas.mjs).

import { drawRoundedRectangle, drawCircle, draw } from "replicad";

export const STYLES = {
  rectangular: (p) =>
    drawRoundedRectangle(
      p.lensWidth,
      p.lensHeight,
      Math.min(8, p.lensHeight / 2 - 0.5)
    ),

  redonda: (p) => drawCircle(Math.min(p.lensWidth, p.lensHeight) / 2),

  ovalada: (p) =>
    drawRoundedRectangle(p.lensWidth, p.lensHeight, p.lensHeight / 2 - 0.01),

  "cat-eye": (p, side = 1) => {
    const w = p.lensWidth / 2;
    const h = p.lensHeight / 2;
    const s = side;
    const base = drawRoundedRectangle(
      p.lensWidth,
      p.lensHeight,
      Math.min(7, h - 0.5)
    );
    // Ala superior en el lado externo (efecto cat-eye).
    const wing = draw([s * w * 0.2, h * 0.45])
      .lineTo([s * w * 1.25, h * 1.3])
      .lineTo([s * w * 0.95, h * 0.15])
      .close();
    return base.fuse(wing);
  },

  aviador: (p, side = 1) => {
    const w = p.lensWidth / 2;
    const h = p.lensHeight / 2;
    const s = side;
    // Lágrima como polígono (offset robusto): ancho arriba, punta suave hacia la
    // nariz abajo.
    return draw([-s * w * 0.85, h])
      .lineTo([s * w, h * 0.8])
      .lineTo([s * w, -h * 0.1])
      .lineTo([s * w * 0.5, -h * 0.85])
      .lineTo([-s * w * 0.05, -h])
      .lineTo([-s * w * 0.7, -h * 0.65])
      .lineTo([-s * w, h * 0.1])
      .close();
  },
};

export function buildFrameWithStyle(styleName, p) {
  const styleFn = STYLES[styleName];
  if (!styleFn) throw new Error(`Estilo desconocido: ${styleName}`);

  const dx = p.pd / 2;
  const rim = (side) => {
    const aperture = styleFn(p, side);
    return aperture
      .offset(p.rimThickness)
      .cut(aperture)
      .sketchOnPlane()
      .extrude(p.frontDepth);
  };

  const rimR = rim(1).translate([dx, 0, 0]);
  const rimL = rim(-1).translate([-dx, 0, 0]);
  const bridge = drawRoundedRectangle(p.bridgeWidth, 6, 3)
    .sketchOnPlane()
    .extrude(p.frontDepth)
    .translate([0, p.lensHeight / 2 - 4, 0]);

  return rimR.fuse(rimL).fuse(bridge);
}
