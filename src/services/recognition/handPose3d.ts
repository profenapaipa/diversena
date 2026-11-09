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

export function palmBasis(landmarks: NormalizedLandmark[], aspect: number, side: HandSide, zScale = 1): PalmBasis {
  const world: Vec3[] = landmarks.map((p) => [p.x * aspect, p.y, (p.z ?? 0) * aspect * zScale]);
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
export function palmFrame(landmarks: NormalizedLandmark[], aspect: number, side: HandSide, zScale = 1): Vec3[] {
  const { origin, size, e1, e2, e3, mirror } = palmBasis(landmarks, aspect, side, zScale);
  return landmarks.map((p) => {
    const r = sub([p.x * aspect, p.y, (p.z ?? 0) * aspect * zScale], origin);
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
 * Inclina toda la mano (alrededor de la muñeca, el origen del marco de la palma) `degX` grados sobre el eje de
 * los nudillos y `degY` sobre el eje de los dedos. Modela el error al estimar hacia dónde mira la palma: la foto
 * de una referencia tomada en ángulo, o una mano vista casi de canto, dan una normal algo inclinada.
 */
export function tiltPose(c: Vec3[], degX: number, degY: number): Vec3[] {
  const [ax, ay] = [(degX * Math.PI) / 180, (degY * Math.PI) / 180];
  return c.map(([x, y, z]) => {
    const y1 = y * Math.cos(ax) - z * Math.sin(ax);
    const z1 = y * Math.sin(ax) + z * Math.cos(ax);
    return [x * Math.cos(ay) + z1 * Math.sin(ay), y1, -x * Math.sin(ay) + z1 * Math.cos(ay)] as Vec3;
  });
}

/** Inclinaciones con las que se acepta una referencia oficial (además de la original). */
export const REFERENCE_TILTS: Array<[number, number]> = [[0, 0], [25, 0], [-25, 0], [0, 25], [0, -25]];

/**
 * La inclinación de la figura que mejor encaja con la mano en vivo (menor error de dirección de los dedos).
 * Así la guía no obliga a girar la mano: se muestra con la inclinación de la palma que se está viendo.
 */
export function bestTiltFit(live: Vec3[], target: Vec3[]): Vec3[] {
  let best = target;
  let bestError = Infinity;
  for (const degX of [-40, -20, 0, 20, 40]) {
    for (const degY of [-40, -20, 0, 20, 40]) {
      const candidate = degX === 0 && degY === 0 ? target : tiltPose(target, degX, degY);
      const error = fingerAngleErrors(live, candidate).reduce((sum, e) => sum + e.degrees, 0);
      if (error < bestError) {
        bestError = error;
        best = candidate;
      }
    }
  }
  return best;
}

/** Peso de las distancias pulgar a punta de cada dedo en el descriptor. */
const TIP_WEIGHT = 2;

/**
 * Distancia de la punta del pulgar a la punta de los otros cuatro dedos, en palmas.
 * No depende de cómo esté girada la mano, y es lo que distingue la O (el pulgar toca
 * los dedos y forma un círculo) de las demás vocales de dedos doblados.
 */
export function thumbTipDistances(c: Vec3[]): number[] {
  const palm = norm(sub(c[9], c[0])) || 1;
  return [8, 12, 16, 20].map((tip) => norm(sub(c[4], c[tip])) / palm);
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
  out.push(...thumbTipDistances(c).map((d) => d * TIP_WEIGHT));
  return out;
}

export function describePose3d(
  landmarks: NormalizedLandmark[],
  aspect: number = DEFAULT_ASPECT,
  side: HandSide = 'derecha',
  zScale = 1,
  /** Razones de flexión de la persona (calibración): la mano se lleva a la escala de las referencias antes de describirla. */
  flexRatios?: number[],
): number[] {
  const frame = palmFrame(landmarks, aspect, side, zScale);
  return describeFrame(flexRatios ? scaleFlexion(frame, flexRatios.map((r) => 1 / r)) : frame);
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


/** Gira `v` alrededor del eje unitario `axis` el ángulo `angle` (radianes), fórmula de Rodrigues. */
function rotate(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const k = cross(axis, v);
  const d = dot(axis, v) * (1 - c);
  return [v[0] * c + k[0] * s + axis[0] * d, v[1] * c + k[1] * s + axis[1] * d, v[2] * c + k[2] * s + axis[2] * d];
}

const angleBetweenDeg = (a: Vec3, b: Vec3) => (Math.acos(Math.min(1, Math.max(-1, dot(a, b)))) * 180) / Math.PI;

/** Cantidad de articulaciones medidas: 3 por dedo (la base respecto de la palma, la media y la de la punta). */
export const JOINT_COUNT = 15;

/**
 * Flexión de cada articulación en grados (0 = dedo recto), en el orden de los
 * dedos (pulgar, índice, medio, anular, meñique) y, dentro de cada uno, base,
 * media y punta. La base se mide contra la dirección muñeca → nudillo.
 */
export function jointFlexions(c: Vec3[]): number[] {
  const out: number[] = [];
  for (const chain of CHAINS) {
    let previous = unit(sub(c[chain[0]], c[0]));
    for (let i = 0; i < 3; i++) {
      const bone = unit(sub(c[chain[i + 1]], c[chain[i]]));
      out.push(angleBetweenDeg(previous, bone));
      previous = bone;
    }
  }
  return out;
}

/**
 * Multiplica la flexión de cada articulación por su razón (15 valores, mismo orden
 * que `jointFlexions`) sin cambiar el largo de los huesos ni el plano en el que se
 * dobla cada dedo. Con razón < 1 la mano se "abre" un poco; con razón > 1, se "cierra".
 * Sirve para pasar una mano a la escala de otra: la guía se acorta a lo que la persona
 * alcanza a doblar, y la mano en vivo se estira a la escala de las referencias.
 */
export function scaleFlexion(c: Vec3[], ratios: number[]): Vec3[] {
  const out = c.map((p) => [...p] as Vec3);
  CHAINS.forEach((chain, f) => {
    let previous = unit(sub(c[chain[0]], c[0]));
    const turns: Array<[Vec3, number]> = [];
    for (let i = 0; i < 3; i++) {
      const length = norm(sub(c[chain[i + 1]], c[chain[i]]));
      // El hueso original, movido por los giros ya aplicados a las articulaciones de antes.
      let bone = unit(sub(c[chain[i + 1]], c[chain[i]]));
      for (const [axis, angle] of turns) bone = rotate(bone, axis, angle);
      const flex = angleBetweenDeg(previous, bone);
      const ratio = ratios[f * 3 + i] ?? 1;
      const axis = cross(previous, bone);
      if (flex > 1 && norm(axis) > 1e-9 && ratio !== 1) {
        const unitAxis = unit(axis);
        // Ninguna articulación pasa de 175°: una flexión mayor no existe y solo amplificaría el ruido.
        const delta = ((Math.min(175, flex * ratio) - flex) * Math.PI) / 180;
        turns.push([unitAxis, delta]);
        bone = rotate(bone, unitAxis, delta);
      }
      const from = out[chain[i]];
      out[chain[i + 1]] = [from[0] + bone[0] * length, from[1] + bone[1] * length, from[2] + bone[2] * length];
      previous = bone;
    }
  });
  return out;
}

/**
 * La pose ideal ajustada a TU mano: se conservan tus nudillos y el largo de
 * cada uno de tus huesos, y solo se toman de la referencia las direcciones.
 * Así la guía nunca pide estirar un dedo más de lo que da tu mano.
 */
export function retargetPose(live: Vec3[], target: Vec3[], bones?: number[]): Vec3[] {
  const out = live.map((p) => [...p] as Vec3);
  CHAINS.forEach((chain, f) => {
    for (let i = 0; i < 3; i++) {
      // Con la calibración se usa el largo medido en la mano completa (estable); sin ella, el del cuadro actual.
      const length = bones?.[f * 3 + i] ?? norm(sub(live[chain[i + 1]], live[chain[i]]));
      const dir = unit(sub(target[chain[i + 1]], target[chain[i]]));
      const from = out[chain[i]];
      out[chain[i + 1]] = [from[0] + dir[0] * length, from[1] + dir[1] * length, from[2] + dir[2] * length];
    }
  });
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
/**
 * Cuánto se aparta cada dedo de la figura en cuanto a su FLEXIÓN (promedio de las tres
 * articulaciones, en grados). Se mide dentro de la mano, así que no depende de cómo esté
 * girada: el dedo está bien si está doblado como en la figura, mire donde mire la palma.
 */
export function fingerFlexErrors(live: Vec3[], target: Vec3[]): Array<{ finger: (typeof FINGER_LABELS)[number]; degrees: number }> {
  const a = jointFlexions(live);
  const b = jointFlexions(target);
  return FINGER_LABELS.map((finger, f) => ({
    finger,
    degrees: (Math.abs(a[f * 3] - b[f * 3]) + Math.abs(a[f * 3 + 1] - b[f * 3 + 1]) + Math.abs(a[f * 3 + 2] - b[f * 3 + 2])) / 3,
  }));
}

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
