import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { extendedFingers, type HandSide } from './handPose3d';

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
export function fitCalibration(frames: CalibrationFrame[]): HandCalibration | null {
  if (frames.length < CALIBRATION_MIN_FRAMES) return null;
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
