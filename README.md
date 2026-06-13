# VisionFactory

Plataforma de lentes a medida: **probador virtual con seguimiento facial →
medición antropométrica → generación de monturas paramétricas → fabricación**
(impresión 3D + biselado de cristales).

El diferenciador no es copiar catálogos ajenos, sino el **ajuste a medida del
rostro de cada persona** y la entrega de archivos listos para fabricar (STEP/STL).

## Estado actual

| Componente | Estado |
|---|---|
| Probador (try-on) | ✅ Versión funcional en `site/index.html` (cámara + FaceMesh + 5 estilos + DP en vivo) |
| Deploy GitHub Pages | ✅ Workflow listo (`.github/workflows/pages.yml`); falta habilitar Pages |
| Generador 3D (STEP/STL) | ✅ `generador/` — medición facial + 5 estilos paramétricos |
| Deploy Vercel (alternativa) | ✅ `probador-lentes/vercel.json` (requiere tu HTML como `index.html`) |
| Pipeline / negocio | 📋 `docs/roadmap.md` |

## Estructura

```
visionfactory/
├── site/                 # Probador (try-on) que se publica en GitHub Pages
│   └── index.html        #   cámara + MediaPipe FaceMesh + 5 estilos + DP en vivo
├── generador/            # Motor 3D: rostro → medidas → STEP/STL (Replicad)
├── probador-lentes/      # Alternativa de deploy en Vercel (vercel.json)
├── docs/roadmap.md       # Arquitectura, fabricación y límites legales
└── .github/workflows/pages.yml   # Deploy automático a GitHub Pages
```

## Deploy en GitHub Pages

El workflow `.github/workflows/pages.yml` publica la carpeta `site/`. Para activarlo:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions** (una vez).
2. **Merge del PR #1 a `main`** (o ejecutar el workflow a mano desde la pestaña
   Actions → *Deploy GitHub Pages* → *Run workflow*).

Queda publicado en: `https://contrerassma-eng.github.io/visionfactory/`

> El probador de `site/index.html` es una versión funcional propia (no usa diseños
> de terceros). Si prefieres tu `probador-lentes.html`, reemplaza `site/index.html`
> con él y se redespliega solo.
