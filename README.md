# DiverSeña

**Aprende lengua de señas con tu cámara.** DiverSeña reconoce tus manos en
tiempo real y te dice si la seña está bien hecha. Empieza por las vocales de
la Lengua de Señas Colombiana (LSC). Funciona en cualquier navegador, sin
instalar nada, y procesa todo en el equipo de la persona.

**App:** https://profenapaipa.github.io/diversena/

Nació como el proyecto "Lector de lengua de señas" del Equipo 6 del
Semillero de Tecnología Maker 2026-II y hoy se desarrolla como una solución
sostenible para colegios, familias e instituciones.

> Las lenguas de señas son lenguas completas y cambian entre países y
> comunidades. **Ninguna seña se presenta aquí como universal.**

## Qué hace

- **Aprender:** elige una vocal, mira cómo se hace y practícala con
  retroalimentación al instante.
- **Traducir:** haz una seña y aparece la letra. Si no está segura, sugiere
  las más parecidas ("¿Quizás quisiste decir…?").
- **Perfil:** nombre, foto encuadrada con detección de rostro y progreso por
  vocal, guardados solo en el navegador.
- **Panel del equipo:** avance del dataset por seña, personas que grabaron,
  requisitos del proyecto y días para la muestra final.
- **Entrenar la IA:** grabar o subir clips etiquetados para que el
  reconocimiento aprenda.

Lenguas: **LSC disponible**. LSM y LSEC aparecen como 🔒 Próximamente.

## Documentación

| Documento | Contenido |
| --- | --- |
| [docs/PROYECTO.md](docs/PROYECTO.md) | Problema, pregunta, requisitos, del boceto a la app, decisiones y antecedentes |
| [docs/MARCA.md](docs/MARCA.md) | Identidad de marca: colores de la bandera Sorda, tipografía, logo y voz |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Cómo está construida, rutas y el camino a producto sostenible |
| [docs/ENTRENAMIENTO-IA.md](docs/ENTRENAMIENTO-IA.md) | Protocolo para grabar clips de entrenamiento y consolidar el dataset |

## Ejecutar en local

En Windows, doble clic en **`INICIAR-DIVERSENA.bat`**: instala lo necesario
la primera vez y abre `http://localhost:5173/diversena/`.

Desde la terminal:

```bash
npm install
npm run dev
```

No abras `index.html` directamente: el proyecto necesita el servidor de Vite.

## Comprobaciones

```bash
npx tsc -b      # tipos
npm run lint    # oxlint
npm test        # pruebas (Vitest)
npm run build   # build de producción
```

Cada push a `main` corre las pruebas y publica en GitHub Pages
(`.github/workflows/deploy.yml`).

## Privacidad

- La cámara solo se enciende cuando la persona lo pide. Ningún cuadro de
  video sale del navegador: la detección de manos y de rostro ocurre en el
  equipo.
- El rostro solo se **detecta** para recortar la foto de perfil. No se
  identifica a nadie ni se guardan datos biométricos.
- Los clips de entrenamiento piden consentimiento (y autorización del
  acudiente para menores). El dataset exportado contiene solo coordenadas de
  la mano, sin imagen.
- Lo único que se descarga de internet es el modelo de MediaPipe (desde CDN)
  y las fuentes.

## Colaboración

`main` es la única rama de trabajo y de despliegue. Clona este repositorio y
trabaja sobre `main`; no crees un historial nuevo en otra rama.
