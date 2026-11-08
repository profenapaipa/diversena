import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/**
 * Descripción de la mano en 3D que no cambia cuando la mano se muestra desde
 * otro ángulo.
 *
 * Por qué existe: con solo x e y, una mano girada hacia un lado (o inclinada
 * hacia la cámara) se ve "acortada" y sus medidas cambian, así que una vocal
 * hecha de lado se parece a otra. MediaPipe entrega también z (profundidad
 * relativa, en la misma escala de x). Con x, y, z se arma un marco de
 * referencia pegado a la palma y se miden las puntas y las articulaciones en
 * ese marco; al girar la mano, el marco gira con ella y las medidas quedan
 * iguales. El análisis que lo respalda (giros de 0 a 60° con ruido en z, entre
 * mano derecha e izquierda) está en entrenamiento/analisis3d del equipo.
 *
 * Pasos:
 *  1. Corregir la proporción de la imagen: x y z vienen normalizados por el
 *     ancho e y por el alto; se pasan todos a unidades de alto. Sin esto, una
 *     cámara 4:3 y un video 16:9 deforman la mano de forma distinta (esto
 *     también era un error del método anterior).
 *  2. Muñeca como origen y escala = distancia muñeca a nudillo medio (en 3D).
 *  3. Eje 1 = muñeca a nudillo medio; eje 3 = normal de la palma (índice por
 *     meñique); eje 2 completa el marco.
 *  4. Una mano izquierda se refleja respecto al plano de la palma, para que
 *     las dos manos se describan igual (medido: 94 y 99 % de acierto entre
 *     una mano y la otra; reflejar el eje lateral daba 60 y 77 %).
 */

export type HandSide = 'derecha' | 'izquierda';

type Vec3 = [number, number, number];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => scale(a, 1 / (norm(a) || 1));

/** Cadenas de landmarks por dedo: base, articulación media, distal y punta. */
const CHAINS = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
] as const;

/** Peso de las posiciones y de los ángulos en la distancia (calibrado en el análisis 3D). */
const POSITION_WEIGHT = 1;
const ANGLE_WEIGHT = 1.5;

/** Proporción (ancho/alto) que se asume si no se conoce: la cámara de la app graba a 640 x 480. */
export const DEFAULT_ASPECT = 4 / 3;

/** Marco de la palma de una mano en el espacio de la imagen (unidades de alto). */
export interface PalmBasis {
  origin: Vec3;
  size: number;
  e1: Vec3;
  e2: Vec3;
  e3: Vec3;
  mirror: 1 | -1;
}

export function palmBasis(landmarks: NormalizedLandmark[], aspect: number, side: HandSide): PalmBasis {
  const world: Vec3[] = landmarks.map((p) => [p.x * aspect, p.y, (p.z ?? 0) * aspect]);
  const origin = world[0];
  const rel = world.map((p) => sub(p, origin));
  const size = norm(rel[9]) || 1;
  const e1 = unit(rel[9]);
  const n = cross(rel[5], rel[17]);
  const e3 = unit(sub(n, scale(e1, dot(n, e1))));
  const e2 = cross(e3, e1);
  return { origin, size, e1, e2, e3, mirror: side === 'izquierda' ? -1 : 1 };
}

/** Los 21 puntos en el marco de la palma, ya normalizados por el tamaño de la mano. */
export function palmFrame(landmarks: NormalizedLandmark[], aspect: number, side: HandSide): Vec3[] {
  const { origin, size, e1, e2, e3, mirror } = palmBasis(landmarks, aspect, side);
  return landmarks.map((p) => {
    const r = sub([p.x * aspect, p.y, (p.z ?? 0) * aspect], origin);
    return [dot(r, e1) / size, dot(r, e2) / size, (dot(r, e3) / size) * mirror];
  });
}

/**
 * Pone una pose guardada en el marco de la palma (por ejemplo la de la foto
 * oficial del INSOR) encima de la mano en vivo: mismo tamaño, misma posición
 * de muñeca y misma orientación 3D. Devuelve puntos normalizados de la imagen
 * (x por el ancho, y por el alto) listos para dibujar. Si la mano se gira, la
 * guía se gira con ella: lo único que queda distinto es la forma de los dedos.
 */
export function projectPose(pose: Vec3[], live: PalmBasis, aspect: number): Array<{ x: number; y: number }> {
  return pose.map(([c1, c2, c3]) => {
    const k3 = c3 * live.mirror;
    const x = live.origin[0] + live.size * (c1 * live.e1[0] + c2 * live.e2[0] + k3 * live.e3[0]);
    const y = live.origin[1] + live.size * (c1 * live.e1[1] + c2 * live.e2[1] + k3 * live.e3[1]);
    return { x: x / aspect, y };
  });
}

const FINGER_LABELS = ['pulgar', 'índice', 'medio', 'anular', 'meñique'] as const;
const TIPS = [4, 8, 12, 16, 20] as const;

/** Distancia de cada punta de la mano en vivo a la de la guía, en tamaños de palma (mismo marco). */
export function tipErrors(live: Vec3[], target: Vec3[]): Array<{ finger: (typeof FINGER_LABELS)[number]; error: number }> {
  return TIPS.map((tip, i) => ({ finger: FINGER_LABELS[i], error: norm(sub(live[tip], target[tip])) }));
}

function angleAt(a: Vec3, vertex: Vec3, b: Vec3): number {
  const u = sub(a, vertex);
  const w = sub(b, vertex);
  return Math.acos(Math.min(1, Math.max(-1, dot(u, w) / ((norm(u) || 1) * (norm(w) || 1))))) / Math.PI;
}

/**
 * Vector de 40 valores: posición 3D de las 5 puntas y de las 5 articulaciones
 * distales en el marco de la palma (30) y 10 ángulos de articulación (dos por
 * dedo). Se compara con distancia euclidiana.
 */
export function describePose3d(landmarks: NormalizedLandmark[], aspect: number = DEFAULT_ASPECT, side: HandSide = 'derecha'): number[] {
  const c = palmFrame(landmarks, aspect, side);
  const out: number[] = [];
  for (const chain of CHAINS) out.push(...c[chain[3]].map((v) => v * POSITION_WEIGHT));
  for (const chain of CHAINS) out.push(...c[chain[2]].map((v) => v * POSITION_WEIGHT));
  for (const [p, q, r, s] of CHAINS) {
    out.push(angleAt(c[p], c[q], c[r]) * ANGLE_WEIGHT, angleAt(c[q], c[r], c[s]) * ANGLE_WEIGHT);
  }
  return out;
}

/**
 * Cuántos dedos largos están extendidos (la punta más lejos de la muñeca que su
 * propio nudillo). Ninguna vocal de la LSC se hace con tres o más extendidos
 * (la U lleva dos): con la mano abierta no hay vocal que mostrar. En las
 * grabaciones del equipo, 437 cuadros de mano abierta de descanso estaban
 * etiquetados como E y hacían que la E "se pareciera" a casi cualquier mano.
 */
export function extendedFingers(landmarks: NormalizedLandmark[]): number {
  const w = landmarks[0];
  const far = (i: number) => Math.hypot(landmarks[i].x - w.x, landmarks[i].y - w.y);
  return ([[8, 5], [12, 9], [16, 13], [20, 17]] as const).filter(([tip, knuckle]) => far(tip) > far(knuckle) * 1.15).length;
}

/** Máximo de dedos extendidos que admite una vocal. */
export const MAX_EXTENDED_FOR_VOWEL = 2;

export function poseDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}
