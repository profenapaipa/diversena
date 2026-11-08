import type { Language, Sign } from '../../models/language';
import { loadAllSamples } from './referenceSet';
import { DEFAULT_ASPECT, palmFrame, type HandSide } from './handPose3d';

type Vec3 = [number, number, number];

/** Alias con el que van en el dataset las fotos oficiales del Diccionario de LSC del INSOR. */
export const OFFICIAL_ALIAS = 'insor-referencia';

const cache = new Map<string, Promise<Vec3[] | null>>();

/**
 * Pose "ideal" de una vocal, en el marco de la palma: la de la foto oficial del
 * INSOR si el dataset la trae; si no, el promedio de los clips de la seña.
 * Sirve de guía en Aprender: se dibuja sobre la mano en vivo para mostrar
 * dónde deben quedar los puntos.
 */
export function loadTargetPose(language: Language, sign: Sign): Promise<Vec3[] | null> {
  const key = `${language.id}:${sign.id}`;
  let promise = cache.get(key);
  if (!promise) {
    promise = compute(language, sign).catch(() => null);
    cache.set(key, promise);
  }
  return promise;
}

async function compute(language: Language, sign: Sign): Promise<Vec3[] | null> {
  const samples = (await loadAllSamples(language)).filter((s) => s.signId === sign.id);
  const official = samples.filter((s) => s.contributor.alias === OFFICIAL_ALIAS);
  const chosen = official.length > 0 ? official : samples;
  const poses: Vec3[][] = [];
  for (const sample of chosen) {
    const frame = sample.frames.find((f) => f.hands.length > 0);
    if (!frame) continue;
    const side: HandSide = frame.handedness[0] === 'Left' ? 'izquierda' : 'derecha';
    poses.push(palmFrame(frame.hands[0] as never, sample.aspect ?? DEFAULT_ASPECT, side));
  }
  if (poses.length === 0) return null;
  return poses[0].map((_, i) => {
    const sum = poses.reduce<Vec3>((a, p) => [a[0] + p[i][0], a[1] + p[i][1], a[2] + p[i][2]], [0, 0, 0]);
    return [sum[0] / poses.length, sum[1] / poses.length, sum[2] / poses.length] as Vec3;
  });
}
