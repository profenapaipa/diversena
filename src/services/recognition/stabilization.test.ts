import { describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { HandLandmarkSmoother } from './landmarkSmoother';
import { TemporalVoter } from './temporalVoter';

function hand(x: number, y: number): NormalizedLandmark[] {
  return Array.from({ length: 21 }, () => ({ x, y, z: 0, visibility: 1 }));
}

describe('HandLandmarkSmoother', () => {
  it('no altera una mano completamente quieta', () => {
    const smoother = new HandLandmarkSmoother();
    let out = hand(0.5, 0.5);
    for (let t = 0; t < 1000; t += 33) out = smoother.smooth(hand(0.5, 0.5), t);
    expect(out[0].x).toBeCloseTo(0.5, 6);
    expect(out[0].y).toBeCloseTo(0.5, 6);
  });

  it('reduce el temblor de una mano quieta con ruido', () => {
    const smoother = new HandLandmarkSmoother();
    const noisy = [0.505, 0.495, 0.506, 0.494, 0.505, 0.495, 0.504, 0.496, 0.505, 0.495];
    const outputs = noisy.map((x, i) => smoother.smooth(hand(x, 0.5), i * 33)[0].x);
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
    // Comparar a partir del 2.º cuadro (el primero pasa sin filtrar).
    expect(spread(outputs.slice(2))).toBeLessThan(spread(noisy.slice(2)) / 2);
  });

  it('sigue un movimiento sostenido sin quedarse atrás', () => {
    const smoother = new HandLandmarkSmoother();
    let last = 0;
    for (let i = 0; i <= 30; i++) last = smoother.smooth(hand(0.2 + i * 0.02, 0.5), i * 33)[0].x;
    // Objetivo final 0.8: debe estar a menos de 0.05 (un par de cuadros de atraso).
    expect(last).toBeGreaterThan(0.75);
  });
});

describe('TemporalVoter', () => {
  it('no cambia por una lectura aislada', () => {
    const voter = new TemporalVoter<string>(8, 5);
    for (let i = 0; i < 8; i++) voter.push('A');
    expect(voter.push('E')).toBe('A');
  });

  it('cambia cuando la nueva etiqueta logra la mayoría', () => {
    const voter = new TemporalVoter<string>(8, 5);
    for (let i = 0; i < 8; i++) voter.push('A');
    let result: string | null = 'A';
    for (let i = 0; i < 5; i++) result = voter.push('E');
    expect(result).toBe('E');
  });

  it('se apaga de forma estable cuando ya no hay reconocimiento', () => {
    const voter = new TemporalVoter<string>(8, 5);
    for (let i = 0; i < 8; i++) voter.push('A');
    for (let i = 0; i < 5; i++) voter.push(null);
    expect(voter.push(null)).toBeNull();
  });
});
