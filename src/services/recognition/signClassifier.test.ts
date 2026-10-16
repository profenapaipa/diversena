import { describe, expect, it } from 'vitest';
import type { HandFeatureVector } from '../../models/handFeatures';
import {
  CONFIDENCE_FLOOR,
  classifyAgainstReferences,
  classifyWithReferenceSet,
  rankSigns,
  similarityTo,
} from './signClassifier';

function features(curl: number, dist: number): HandFeatureVector {
  const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky'] as const;
  const fingerCurl = Object.fromEntries(fingers.map((f) => [f, curl])) as HandFeatureVector['fingerCurl'];
  const fingertipDistance = Object.fromEntries(
    fingers.map((f) => [f, dist]),
  ) as HandFeatureVector['fingertipDistance'];
  return { fingerCurl, fingertipDistance };
}

describe('similarityTo', () => {
  it('devuelve 1 para dos vectores idénticos', () => {
    const a = features(180, 1.2);
    expect(similarityTo(a, a)).toBeCloseTo(1, 5);
  });

  it('devuelve una similitud menor cuanto más distintos son los vectores', () => {
    const open = features(180, 1.2);
    const slightlyBent = features(150, 1.0);
    const fist = features(40, 0.3);

    const simSlight = similarityTo(open, slightlyBent);
    const simFist = similarityTo(open, fist);

    expect(simSlight).toBeGreaterThan(simFist);
    expect(simFist).toBeGreaterThanOrEqual(0);
  });
});

describe('classifyAgainstReferences', () => {
  const vocalA = features(10, 0.05); // puño muy cerrado
  const vocalU = features(179, 1.95); // mano muy abierta

  it('elige la referencia más parecida cuando supera el umbral', () => {
    const live = features(14, 0.08); // muy parecido a "A"
    const result = classifyAgainstReferences(live, [
      { sign: 'A', reference: vocalA },
      { sign: 'U', reference: vocalU },
    ]);

    expect(result).not.toBeNull();
    expect(result?.sign).toBe('A');
    expect(result?.confidence).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR);
  });

  it('devuelve null si ninguna referencia supera el umbral de confianza', () => {
    const ambiguous = features(94.5, 1); // a medio camino entre A y U
    const result = classifyAgainstReferences(ambiguous, [
      { sign: 'A', reference: vocalA },
      { sign: 'U', reference: vocalU },
    ]);

    expect(result).toBeNull();
  });

  it('devuelve null si no hay ninguna referencia cargada', () => {
    const live = features(38, 0.32);
    const result = classifyAgainstReferences(live, [
      { sign: 'A', reference: null },
      { sign: 'U', reference: null },
    ]);

    expect(result).toBeNull();
  });
});

describe('classifyWithReferenceSet', () => {
  it('usa la mayoría de vecinos cercanos, no solo el más cercano', () => {
    // Un clip "raro" de E queda muy cerca, pero varios clips de A quedan cerca también.
    const live = features(20, 0.1);
    const result = classifyWithReferenceSet(live, [
      { sign: 'A', references: [features(24, 0.12), features(26, 0.14), features(28, 0.15), features(30, 0.16)] },
      { sign: 'E', references: [features(21, 0.1), features(120, 1.2)] },
    ]);
    expect(result?.sign).toBe('A');
  });

  it('devuelve null sin referencias', () => {
    expect(classifyWithReferenceSet(features(20, 0.1), [{ sign: 'A', references: [] }])).toBeNull();
  });
});

describe('rankSigns', () => {
  it('ordena las señas de la más a la menos parecida y omite las lejanas', () => {
    const live = features(60, 0.6);
    const ranked = rankSigns(live, [
      { sign: 'A', references: [features(10, 0.05)] },
      { sign: 'E', references: [features(70, 0.7)] },
      { sign: 'O', references: [features(50, 0.5), features(90, 0.9)] },
      { sign: 'U', references: [] },
    ]);
    expect(ranked.map((r) => r.sign).slice(0, 2).sort()).toEqual(['E', 'O']);
    expect(ranked.every((r) => r.sign !== 'U')).toBe(true);
    expect(ranked[0].confidence).toBeGreaterThanOrEqual(ranked[ranked.length - 1].confidence);
  });
});
