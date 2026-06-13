# flame-fit — medición y ajuste a medida (I+D)

Servicio para **extraer datos visuales del rostro del cliente** (con su
consentimiento) y derivar medidas para fabricar monturas a medida. Dos niveles:

| Endpoint | Qué hace | Estado |
|---|---|---|
| `POST /measure` | Landmarks (478, MediaPipe) → medidas en mm (DP, ancho facial, puente, alto) usando el iris como escala | ✅ Funciona, sin licencia |
| `POST /fit` | Foto → ajuste **FLAME** → malla de cabeza completa (orejas) + forma + medidas + oclusor por persona | ⛔ Stub (pesos con licencia) |

> El probador web ya hace la medición `/measure` en el navegador y exporta JSON
> ("Medir → JSON"). Este servicio replica ese cálculo del lado servidor y deja
> preparado el camino FLAME para el modelo de cabeza completo.

## Correr

```bash
cd flame-fit
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
# POST /measure con { image_width, image_height, landmarks:[{x,y,z}...] }
```

## Camino FLAME (`/fit`) — pendiente y OJO con la licencia

Pipeline previsto: detección de cara → regresor (**MICA** identidad/forma +
**DECA/EMOCA** expresión/detalle) → parámetros **FLAME** → malla de 5023 vértices
(cabeza completa, con orejas) → medidas precisas + oclusor por persona.

⚠️ **Licencia:** FLAME y sus regresores (MICA, DECA, EMOCA) se distribuyen bajo
**licencia de investigación NO comercial**. Para un producto comercial hay que:
- registrarse y aceptar la licencia en <https://flame.is.tue.mpg.de> para evaluar, y
- **gestionar una licencia comercial** con Max Planck (MPI-IS), **o** usar una
  alternativa con licencia comercial / construir un modelo propio.

Por eso este repo deja el endpoint como stub: no incluyo pesos ni los descargo.

## Privacidad (datos de rostro = datos sensibles)
La cara/medidas son **datos personales** (en salud, sensibles). Recolectar solo
con **consentimiento explícito**, minimizar lo almacenado, y cumplir la Ley 19.628
/ Ley 21.719 (ver `docs/roadmap.md`).
