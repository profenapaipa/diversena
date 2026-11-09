import { describe, expect, it } from 'vitest';
import { detectSixSeven, type HandHeights } from './sixSeven';

/** 1,5 s de muestras a unas 16 por segundo; cada mano sube y baja con su propia fase. */
function run(leftOf: (t: number) => number, rightOf: (t: number) => number): HandHeights[] {
  return Array.from({ length: 24 }, (_, i) => ({ t: i * 62, left: leftOf(i * 62), right: rightOf(i * 62) }));
}
const wave = (phase: number, amplitude = 0.08) => (t: number) => 0.5 + amplitude * Math.sin((t / 1000) * 2 * Math.PI * 2 + phase);
const NOW = 24 * 62;

describe('detectSixSeven', () => {
  it('las dos manos subiendo y bajando por turnos activan el gesto', () => {
    expect(detectSixSeven(run(wave(0), wave(Math.PI)), NOW)).toBe(true);
  });
  it('las dos manos subiendo y bajando a la vez no lo activan', () => {
    expect(detectSixSeven(run(wave(0), wave(0)), NOW)).toBe(false);
  });
  it('manos quietas o con un temblor no lo activan', () => {
    expect(detectSixSeven(run(() => 0.5, () => 0.5), NOW)).toBe(false);
    expect(detectSixSeven(run(wave(0, 0.004), wave(Math.PI, 0.004)), NOW)).toBe(false);
  });
  it('una mano que se mueve y la otra quieta no lo activa', () => {
    expect(detectSixSeven(run(wave(0), () => 0.5), NOW)).toBe(false);
  });
  it('un solo movimiento (subir y bajar una vez) no alcanza', () => {
    const once = (t: number) => 0.5 + 0.08 * Math.sin((t / 1500) * Math.PI);
    expect(detectSixSeven(run(once, (t) => 1 - once(t)), NOW)).toBe(false);
  });
  it('con muy pocas muestras o muestras viejas no lo activa', () => {
    expect(detectSixSeven(run(wave(0), wave(Math.PI)).slice(0, 6), NOW)).toBe(false);
    expect(detectSixSeven(run(wave(0), wave(Math.PI)), NOW + 5000)).toBe(false);
  });
});
