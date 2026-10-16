# Entrenar la IA de DiverSeña — guía para el equipo

Esta guía explica cómo reunir los videos con los que DiverSeña aprende a
reconocer señas. **Foco actual: Lengua de Señas Colombiana (LSC), vocales
A, E, I, O, U.** LSM y LSEC quedan como "Próximamente" hasta que la LSC
funcione bien; la herramienta ya permite empezar a grabarlas.

## 1. Dónde se graba

En la app: pie de página → **Entrenar IA**
(`https://profenapaipa.github.io/diversena/#/herramientas/entrenar`, o en
local con `INICIAR-DIVERSENA.bat` → `http://localhost:5173/diversena/#/herramientas/entrenar`).

La herramienta tiene dos formas de agregar clips:

- **Grabar con la cámara**: cuenta regresiva de 3 s y graba un clip de 3 s.
- **Subir videos**: varios archivos a la vez (por ejemplo, grabados con el
  celular), todos con la seña que esté seleccionada. Máximo 30 s cada uno.

En ambos casos la app recorre el video a 15 cuadros/s, extrae los 21 puntos
de cada mano (hasta dos manos) y guarda la secuencia. **Si la mano se ve en
menos del 50 % del clip, no lo guarda** y pide repetirlo.

Lo que se graba se usa de inmediato para el reconocimiento en ese mismo
navegador (Aprender e Identificar).

## 2. Protocolo de grabación

| Aspecto | Indicación |
| --- | --- |
| Contenido | **Una sola seña por clip.** Empezar con la mano ya en posición y mantenerla. |
| Encuadre | Mano completa (muñeca y 5 dedos) a la altura del pecho, cara visible. |
| Luz | De frente (fuente de luz detrás de la cámara). Evitar contraluz. |
| Fondo | Sencillo, sin otras personas ni manos. |
| Variedad | Cambiar distancia, ángulo, luz, fondo, ropa y día entre clips. |
| Personas | **Mínimo 8 personas distintas por seña**, con mano derecha e izquierda. |
| Cantidad | **Meta: 40 clips por seña** (200 para las 5 vocales LSC). Lo ideal son 100 o más. |
| Quién | Personas Sordas usuarias de LSC o intérpretes certificados. Los clips de aprendices se marcan aparte y solo sirven para pruebas. |
| Negativos | (Siguiente fase) clips de "ninguna seña": mano relajada, gestos al hablar, etc. Así el modelo aprende a decir "no reconozco". |

### Consentimiento y datos personales

- Cada persona marca la casilla de autorización antes de grabar. Con
  **menores de edad** se necesita además la **autorización escrita del
  acudiente**, y el colegio debe archivarla.
- Usar **seudónimos**, nunca nombres completos ni números de documento.
- El JSON exportado **no contiene imagen**: solo coordenadas de la mano. Los
  videos originales se archivan aparte, en una carpeta con acceso restringido.
- Cualquier persona puede pedir que se borren sus clips. Por eso cada clip
  guarda el seudónimo y la fecha del consentimiento.

## 3. Cómo se consolida el dataset

```
cada persona del equipo                      repositorio
─────────────────────────                    ──────────────────────────────
Entrenar IA → graba clips
            → "Exportar dataset LSC"  ──►  carpeta compartida del equipo
            → "Descargar todos los videos" ► (Drive) /dataset/lsc/json  y  /videos
                                                       │
responsable del dataset:                               ▼
  "Importar dataset" con todos los .json  ──►  revisa los clips y borra los malos
  "Exportar dataset LSC"                  ──►  public/datasets/lsc.json
  git commit + push                       ──►  GitHub Pages lo publica: todos
                                               los estudiantes tienen reconocimiento
```

Nombres de los videos descargados: `<lengua>_<seña>_<seudónimo>_<id>.webm`
(por ejemplo `lsc_a_maria-t_3f9c21ab.webm`).

> `public/datasets/lsc.json` hoy está vacío. Cuando tenga clips reales, la
> app los carga sola al abrir Aprender o Identificar.

## 4. Formato del archivo (`diversena-dataset` v1)

```jsonc
{
  "format": "diversena-dataset",
  "version": 1,
  "languageId": "lsc",
  "samples": [{
    "id": "uuid", "languageId": "lsc", "signId": "lsc-a", "label": "A",
    "source": "camara" | "archivo",
    "contributor": { "alias": "…", "dominantHand": "derecha", "signerProfile": "sorda" },
    "consentAt": "ISO-8601", "durationSec": 3, "sampleFps": 15, "handCoverage": 0.93,
    "frames": [{ "t": 0.0667, "hands": [[{ "x": 0.51, "y": 0.62, "z": -0.01 }, … 21 puntos]], "handedness": ["Right"] }]
  }]
}
```

Se guardan los **puntos crudos**, no características ya calculadas. Así,
cuando cambie el modelo, se reutilizan los mismos datos sin volver a grabar.

## 5. Cómo usa la app estos datos hoy, y hacia dónde va

**Hoy (k vecinos más cercanos):** de cada clip se toman hasta 12 cuadros del
60 % central (se descartan la entrada y la salida de la seña). Cada cuadro se
normaliza (posición, tamaño y rotación) y se resume en ángulos y distancias
de los dedos. La mano en vivo se compara con todas las referencias y votan las
5 más parecidas. El resultado mostrado solo cambia cuando la misma seña gana
varias lecturas seguidas (~0,5 s).

**Siguiente paso (cuando haya ≥ 40 clips por vocal):**

1. Enriquecer las características: posición del pulgar respecto a los demás
   dedos, separación entre puntas y orientación de la palma. Las vocales A, E
   y O se distinguen sobre todo por el pulgar.
2. Entrenar un clasificador pequeño (MLP) sobre los puntos normalizados, en
   Python o TensorFlow.js, y exportarlo para el navegador. Debe pesar menos
   de 1 MB y responder en menos de 1 ms por cuadro.
3. **Evaluar separando por persona**: las personas del conjunto de prueba
   nunca deben aparecer en el de entrenamiento. Publicar precisión por vocal
   y la matriz de confusión antes de mostrar cualquier "% de acierto".
4. Para señas con movimiento (palabras, letras como J o Z) se usará la
   secuencia completa de cuadros con un modelo temporal (GRU/LSTM o
   Transformer pequeño). Por eso el dataset ya guarda secuencias y dos manos.
