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

const FINGER_LABELS = ['pulgar', 'índice', 'medio', 'anular', 'meñique'] as const;

/** Cadenas de landmarks por dedo: base, articulación media, distal y punta. */
const CHAINS = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
] as const;

/** Peso de las direcciones de los huesos y de los ángulos en la distancia (calibrado en el análisis 3D). */
const DIRECTION_WEIGHT = 1;
const ANGLE_WEIGHT = 1.5;

/** Alias con el que van en el dataset las fotos oficiales del Diccionario de LSC del INSOR. */
export const OFFICIAL_ALIAS = 'insor-referencia';

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



function angleAt(a: Vec3, vertex: Vec3, b: Vec3): number {
  const u = sub(a, vertex);
  const w = sub(b, vertex);
  return Math.acos(Math.min(1, Math.max(-1, dot(u, w) / ((norm(u) || 1) * (norm(w) || 1))))) / Math.PI;
}

/**
 * Vector de 55 valores calculado desde el marco de la palma: la dirección (vector
 * unitario) de cada uno de los 15 huesos de los dedos (45) y los 10 ángulos de
 * articulación. Usa direcciones y no posiciones a propósito: no dependen de lo
 * largos que sean los dedos de cada persona, y por eso una A hecha en una postura
 * natural con una mano pequeña, grande, delgada o ancha da lo mismo. Se compara
 * con distancia euclidiana.
 */
export function describeFrame(c: Vec3[]): number[] {
  const out: number[] = [];
  for (const chain of CHAINS) {
    for (let i = 0; i < 3; i++) out.push(...unit(sub(c[chain[i + 1]], c[chain[i]])).map((v) => v * DIRECTION_WEIGHT));
  }
  for (const [p, q, r, s] of CHAINS) {
    out.push(angleAt(c[p], c[q], c[r]) * ANGLE_WEIGHT, angleAt(c[q], c[r], c[s]) * ANGLE_WEIGHT);
  }
  return out;
}

export function describePose3d(landmarks: NormalizedLandmark[], aspect: number = DEFAULT_ASPECT, side: HandSide = 'derecha'): number[] {
  return describeFrame(palmFrame(landmarks, aspect, side));
}

/**
 * Dobla los cuatro dedos largos `degrees` grados en cada articulación (hacia la
 * palma si es positivo, hacia atrás si es negativo). Con las señas oficiales, que
 * vienen de una sola foto, se generan versiones de ±10° y ±20°: es la variación
 * natural de una mano relajada. Medido: con eso se acepta la vocal con los dedos
 * hasta 20 a 30° más cerrados o más abiertos, y a 45° ya no.
 */
export function flexFingers(c: Vec3[], degrees: number): Vec3[] {
  const out = c.map((p) => [...p] as Vec3);
  const th = (degrees * Math.PI) / 180;
  const [cos, sin] = [Math.cos(th), Math.sin(th)];
  for (const chain of CHAINS.slice(1)) {
    for (let j = 1; j < 4; j++) {
      const pivot = [...out[chain[j - 1]]] as Vec3;
      for (let k = j; k < 4; k++) {
        const r = sub(out[chain[k]], pivot);
        out[chain[k]] = [pivot[0] + r[0] * cos + r[2] * sin, pivot[1] + r[1], pivot[2] - r[0] * sin + r[2] * cos];
      }
    }
  }
  return out;
}

/**
 * La pose ideal ajustada a TU mano: se conservan tus nudillos y el largo de
 * cada uno de tus huesos, y solo se toman de la referencia las direcciones.
 * Así la guía nunca pide estirar un dedo más de lo que da tu mano.
 */
export function retargetPose(live: Vec3[], target: Vec3[]): Vec3[] {
  const out = live.map((p) => [...p] as Vec3);
  for (const chain of CHAINS) {
    for (let i = 0; i < 3; i++) {
      const length = norm(sub(live[chain[i + 1]], live[chain[i]]));
      const dir = unit(sub(target[chain[i + 1]], target[chain[i]]));
      const from = out[chain[i]];
      out[chain[i + 1]] = [from[0] + dir[0] * length, from[1] + dir[1] * length, from[2] + dir[2] * length];
    }
  }
  return out;
}

/** Cuánto se aparta (en grados, promedio de sus tres huesos) la dirección de cada dedo de la mano en vivo de la de la guía. */
export function fingerAngleErrors(live: Vec3[], target: Vec3[]): Array<{ finger: (typeof FINGER_LABELS)[number]; degrees: number }> {
  return CHAINS.map((chain, f) => {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
      const a = unit(sub(live[chain[i + 1]], live[chain[i]]));
      const b = unit(sub(target[chain[i + 1]], target[chain[i]]));
      sum += (Math.acos(Math.min(1, Math.max(-1, dot(a, b)))) * 180) / Math.PI;
    }
    return { finger: FINGER_LABELS[f], degrees: sum / 3 };
  });
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
