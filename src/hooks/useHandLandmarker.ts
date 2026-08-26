import { useEffect, useState, type RefObject } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { getHandLandmarker } from '../services/mediapipe/handTrackingService';

export type HandTrackingStatus = 'inactivo' | 'cargando' | 'sin-mano' | 'mano-detectada' | 'error';

export interface UseHandLandmarkerResult {
  status: HandTrackingStatus;
  hands: NormalizedLandmark[][];
}

/**
 * Detección de manos (no reconocimiento de seña): entrega los landmarks
 * crudos por cuadro de video mientras `active` sea verdadero.
 */
export function useHandLandmarker(
  videoRef: RefObject<HTMLVideoElement | null>,
  active: boolean,
): UseHandLandmarkerResult {
  const [runtimeStatus, setStatus] = useState<HandTrackingStatus>('cargando');
  const [hands, setHands] = useState<NormalizedLandmark[][]>([]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let rafId = 0;
    setStatus('cargando');

    getHandLandmarker()
      .then((landmarker) => {
        if (cancelled) return;

        const loop = () => {
          if (cancelled) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2) {
            const result = landmarker.detectForVideo(video, performance.now());
            setHands(result.landmarks);
            setStatus(result.landmarks.length > 0 ? 'mano-detectada' : 'sin-mano');
          }
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [active, videoRef]);

  if (!active) {
    return { status: 'inactivo', hands: [] };
  }
  return { status: runtimeStatus, hands };
}
