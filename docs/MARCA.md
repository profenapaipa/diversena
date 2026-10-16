# Identidad de marca DiverSeña

Guía para que todo lo que se diseñe (la app, presentaciones, redes,
impresos) se vea como una misma marca.

## Idea central

**La lengua de señas se ve.** El símbolo es el ojo del boceto original del
equipo (el ojo entre dos manos), dibujado con los colores de la bandera de la
comunidad Sorda. La "firma visual" secundaria es la mano dibujada con sus 21
puntos, que es exactamente lo que ve la cámara de DiverSeña.

## Colores

Vienen de la bandera de la comunidad Sorda. Cada uno tiene un significado y
se usa con ese sentido:

| Token | Color | Significado | Uso |
| --- | --- | --- | --- |
| `--brand-navy` | `#1d2394` | Humanidad, unión, liderazgo | Botones principales, fondo del símbolo, bloques destacados |
| `--brand-sky` | `#2f9be6` | Color mundial de la comunidad Sorda | Ondas, líneas de la mano, barras de avance |
| `--brand-sky-ink` | `#0b6cb8` | (variante legible del azul claro) | Enlaces, etiquetas pequeñas y textos en azul sobre fondo claro |
| `--brand-sun` | `#ffd83d` | Luz, convivencia | Solo para acentos: la letra reconocida, los números de los pasos, las puntas de los dedos |

Reglas:

- El amarillo es un acento: nunca se usa para texto sobre fondo blanco (no
  se lee). Sobre amarillo siempre va texto azul oscuro `#151a6e`.
- Los colores de estado (verde = cumplido, ámbar = en progreso, rojo = falta)
  son aparte de la marca: no se reemplazan por los colores de la bandera.
- La app tiene modo claro y oscuro automáticos. Todos los colores están
  definidos como tokens en `src/index.css`; no se escriben colores sueltos en
  los componentes.

## Tipografía

| Rol | Fuente | Por qué |
| --- | --- | --- |
| Títulos | **Lexend** (600–700) | Diseñada para facilitar la lectura; tiene carácter sin perder claridad |
| Texto | **Atkinson Hyperlegible** (400/700) | Creada por el Braille Institute para personas con baja visión: cada letra se distingue de las demás |

Ambas son gratuitas (Google Fonts).

## Símbolo y logotipo

- Componente: `src/components/brand/Logo.tsx` (`<LogoMark />` y `<Logo />`).
  Favicon: `public/favicon.svg`.
- El nombre se escribe **DiverSeña**, con D y S mayúsculas y la ñ. En el
  logotipo, "Seña" va en azul claro.
- Dejar alrededor del símbolo un espacio libre igual a la mitad de su ancho.
  No estirarlo, girarlo ni cambiarle los colores.

## Formas

- Esquinas redondeadas (0.55 a 1.5 rem). Botones en forma de píldora.
- Ondas suaves de azul claro, tomadas del boceto del equipo, solo en la
  portada.
- Franja de tres colores (azul oscuro, azul claro y amarillo) bajo el
  encabezado.

## Voz y tono

- Cercana y clara, de tú: "Haz la seña", "Muestra tu mano".
- **Persona Sorda** (con S mayúscula cuando se habla de la comunidad y su
  identidad cultural). No usar "sordomudo" ni "lenguaje de señas": se dice
  **lengua de señas**, porque es una lengua completa.
- Nunca presentar una seña como universal: siempre decir de qué lengua es
  (LSC, LSM, LSEC).
- Honestidad sobre la tecnología: hablar de "parecido con la referencia",
  no de "precisión", hasta que el modelo esté evaluado.
