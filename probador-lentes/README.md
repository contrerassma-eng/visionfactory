# Probador de Lentes — Sitio estático (Vercel)

Página única: probador virtual con cámara en vivo y seguimiento facial (MediaPipe
FaceMesh por CDN jsdelivr). Estático puro, sin build ni backend. `getUserMedia`
exige HTTPS y permiso de cámara **a nivel de página** (por eso NO funciona dentro
de un iframe ni servido por una Edge Function que devuelva el código como texto).

## ⚠️ Falta el archivo fuente

El despliegue requiere `probador-lentes.html` (el que descargaste del chat). Aún
**no está en el repo**. Para completarlo:

1. Copia tu archivo aquí con el nombre **exacto** `index.html`:
   ```bash
   cp /ruta/a/probador-lentes.html probador-lentes/index.html
   ```
2. Confirma que quede `probador-lentes/index.html` (no `.htm`, no el nombre original).

## Despliegue

```bash
cd probador-lentes
npx vercel --prod
```

Primera vez: aceptar defaults (scope personal, nombre `probador-lentes`, sin build
command, output directory `.`). Capturar la URL de producción que devuelve el CLI.

> Alternativa: este entorno tiene un conector de Vercel (MCP). Una vez que
> `index.html` esté en el repo, puedo lanzar el deploy desde aquí.

## Verificación automática

```bash
curl -sI <URL_PRODUCCION> | grep -iE "^HTTP|content-type"
```

Esperado: `HTTP/2 200` y `content-type: text/html; charset=utf-8`.

- **401/403 con redirect a `vercel.com/sso`** → Deployment Protection activa.
  Dashboard → proyecto → Settings → Deployment Protection → Vercel Authentication =
  **Disabled** (al menos para Production). Re-verificar.
- **`content-type` distinto de `text/html`** → confirma que el archivo se llama
  `index.html` y redespliega.

## Verificación manual

1. Abrir la URL en Chrome de escritorio y en el celular.
2. "Activar cámara" → el navegador pide permiso una sola vez.
3. Badge → "Rostro detectado"; las monturas siguen posición, escala y giro.
4. Cambiar de modelo en el catálogo y usar los sliders de tamaño/altura.
5. "Capturar" descarga un PNG con foto + montura.

## Notas técnicas

- Referencia `cdn.jsdelivr.net` (FaceMesh + modelo ~3 MB en primer uso) y Google
  Fonts. No vendorizar salvo pedido explícito.
- El efecto espejo (selfie) es intencional: el canvas dibuja con `scale(-1,1)`.
- Estático puro de un archivo: no agregar framework, bundler ni paquetes.
