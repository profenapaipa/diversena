# DiverSeña

DiverSeña es una aplicación web educativa para **aprender, practicar e
identificar** vocales (A, E, I, O, U) en distintas lenguas de señas, usando
únicamente la cámara del navegador.

> Las lenguas de señas son lenguas humanas de pleno derecho y presentan
> diferencias entre comunidades y países. **Ninguna seña se presenta aquí
> como universal**: la misma letra puede tener una configuración manual
> distinta según la lengua.

## Lenguas y vocales de la primera versión

- Lengua de Señas Colombiana (LSC)
- Lengua de Señas Mexicana (LSM)
- Lengua de Señas Ecuatoriana (LSEC)

Vocales: **A, E, I, O, U**.

Las referencias visuales, videos, explicaciones e instrucciones de cada seña
las entrega el equipo del proyecto; hasta que eso ocurra, la aplicación
muestra placeholders explícitos (`[IMAGEN PENDIENTE]`, `[VIDEO PENDIENTE]`,
etc.) en vez de inventar contenido lingüístico.

## Estado actual

Fases 1–7 completas: estructura, navegación, modelo de datos, cámara,
detección de manos en vivo (MediaPipe HandLandmarker), normalización /
extracción de características geométricas, y un **clasificador por vecino
más cercano** que compara la mano en vivo contra referencias reales
capturadas por el equipo (ver "Capturar referencias" más abajo). Sin
referencias guardadas para una lengua, la app lo dice explícitamente en vez
de inventar un resultado.

Hay **una sola cámara** por pantalla: el mismo video en vivo muestra los
puntos de las articulaciones de la mano y sirve para grabar (o subir) un
video de la práctica y revisarlo después — no dos cámaras independientes.

## Arquitectura

Pipeline conceptual, pensado para que la interfaz nunca dependa directamente
de MediaPipe:

```
CameraService → HandTrackingService → LandmarkProcessor → SignRecognitionService → RecognitionResult
```

- **Detección de mano** (MediaPipe) y **reconocimiento de seña** (clasificador
  propio) son capas separadas: MediaPipe por sí solo no reconoce vocales de
  ninguna lengua de señas, solo entrega landmarks de la mano.
- Cada capa vive detrás de una interfaz TypeScript reemplazable, para poder
  evolucionar el motor de visión o el clasificador sin reescribir la UI.
- Estado de la aplicación con React Context/hooks, sin librerías de estado
  externas.
- Enrutamiento con `react-router-dom` en modo `HashRouter`, elegido porque
  GitHub Pages sirve archivos estáticos y así se evita el hack de `404.html`
  que requeriría `BrowserRouter`.

## Tecnologías

- React + TypeScript + Vite
- `react-router-dom` (HashRouter)
- `@mediapipe/tasks-vision` (HandLandmarker) para detección de manos
- Sin backend, sin base de datos, sin autenticación (ver Privacidad)

## Estructura del proyecto

```
src/
├── app/                 # Shell de la app y enrutamiento
├── pages/               # Inicio, Aprender, Identificar, Explorar
├── components/          # Componentes reutilizables (selectores, tarjetas, layout)
├── data/languages/       # Datos de cada lengua, físicamente separados (LSC/LSM/LSEC)
├── models/              # Tipos de dominio (Language, Sign, ...)
├── features/camera/      # CameraView (única cámara: landmarks + clasificación + grabar/subir);
│                         # HandLandmarksCanvas, RecordingControls
├── services/
│   ├── camera/           # CameraService (getUserMedia)
│   ├── mediapipe/        # HandTrackingService (HandLandmarker)
│   └── recognition/      # LandmarkProcessor (normalización + features),
│                         # signClassifier (vecino más cercano), referenceStore (localStorage)
├── hooks/                # useCamera, useHandLandmarker, useTrackedHand, useMediaRecorder
└── utils/                # (sin uso todavía)
```

Las carpetas `services/`, `hooks/` y `utils/` se crean cuando tienen
contenido real, para no dejar carpetas vacías en el repositorio.

## Reconocimiento (cómo se llegará de landmarks a una vocal)

1. **Detección** (ya implementada): `HandLandmarker` entrega hasta 21
   landmarks `{x, y, z}` por mano, en cada cuadro de video, mientras la
   cámara está activa. El WASM del runtime y el modelo (`hand_landmarker.task`)
   se cargan una sola vez desde CDN (jsDelivr / Google Storage) — son activos
   estáticos, no un envío de datos del usuario (ver Privacidad).
2. **Normalización** (ya implementada, `services/recognition/landmarkProcessor.ts`):
   traslación (origen en la muñeca), escala (respecto a la distancia
   muñeca→nudillo medio) y rotación (esa misma referencia queda "hacia
   arriba"), para que el resultado no dependa del tamaño de la mano, la
   distancia a la cámara ni su orientación en el plano de la imagen. Cubierto
   con pruebas de Vitest (invariancia a escala/rotación, ángulos de flexión
   por dedo) usando landmarks sintéticos, no una cámara real.
3. **Clasificador por lengua** (ya implementada, `services/recognition/signClassifier.ts`):
   compara el vector de características en vivo contra las referencias
   guardadas de la lengua seleccionada y devuelve la más parecida —
   **vecino más cercano geométrico, no una red entrenada**. Sin ninguna
   referencia cargada, o si ninguna supera el umbral de confianza, devuelve
   `null` explícitamente: nunca inventa una letra sin evidencia.
4. **Confianza**: `similarityTo` da un valor 0-1 de qué tan parecida es la
   postura en vivo a la referencia más cercana. Se muestra siempre como
   "confianza del reconocimiento" (qué tan parecida es la forma de la mano),
   nunca como certeza de que la seña se ejecutó lingüísticamente correcta.

No se publicará ningún porcentaje de precisión evaluado formalmente: este
número es una medida de similitud geométrica, no una métrica de exactitud
validada con usuarios reales.

### Capturar referencias (cómo obtener el clasificador real, sin inventar datos)

El clasificador necesita, por cada vocal y lengua, una referencia geométrica
real. Como el equipo todavía no ha entregado ese material, se construyó una
herramienta para capturarlo directamente en la app, en vez de inventar
umbrales o usar señas de otra lengua (p. ej. ASL) como relleno:

`http://localhost:5173/diversena/#/herramientas/referencias` (en producción,
`https://<usuario>.github.io/diversena/#/herramientas/referencias`)

Es una herramienta **interna del equipo**, no un enlace del menú principal
para estudiantes. Flujo: alguien que sepa la lengua elige lengua + vocal,
activa la cámara, y con la mano en la posición correcta pulsa "Guardar esta
postura como referencia". Las referencias se guardan en el `localStorage` del
navegador (no hay backend todavía); "Descargar referencias (.json)" e
"Importar archivo .json" permiten pasarlas entre computadores del equipo.

### Espejo y landmarks

El video se muestra en espejo (`transform: scaleX(-1)` en CSS) porque es más
natural para quien practica frente a la cámara. `HandLandmarker` procesa el
cuadro **real, sin espejar** — la detección no se ve afectada por el CSS. El
canvas de landmarks (`HandLandmarksCanvas`) recibe el mismo espejo CSS que el
video, así que los puntos quedan alineados visualmente sin tener que invertir
ninguna coordenada a mano.

## Datos: cómo añadir una nueva letra o lengua

- **Nueva letra** en una lengua existente: agregar un `Sign` al arreglo
  `signs` de esa lengua en `src/data/languages/<pais>.ts`.
- **Nueva lengua**: crear una carpeta en `src/data/languages/<pais>/` con su
  propio archivo de datos, y registrarla en `src/data/languages/index.ts`.
  Cada lengua es independiente: no se comparten clasificadores ni referencias
  entre lenguas.

## Privacidad

- La cámara solo se activa cuando el usuario la enciende explícitamente.
- No se guardan imágenes ni video, ni se envían frames a ningún servidor: todo
  el procesamiento (detección de manos incluida) ocurre en el navegador.
- La única descarga externa es el modelo de `HandLandmarker` (WASM + archivo
  `.task`) desde CDN, una sola vez por sesión de navegador: es un activo
  estático de la librería, no contiene ni transmite datos del usuario.
- No hay backend, base de datos ni autenticación en esta versión.

## Colaboración

`main` es la única rama de trabajo del proyecto: todo el desarrollo, y el
despliegue a GitHub Pages, se hacen desde ahí. (Una rama `master` con una
copia antigua del proyecto se generó por un `git init` independiente en otra
cuenta; ya se integró a `main` — grabar/subir video, en las pantallas
Aprender e Identificar, viene de ese trabajo. Evitemos que se repita:
cualquiera que clone el repo debe hacerlo desde este remoto y trabajar sobre
`main`, no crear un historial nuevo en `master`.)

## Desarrollo local

```bash
npm install
npm run dev
```

> **No abras `index.html` directamente con doble clic ni con un navegador de
> archivos (`file://`).** El proyecto usa Vite para compilar TypeScript/JSX y
> resolver módulos; abrir el archivo así deja la página en blanco (el
> navegador bloquea `src="/src/main.tsx"` por CORS al no venir de un
> servidor). Siempre entra por la URL que imprime `npm run dev`
> (`http://localhost:5173/diversena/`).

## Comprobaciones

```bash
npx tsc -b       # chequeo de tipos
npm run lint     # oxlint
npm test         # vitest (normalización y extracción de características)
npm run build    # build de producción a dist/
```

## Despliegue en GitHub Pages

El proyecto está configurado para publicarse en
`https://<usuario>.github.io/diversena/`:

- `vite.config.ts` define `base: '/diversena/'`.
- El enrutamiento usa `HashRouter`, que no necesita configuración adicional
  de rutas en Pages.
- El flujo de GitHub Actions (build + deploy) se añade en la fase de
  despliegue.

## Limitaciones actuales

- El clasificador **solo funciona en las lenguas/vocales para las que alguien
  haya capturado una referencia** con la herramienta interna; sin eso, la app
  lo dice explícitamente en vez de adivinar.
- Las referencias viven en `localStorage`: son por navegador, no se
  sincronizan solas entre computadores (usar descargar/importar) y no hay
  backend ni base de datos todavía.
- Es un clasificador de **una sola postura estática** por vecino más cercano,
  sin ninguna validación lingüística ni de precisión con usuarios reales —
  la "confianza" es solo similitud geométrica a la referencia guardada.
- La carga del modelo de `HandLandmarker` depende de acceso a Internet (CDN);
  sin conexión, la detección no arrancará (el estado quedará en "cargando" o
  pasará a error, nunca fingirá haber detectado algo).
- Los recursos educativos (imagen, video, explicación, instrucciones) son
  placeholders hasta que el equipo entregue el material real por lengua.

## Roadmap

**Primera versión**: LSC, LSM, LSEC · vocales A/E/I/O/U · modo aprender ·
modo identificar · cámara y landmarks · clasificador inicial · puntuación ·
publicación en GitHub Pages.

**Evolución**: más letras, números, palabras, frases, nuevos clasificadores,
dataset y modelos entrenados, usuarios y progreso, estadísticas, base de
datos, autenticación, nuevas lenguas de señas.
