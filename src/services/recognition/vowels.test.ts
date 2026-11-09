import datasetText from '../../../public/datasets/lsc.json?raw';
import { describe, expect, it } from 'vitest';
import type { TrainingSample } from '../../models/dataset';
import type { HandFeatureVector } from '../../models/handFeatures';
import { DEFAULT_ASPECT, OFFICIAL_ALIAS, describeFrame, flexFingers, palmFrame, retargetPose, fingerAngleErrors, jointFlexions, scaleFlexion } from './handPose3d';
import { REFERENCE_FLEX_MAX } from './calibration';
import { featuresFromSample } from './referenceSet';
import { classifyWithReferenceSet, POSE3D_FLOOR } from './signClassifier';

/** Prueba con el dataset REAL que se publica: las fotos oficiales del INSOR como mano "en vivo", con y sin giro y con los dedos más o menos doblados. */
const dataset = JSON.parse(datasetText) as { samples: TrainingSample[] };
const candidates = ['a', 'e', 'i', 'o', 'u'].map((v) => ({
  sign: v,
  references: dataset.samples.filter((s) => s.signId === `lsc-${v}`).flatMap((s) => featuresFromSample(s)),
}));
const official = (v: string) => dataset.samples.find((s) => s.signId === `lsc-${v}` && s.contributor.alias === OFFICIAL_ALIAS)!;
const officialFrame = (v: string) => {
  const s = official(v);
  const f = s.frames[0];
  return palmFrame(f.hands[0] as never, s.aspect ?? DEFAULT_ASPECT, f.handedness[0] === 'Left' ? 'izquierda' : 'derecha');
};
const live = (frame: ReturnType<typeof officialFrame>): HandFeatureVector => ({
  fingerCurl: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 },
  fingertipDistance: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 },
  pose3d: describeFrame(frame),
  extended: 0,
});

describe('vocales con el dataset publicado', () => {
  for (const v of ['a', 'e', 'i', 'o', 'u']) {
    it(`la ${v.toUpperCase()} oficial se reconoce por encima del umbral`, () => {
      const m = classifyWithReferenceSet(live(officialFrame(v)), candidates);
      expect(m?.sign).toBe(v);
      expect(m!.confidence).toBeGreaterThan(POSE3D_FLOOR + 0.05);
    });
  }

  it('la A con los dedos algo más cerrados o abiertos (postura natural) se acepta', () => {
    for (const deg of [-15, -10, 10, 15]) {
      const m = classifyWithReferenceSet(live(flexFingers(officialFrame('a'), deg)), candidates);
      expect(m?.sign, `flexión ${deg}`).toBe('a');
    }
  });

  it('la A con los dedos muy abiertos o muy cerrados baja el parecido por debajo del umbral', () => {
    for (const deg of [-45, 45]) {
      const m = classifyWithReferenceSet(live(flexFingers(officialFrame('a'), deg)), candidates);
      expect(m === null || m.confidence < POSE3D_FLOOR + 0.1 || m.sign !== 'a', `flexión ${deg}`).toBe(true);
    }
  });

  it('la guía se ajusta al largo de los huesos de la mano y no pide más de lo que da', () => {
    const own = officialFrame('i');
    const longer = own.map(([x, y, z]) => [x * 1.2, y * 1.2, z * 1.2] as [number, number, number]);
    const fitted = retargetPose(longer, officialFrame('i'));
    expect(Math.max(...fingerAngleErrors(longer, fitted).map((e) => e.degrees))).toBeLessThan(1);
  });
});

describe('rango de tolerancia', () => {
  const vowels = ['a', 'e', 'i', 'o', 'u'];

  it('cada vocal se acepta con los dedos hasta 15° más cerrados o abiertos', () => {
    for (const v of vowels) {
      for (const deg of [-15, -10, 10, 15]) {
        const m = classifyWithReferenceSet(live(flexFingers(officialFrame(v), deg)), candidates);
        expect(m?.sign, `${v} con flexión ${deg}`).toBe(v);
      }
    }
  });

  it('una vocal nunca se confunde con otra, ni siquiera a ±30°: se acepta como ella o no se muestra nada', () => {
    for (const v of vowels) {
      for (const deg of [-30, -20, 20, 30]) {
        const m = classifyWithReferenceSet(live(flexFingers(officialFrame(v), deg)), candidates);
        expect(m === null || m.sign === v, `${v} con flexión ${deg} dio ${m?.sign}`).toBe(true);
      }
    }
  });
});

describe('mano que dobla menos que la referencia (calibración)', () => {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  // Una persona cuyos dedos solo doblan el 75 % de lo que piden las referencias en las articulaciones grandes.
  const limited = REFERENCE_FLEX_MAX.map((m) => (m >= 60 ? 0.75 : 1));

  it('scaleFlexion con razón 1 no cambia la mano y con la inversa la devuelve', () => {
    for (const v of vowels) {
      const f = officialFrame(v);
      const same = scaleFlexion(f, new Array(15).fill(1));
      same.forEach((p, i) => p.forEach((x, k) => expect(x).toBeCloseTo(f[i][k], 6)));
      const back = scaleFlexion(scaleFlexion(f, limited), limited.map((r) => 1 / r));
      const err = Math.max(...back.map((p, i) => Math.hypot(p[0] - f[i][0], p[1] - f[i][1], p[2] - f[i][2])));
      expect(err).toBeLessThan(0.05);
    }
  });

  it('las flexiones medidas bajan con la razón', () => {
    const f = officialFrame('a');
    const before = jointFlexions(f);
    const after = jointFlexions(scaleFlexion(f, limited));
    before.forEach((deg, j) => {
      if (limited[j] < 1 && deg > 20) expect(after[j]).toBeLessThan(deg * 0.9);
    });
  });

  it('con la calibración, la mano limitada se reconoce como cada vocal', () => {
    for (const v of vowels) {
      const handOfThePerson = scaleFlexion(officialFrame(v), limited);
      const calibrated = describeFrame(scaleFlexion(handOfThePerson, limited.map((r) => 1 / r)));
      const m = classifyWithReferenceSet({ ...live(handOfThePerson), pose3d: calibrated }, candidates);
      expect(m?.sign, v).toBe(v);
    }
  });

  it('la guía acortada nunca pide más flexión de la que la persona alcanza', () => {
    for (const v of vowels) {
      const guide = scaleFlexion(officialFrame(v), limited);
      const asked = jointFlexions(officialFrame(v));
      const shown = jointFlexions(guide);
      shown.forEach((deg, j) => expect(deg).toBeLessThanOrEqual(asked[j] + 0.5));
    }
  });
});
