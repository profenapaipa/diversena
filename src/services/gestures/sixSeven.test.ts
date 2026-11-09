import { describe, expect, it } from 'vitest';
import { detectSixSeven, type HandHeights } from './sixSeven';

/** Muestras a 30 por segundo durante `seconds`; cada mano sube y baja con su propia fase. */
function run(leftOf: (t: number) => number, rightOf: (t: number) => number, seconds = 1.6): HandHeights[] {
  const n = Math.round(seconds * 30);
  return Array.from({ length: n }, (_, i) => ({ t: i * 33, left: leftOf(i * 33), right: rightOf(i * 33) }));
}
/** Una mano que sube y baja `hz` veces por segundo (2 es un six seven normal). */
const wave = (phase: number, amplitude = 0.06, hz = 2) => (t: number) => 0.5 + amplitude * Math.sin((t / 1000) * 2 * Math.PI * hz + phase);
const NOW = 1.6 * 30 * 33;

describe('detectSixSeven', () => {
  it('las dos manos subiendo y bajando por turnos activan el gesto', () => {
    expect(detectSixSeven(run(wave(0), wave(Math.PI)), NOW)).toBe(true);
  });
  it('las dos manos subiendo y bajando a la vez no lo activan', () => {
    expect(detectSixSeven(run(wave(0), wave(0)), NOW)).toBe(false);
  });
  it('manos quietas o con un temblor no lo activan', () => {
    expect(detectSixSeven(run(() => 0.5, () => 0.5), NOW)).toBe(false);
    expect(detectSixSeven(run(wave(0, 0.003), wave(Math.PI, 0.003)), NOW)).toBe(false);
  });
  it('una mano que se mueve y la otra quieta no lo activa', () => {
    expect(detectSixSeven(run(wave(0), () => 0.5), NOW)).toBe(false);
  });
  it('con tres subidas y bajadas de cada mano ya se activa, aunque sean despacio y de poco recorrido', () => {
    // 1,5 vueltas por segundo durante 2,2 s = 3 subidas y bajadas, con solo el 5 % de la altura de la imagen.
    const slow = run(wave(0, 0.025, 1.5), wave(Math.PI, 0.025, 1.5), 2.2);
    expect(detectSixSeven(slow, 2.2 * 30 * 33)).toBe(true);
  });
  it('una sola subida y bajada, o dos, no alcanzan', () => {
    const once = (t: number) => 0.5 + 0.08 * Math.sin((t / 1000) * Math.PI);
    expect(detectSixSeven(run(once, (t) => 1 - once(t), 1), 1000)).toBe(false);
    const twice = run(wave(0, 0.06, 1), wave(Math.PI, 0.06, 1), 2);
    expect(detectSixSeven(twice, 2 * 30 * 33)).toBe(false);
  });
  it('con muy pocas muestras o muestras viejas no lo activa', () => {
    expect(detectSixSeven(run(wave(0), wave(Math.PI)).slice(0, 6), NOW)).toBe(false);
    expect(detectSixSeven(run(wave(0), wave(Math.PI)), NOW + 5000)).toBe(false);
  });
});
