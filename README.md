# VisionFactory

Plataforma de lentes a medida: **probador virtual con seguimiento facial →
medición antropométrica → generación de monturas paramétricas → fabricación**
(impresión 3D + biselado de cristales).

El diferenciador no es copiar catálogos ajenos, sino el **ajuste a medida del
rostro de cada persona** y la entrega de archivos listos para fabricar (STEP/STL).

## Estado actual

| Componente | Estado |
|---|---|
| Probador virtual (HTML) | ⏳ Falta subir el fuente como `probador-lentes/index.html` |
| Config de despliegue Vercel | ✅ Listo en `probador-lentes/vercel.json` |
| Pipeline 3D / fabricación | 📋 Diseñado en `docs/roadmap.md` |

## Estructura

```
visionfactory/
├── probador-lentes/      # Sitio estático del probador (deploy a Vercel)
│   ├── vercel.json       # Headers (Permissions-Policy: camera=self)
│   └── index.html        # ← PENDIENTE: copiar aquí probador-lentes.html
└── docs/
    └── roadmap.md        # Arquitectura, pipeline de fabricación y límites legales
```

## Próximo paso inmediato

El despliegue está **bloqueado** porque falta el HTML del probador. Instrucciones
en `probador-lentes/README.md`. El resto del plan (medición, generación 3D,
materiales, datos y cumplimiento) está en `docs/roadmap.md`.
