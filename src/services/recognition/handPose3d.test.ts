import { describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { describePose3d, poseDistance } from './handPose3d';
import { classifyWithReferenceSet, rankSigns, POSE3D_FLOOR } from './signClassifier';
import type { HandFeatureVector } from '../../models/handFeatures';

/** Mano sintética en 3D: palma en el plano z = 0 y dedos rectos o doblados hacia la cámara (z negativo). */
function hand(curled: boolean[]): NormalizedLandmark[] {
  const pts: NormalizedLandmark[] = new Array(21);
  pts[0] = { x: 0, y: 0, z: 0, visibility: 1 };
  const bases = [
    [0.12, -0.08],
    [0.1, -0.3],
    [0.0, -0.33],
    [-0.09, -0.3],
    [-0.17, -0.25],
  ];
  bases.forEach(([x, y], f) => {
    for (let k = 0; k < 4; k++) {
      const len = 0.09 * k;
      const bend = curled[f] && k > 0 ? 0.07 * k : 0;
      pts[1 + f * 4 + k] = { x: x + (f === 0 ? 0.04 : 0) * k, y: y - len + (curled[f] ? 0.05 * k : 0), z: -bend, visibility: 1 };
    }
  });
  return pts;
}

/** Las pruebas usan proporción 1 (x, y y z en la misma unidad) para girar sin deformar. */

/** Gira la mano en 3D (guiñada, cabeceo y alabeo) alrededor de la muñeca. */
function rotate(points: NormalizedLandmark[], yaw: number, pitch: number, roll: number): NormalizedLandmark[] {
  const [cy, sy, cp, sp, cr, sr] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch), Math.cos(roll), Math.sin(roll)];
  return points.map(({ x, y, z }) => {
    const y1 = y * cp - z * sp;
    const z1 = y * sp + z * cp;
    const x2 = x * cy + z1 * sy;
    const z2 = -x * sy + z1 * cy;
    return { x: x2 * cr - y1 * sr, y: x2 * sr + y1 * cr, z: z2, visibility: 1 };
  });
}

describe('describePose3d', () => {
  const fist = hand([true, true, true, true, true]);
  const open = hand([false, false, false, false, false]);

  it('no cambia al girar la mano en el espacio', () => {
    const base = describePose3d(fist, 1);
    for (const [yaw, pitch, roll] of [[0.8, 0, 0], [0, 0.9, 0.4], [-0.7, 0.5, 2.5], [1, -0.8, -1.2]]) {
      expect(poseDistance(base, describePose3d(rotate(fist, yaw, pitch, roll), 1))).toBeLessThan(0.05);
    }
  });

  it('no cambia con la distancia a la cámara', () => {
    const far = fist.map((p) => ({ ...p, x: p.x * 0.4, y: p.y * 0.4, z: p.z * 0.4 }));
    expect(poseDistance(describePose3d(fist, 1), describePose3d(far, 1))).toBeLessThan(1e-6);
  });

  it('distingue una mano abierta de un puño aunque se muestre de lado', () => {
    const side = describePose3d(rotate(open, 1.0, 0.3, 0), 1);
    expect(poseDistance(side, describePose3d(open, 1))).toBeLessThan(0.05);
    expect(poseDistance(side, describePose3d(fist, 1))).toBeGreaterThan(1);
  });

  it('describe igual la mano izquierda reflejada', () => {
    const mirrored = fist.map((p) => ({ ...p, x: -p.x }));
    expect(poseDistance(describePose3d(fist, 1, 'derecha'), describePose3d(mirrored, 1, 'izquierda'))).toBeLessThan(0.05);
  });
});

describe('clasificación con la descripción 3D', () => {
  const asFeatures = (landmarks: NormalizedLandmark[]): HandFeatureVector => ({
    fingerCurl: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 },
    fingertipDistance: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 },
    pose3d: describePose3d(landmarks, 1),
  });
  const candidates = [
    { sign: 'puño', references: [asFeatures(hand([true, true, true, true, true]))] },
    { sign: 'abierta', references: [asFeatures(hand([false, false, false, false, false]))] },
  ];

  it('reconoce la seña girada y da un porcentaje alto solo a esa seña', () => {
    const live = asFeatures(rotate(hand([true, true, true, true, true]), 0.7, 0.4, 1.3));
    const match = classifyWithReferenceSet(live, candidates);
    expect(match?.sign).toBe('puño');
    expect(match!.confidence).toBeGreaterThan(0.85);
    const ranking = rankSigns(live, candidates, 2);
    expect(ranking.find((r) => r.sign === 'abierta')?.confidence ?? 0).toBeLessThan(0.2);
  });

  it('no muestra una vocal con la mano abierta aunque se parezca a una referencia', () => {
    const live = { ...asFeatures(hand([true, true, true, true, true])), extended: 4 };
    expect(classifyWithReferenceSet(live, candidates)).toBeNull();
    expect(rankSigns(live, candidates)).toEqual([]);
  });

  it('no muestra nada cuando la mano no se parece a ninguna seña', () => {
    const half = asFeatures(hand([true, false, true, false, true]));
    expect(classifyWithReferenceSet(half, candidates)).toBeNull();
    expect(POSE3D_FLOOR).toBeGreaterThan(0.5);
  });
});
