import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrackedHand } from './useHandLandmarker';
import {
  CALIBRATION_STEPS,
  advanceRun,
  finalizeRun,
  isRunFinished,
  saveCalibration,
  skipStep,
  startRun,
  type CalibrationRun,
} from '../services/recognition/calibration';

/** idle: sin sesión · running: pasos guiados · done: listo, con los checks a la vista · failed: no alcanzó para calibrar. */
export type CalibrationPhase = 'idle' | 'running' | 'done' | 'failed';

/**
 * Sesión de calibración guiada: siete posturas, una por una. Cada lectura de la mano
 * avanza el paso actual; al completar (o omitir) el último, se ajusta y guarda la
 * calibración. `aspect` es la proporción ancho/alto del video.
 */
export function useCalibrationSession(hand: TrackedHand | null, aspect: number) {
  const [phase, setPhase] = useState<CalibrationPhase>('idle');
  const [run, setRun] = useState<CalibrationRun>(startRun);
  const runRef = useRef<CalibrationRun>(run);

  const update = useCallback((next: CalibrationRun) => {
    if (isRunFinished(runRef.current)) return;
    runRef.current = next;
    setRun(next);
    if (!isRunFinished(next)) return;
    const result = finalizeRun(next);
    if (result) {
      saveCalibration(result);
      setPhase('done');
    } else {
      setPhase('failed');
    }
  }, []);

  const start = useCallback(() => {
    const fresh = startRun();
    runRef.current = fresh;
    setRun(fresh);
    setPhase('running');
  }, []);

  const skip = useCallback(() => update(skipStep(runRef.current)), [update]);
  const cancel = useCallback(() => setPhase('idle'), []);
  const dismiss = useCallback(() => setPhase('idle'), []);

  // Cada lectura nueva (o la falta de mano) hace avanzar el paso actual.
  useEffect(() => {
    if (phase !== 'running' || isRunFinished(runRef.current)) return;
    const frame = hand ? { landmarks: hand.landmarks.map((p) => ({ ...p })), aspect, side: hand.side } : null;
    update(advanceRun(runRef.current, frame));
  }, [hand, phase, aspect, update]);

  return { phase, run, steps: CALIBRATION_STEPS, start, skip, cancel, dismiss };
}
