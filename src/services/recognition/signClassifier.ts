import type { FingerName, HandFeatureVector } from '../../models/handFeatures';
import { MAX_EXTENDED_FOR_VOWEL, poseDistance } from './handPose3d';

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

/**
 * Por debajo de esta similitud, se considera que no hay evidencia suficiente.
 *
 * Calibrado con los videos del Equipo 6 (nov. 2026): con 0,55 la mano
 * abierta de descanso se mostraba como alguna vocal en el 99 % de los
 * cuadros, porque casi cualquier mano supera ese parecido. Con 0,85 baja al
 * 6 % y las vocales siguen pasando en el 99 % de los cuadros (prueba con la
 * otra mano). Revisar cuando el dataset tenga más personas: con manos
 * nuevas el parecido baja y quizá convenga 0,8.
 */
export const CONFIDENCE_FLOOR = 0.85;

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
  if (live.pose3d) {
    if ((live.extended ?? 0) > MAX_EXTENDED_FOR_VOWEL) return null;
    const scores = scorePose3d(live.pose3d, candidates);
    if (scores) {
      const best = scores.reduce((a, b) => (b.confidence > a.confidence ? b : a));
      return best.confidence >= POSE3D_FLOOR ? best : null;
    }
  }
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

/** Similitud mínima para proponer una seña como sugerencia ("¿quizás quisiste decir…?"). */
export const SUGGESTION_FLOOR = 0.4;

/**
 * Señas ordenadas de la más a la menos parecida (por su referencia más
 * cercana), solo las que superan `SUGGESTION_FLOOR`. Sirve para sugerir
 * opciones cuando el reconocimiento no está seguro, en vez de no decir nada.
 */
export function rankSigns<TSign>(
  live: HandFeatureVector,
  candidates: Array<{ sign: TSign; references: HandFeatureVector[] }>,
  limit = 3,
): Array<SignMatch<TSign>> {
  if (live.pose3d) {
    if ((live.extended ?? 0) > MAX_EXTENDED_FOR_VOWEL) return [];
    const scores = scorePose3d(live.pose3d, candidates);
    if (scores) {
      return scores
        .filter((match) => match.confidence >= POSE3D_SUGGESTION_FLOOR)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);
    }
  }
  const ranked: Array<SignMatch<TSign>> = [];
  for (const { sign, references } of candidates) {
    let best = 0;
    for (const reference of references) best = Math.max(best, similarityTo(live, reference));
    if (references.length > 0 && best >= SUGGESTION_FLOOR) ranked.push({ sign, confidence: best });
  }
  return ranked.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Parecido con la descripción 3D (ver handPose3d.ts)
// ---------------------------------------------------------------------------

/**
 * Ancho del parecido: a esta distancia (en el espacio de 40 medidas) el parecido
 * de una seña cae a 37 %. Calibrado con el análisis 3D del equipo: una seña
 * bien hecha, con la otra mano o girada 45°, queda en 0,2 a 0,9 de distancia.
 */
export const POSE3D_WIDTH = 0.9;

/**
 * Parecido mínimo para mostrar una vocal. Con 0,7 y el ancho de arriba, las
 * vocales se aceptan en el 84 % de los cuadros (63 % con la mano girada 45° y
 * ruido en z) y una mano abierta se muestra como vocal en el 4 %; además, con
 * tres o más dedos extendidos nunca se muestra una vocal, y la votación en el
 * tiempo baja el resto.
 */
export const POSE3D_FLOOR = 0.7;
export const POSE3D_SUGGESTION_FLOOR = 0.25;

/**
 * Parecido de la lectura a cada seña. Cada seña se mide por su referencia más
 * cercana y el parecido es s = exp(-(d / ancho)^2). Además se reparte entre
 * las señas (p = s / suma de s): si dos vocales se parecen casi igual, ninguna
 * gana con fuerza. Lo que se muestra es la media geométrica de s y p, así un
 * porcentaje alto exige estar cerca de UNA vocal y lejos de las demás; antes
 * una mano casi cualquiera daba más de 85 % con varias letras. Devuelve null
 * si ninguna seña tiene referencias con descripción 3D (referencias antiguas).
 */
function scorePose3d<TSign>(
  live: number[],
  candidates: Array<{ sign: TSign; references: HandFeatureVector[] }>,
): Array<SignMatch<TSign>> | null {
  const near = candidates.map(({ sign, references }) => {
    let best = Infinity;
    for (const reference of references) {
      if (reference.pose3d) best = Math.min(best, poseDistance(live, reference.pose3d));
    }
    return { sign, best };
  });
  const usable = near.filter((n) => Number.isFinite(n.best));
  if (usable.length === 0) return null;
  const s = usable.map((n) => Math.exp(-((n.best / POSE3D_WIDTH) ** 2)));
  const total = s.reduce((a, b) => a + b, 0) + 1e-9;
  return usable.map((n, i) => ({ sign: n.sign, confidence: Math.sqrt(s[i] * (s[i] / total)) }));
}
