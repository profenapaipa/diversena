# El proyecto DiverSeña

Resumen de la documentación del Equipo 6 ("Lector de lengua de señas") del
**Semillero de Tecnología Maker 2026-II**, consolidada desde la carpeta del
equipo en Drive (propuesta, ficha técnica, artículo base, matriz de
antecedentes, bocetos, barreras y ruta del semestre). La versión pública está
en la app, en `#/proyecto`. Su contenido vive en `src/data/project.ts`.

> **Privacidad:** los integrantes son menores de edad. En la web y en este
> repositorio se nombran con nombre e inicial del apellido. Los nombres
> completos están solo en el artículo del equipo.

## Equipo y contexto

- Integrantes: Matías A., Nicolás P., César P. (grado 9C).
- Muestra final: 28 y 29 de octubre de 2026. Dos proyectos del colegio se
  presentan en la Cámara de Comercio.

## Problema

En distintos espacios, las personas sordas pueden enfrentar dificultades para
comunicarse de manera clara y lograr que otras personas comprendan lo que
necesitan expresar. La situación suele pasar desapercibida hasta que se
requiere comunicación o ayuda.

**Pregunta de investigación:** ¿Qué problemas tienen las personas sordas
para comunicarse de manera clara, sabiendo lo que quieren expresar?

**Público:** personas desde los 6 años que necesitan o quieren entender la
lengua de señas.

**Validación prevista:** docentes del colegio que conocen la lengua de señas.

## Requisitos (ficha técnica, paso 2)

| # | La solución debe… | Cómo se prueba | Estado |
| --- | --- | --- | --- |
| 1 | Reconocer las manos y la posición de los dedos | Mostrar las manos y ver los 21 puntos siguiéndolas | Cumplido |
| 2 | Comprender las señas y traducirlas a texto | Hacer cada vocal y ver la letra correcta | En progreso (faltan datos de entrenamiento) |
| 3 | Dar sugerencias cuando no entiende | Hacer una seña a medias y ver opciones parecidas | Cumplido ("¿Quizás quisiste decir…?") |

## Cómo funciona (las tres cajas)

1. **Entra:** la imagen de la cámara con una persona haciendo una seña.
2. **Procesa:** toma los puntos de las manos, los compara con las señas de
   referencia y elige la más parecida.
3. **Sale:** la letra en pantalla, o sugerencias si no está segura.

## Del boceto a la app

El boceto del 14 de octubre propone tres pantallas. Así quedaron en la app:

| Boceto | En la app |
| --- | --- |
| Menú con foto de perfil arriba a la izquierda y menú de tres líneas a la derecha | Encabezado en celular: avatar, logo y menú hamburguesa |
| Íconos de libro (aprender) y cámara | Barra inferior en celular: Inicio, Aprender, Traducir y Perfil |
| Ondas azules y manos alrededor de un ojo | Portada con ondas; el ojo es el símbolo de la marca |
| La cámara ve la mano y sale la letra "a" | Traducir: video con los puntos de la mano y la letra en grande al lado |
| "¿Quizás quisiste decir…?" | Panel de sugerencias con las 3 señas más parecidas |

## Barreras que reportó el equipo y cómo se resolvieron

| Barrera | Solución |
| --- | --- |
| "No logramos que la interfaz quedara como el boceto" | Rediseño completo a partir del boceto, con una guía de marca (`docs/MARCA.md`) |
| "No logramos que la app muestre la cámara consistentemente" | La cámara se reconecta y arranca de forma explícita; si el equipo rechaza la resolución pedida, se reintenta con una configuración básica; botón "Reintentar" |
| "No encontramos un algoritmo para detectar las manos" | MediaPipe HandLandmarker en el navegador (21 puntos por mano, dos manos) |

## Decisiones técnicas

1. **Página web en vez de app instalable**, para que más personas accedan
   con un enlace.
2. **De Unity y Teachable Machine al navegador**: MediaPipe corre en la
   página, sin servidores.
3. **Puntos de la mano en vez de imágenes**: más liviano y más privado.
4. **LSC primero**; LSM y LSEC quedan como "Próximamente".

## Antecedentes (APA 7)

- González, T. de J. (2023). Percepción del uso de herramientas tecnológicas en el proceso de enseñanza aprendizaje de los estudiantes con discapacidad auditiva de un centro educativo para sordos de la República Dominicana. *Revista de Educación Inclusiva*. https://dialnet.unirioja.es/servlet/articulo?codigo=9361875
- Quevedo-Sánchez, L. del P., Peralta-Eugenio, G., Morales-Pérez, L., & Quevedo-Sánchez, J. E. (2026). Software en el proceso de enseñanza aprendizaje de lengua de señas: una revisión sistemática y bibliométrica. *Revista InveCom*. https://doi.org/10.5281/zenodo.18014342
- Ramírez Cabezas, J. A., Jiménez Bedón, A. M., Bajaña Zajía, J. X., & Cunuhay Cuchipe, W. C. (2025). Aplicación móvil para la comunicación entre oyentes y personas con discapacidad auditiva mediante reconocimiento de frases en LSEC con redes neuronales convolucionales. *e-Revista Multidisciplinaria del Saber*. https://doi.org/10.61286/e-rms.v3i.307
- Ritmeester, J., Sümer, B., Boonstra, M., de Meulder, M., van der Aa, B., Roelofsen, F., et al. (2026). From words to sentences: Designing and evaluating a parent-facing sign language learning app. *Universal Access in the Information Society*. https://doi.org/10.1007/s10209-026-01378-9
- Rodríguez-Fuentes, A., Alain, L., & García García, F. (2020). EnSenias: herramienta tecnológica para aprender, enseñar, mejorar y usar la lengua de signos panameña. *Íkala, Revista de Lenguaje y Cultura, 25*(3). https://doi.org/10.17533/udea.ikala.v25n03a05
- Vesely, S. E., & Frampton, S. E. (2026). The use of self-study and matrix training to teach sign language. *The Analysis of Verbal Behavior, 42*, 84–108. https://doi.org/10.1007/s40616-026-00228-2

Recurso de referencia lingüística: diccionario del INSOR,
https://educativo.insor.gov.co/diccionario/

## Para el artículo del equipo

Datos listos para las secciones del artículo base que siguen vacías:

- **3.1 Qué debe hacer la solución:** la tabla de requisitos de arriba.
- **3.2 Con qué se construyó:** React 19, TypeScript 6, Vite 8, MediaPipe
  Tasks Vision 1.0.1 (HandLandmarker y FaceDetector), Vitest 4, GitHub Pages
  y GitHub Actions. Asistentes de IA: Claude y Gemini.
- **3.4 Qué funciona hoy:** detección de dos manos en vivo (~30 fps),
  reconocimiento por vecinos más cercanos con sugerencias, perfil con
  progreso, grabación de práctica con los puntos dibujados, espacio para
  entrenar la IA y panel del equipo. Falta: datos de entrenamiento reales
  validados por la comunidad Sorda, por lo que el reconocimiento aún no
  identifica vocales para usuarios nuevos.
