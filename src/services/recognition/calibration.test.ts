import { describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { CALIBRATION_MIN_FRAMES, fitCalibration, type CalibrationFrame } from './calibration';

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
