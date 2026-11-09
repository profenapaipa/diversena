import { describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  CALIBRATION_MIN_FRAMES,
  REFERENCE_FLEX_MAX,
  advanceRun,
  finalizeRun,
  fitCalibration,
  flexRatios,
  isRunFinished,
  skipStep,
  startRun,
  type CalibrationFrame,
  type CalibrationRun,
} from './calibration';

/** Mano abierta sintética en 3D (palma en el plano z = 0), con proporción 1. */
function openHand(): NormalizedLandmark[] {
  const pts: NormalizedLandmark[] = new Array(21);
  pts[0] = { x: 0, y: 0, z: 0, visibility: 1 };
  const bases = [[0.12, -0.08], [0.1, -0.3], [0.0, -0.33], [-0.09, -0.3], [-0.17, -0.25]];
  bases.forEach(([x, y], f) => {
    for (let k = 0; k < 4; k++) pts[1 + f * 4 + k] = { x: x + (f === 0 ? 0.04 : 0) * k, y: y - 0.09 * k, z: 0, visibility: 1 };
  });
  return pts;
}

/** Gira alrededor del eje vertical y le aplica a z una escala distinta de la real (como una cámara que estima mal la profundidad). */
function turned(points: NormalizedLandmark[], yaw: number, zBias: number): NormalizedLandmark[] {
  return points.map(({ x, y, z }) => ({ x: x * Math.cos(yaw) + z * Math.sin(yaw), y, z: (-x * Math.sin(yaw) + z * Math.cos(yaw)) * zBias, visibility: 1 }));
}

function session(zBias: number, maxYaw: number): CalibrationFrame[] {
  return Array.from({ length: 60 }, (_, i) => ({
    landmarks: turned(openHand(), Math.sin(i / 6) * maxYaw, zBias),
    aspect: 1,
    side: 'derecha' as const,
  }));
}

describe('fitCalibration', () => {
  it('necesita un mínimo de cuadros', () => {
    expect(fitCalibration(session(1, 0.6).slice(0, CALIBRATION_MIN_FRAMES - 1))).toBeNull();
  });

  it('recupera la escala de z cuando la profundidad viene encogida o estirada', () => {
    for (const bias of [0.5, 1, 1.6]) {
      const c = fitCalibration(session(bias, 0.8))!;
      expect(c.zScale).toBeGreaterThan((1 / bias) * 0.85);
      expect(c.zScale).toBeLessThan((1 / bias) * 1.15);
    }
  });

  it('mide el largo de los 15 huesos y los grados de giro vistos', () => {
    const c = fitCalibration(session(1, 0.8))!;
    expect(c.bones).toHaveLength(15);
    expect(c.bones.every((b) => b > 0.1 && b < 1)).toBe(true);
    expect(c.turnDegrees).toBeGreaterThan(20);
  });

  it('si la mano no gira deja z sin tocar', () => {
    expect(fitCalibration(session(0.5, 0))!.zScale).toBe(1);
  });
});

describe('calibración guiada', () => {
  const asFrame = (landmarks: NormalizedLandmark[]): CalibrationFrame => ({ landmarks, aspect: 1, side: 'derecha' });
  const fist = (): NormalizedLandmark[] => {
    const hand = openHand();
    for (let f = 0; f < 5; f++) for (let k = 1; k < 4; k++) hand[1 + f * 4 + k] = { ...hand[1 + f * 4], y: hand[1 + f * 4].y + 0.03 * k };
    return hand;
  };
  const spread = (): NormalizedLandmark[] => openHand().map((p, i) => (i === 0 ? p : { ...p, x: p.x * 1.6 }));
  const thumb = (out: boolean): NormalizedLandmark[] => {
    const hand = openHand();
    hand[4] = out ? { ...hand[4], x: hand[4].x + 0.4 } : { ...hand[5] };
    return hand;
  };
  const feed = (run: CalibrationRun, frames: NormalizedLandmark[][], times = 12) => {
    for (const lm of frames) for (let i = 0; i < times; i++) run = advanceRun(run, asFrame(lm));
    return run;
  };

  it('completa los siete pasos en orden y ajusta la calibración', () => {
    let run = startRun();
    run = feed(run, [openHand()]);
    expect(run.index).toBe(1);
    run = feed(run, [turned(openHand(), 0.8, 1)]);
    expect(run.index).toBe(2);
    run = feed(run, [turned(openHand(), 1.55, 1)]);
    expect(run.index).toBe(3);
    run = feed(run, [turned(openHand(), 3.1, 1)]);
    expect(run.index).toBe(4);
    run = feed(run, [fist()]);
    expect(run.index).toBe(5);
    run = feed(run, [spread()]);
    expect(run.index).toBe(6);
    run = feed(run, [thumb(false), thumb(true)], 3);
    expect(isRunFinished(run)).toBe(true);
    expect(run.done.every(Boolean)).toBe(true);
    // Giros intermedios para que el ajuste de profundidad tenga datos suficientes.
    run = { ...run, openFrames: [...run.openFrames, ...session(1, 0.8)] };
    const calibration = finalizeRun(run)!;
    expect(calibration.ratios).toHaveLength(15);
    expect(calibration.flexMax).toHaveLength(15);
    expect(calibration.stepsDone).toBe(7);
  });

  it('un paso no avanza si la postura no es la pedida', () => {
    let run = startRun();
    run = feed(run, [fist()]);
    expect(run.index).toBe(0);
    run = feed(run, [openHand()]);
    // El giro de 45° no se da por bueno con la mano de frente.
    run = feed(run, [openHand()]);
    expect(run.index).toBe(1);
  });

  it('sin la mano el paso empieza de nuevo y se puede omitir', () => {
    let run = startRun();
    run = feed(run, [openHand()], 5);
    expect(run.hold).toBe(5);
    run = advanceRun(run, null);
    expect(run.hold).toBe(0);
    run = skipStep(run);
    expect(run.index).toBe(1);
    expect(run.done).toEqual([false]);
  });

  it('flexRatios deja en 1 lo que no llega al mínimo y limita a 0,6', () => {
    const ratios = flexRatios(REFERENCE_FLEX_MAX.map(() => 10));
    expect(ratios.every((r) => r >= 0.6 && r <= 1)).toBe(true);
    expect(ratios[0]).toBe(1);
    expect(flexRatios(REFERENCE_FLEX_MAX.map((m) => m * 2)).every((r) => r === 1)).toBe(true);
  });
});
