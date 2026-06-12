# VisionFactory — Roadmap técnico y de negocio

> Documento de trabajo. Las secciones legales son orientación general, **no
> asesoría legal**: confirma con un abogado chileno de propiedad intelectual y
> protección de datos antes de operar.

## 1. La propuesta de valor (y dónde está el foso defensivo)

El negocio fuerte no es "tener un catálogo parecido al de la competencia". Eso es
fácil de copiar y te mete en problemas de propiedad intelectual. El foso real es:

**Monturas generadas a medida del rostro de cada cliente, fabricadas bajo demanda
y a costo agresivo.** El probador no es solo un espejo: es el instrumento de
medición que alimenta la fabricación. Eso nadie te lo puede copiar fácil y además
justifica precio.

Por eso el plan reorienta tres ideas del brief hacia versiones legales y, casi
siempre, *mejores* de negocio (ver §4 y §5).

## 2. Arquitectura del pipeline

```
[Probador web]            [Medición]                 [Generación]            [Fabricación]
cámara + FaceMesh   →   DP, anchos, alturas   →   montura paramétrica   →   impresión 3D
landmarks 468/473       calibradas en mm          STEP (CAD/CNC)            + biselado de
(iris)                  (iris como regla)         STL (impresión)           cristales (OMA)
```

### 2.1 Medición antropométrica (el truco clave)

El probador ya corre MediaPipe FaceMesh con `refine_landmarks` (iris 468 izq /
473 der). Con eso se obtienen medidas reales, no solo overlay visual:

- **Calibración px→mm con el iris**: el diámetro horizontal visible del iris
  (HVID) es una constante poblacional ≈ **11.7 mm** con muy poca variación entre
  adultos. Midiendo el iris en píxeles obtienes el factor de escala de la imagen.
  Es el "patrón de regla" que llevas pegado a la cara.
- **Distancia pupilar (DP)**: distancia entre centros de iris (landmarks 468 y
  473) × factor. Sirve mono y binocular respecto a la línea media nasal.
- **Otras medidas**: ancho facial (sien a sien), ancho de puente nasal, altura del
  centro óptico, posición de orejas para el largo de varilla.
- **Limitación honesta**: una sola cámara 2D da una *estimación*. Para dispensación
  clínica hay que validar; para *ajustar una montura* es un excelente primer corte.
  Mejoras: pedir calibrar con un objeto de tamaño conocido (tarjeta ISO/7810,
  85.6 mm) o usar la cámara TrueDepth/ARKit en iPhone para profundidad real.

### 2.2 Generación paramétrica de monturas

- **Stack recomendado: CadQuery** (Python, sobre OpenCASCADE). Genera geometría
  paramétrica desde las medidas y exporta **STEP** (B-rep, ideal para CAD/CNC y
  para "entregarte a ti mismo el archivo de fabricación") y **STL** (impresión).
- Alternativa moderna: `build123d` (también OpenCASCADE, exporta STEP). OpenSCAD
  queda fuera porque solo exporta STL (sin STEP).
- **Biblioteca de estilos propios**: 3–5 familias parametrizadas (redonda,
  rectangular, cat-eye, browline, aviador). Son *categorías de estilo* (no
  protegibles) con diseño propio, ajustadas por las medidas del cliente.

### 2.3 Fabricación

- **Impresión 3D de monturas**:
  - *Estándar de la industria*: nylon **PA12 por SLS** (resistencia, flexibilidad,
    apto contacto con piel). Es lo que usan las gafas impresas serias.
  - *Gama económica / prototipos*: FDM en **PETG o nylon**. Viable para muestras.
  - *Fibra de madera (wood-fill PLA)*: bonito para muestras y exhibición, pero el
    PLA es frágil y sensible a calor/UV/sudor → **no recomendado para uso diario**.
    Si quieres estética de madera durable, evalúa nylon teñido o acetato fresado.
  - El **acetato** sigue siendo el material premium real; se fresa, no se imprime.
- **Cristales (viseladora automática)**: la viseladora necesita la *forma del
  lente*, no el STEP de la montura. El estándar de intercambio es el formato
  **OMA/VCA (Vision Council DCS)**. Como generas la montura digitalmente, puedes
  exportar la curva de la apertura del lente directamente a ese formato (confirmar
  con el modelo de viseladora que compres; muchos también leen desde un trazador).
  - **Recetas típicas en stock**: mantener *blanks* semiterminados por los rangos
    de esfera/cilindro más vendidos reduce tiempo de entrega. Eso es legal y
    sensato (es inventario propio, no datos de pacientes).

## 3. Materiales / filamentos

| Material | Uso | Nota |
|---|---|---|
| Nylon PA12 (SLS) | Producción | Estándar de gafas impresas |
| PETG / Nylon (FDM) | Prototipos, gama baja | Económico, calidad media |
| Wood-fill PLA | Muestras/exhibición | Frágil; no para uso diario |
| Acetato (fresado) | Premium | No es impresión 3D |

Diseñar filamentos propios es un proyecto en sí (formulación + extrusión). Tiene
sentido más adelante; al inicio conviene comprar filamento técnico probado.

## 4. Datos y cumplimiento — qué NO hacer y qué hacer en su lugar

> **"Comprar datos de oftalmólogos" → no.** Las recetas/datos de salud son **datos
> sensibles** bajo la Ley 19.628 y la nueva **Ley 21.719** (crea la Agencia de
> Protección de Datos Personales; vigencia plena hacia fines de 2026, con multas
> serias). Comprar o usar datos de pacientes **sin su consentimiento informado** es
> ilegal y de altísimo riesgo reputacional y económico.

**Alternativa legal y mejor activo**: recolección propia *con consentimiento*.

- Alianzas con oftalmólogos/ópticas donde **el paciente** consiente compartir su
  receta contigo, con contrato de tratamiento de datos (encargado/responsable).
- Consentimiento explícito en el flujo del probador para guardar medidas.
- Resultado: un dataset propio, limpio, trazable y defendible — vale más que una
  lista comprada que te expone a sanción.

## 5. Propiedad intelectual — los límites

> **"Modelos inspirados en los más vendidos de Luxottica" → con cuidado.**
> EssilorLuxottica (Ray-Ban, Oakley, Persol, Oliver Peoples, etc.) protege marcas,
> **diseños registrados** y *trade dress*, y litiga agresivamente.

- ❌ No usar nombres/logos de marca ni clonar un modelo específico protegido.
- ✅ Sí diseñar dentro de **categorías de estilo** genéricas (aviador, wayfarer-ish,
  redondo, cat-eye): las siluetas comunes no son protegibles por sí solas.
- Tu diferenciador es el **ajuste a medida**, no la copia. Es mejor negocio y te
  saca del radar legal.

> **"Extraer modelos de visiondirecta.cl" → no construyo el scraper.** Sus
> imágenes y modelos 3D son obra protegida (Ley 17.336), su scraping suele violar
> sus términos, y reproducir sus activos puede ser competencia desleal (Ley 20.169).

**Alternativa legal**: investigación de mercado sobre información *pública* (qué
estilos y rangos de precio funcionan) hecha manualmente, para informar **tus
propios diseños**. No lifteamos sus assets.

## 6. Canales y regulación

- **Mercado Libre Fulfillment ("Mercado Envíos Full")**: ellos almacenan y
  despachan **stock**. Encaja con productos en stock (gafas de sol, filtro azul
  *sin* receta). Para lentes **con receta** (made-to-order) usar Flex/colecta, no
  Full. Servicios a medida → venta directa con agenda.
- **Regulación sanitaria**: los productos ópticos con receta son producto
  sanitario; en Chile la dispensación óptica está regulada (normativa ISP / salud;
  ciertos actos requieren personal calificado). **Partir por gafas sin receta**
  (sol, filtro azul cosmético) tiene mucha menos fricción para validar el negocio.

## 7. Plan por fases

- **Fase 0 — Deploy del probador** *(bloqueada: falta `index.html`)*. Publicar en
  Vercel con cámara funcionando en desktop y móvil.
- **Fase 1 — Medición**: extraer DP/anchos/alturas desde los landmarks, calibrar
  con iris, mostrar medidas en pantalla y permitir guardarlas (con consentimiento).
- **Fase 2 — Generación**: biblioteca de 3–5 estilos propios en CadQuery; export
  STEP/STL ajustado a las medidas; botón "descargar STEP" (entrega para fabricar).
- **Fase 3 — Fabricación**: validar material e impresión; integrar forma de lente
  con la viseladora (OMA/VCA); stock de blanks por recetas típicas.
- **Fase 4 — Datos y cumplimiento**: consentimiento, alianzas con profesionales,
  base de datos propia conforme a ley.
- **Fase 5 — Canales**: tienda directa + Mercado Libre (sol/sin Rx primero).

## 8. Decisiones que necesito de ti

1. **El `probador-lentes.html`**: súbelo/pégalo para desbloquear el deploy.
2. **Generación**: ¿confirmamos CadQuery (Python) como motor de STEP?
3. **Viseladora**: ¿qué modelo evalúas comprar? (define el formato de datos real).
4. **Material objetivo** de las monturas (define costo y proceso).
5. **¿Partimos por gafas sin receta** (menos regulación) o vas directo a Rx?
