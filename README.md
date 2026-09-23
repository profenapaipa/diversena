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

Fases 1–6 completas: estructura, navegación, modelo de datos, cámara,
detección de manos en vivo (MediaPipe HandLandmarker) y normalización /
extracción de características geométricas. **Todavía no incluye clasificador
de señas** — la app detecta y dibuja la mano, pero no identifica todavía qué
vocal se está formando (ver Roadmap).

Además de la cámara en vivo con seguimiento de manos, las pantallas Aprender
e Identificar incluyen una función complementaria para **grabar o subir un
video** de la práctica y revisarlo después (sin seguimiento de manos: es solo
un video para guardar o compartir).

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
├── features/camera/      # CameraView + HandLandmarksCanvas (seguimiento en vivo);
│                         # VideoCaptureView (grabar/subir video)
├── services/
│   ├── camera/           # CameraService (getUserMedia)
│   ├── mediapipe/        # HandTrackingService (HandLandmarker)
│   └── recognition/      # LandmarkProcessor: normalización + features geométricas
├── hooks/                # useCamera, useHandLandmarker, useVideoCapture
└── utils/                # (a partir de la fase de clasificación)
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
3. **Clasificador por lengua** (pendiente): heurístico/geométrico en su
   primera versión, detrás de una interfaz común, para poder reemplazarlo por
   un modelo entrenado sin tocar la interfaz. Necesita referencias
   geométricas reales por seña y lengua que el equipo aún no ha entregado;
   no se van a inventar umbrales ni datos lingüísticos mientras tanto.
4. **Confianza** (pendiente): se mostrará como "confianza del reconocimiento"
   (una medida del modelo), nunca como certeza de que la seña se ejecutó
   correctamente.

No se publicará ningún porcentaje de precisión sin una evaluación formal.

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

- Hay detección de manos (landmarks), pero **todavía no hay reconocimiento de
  seña**: nada en la app identifica qué vocal se está formando.
- La carga del modelo de `HandLandmarker` depende de acceso a Internet (CDN);
  sin conexión, la detección no arrancará (el estado quedará en "cargando" o
  pasará a error, nunca fingirá haber detectado algo).
- Los recursos educativos (imagen, video, explicación, instrucciones) son
  placeholders hasta que el equipo entregue el material real por lengua.
- El futuro clasificador por lengua no tendrá validación lingüística hasta
  que existan referencias reales.

## Roadmap

**Primera versión**: LSC, LSM, LSEC · vocales A/E/I/O/U · modo aprender ·
modo identificar · cámara y landmarks · clasificador inicial · puntuación ·
publicación en GitHub Pages.

**Evolución**: más letras, números, palabras, frases, nuevos clasificadores,
dataset y modelos entrenados, usuarios y progreso, estadísticas, base de
datos, autenticación, nuevas lenguas de señas.
