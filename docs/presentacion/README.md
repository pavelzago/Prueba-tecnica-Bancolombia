# Presentación ejecutiva

- `presentacion.md`: fuente en formato [Marp](https://marp.app/) (5 diapositivas, 16:9).
- `presentacion.pdf`: versión exportada para exponer o compartir.
- `img/`: capturas reales del conciliador con los datos de `test-data/`.

## Regenerar el PDF

Requiere Node >= 20 y Google Chrome (o Chromium/Edge). Desde esta carpeta:

```bash
cd docs/presentacion
npx -y @marp-team/marp-cli@4.5.1 presentacion.md --pdf --html --allow-local-files -o presentacion.pdf
```

- `--html` es necesario: los diagramas y tarjetas están hechos con HTML/CSS dentro del Markdown.
- `--allow-local-files` permite cargar la captura de `img/` y la tipografía IBM Plex Sans desde `frontend/node_modules/@fontsource/ibm-plex-sans` (ejecuta antes `npm install` en `frontend/`; si no está, se usa una tipografía del sistema).
- Si Marp no encuentra el navegador, indícalo con la variable `CHROME_PATH`, por ejemplo `CHROME_PATH=/usr/bin/google-chrome`.

Para revisar las diapositivas como imágenes: cambia `--pdf ... -o presentacion.pdf` por `--images png -o /ruta/temporal/slide.png`.
