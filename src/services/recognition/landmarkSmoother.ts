import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/**
 * Filtro "One Euro" (Casiez et al., 2012): suaviza mucho cuando la mano está
 * quieta (quita el temblor de los puntos) y casi nada cuando se mueve rápido
 * (no se siente retraso). Es el filtro que usa el propio MediaPipe en sus
 * pipelines nativos para landmarks.
 */
class OneEuroFilter {
  private prevValue: number | null = null;
  private prevDerivative = 0;
  private prevTimeMs = 0;
  private readonly minCutoff: number;
  private readonly beta: number;
  private readonly derivativeCutoff: number;

  constructor(minCutoff: number, beta: number, derivativeCutoff: number) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.derivativeCutoff = derivativeCutoff;
  }

  filter(value: number, timeMs: number): number {
    if (this.prevValue === null) {
      this.prevValue = value;
      this.prevTimeMs = timeMs;
      return value;
    }
    const dt = Math.max((timeMs - this.prevTimeMs) / 1000, 1 / 120);
    this.prevTimeMs = timeMs;

    const derivative = (value - this.prevValue) / dt;
    const smoothedDerivative = lerp(this.prevDerivative, derivative, alpha(this.derivativeCutoff, dt));
    this.prevDerivative = smoothedDerivative;

    const cutoff = this.minCutoff + this.beta * Math.abs(smoothedDerivative);
    const result = lerp(this.prevValue, value, alpha(cutoff, dt));
    this.prevValue = result;
    return result;
  }
}

function alpha(cutoffHz: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dt);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

// Ajustados para coordenadas normalizadas 0-1 a ~30 fps. Con la mano quieta el
// corte queda en 3 Hz (retraso de ~50 ms, el temblor sigue fuera); en cuanto
// la mano o un dedo se mueven, sube rápido (~33 Hz con medio ancho de imagen
// por segundo) y el punto casi no se retrasa. Antes eran 1,5 Hz y beta 10,
// que dejaban los puntos ~100 ms atrás al mover un dedo despacio.
const MIN_CUTOFF = 3;
const BETA = 60;
const DERIVATIVE_CUTOFF = 1;

/** Suaviza los 21 landmarks de una mano, cuadro a cuadro. */
export class HandLandmarkSmoother {
  private filters: OneEuroFilter[][] = [];

  smooth(hand: NormalizedLandmark[], timeMs: number): NormalizedLandmark[] {
    if (this.filters.length !== hand.length) {
      this.filters = hand.map(() => [0, 1, 2].map(() => new OneEuroFilter(MIN_CUTOFF, BETA, DERIVATIVE_CUTOFF)));
    }
    return hand.map((point, i) => {
      const [fx, fy, fz] = this.filters[i];
      return {
        x: fx.filter(point.x, timeMs),
        y: fy.filter(point.y, timeMs),
        z: fz.filter(point.z, timeMs),
        visibility: point.visibility,
      };
    });
  }

  /** Olvida el historial: la próxima mano que aparezca no se mezcla con la anterior. */
  reset(): void {
    this.filters = [];
  }
}
