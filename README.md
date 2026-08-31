# Agrepa Asfalcem — sitio web

Sitio corporativo de **AGREPA ASFALCEM**, constructora vial con planta de asfalto propia
(asfaltado, repavimentación, obras civiles y alquiler de maquinaria).

Es un sitio estático: HTML, CSS e imágenes, sin build ni dependencias. Se publica solo
en GitHub Pages con cada `push` a `main`.

- **Preview actual:** https://zerogapcode.github.io/agrepa-web/
- **Dominio propio:** pendiente de compra ([ver abajo](#cambiar-el-dominio))

---

## Estructura

```
index.html      La página completa (CSS y JS embebidos; una sola petición)
404.html        Página de error con la identidad de la marca
img/            Todas las imágenes: logo, fotos, favicon, avatar del bot
js/config.js    URL del Worker de Cloudflare + memoria de conversación del bot
robots.txt      Permite indexación, apunta al sitemap
sitemap.xml     Una URL por ahora; agregar aquí cada página nueva
scripts/        Utilidades de mantenimiento
docs/           Notas técnicas (bloque del asistente Daniel Bot)
.github/workflows/static.yml   Despliegue automático a GitHub Pages
```

## Ver el sitio en local

```bash
python3 -m http.server 8000
```

Y abrir http://localhost:8000. Sirve el sitio por HTTP real, así que las rutas y el
asistente se comportan igual que en producción (abrir el `index.html` con doble clic
no es equivalente).

## Cambiar el dominio

Al comprar el dominio, un solo comando actualiza todo — canonical, Open Graph, JSON-LD,
enlaces internos, `robots.txt`, `sitemap.xml` — y escribe el `CNAME` que necesita Pages:

```bash
./scripts/set-dominio.sh agrepaasfalcem.com
git add -A && git commit -m "Apuntar el sitio al dominio propio" && git push
```

Después, del lado del registrador y de GitHub:

1. **DNS del registrador** — para el dominio raíz (`agrepaasfalcem.com`), cuatro registros `A`:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   Para `www`, un `CNAME` a `zerogapcode.github.io`.
2. **GitHub → Settings → Pages** — poner el dominio en *Custom domain*, esperar la
   verificación y marcar **Enforce HTTPS** (el certificado tarda unos minutos).

El script es repetible: lee el dominio actual del `<link rel="canonical">`, así que puede
correrse otra vez para corregir o cambiar de dominio.

---

## Asistente virtual (Daniel Bot)

El botón flotante habla con un Worker de Cloudflare compartido, definido en
`js/config.js`, enviando `{ message, assistant: "daniel", session_id }`.

> **Pendiente y bloqueante:** el Worker todavía no tiene el caso `daniel`. Hasta que se
> agregue, Daniel responde con la personalidad genérica de ProtonLab en vez de la de
> Agrepa. El bloque a pegar está en [`docs/daniel-bot-worker.js`](docs/daniel-bot-worker.js);
> va justo antes de `} else if (assistantType === "carlitos") {`.

El historial de conversación se guarda en el `localStorage` del visitante (últimas 14
intervenciones), no en el servidor.

---

## Pendientes antes de publicar en el dominio propio

Datos por confirmar con el cliente:

- [ ] **Teléfono y dirección.** `(0414) 174-5646` y la sede de Santa Lucía del Tuy salieron
      de un registro mercantil público, no de una fuente oficial de la empresa.
- [ ] **Correo de contacto.** Hoy es el marcador `correo@dominio.com`.
- [ ] **Cifras entre corchetes** en el texto (`[X] km`, `[X] días`): reemplazar por datos
      reales o quitar la frase.

Contenido y rendimiento:

- [ ] **Fotos reales de obra.** Las actuales son de stock y no muestran trabajos de Agrepa.
- [ ] **Versiones WebP** de las imágenes, servidas con `<picture>`. Bajan bastante el peso;
      se generan al desplegar (`cwebp -q 82`).
- [ ] Agregar el sitio a **Google Search Console** y enviar el `sitemap.xml`.

## Notas de mantenimiento

- El CSS y el JS viven dentro de `index.html` a propósito: el sitio es una sola página y
  así carga en una sola petición, sin render bloqueado.
- El diseño es **mobile-first** — la mayoría de quienes lo aprueban lo ven en el teléfono.
  Probar siempre a 375 px de ancho antes de dar algo por terminado.
- Los hexágonos del fondo son SVG sin relleno con parallax por scroll; el grosor del trazo
  escala con el tamaño para dar profundidad. Respetan `prefers-reduced-motion`.
- Las imágenes llevan `width`/`height` explícitos para evitar saltos de maquetación (CLS).
