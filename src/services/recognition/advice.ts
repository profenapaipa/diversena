import { jointFlexions, thumbTipDistances } from './handPose3d';

type Vec3 = [number, number, number];

const FINGERS = ['pulgar', 'índice', 'medio', 'anular', 'meñique'] as const;
/** Cómo se nombra cada dedo en una frase («el dedo medio» suena más natural que «el medio»). */
const NAME: Record<(typeof FINGERS)[number], string> = {
  pulgar: 'el pulgar',
  índice: 'el índice',
  medio: 'el dedo medio',
  anular: 'el anular',
  meñique: 'el meñique',
};

export interface Advice {
  /** Dedos que ya están como en la figura. */
  placed: number;
  total: number;
  /** Consejos concretos y cortos, del que más falta al que menos (máximo dos de dedos y uno del pulgar). */
  tips: string[];
}

/**
 * Consejos para acercar la mano en vivo a la figura de una vocal. Cada dedo se compara por cuánto está doblado (dentro
 * de la mano, así que no importa cómo esté girada la palma): si está más doblado de lo que debe, se pide estirar; si
 * está más recto, doblar. Los dedos dentro de `tolerance` grados cuentan como bien puestos y no reciben consejo.
 */
export function adviceFromPoses(live: Vec3[], target: Vec3[], tolerance: number): Advice {
  const a = jointFlexions(live);
  const b = jointFlexions(target);
  const perFinger = FINGERS.map((finger, f) => {
    const diffs = [0, 1, 2].map((i) => a[f * 3 + i] - b[f * 3 + i]);
    return { finger, signed: diffs.reduce((s, d) => s + d, 0) / 3, abs: diffs.reduce((s, d) => s + Math.abs(d), 0) / 3 };
  });
  const off = perFinger.filter((p) => p.abs > tolerance).sort((x, y) => y.abs - x.abs);
  const tips = off.slice(0, 2).map((p) => (p.signed > 0 ? `Estira un poco ${NAME[p.finger]}.` : `Dobla un poco ${NAME[p.finger]}.`));

  // Contacto del pulgar con los otros dedos (la O lo necesita): solo se dice si los dedos ya están bien.
  if (off.length === 0) {
    const liveTips = thumbTipDistances(live);
    const goalTips = thumbTipDistances(target);
    const gap = liveTips.reduce((sum, d, i) => sum + (d - goalTips[i]), 0) / liveTips.length;
    if (gap > 0.35) tips.push('Acerca la punta del pulgar a la de los otros dedos.');
    else if (gap < -0.35) tips.push('Separa un poco la punta del pulgar de los otros dedos.');
  }
  return { placed: perFinger.length - off.length, total: perFinger.length, tips };
}
