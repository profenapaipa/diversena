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

/** Cuántas referencias más cercanas votan en el clasificador k-NN. */
export const K_NEIGHBORS = 5;

/**
 * k vecinos más cercanos: compara `live` contra TODAS las referencias de
 * todas las señas candidatas, toma las `K_NEIGHBORS` más parecidas y gana la
 * seña con más similitud acumulada entre ellas. Con muchos clips de
 * entrenamiento por seña (distintas personas, manos, luces) esto es mucho
 * más estable que comparar contra una única referencia.
 *
 * La confianza es la similitud de la referencia más cercana de la seña
 * ganadora. Devuelve `null` si no hay referencias o ninguna supera
 * `CONFIDENCE_FLOOR` — nunca se inventa un resultado sin evidencia.
 */
export function classifyWithReferenceSet<TSign>(
  live: HandFeatureVector,
  candidates: Array<{ sign: TSign; references: HandFeatureVector[] }>,
): SignMatch<TSign> | null {
  const scored: Array<{ index: number; similarity: number }> = [];
  candidates.forEach(({ references }, index) => {
    for (const reference of references) {
      scored.push({ index, similarity: similarityTo(live, reference) });
    }
  });
  if (scored.length === 0) return null;

  scored.sort((a, b) => b.similarity - a.similarity);
  const neighbors = scored.slice(0, K_NEIGHBORS).filter((n) => n.similarity >= CONFIDENCE_FLOOR);
  if (neighbors.length === 0) return null;

  const votes = new Map<number, { weight: number; best: number }>();
  for (const { index, similarity } of neighbors) {
    const entry = votes.get(index) ?? { weight: 0, best: 0 };
    entry.weight += similarity;
    entry.best = Math.max(entry.best, similarity);
    votes.set(index, entry);
  }

  let winner: { index: number; weight: number; best: number } | null = null;
  for (const [index, entry] of votes) {
    if (!winner || entry.weight > winner.weight) winner = { index, ...entry };
  }
  if (!winner) return null;
  return { sign: candidates[winner.index].sign, confidence: winner.best };
}

/** Variante con una sola referencia (o ninguna) por seña. */
export function classifyAgainstReferences<TSign>(
  live: HandFeatureVector,
  candidates: Array<{ sign: TSign; reference: HandFeatureVector | null }>,
): SignMatch<TSign> | null {
  return classifyWithReferenceSet(
    live,
    candidates.map(({ sign, reference }) => ({ sign, references: reference ? [reference] : [] })),
  );
}
