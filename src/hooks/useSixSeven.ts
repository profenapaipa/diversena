import { useEffect, useRef } from 'react';
import type { TrackedHand } from './useHandLandmarker';
import { SIX_SEVEN_WINDOW_MS, detectSixSeven, type HandHeights } from '../services/gestures/sixSeven';
import { playSixSeven } from '../services/gestures/sixSevenEffect';

/** Tiempo mínimo entre dos activaciones, para que el efecto no se repita sin parar. */
const COOLDOWN_MS = 6000;
/** Si falta una de las dos manos más de esto, se descarta lo anterior: ya no es el mismo movimiento. */
const MAX_GAP_MS = 500;
/** Puntos de la palma (muñeca y los cuatro nudillos): su altura promedio es más estable que la de un solo punto. */
const PALM_POINTS = [0, 5, 9, 13, 17];

const palmHeight = (hand: TrackedHand) => PALM_POINTS.reduce((sum, i) => sum + hand.landmarks[i].y, 0) / PALM_POINTS.length;

/**
 * Con la cámara encendida, mira si las dos manos hacen el six seven y, si es así, lanza el efecto.
 *
 * Se piensa para manos en movimiento rápido, donde el detector falla más:
 *  - Las dos manos se distinguen por su posición en la imagen (la de más a la izquierda y la de más a la derecha), no por
 *    la etiqueta «derecha» o «izquierda» de MediaPipe, que se confunde con las palmas hacia arriba y cambia de un cuadro a otro.
 *  - Una pérdida breve de una mano (menos de medio segundo) no reinicia el gesto: simplemente ese cuadro no suma.
 */
export function useSixSevenGesture(hands: TrackedHand[]): void {
  const samples = useRef<HandHeights[]>([]);
  const lastPlayed = useRef(-COOLDOWN_MS);
  const lastBoth = useRef(0);

  useEffect(() => {
    const now = performance.now();
    if (hands.length < 2) {
      if (now - lastBoth.current > MAX_GAP_MS) samples.current = [];
      return;
    }
    lastBoth.current = now;
    const [leftmost, rightmost] = [...hands].sort((a, b) => a.landmarks[0].x - b.landmarks[0].x);
    samples.current.push({ t: now, left: palmHeight(leftmost), right: palmHeight(rightmost) });
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
