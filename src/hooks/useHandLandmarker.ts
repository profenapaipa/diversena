import { useEffect, useRef, useState, type RefObject } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { getHandLandmarker } from '../services/mediapipe/handTrackingService';
import { HandLandmarkSmoother } from '../services/recognition/landmarkSmoother';

export type HandTrackingStatus = 'inactivo' | 'cargando' | 'sin-mano' | 'mano-detectada' | 'error';

export interface UseHandLandmarkerResult {
  status: HandTrackingStatus;
  /** Manos detectadas (suavizadas), actualizadas para React ~15 veces por segundo. */
  hands: NormalizedLandmark[][];
  /** Las mismas manos, actualizadas en cada cuadro: para dibujar sin re-render de React. */
  latestHandsRef: RefObject<NormalizedLandmark[][]>;
  /** Cuadros de video procesados por segundo (diagnóstico de fluidez). */
  fps: number;
}

/** Cada cuánto se publica el estado a React; el dibujo va a la tasa completa del video. */
const UI_UPDATE_MS = 66;
/**
 * Si la mano se pierde menos de este tiempo (un parpadeo del detector, un
 * dedo que tapa a otro), se mantiene la última posición en vez de "apagar"
 * todo y volver a encender: el resultado no titila.
 */
const HOLD_LOST_HAND_MS = 200;

/**
 * Detección de manos (no reconocimiento de seña): entrega los landmarks
 * por cuadro de video mientras `active` sea verdadero.
 *
 * Rendimiento: solo se procesa cuando el video tiene un cuadro nuevo (no a
 * la tasa de refresco de la pantalla), y React solo se entera ~15 veces por
 * segundo — el canvas lee `latestHandsRef` directamente.
 */
export function useHandLandmarker(
  videoRef: RefObject<HTMLVideoElement | null>,
  active: boolean,
): UseHandLandmarkerResult {
  const [runtimeStatus, setStatus] = useState<HandTrackingStatus>('cargando');
  const [hands, setHands] = useState<NormalizedLandmark[][]>([]);
  const [fps, setFps] = useState(0);
  const latestHandsRef = useRef<NormalizedLandmark[][]>([]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let rafId = 0;
    setStatus('cargando');

    const smoothers: HandLandmarkSmoother[] = [];
    let lastVideoTime = -1;
    let lastTimestamp = 0;
    let lastSeenAt = 0;
    let lastUiUpdate = 0;
    let framesThisSecond = 0;
    let fpsWindowStart = performance.now();

    getHandLandmarker()
      .then((landmarker) => {
        if (cancelled) return;

        const loop = () => {
          if (cancelled) return;
          const video = videoRef.current;

          if (video && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            // detectForVideo exige marcas de tiempo estrictamente crecientes.
            const now = Math.max(performance.now(), lastTimestamp + 1);
            lastTimestamp = now;

            const result = landmarker.detectForVideo(video, now);
            let current = latestHandsRef.current;

            if (result.landmarks.length > 0) {
              current = result.landmarks.map((hand, i) => {
                smoothers[i] ??= new HandLandmarkSmoother();
                return smoothers[i].smooth(hand, now);
              });
              lastSeenAt = now;
            } else if (now - lastSeenAt > HOLD_LOST_HAND_MS) {
              current = [];
              smoothers.forEach((smoother) => smoother.reset());
            }
            latestHandsRef.current = current;

            framesThisSecond++;
            if (now - fpsWindowStart >= 1000) {
              setFps(Math.round((framesThisSecond * 1000) / (now - fpsWindowStart)));
              framesThisSecond = 0;
              fpsWindowStart = now;
            }

            if (now - lastUiUpdate >= UI_UPDATE_MS) {
              lastUiUpdate = now;
              setHands(current);
              setStatus(current.length > 0 ? 'mano-detectada' : 'sin-mano');
            }
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
      latestHandsRef.current = [];
    };
  }, [active, videoRef]);

  if (!active) {
    return { status: 'inactivo', hands: [], latestHandsRef, fps: 0 };
  }
  return { status: runtimeStatus, hands, latestHandsRef, fps };
}
