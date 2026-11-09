import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { JOINT_COUNT, extendedFingers, jointFlexions, palmFrame, type HandSide } from './handPose3d';

/**
 * Calibración de la mano de cada persona (una vez, en unos 8 segundos).
 *
 * Con la mano abierta y girándola despacio de lado a lado se miden dos cosas:
 *  - El largo de cada uno de los 15 huesos de los dedos, en unidades de palma. La
 *    guía de Aprender se arma con ellos, así que siempre cabe en esa mano.
 *  - La escala de la profundidad (z). MediaPipe estima z, no la mide, y su escala
 *    cambia con la cámara y la mano. Un hueso mide lo mismo girado o de frente; si
 *    al girar la mano el largo 3D cambia, z está mal escalada. Se busca el factor
 *    que deja los largos constantes, y con él las medidas en 3D siguen siendo
 *    proporcionales cuando la mano se gira.
 */

export interface HandCalibration {
  version: 1;
  /** Factor por el que se multiplica z (relativo a x) para que los huesos midan lo mismo al girar la mano. */
  zScale: number;
  /** Largo de los 15 huesos (5 dedos por 3), en unidades de palma. */
  bones: number[];
  /** Cuadros usados y grados de giro de la palma que se vieron. */
  frames: number;
  turnDegrees: number;
  createdAt: string;
  /** Flexión máxima que alcanzó cada una de las 15 articulaciones con el puño cerrado, en grados. */
  flexMax?: number[];
  /**
   * Razón entre lo que dobla esta persona y lo que piden las referencias (15 valores, 1 = igual). La guía se
   * acorta con ella y la mano en vivo se estira con su inverso, así la medida es proporcional a cada mano.
   */
  ratios?: number[];
  /** Pasos de la calibración guiada que se completaron (de 7). */
  stepsDone?: number;
}

export interface CalibrationFrame {
  landmarks: NormalizedLandmark[];
  aspect: number;
  side: HandSide;
}

const STORAGE_KEY = 'diversena.calibration.v1';
export const CALIBRATION_MIN_FRAMES = 30;
export const CALIBRATION_SECONDS = 8;

const CHAINS = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
] as const;

type Vec3 = [number, number, number];
const norm = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const diff = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const listeners = new Set<() => void>();
let cached: HandCalibration | null | undefined;

export function getCalibration(): HandCalibration | null {
  if (cached !== undefined) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cached = raw ? (JSON.parse(raw) as HandCalibration) : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function saveCalibration(calibration: HandCalibration | null): void {
  cached = calibration;
  try {
    if (calibration) localStorage.setItem(STORAGE_KEY, JSON.stringify(calibration));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Almacenamiento bloqueado: la calibración dura lo que dure la pestaña.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeCalibration(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Factor de escala de z de la persona (1 si no se calibró). */
export function currentZScale(): number {
  return getCalibration()?.zScale ?? 1;
}

/** ¿Sirve este cuadro para calibrar? Mano abierta (4 dedos extendidos): así se ven todos los huesos. */
export function isCalibrationFrame(landmarks: NormalizedLandmark[]): boolean {
  return extendedFingers(landmarks) >= 4;
}

function world(frame: CalibrationFrame, zScale: number): Vec3[] {
  return frame.landmarks.map((p) => [p.x * frame.aspect, p.y, (p.z ?? 0) * frame.aspect * zScale]);
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const mean = (values: number[]) => values.reduce((s, x) => s + x, 0) / values.length;

/** Giro mínimo (en grados) para fiarse de la profundidad: con menos, la mano casi no se movió y z sería solo ruido. */
const MIN_TURN_TO_FIT_Z = 12;

/** Grados de giro de la palma vistos en los cuadros (percentil 90 del ángulo entre la normal de cada cuadro y la normal más frecuente). */
function palmTurnDegrees(frames: CalibrationFrame[], zScale: number): number {
  const normals: Vec3[] = frames.map((frame) => {
    const w = world(frame, zScale);
    const u = diff(w[5], w[0]);
    const v = diff(w[17], w[0]);
    const n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = norm(n) || 1;
    return [n[0] / len, n[1] / len, n[2] / len];
  });
  const mid: Vec3 = [median(normals.map((n) => n[0])), median(normals.map((n) => n[1])), median(normals.map((n) => n[2]))];
  const midLen = norm(mid) || 1;
  const angles = normals.map((n) => (Math.acos(Math.min(1, Math.max(-1, Math.abs(n[0] * mid[0] + n[1] * mid[1] + n[2] * mid[2]) / midLen))) * 180) / Math.PI);
  return [...angles].sort((x, y) => x - y)[Math.floor(angles.length * 0.9)];
}

/**
 * Ajusta la calibración con los cuadros de la mano abierta girando. Devuelve null
 * si no hay suficientes cuadros.
 *
 * Para cada hueso, el largo al cuadrado es dx² + dy² + k²·dz². Si k es el bueno, no
 * cambia de un cuadro a otro; se busca k² por mínimos cuadrados con la variación de
 * dz² contra la de dx² + dy² dentro de cada hueso. Si la mano casi no giró, dz² casi
 * no varía y no se puede saber k: se deja en 1.
 */
export function fitCalibration(frames: CalibrationFrame[], minFrames = CALIBRATION_MIN_FRAMES): HandCalibration | null {
  if (frames.length < minFrames) return null;
  const bonesCount = CHAINS.length * 3;
  const flat: Array<{ d2: number[]; dz2: number[] }> = Array.from({ length: bonesCount }, () => ({ d2: [], dz2: [] }));
  const palmLengths: number[] = [];
  for (const frame of frames) {
    const w = world(frame, 1);
    palmLengths.push(norm(diff(w[9], w[0])));
    CHAINS.forEach((chain, f) => {
      for (let i = 0; i < 3; i++) {
        const a = w[chain[i]];
        const b = w[chain[i + 1]];
        flat[f * 3 + i].d2.push((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
        flat[f * 3 + i].dz2.push((b[2] - a[2]) ** 2);
      }
    });
  }
  let cov = 0;
  let varZ = 0;
  for (const { d2, dz2 } of flat) {
    const md = mean(d2);
    const mz = mean(dz2);
    for (let t = 0; t < d2.length; t++) {
      cov += (d2[t] - md) * (dz2[t] - mz);
      varZ += (dz2[t] - mz) ** 2;
    }
  }
  // Hace falta giro de verdad para estimar z: si dz² casi no varía frente a la palma, no se toca.
  const spread = Math.sqrt(varZ / (frames.length * bonesCount));
  const enoughTurn = spread > 0.0001 * median(palmLengths) ** 2;
  // Además del tamaño de la variación, la palma tiene que haber girado de verdad (con la mano casi quieta, z solo es ruido).
  const turnWithoutFit = palmTurnDegrees(frames, 1);
  const k2 = enoughTurn && turnWithoutFit >= MIN_TURN_TO_FIT_Z && varZ > 0 ? -cov / varZ : 1;
  const zScale = Math.min(2.5, Math.max(0.4, k2 > 0 ? Math.sqrt(k2) : 1));

  const perBone: number[][] = Array.from({ length: bonesCount }, () => []);
  for (const frame of frames) {
    const w = world(frame, zScale);
    const palm = norm(diff(w[9], w[0])) || 1;
    CHAINS.forEach((chain, f) => {
      for (let i = 0; i < 3; i++) perBone[f * 3 + i].push(norm(diff(w[chain[i + 1]], w[chain[i]])) / palm);
    });
  }

  const turn = palmTurnDegrees(frames, zScale);

  return {
    version: 1,
    zScale: Math.round(zScale * 1000) / 1000,
    bones: perBone.map((values) => Math.round(median(values) * 10000) / 10000),
    frames: frames.length,
    turnDegrees: Math.round(turn),
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Calibración guiada: siete posturas, cada una con un objetivo y su check
// ---------------------------------------------------------------------------

/**
 * Flexión máxima (grados) que piden las cinco vocales de referencia en cada articulación, medida con el mismo
 * estimador que mide a la persona. Con ella se sabe cuánto de lo que pide la guía alcanza a doblar esta mano.
 */
export const REFERENCE_FLEX_MAX = [37, 42, 113, 54, 143, 49, 51, 140, 55, 45, 145, 46, 51, 146, 59];
/** Articulaciones que piden menos de esto casi no se doblan: se dejan sin ajustar para no amplificar el ruido. */
const MIN_FLEX_TO_ADJUST = 60;
/** Con 0,75 la mano en vivo se estira como máximo un tercio (1/0,75): un puño suave no sesga las vocales. */
const MIN_RATIO = 0.85;

/** Razón de flexión de cada articulación a partir de la flexión máxima medida en el puño. */
export function flexRatios(flexMax: number[]): number[] {
  return REFERENCE_FLEX_MAX.map((reference, j) => {
    if (reference < MIN_FLEX_TO_ADJUST || !Number.isFinite(flexMax[j])) return 1;
    return Math.min(1, Math.max(MIN_RATIO, flexMax[j] / reference));
  });
}

/** Normal de la palma (vector unitario) con z sin ajustar; sirve para medir cuánto giró la mano entre dos cuadros. */
export function palmNormal(landmarks: NormalizedLandmark[], aspect: number): Vec3 {
  const w = world({ landmarks, aspect, side: 'derecha' }, 1);
  const u = diff(w[5], w[0]);
  const v = diff(w[17], w[0]);
  const n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = norm(n) || 1;
  return [n[0] / len, n[1] / len, n[2] / len];
}

function angleBetween(a: Vec3, b: Vec3): number {
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return (Math.acos(Math.min(1, Math.max(-1, d))) * 180) / Math.PI;
}

export type CalibrationStepId = 'open' | 'turn45' | 'turn90' | 'turn180' | 'fist' | 'spread' | 'thumb';

export interface CalibrationStep {
  id: CalibrationStepId;
  /** Texto corto para la lista de pasos. */
  label: string;
  title: string;
  hint: string;
  /** Qué se mide con este paso, para explicarlo a la persona. */
  purpose: string;
}

export const CALIBRATION_STEPS: CalibrationStep[] = [
  { id: 'open', label: 'Mano abierta', title: 'Extiende la mano completamente', hint: 'Palma hacia la cámara, dedos abiertos. Mantén la mano quieta un momento.', purpose: 'Mide el tamaño de tu mano y el largo de cada dedo.' },
  { id: 'turn45', label: 'Giro de 45°', title: 'Gira la mano unos 45°', hint: 'Mano abierta: gírala un poco hacia un lado, como si fueras a mostrar el borde.', purpose: 'Muestra cómo se ve tu mano cuando no está de frente.' },
  { id: 'turn90', label: 'De canto', title: 'Ponla de canto, a 90°', hint: 'Sigue girando hasta ver la mano de lado, con la palma hacia un costado.', purpose: 'Ayuda a medir cómo cambia tu mano al girar.' },
  { id: 'turn180', label: 'El dorso', title: 'Muestra el dorso, 180°', hint: 'Termina el giro: ahora la cámara ve el dorso de tu mano (el lado de las uñas).', purpose: 'Completa el giro para que la comparación funcione mejor con tu mano girada.' },
  { id: 'fist', label: 'Puño', title: 'Cierra el puño completo', hint: 'Cierra los cuatro dedos hasta donde llegues con naturalidad. Mantén la mano quieta un momento.', purpose: 'Mide cuánto dobla cada articulación de tus dedos.' },
  { id: 'spread', label: 'Dedos estirados', title: 'Abre y estira los dedos al máximo', hint: 'Desde el puño, abre la mano y sepáralos todo lo que puedas.', purpose: 'Mide hasta dónde estiras y separas cada dedo.' },
  { id: 'thumb', label: 'Pulgar', title: 'Mueve el pulgar: afuera y adentro', hint: 'Sepáralo lo más que puedas de la mano y luego llévalo sobre la palma.', purpose: 'Mide el recorrido de tu pulgar, que es el que más varía entre personas.' },
];

/** Cuadros seguidos que sostienen una postura para darla por buena. */
const HOLD_FRAMES = 10;
/** Grados de giro de la palma (frente a la postura de frente) que exige cada paso de giro. */
const TURN_REQUIRED: Partial<Record<CalibrationStepId, [number, number]>> = { turn45: [28, 80], turn90: [60, 130], turn180: [130, 181] };
/** Separación mínima entre la punta del índice y la del meñique (en palmas) para dar por buena la mano estirada y abierta. */
const SPREAD_MIN = 0.9;
/** Distancia pulgar a base del índice (en palmas): afuera y adentro. */
const THUMB_OUT = 0.75;
const THUMB_IN = 0.45;

export interface CalibrationRun {
  /** Paso actual (0 a 6); igual al total cuando terminaron todos. */
  index: number;
  /** Avance del paso actual, de 0 a 1. */
  progress: number;
  hold: number;
  /** Pasos ya completados (true) u omitidos (false). */
  done: boolean[];
  reference: Vec3 | null;
  /** Giro actual de la palma respecto a la postura de frente, en grados. */
  turn: number;
  thumbOut: boolean;
  thumbIn: boolean;
  /** Cuadros de mano abierta (con los que se ajustan huesos y profundidad) y de puño (con los que se mide la flexión). */
  openFrames: CalibrationFrame[];
  fistFrames: CalibrationFrame[];
}

export function startRun(): CalibrationRun {
  return { index: 0, progress: 0, hold: 0, done: [], reference: null, turn: 0, thumbOut: false, thumbIn: false, openFrames: [], fistFrames: [] };
}

export const isRunFinished = (run: CalibrationRun) => run.index >= CALIBRATION_STEPS.length;

/** Pasa al paso siguiente; `completed` es false si la persona lo omitió. */
export function skipStep(run: CalibrationRun, completed = false): CalibrationRun {
  if (isRunFinished(run)) return run;
  return { ...run, index: run.index + 1, progress: 0, hold: 0, thumbOut: false, thumbIn: false, done: [...run.done, completed] };
}

const dist = (landmarks: NormalizedLandmark[], aspect: number, a: number, b: number) =>
  norm(diff([landmarks[a].x * aspect, landmarks[a].y, (landmarks[a].z ?? 0) * aspect], [landmarks[b].x * aspect, landmarks[b].y, (landmarks[b].z ?? 0) * aspect]));

/** Guarda el cuadro donde corresponde: la mano abierta sirve para huesos y profundidad; el puño, para la flexión. */
function collect(run: CalibrationRun, frame: CalibrationFrame, id: CalibrationStepId): Partial<CalibrationRun> {
  if (id === 'fist') return { fistFrames: [...run.fistFrames, frame] };
  if (id === 'thumb') return {};
  return { openFrames: [...run.openFrames, frame] };
}

function finish(run: CalibrationRun, frame: CalibrationFrame, id: CalibrationStepId): Partial<CalibrationRun> {
  return {
    ...collect(run, frame, id),
    index: run.index + 1,
    progress: 0,
    hold: 0,
    thumbOut: false,
    thumbIn: false,
    done: [...run.done, true],
    // El primer paso fija la postura «de frente» contra la que se miden los giros.
    reference: id === 'open' ? palmNormal(frame.landmarks, frame.aspect) : run.reference,
  };
}

/**
 * Avanza la calibración con una lectura nueva (o con ninguna mano). Función pura:
 * devuelve el estado siguiente. Cada paso se da por bueno al sostener su postura
 * unos cuadros seguidos (o, en el pulgar, al alcanzar los dos extremos).
 */
export function advanceRun(run: CalibrationRun, frame: CalibrationFrame | null): CalibrationRun {
  if (isRunFinished(run)) return run;
  const step = CALIBRATION_STEPS[run.index];
  if (!frame) return { ...run, hold: 0, progress: step.id === 'thumb' ? run.progress : 0 };

  const { landmarks, aspect } = frame;
  const extended = extendedFingers(landmarks);
  // Si se omitió el primer paso no hay postura «de frente»: se toma la de este cuadro, para que los giros se puedan medir.
  const reference = run.reference ?? palmNormal(landmarks, aspect);
  const turn = angleBetween(palmNormal(landmarks, aspect), reference);
  const palm = dist(landmarks, aspect, 0, 9) || 1;
  const next: CalibrationRun = { ...run, reference, turn: Math.round(turn) };

  if (step.id === 'thumb') {
    const d = dist(landmarks, aspect, 4, 5) / palm;
    const thumbOut = run.thumbOut || d >= THUMB_OUT;
    const thumbIn = run.thumbIn || d <= THUMB_IN;
    if (thumbOut && thumbIn) return { ...next, ...finish(next, frame, 'thumb') };
    return { ...next, thumbOut, thumbIn, progress: ((thumbOut ? 1 : 0) + (thumbIn ? 1 : 0)) / 2 };
  }

  // La postura que pide el paso, cuadro por cuadro.
  let fits = false;
  if (step.id === 'open') fits = extended >= 4;
  else if (step.id === 'fist') fits = extended === 0;
  else if (step.id === 'spread') fits = extended >= 4 && dist(landmarks, aspect, 8, 20) / palm >= SPREAD_MIN;
  else {
    const [min, max] = TURN_REQUIRED[step.id] ?? [0, 181];
    fits = extended >= 3 && turn >= min && turn <= max;
  }

  if (!fits) return { ...next, hold: 0, progress: 0 };
  const hold = run.hold + 1;
  if (hold >= HOLD_FRAMES) return { ...next, ...finish(next, frame, step.id) };
  return { ...next, hold, progress: hold / HOLD_FRAMES, ...collect(next, frame, step.id) };
}

const MIN_OPEN_FRAMES = 8;

const percentile = (values: number[], p: number) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
};

/**
 * Calibración final con lo que recogió la sesión guiada. Devuelve null si no hubo
 * suficientes cuadros de mano abierta. Si faltó el puño (paso omitido), la flexión
 * queda sin ajustar (razones en 1).
 */
export function finalizeRun(run: CalibrationRun): HandCalibration | null {
  // Con pocos cuadros de mano abierta (pasos de giro omitidos) igual se miden los huesos; la profundidad queda sin ajustar.
  const base = fitCalibration(run.openFrames, MIN_OPEN_FRAMES);
  if (!base) return null;
  let flexMax: number[] | undefined;
  if (run.fistFrames.length >= 5) {
    const perJoint: number[][] = Array.from({ length: JOINT_COUNT }, () => []);
    for (const f of run.fistFrames) {
      jointFlexions(palmFrame(f.landmarks, f.aspect, f.side, base.zScale)).forEach((deg, j) => {
        if (Number.isFinite(deg)) perJoint[j].push(deg);
      });
    }
    flexMax = perJoint.map((values) => (values.length > 0 ? Math.round(percentile(values, 0.9)) : NaN));
  }
  return {
    ...base,
    flexMax,
    ratios: flexMax ? flexRatios(flexMax) : new Array(JOINT_COUNT).fill(1),
    stepsDone: run.done.filter(Boolean).length,
  };
}
