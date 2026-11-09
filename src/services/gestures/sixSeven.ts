/**
 * Detector del gesto «six seven»: las dos manos con la palma hacia arriba, subiendo
 * y bajando por turnos (cuando una sube, la otra baja). Solo mira la altura de la
 * muñeca de cada mano en el último par de segundos, sin depender de la postura de
 * los dedos, así que sirve con la mano abierta o cerrada.
 */
export interface HandHeights {
  /** Milisegundos (reloj del navegador). */
  t: number;
  /** Altura de cada mano en la imagen (0 arriba, 1 abajo). */
  left: number;
  right: number;
}

/** Ventana de tiempo que se analiza. */
export const SIX_SEVEN_WINDOW_MS = 2500;
const MIN_SAMPLES = 12;
/** Cuánto debe subir y bajar cada mano (fracción del alto de la imagen). */
const MIN_RANGE = 0.04;
/** Tres subidas y bajadas de cada mano son cinco cambios de sentido (subir, bajar, subir, bajar, subir, bajar). */
const MIN_TURNS = 5;
/** Movimientos menores a esto se toman como temblor, no como cambio de sentido. */
const DEADBAND = 0.008;
/** Correlación máxima entre las dos manos: negativa significa que una sube mientras la otra baja. */
const MAX_CORRELATION = -0.2;

const mean = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length;

function turns(values: number[]): number {
  let count = 0;
  let direction = 0;
  let anchor = values[0];
  for (const v of values) {
    if (Math.abs(v - anchor) < DEADBAND) continue;
    const next = v > anchor ? 1 : -1;
    if (direction !== 0 && next !== direction) count++;
    direction = next;
    anchor = v;
  }
  return count;
}

function correlation(a: number[], b: number[]): number {
  const [ma, mb] = [mean(a), mean(b)];
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : 0;
}

/** ¿Las muestras recientes corresponden al six seven? Solo cuentan las de la ventana que termina en `now`. */
export function detectSixSeven(samples: HandHeights[], now: number): boolean {
  const recent = samples.filter((s) => now - s.t <= SIX_SEVEN_WINDOW_MS);
  if (recent.length < MIN_SAMPLES) return false;
  const left = recent.map((s) => s.left);
  const right = recent.map((s) => s.right);
  const range = (v: number[]) => Math.max(...v) - Math.min(...v);
  if (range(left) < MIN_RANGE || range(right) < MIN_RANGE) return false;
  if (turns(left) < MIN_TURNS || turns(right) < MIN_TURNS) return false;
  return correlation(left, right) <= MAX_CORRELATION;
}
