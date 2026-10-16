# Arquitectura de DiverSeña

## Hoy: aplicación web estática, todo en el navegador

```
Cámara ─► CameraService ─► HandLandmarker (MediaPipe, GPU) ─► suavizado One-Euro
        (getUserMedia)      21 puntos × 2 manos, ~30 fps        + retención breve
                                                                     │
          ┌──────────────────────────────────────────────────────────┘
          ▼
   LandmarkProcessor ─► características ─► k-NN contra el ReferenceSet ─► votación temporal
   (normaliza posición,   (flexión y        (dataset publicado + local     (resultado estable)
    escala y rotación)     distancias)       + referencias rápidas)              │
                                                                                 ▼
                                                    Letra en pantalla o "¿Quizás quisiste decir…?"
```

| Capa | Dónde | Notas |
| --- | --- | --- |
| Interfaz | `src/pages`, `src/components`, `src/features` | React 19 + TypeScript, `HashRouter` para GitHub Pages |
| Visión | `src/services/mediapipe` | Runtime Wasm compartido, GPU con respaldo a CPU, precarga y calentamiento |
| Reconocimiento | `src/services/recognition` | Normalización, suavizado, k-NN, ranking de sugerencias, votación temporal. Con pruebas en Vitest |
| Dataset | `src/services/dataset` | IndexedDB, extracción de landmarks desde video, metas por seña |
| Perfil | `src/services/profile` | `localStorage`. La foto de perfil solo usa detección de rostro, no reconocimiento |
| Contenido | `src/data` | Lenguas y señas, y contenido del proyecto (`project.ts`) |
| Marca | `src/index.css`, `src/components/brand` | Tokens de color y tipografía; ver `docs/MARCA.md` |

**Despliegue:** cada push a `main` corre las pruebas, compila y publica en
GitHub Pages (`.github/workflows/deploy.yml`). En local:
`INICIAR-DIVERSENA.bat` o `npm run dev`.

### Rutas

| Ruta | Para quién | Qué es |
| --- | --- | --- |
| `#/` | Todos | Portada |
| `#/aprender` | Estudiantes | Elegir una vocal y practicarla con la cámara |
| `#/identificar` | Estudiantes | Traducir una seña a texto, con sugerencias |
| `#/explorar` | Estudiantes | Señas por lengua |
| `#/perfil` | Estudiantes | Perfil, foto y progreso |
| `#/proyecto` | Público, jurados | Documentación del proyecto |
| `#/panel` | Equipo | Panel con el estado del dataset y de los requisitos |
| `#/herramientas/entrenar` | Equipo | Grabar o subir clips de entrenamiento |
| `#/herramientas/referencias` | Equipo | Referencias rápidas de una sola postura |

## Hacia una solución sostenible

Lo que cambia para pasar de prototipo a producto (ver también la propuesta
de modelo de negocio):

1. **Backend con cuentas** (por ejemplo Supabase: Postgres, autenticación y
   almacenamiento). Tablas mínimas: `organizations`, `users` (con rol
   estudiante, docente o admin), `progress`, `training_samples` (los
   landmarks en JSON y un enlace al video en almacenamiento privado) y
   `consents`. El dataset deja de viajar por archivos exportados.
2. **Paneles por rol**: el panel docente (grupos, avance por estudiante)
   reutiliza los componentes del Panel del equipo (`kpi`, `data-table`,
   `meter`, `badge`).
3. **Modelo entrenado**: un clasificador pequeño (MLP) entrenado con los
   landmarks, exportado para el navegador y evaluado separando a las personas
   de entrenamiento y de prueba. Reemplaza al k-NN detrás de la misma interfaz
   (`classifyWithReferenceSet` / `rankSigns`).
4. **Hosting comercial** (Vercel, Netlify o Cloudflare Pages): GitHub Pages
   no permite usarse para un servicio comercial.
5. **App instalable (PWA)** con modelo en caché, para colegios con mala
   conexión.
6. **Datos personales** (Ley 1581 de 2012): política de tratamiento,
   consentimiento con autorización del acudiente para menores, y videos con
   acceso restringido.

## Calidad

```bash
npx tsc -b      # tipos
npm run lint    # oxlint
npm test        # Vitest: normalización, clasificador, suavizado, votación, sugerencias
npm run build   # build de producción
```
