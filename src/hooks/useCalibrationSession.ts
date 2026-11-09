import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrackedHand } from './useHandLandmarker';
import {
  CALIBRATION_MIN_FRAMES,
  CALIBRATION_SECONDS,
  fitCalibration,
  isCalibrationFrame,
  saveCalibration,
  type CalibrationFrame,
} from '../services/recognition/calibration';

export type CalibrationPhase = 'idle' | 'running' | 'failed';

/**
 * Sesión de calibración: durante unos 8 segundos junta los cuadros de la mano
 * abierta (la mano que se está reconociendo) y al terminar ajusta y guarda la
 * calibración. `aspect` es la proporción ancho/alto del video.
 */
export function useCalibrationSession(hand: TrackedHand | null, aspect: number) {
  const [phase, setPhase] = useState<CalibrationPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [collected, setCollected] = useState(0);
  const framesRef = useRef<CalibrationFrame[]>([]);
  const startRef = useRef(0);

  const start = useCallback(() => {
    framesRef.current = [];
    startRef.current = performance.now();
    setCollected(0);
    setProgress(0);
    setPhase('running');
  }, []);

  const cancel = useCallback(() => setPhase('idle'), []);

  // Cada lectura nueva de la mano abierta suma un cuadro.
  useEffect(() => {
    if (phase !== 'running' || !hand || !isCalibrationFrame(hand.landmarks)) return;
    framesRef.current.push({ landmarks: hand.landmarks.map((p) => ({ ...p })), aspect, side: hand.side });
    setCollected(framesRef.current.length);
  }, [hand, phase, aspect]);

  // El reloj de la sesión: avanza la barra y, al llegar a los segundos, cierra.
  useEffect(() => {
    if (phase !== 'running') return;
    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      setProgress(Math.min(1, elapsed / CALIBRATION_SECONDS));
      if (elapsed >= CALIBRATION_SECONDS) {
        window.clearInterval(timer);
        const result = fitCalibration(framesRef.current);
        if (result) {
          saveCalibration(result);
          setPhase('idle');
        } else {
          setPhase('failed');
        }
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, [phase]);

  return { phase, progress, collected, needed: CALIBRATION_MIN_FRAMES, start, cancel };
}
