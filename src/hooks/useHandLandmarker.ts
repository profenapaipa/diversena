import { useEffect, useRef, useState, type RefObject } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { DominantHand } from '../models/dataset';
import { getHandLandmarker } from '../services/mediapipe/handTrackingService';
import { HandLandmarkSmoother } from '../services/recognition/landmarkSmoother';

export type HandTrackingStatus = 'inactivo' | 'cargando' | 'sin-mano' | 'mano-detectada' | 'error';

export interface TrackedHand {
  landmarks: NormalizedLandmark[];
  /** Mano de la persona (no del lado de la imagen). */
  side: DominantHand;
}

export interface UseHandLandmarkerResult {
  status: HandTrackingStatus;
  /** Manos detectadas (suavizadas), actualizadas para React ~15 veces por segundo. */
  hands: TrackedHand[];
  /** Las mismas manos, actualizadas en cada cuadro: para dibujar sin re-render de React. */
  latestHandsRef: RefObject<TrackedHand[]>;
  /** Cuadros de video procesados por segundo (diagnóstico de fluidez). */
  fps: number;
}

/** Cada cuánto se publica el estado a React; el dibujo va a la tasa completa del video. */
const UI_UPDATE_MS = 66;
/**
 * Si una mano se pierde menos de este tiempo (un parpadeo del detector, un
 * dedo que tapa a otro), se mantiene su última posición en vez de "apagar"
 * todo y volver a encender: el resultado no titila.
 */
const HOLD_LOST_HAND_MS = 200;

/**
 * MediaPipe etiqueta la mano suponiendo una imagen de cámara frontal ya
 * espejada. Le pasamos el cuadro real, sin espejar, así que sus etiquetas
 * quedan invertidas respecto a la persona: "Left" es su mano derecha.
 */
function sideFromLabel(label: string | undefined): DominantHand {
  return label === 'Left' ? 'derecha' : 'izquierda';
}

/**
 * Detección de manos (no reconocimiento de seña): entrega los landmarks de
 * hasta dos manos por cuadro de video mientras `active` sea verdadero.
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
  const [hands, setHands] = useState<TrackedHand[]>([]);
  const [fps, setFps] = useState(0);
  const latestHandsRef = useRef<TrackedHand[]>([]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let rafId = 0;
    setStatus('cargando');

    // Un suavizador y un "último visto" por mano, para que la derecha y la
    // izquierda nunca se mezclen aunque MediaPipe cambie su orden.
    const smoothers = new Map<DominantHand, HandLandmarkSmoother>();
    const lastSeenAt = new Map<DominantHand, number>();
    let lastVideoTime = -1;
    let lastTimestamp = 0;
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
            const detected = new Map<DominantHand, NormalizedLandmark[]>();
            result.landmarks.forEach((landmarks, i) => {
              let side = sideFromLabel(result.handedness[i]?.[0]?.categoryName);
              // Si MediaPipe etiqueta las dos manos igual, la segunda es la otra.
              if (detected.has(side)) side = side === 'derecha' ? 'izquierda' : 'derecha';
              detected.set(side, landmarks);
            });

            const previous = latestHandsRef.current;
            const current: TrackedHand[] = [];
            for (const side of ['derecha', 'izquierda'] as const) {
              const landmarks = detected.get(side);
              if (landmarks) {
                let smoother = smoothers.get(side);
                if (!smoother) {
                  smoother = new HandLandmarkSmoother();
                  smoothers.set(side, smoother);
                }
                current.push({ side, landmarks: smoother.smooth(landmarks, now) });
                lastSeenAt.set(side, now);
              } else {
                const held = previous.find((hand) => hand.side === side);
                if (held && now - (lastSeenAt.get(side) ?? 0) <= HOLD_LOST_HAND_MS) {
                  current.push(held);
                } else {
                  smoothers.get(side)?.reset();
                }
              }
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
