import type { FingerName, HandFeatureVector } from '../../models/handFeatures';

const FINGER_NAMES: FingerName[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

// Escalas para poner ángulo (grados) y distancia (unidades normalizadas) en
// una misma magnitud antes de comparar: sin esto, los grados (0-180)
// dominarían por completo la distancia geométrica.
const CURL_SCALE = 180;
const DISTANCE_SCALE = 2;

// Distancia euclidiana máxima posible entre dos vectores de 10 dimensiones
// ya escaladas a [0,1]: sqrt(10). Se usa para convertir distancia en
// "similitud" 0-1.
const MAX_DISTANCE = Math.sqrt(FINGER_NAMES.length * 2);

/** Por debajo de esta similitud, se considera que no hay evidencia suficiente. */
export const CONFIDENCE_FLOOR = 0.55;

function distance(a: HandFeatureVector, b: HandFeatureVector): number {
  let sumSquares = 0;
  for (const finger of FINGER_NAMES) {
    const curlDiff = (a.fingerCurl[finger] - b.fingerCurl[finger]) / CURL_SCALE;
    const distDiff = (a.fingertipDistance[finger] - b.fingertipDistance[finger]) / DISTANCE_SCALE;
    sumSquares += curlDiff * curlDiff + distDiff * distDiff;
  }
  return Math.sqrt(sumSquares);
}

/**
 * Similitud geométrica a la referencia más cercana, como valor 0-1. Es una
 * medida heurística de parecido de forma, no una probabilidad estadística
 * ni una certeza de que la seña se ejecutó "correctamente" (sección 25) —
 * documentar esto donde se muestre al usuario.
 */
export function similarityTo(live: HandFeatureVector, reference: HandFeatureVector): number {
  const d = distance(live, reference);
  return Math.max(0, 1 - d / MAX_DISTANCE);
}

export interface SignMatch<TSign> {
  sign: TSign;
  confidence: number;
}

/**
 * Compara `live` contra cada entrada de `candidates` (letra → referencia) y
 * devuelve la más parecida, o `null` si ninguna referencia existe o ninguna
 * supera `CONFIDENCE_FLOOR` — nunca se inventa un resultado sin evidencia.
 */
export function classifyAgainstReferences<TSign>(
  live: HandFeatureVector,
  candidates: Array<{ sign: TSign; reference: HandFeatureVector | null }>,
): SignMatch<TSign> | null {
  let best: SignMatch<TSign> | null = null;

  for (const { sign, reference } of candidates) {
    if (!reference) continue;
    const confidence = similarityTo(live, reference);
    if (!best || confidence > best.confidence) {
      best = { sign, confidence };
    }
  }

  if (!best || best.confidence < CONFIDENCE_FLOOR) return null;
  return best;
}
