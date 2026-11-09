import { useEffect, useRef } from 'react';
import type { TrackedHand } from './useHandLandmarker';
import { SIX_SEVEN_WINDOW_MS, detectSixSeven, type HandHeights } from '../services/gestures/sixSeven';
import { playSixSeven } from '../services/gestures/sixSevenEffect';

/** Tiempo mínimo entre dos activaciones, para que el efecto no se repita sin parar. */
const COOLDOWN_MS = 6000;
/** Nudillo del dedo medio: es estable y casi no se mueve cuando los dedos se doblan. */
const MIDDLE_KNUCKLE = 9;

/** Con la cámara encendida, mira si las dos manos hacen el six seven y, si es así, lanza el efecto. */
export function useSixSevenGesture(hands: TrackedHand[]): void {
  const samples = useRef<HandHeights[]>([]);
  const lastPlayed = useRef(-COOLDOWN_MS);

  useEffect(() => {
    const now = performance.now();
    const left = hands.find((h) => h.side === 'izquierda');
    const right = hands.find((h) => h.side === 'derecha');
    if (!left || !right) {
      // Con una sola mano a la vista no hay gesto: se descarta lo anterior para no mezclar momentos distintos.
      samples.current = [];
      return;
    }
    samples.current.push({ t: now, left: left.landmarks[MIDDLE_KNUCKLE].y, right: right.landmarks[MIDDLE_KNUCKLE].y });
    samples.current = samples.current.filter((s) => now - s.t <= SIX_SEVEN_WINDOW_MS);
    if (now - lastPlayed.current > COOLDOWN_MS && detectSixSeven(samples.current, now)) {
      lastPlayed.current = now;
      samples.current = [];
      playSixSeven();
    }
  }, [hands]);
}

/** Con el teclado, 6 y luego 7 seguidos (fuera de los campos de texto) también lo lanzan: sirve para mostrarlo en una exposición. */
export function useSixSevenKeys(): void {
  const lastSix = useRef(0);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === '6') lastSix.current = performance.now();
      else if (event.key === '7' && performance.now() - lastSix.current < 900) {
        lastSix.current = 0;
        playSixSeven();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
