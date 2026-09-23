import { describe, expect, it } from 'vitest';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { extractHandFeatures, normalizeHandLandmarks } from './landmarkProcessor';

function point(x: number, y: number): NormalizedLandmark {
  return { x, y, z: 0, visibility: 1 };
}

function pointAt(base: NormalizedLandmark, angleRad: number, length: number): NormalizedLandmark {
  return point(base.x + Math.cos(angleRad) * length, base.y + Math.sin(angleRad) * length);
}

/** Cadena de 4 landmarks en línea recta desde `base`, en la dirección `angleRad`. */
function straightChain(
  base: NormalizedLandmark,
  angleRad: number,
  segment: number,
): [NormalizedLandmark, NormalizedLandmark, NormalizedLandmark, NormalizedLandmark] {
  const a = pointAt(base, angleRad, segment);
  const b = pointAt(a, angleRad, segment);
  const c = pointAt(b, angleRad, segment);
  const d = pointAt(c, angleRad, segment);
  return [a, b, c, d];
}

/**
 * Cadena de 4 landmarks recta hasta el segundo punto (articulación base →
 * media) y doblada a partir de ahí, para que el ángulo medido en la
 * articulación media (el que usa `extractHandFeatures`) refleje el doblez.
 */
function bentChain(
  base: NormalizedLandmark,
  angleRad: number,
  segment: number,
): [NormalizedLandmark, NormalizedLandmark, NormalizedLandmark, NormalizedLandmark] {
  const a = pointAt(base, angleRad, segment);
  const b = pointAt(a, angleRad, segment);
  const bentAngle = angleRad + Math.PI * 0.7; // dobla ~126°
  const c = pointAt(b, bentAngle, segment * 0.8);
  const d = pointAt(c, bentAngle, segment * 0.6);
  return [a, b, c, d];
}

/**
 * Construye los 21 landmarks de una mano sintética: la muñeca y el nudillo
 * medio quedan fijos (definen la referencia de escala/rotación) y cada dedo
 * se genera recto o doblado según `fingers`.
 */
function buildHand(
  fingers: Record<'thumb' | 'index' | 'middle' | 'ring' | 'pinky', 'straight' | 'bent'>,
  options?: { rotationRad?: number; scale?: number; wrist?: NormalizedLandmark },
): NormalizedLandmark[] {
  const rotation = options?.rotationRad ?? -Math.PI / 2; // "hacia arriba" por defecto
  const scale = options?.scale ?? 1;
  const wrist = options?.wrist ?? point(0, 0);

  const bases: Record<string, NormalizedLandmark> = {
    thumb: pointAt(wrist, rotation + Math.PI / 3, 0.3 * scale),
    index: pointAt(wrist, rotation - 0.35, 0.5 * scale),
    middle: pointAt(wrist, rotation, 0.55 * scale),
    ring: pointAt(wrist, rotation + 0.35, 0.5 * scale),
    pinky: pointAt(wrist, rotation + 0.7, 0.4 * scale),
  };

  const chainFor = (name: keyof typeof fingers) => {
    const build = fingers[name] === 'straight' ? straightChain : bentChain;
    return build(bases[name], rotation, 0.2 * scale);
  };

  const landmarks: NormalizedLandmark[] = new Array(21);
  landmarks[0] = wrist;

  const order: Array<keyof typeof fingers> = ['thumb', 'index', 'middle', 'ring', 'pinky'];
  order.forEach((name, fingerIndex) => {
    const startIndex = 1 + fingerIndex * 4;
    const [a, b, c, d] = chainFor(name);
    landmarks[startIndex] = a;
    landmarks[startIndex + 1] = b;
    landmarks[startIndex + 2] = c;
    landmarks[startIndex + 3] = d;
  });

  return landmarks;
}

describe('normalizeHandLandmarks', () => {
  it('coloca la muñeca en el origen', () => {
    const hand = buildHand({ thumb: 'straight', index: 'straight', middle: 'straight', ring: 'straight', pinky: 'straight' });
    const normalized = normalizeHandLandmarks(hand);
    expect(normalized[0].x).toBeCloseTo(0, 5);
    expect(normalized[0].y).toBeCloseTo(0, 5);
  });

  it('es invariante a la escala (distancia a la cámara)', () => {
    const allOpen = { thumb: 'straight', index: 'straight', middle: 'straight', ring: 'straight', pinky: 'straight' } as const;
    const near = normalizeHandLandmarks(buildHand(allOpen, { scale: 1 }));
    const far = normalizeHandLandmarks(buildHand(allOpen, { scale: 0.4 }));

    for (let i = 0; i < near.length; i++) {
      expect(far[i].x).toBeCloseTo(near[i].x, 4);
      expect(far[i].y).toBeCloseTo(near[i].y, 4);
    }
  });

  it('es invariante a la rotación en el plano de la imagen', () => {
    const allOpen = { thumb: 'straight', index: 'straight', middle: 'straight', ring: 'straight', pinky: 'straight' } as const;
    const upright = normalizeHandLandmarks(buildHand(allOpen, { rotationRad: -Math.PI / 2 }));
    const tilted = normalizeHandLandmarks(buildHand(allOpen, { rotationRad: -Math.PI / 2 + 0.9 }));

    for (let i = 0; i < upright.length; i++) {
      expect(tilted[i].x).toBeCloseTo(upright[i].x, 4);
      expect(tilted[i].y).toBeCloseTo(upright[i].y, 4);
    }
  });
});

describe('extractHandFeatures', () => {
  it('reporta un ángulo cercano a 180° para un dedo extendido', () => {
    const hand = buildHand({ thumb: 'bent', index: 'straight', middle: 'bent', ring: 'bent', pinky: 'bent' });
    const features = extractHandFeatures(normalizeHandLandmarks(hand));
    expect(features.fingerCurl.index).toBeGreaterThan(170);
  });

  it('reporta un ángulo bajo para un dedo doblado', () => {
    const hand = buildHand({ thumb: 'bent', index: 'bent', middle: 'bent', ring: 'bent', pinky: 'bent' });
    const features = extractHandFeatures(normalizeHandLandmarks(hand));
    expect(features.fingerCurl.index).toBeLessThan(100);
  });

  it('reporta menor distancia punta-muñeca para un puño que para una mano abierta', () => {
    const open = { thumb: 'straight', index: 'straight', middle: 'straight', ring: 'straight', pinky: 'straight' } as const;
    const fist = { thumb: 'bent', index: 'bent', middle: 'bent', ring: 'bent', pinky: 'bent' } as const;

    const openFeatures = extractHandFeatures(normalizeHandLandmarks(buildHand(open)));
    const fistFeatures = extractHandFeatures(normalizeHandLandmarks(buildHand(fist)));

    expect(fistFeatures.fingertipDistance.index).toBeLessThan(openFeatures.fingertipDistance.index);
  });
});
