// Convierte landmarks de MediaPipe FaceMesh (refine_landmarks) en medidas reales
// en milímetros, usando el iris como patrón de escala.
//
// Truco clave: el diámetro horizontal visible del iris (HVID) es ~11.7 mm en
// adultos con muy poca variación. Midiéndolo en píxeles obtenemos mm/px y de ahí
// todas las demás medidas en mm desde una sola cámara 2D.
//
// Estas medidas alimentan al generador (paramsFromMeasurements -> frame.mjs) para
// que cada montura salga ajustada al rostro.
//
// Índices según MediaPipe FaceMesh con refine_landmarks=true (478 puntos).

export const HVID_MM = 11.7;

export const LM = {
  irisRight: { center: 468, ring: [469, 470, 471, 472] },
  irisLeft: { center: 473, ring: [474, 475, 476, 477] },
  eyeRightOuter: 33,
  eyeRightInner: 133,
  eyeLeftOuter: 263,
  eyeLeftInner: 362,
  faceRight: 234, // óvalo facial cerca de la sien derecha
  faceLeft: 454, // óvalo facial cerca de la sien izquierda
};

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const r1 = (x) => Math.round(x * 10) / 10;

/**
 * @param {{x:number,y:number}[]} landmarks  Landmarks normalizados [0..1].
 * @param {number} imageWidth   Ancho del frame en px.
 * @param {number} imageHeight  Alto del frame en px.
 */
export function computeMeasurements(landmarks, imageWidth, imageHeight) {
  const px = (i) => {
    const p = landmarks[i];
    if (!p) throw new Error(`Falta el landmark ${i}`);
    return [p.x * imageWidth, p.y * imageHeight];
  };

  // Diámetro del iris = 2 x distancia media del centro a los 4 puntos del anillo
  // (robusto sin asumir el orden N/E/S/O de los puntos).
  const irisDiameterPx = (iris) => {
    const c = px(iris.center);
    const mean =
      iris.ring.reduce((s, i) => s + dist(c, px(i)), 0) / iris.ring.length;
    return mean * 2;
  };

  const irisPx =
    (irisDiameterPx(LM.irisRight) + irisDiameterPx(LM.irisLeft)) / 2;
  const mmPerPx = HVID_MM / irisPx;

  const pdMm = dist(px(LM.irisRight.center), px(LM.irisLeft.center)) * mmPerPx;
  const faceWidthMm = dist(px(LM.faceRight), px(LM.faceLeft)) * mmPerPx;
  // Distancia inter-cantal interna: proxy del puente nasal (el DBL real de la
  // montura suele ser algo menor; calibrar con pruebas reales).
  const bridgeMm = dist(px(LM.eyeRightInner), px(LM.eyeLeftInner)) * mmPerPx;
  const eyeR = dist(px(LM.eyeRightOuter), px(LM.eyeRightInner));
  const eyeL = dist(px(LM.eyeLeftOuter), px(LM.eyeLeftInner));
  const eyeWidthMm = ((eyeR + eyeL) / 2) * mmPerPx;

  return {
    mmPerPx: Math.round(mmPerPx * 10000) / 10000,
    pdMm: r1(pdMm),
    faceWidthMm: r1(faceWidthMm),
    bridgeMm: r1(bridgeMm),
    eyeWidthMm: r1(eyeWidthMm),
  };
}

/**
 * Mapea medidas faciales a parámetros de montura.
 * Modelo: faceWidth ≈ 2 x (lensWidth + rimThickness) + bridgeWidth.
 */
export function paramsFromMeasurements(
  m,
  { rimThickness = 4, frontDepth = 6, cornerRadius = 10, lensHeightRatio = 0.78 } = {}
) {
  const lensWidth = Math.max(
    40,
    (m.faceWidthMm - m.bridgeMm) / 2 - 2 * rimThickness
  );
  return {
    pd: m.pdMm,
    lensWidth: Math.round(lensWidth),
    lensHeight: Math.round(lensWidth * lensHeightRatio),
    bridgeWidth: Math.round(m.bridgeMm),
    rimThickness,
    frontDepth,
    cornerRadius,
  };
}

// --- Smoke test (datos SINTÉTICOS, no es un rostro real) -------------------
export function sampleLandmarks() {
  const L = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const set = (i, x, y) => (L[i] = { x, y, z: 0 });
  const eyeY = 0.45;
  const ir = 0.0094; // radio del iris (px) en coords normalizadas de X
  // Iris circular en PÍXELES: el offset vertical se corrige por el aspecto del
  // frame (640x480), si no la elipse normalizada falsea la escala.
  const irY = ir * (640 / 480);
  // iris derecho (centro 468) e izquierdo (centro 473)
  for (const [c, cx] of [[468, 0.45], [473, 0.55]]) {
    set(c, cx, eyeY);
    set(c + 1, cx + ir, eyeY);
    set(c + 2, cx, eyeY - irY);
    set(c + 3, cx - ir, eyeY);
    set(c + 4, cx, eyeY + irY);
  }
  set(LM.faceRight, 0.39, eyeY);
  set(LM.faceLeft, 0.61, eyeY);
  set(LM.eyeRightInner, 0.47, eyeY);
  set(LM.eyeLeftInner, 0.53, eyeY);
  set(LM.eyeRightOuter, 0.41, eyeY);
  set(LM.eyeLeftOuter, 0.59, eyeY);
  return L;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const m = computeMeasurements(sampleLandmarks(), 640, 480);
  console.log("Medidas (datos sintéticos):", m);
  console.log("Parámetros de montura:", paramsFromMeasurements(m));
}
