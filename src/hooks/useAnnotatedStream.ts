import { useEffect, useRef, useState, type RefObject } from 'react';
import { drawHands } from '../features/camera/drawHands';
import type { TrackedHand } from './useHandLandmarker';

const RECORDING_FPS = 30;

/**
 * Stream de video para GRABAR la práctica: la imagen de la cámara en espejo
 * (como la persona se ve en pantalla) con los puntos de las manos dibujados
 * encima. MediaRecorder sobre el stream crudo de la cámara no incluiría los
 * puntos, porque en pantalla son un canvas aparte superpuesto al video.
 *
 * `showLandmarks` sigue al interruptor "Mostrar puntos de referencia": lo
 * que se ve es lo que se graba.
 */
export function useAnnotatedStream(
  videoRef: RefObject<HTMLVideoElement | null>,
  handsRef: RefObject<TrackedHand[]>,
  active: boolean,
  showLandmarks: boolean,
): MediaStream | null {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const showRef = useRef(showLandmarks);
  useEffect(() => {
    showRef.current = showLandmarks;
  }, [showLandmarks]);

  useEffect(() => {
    if (!active) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof canvas.captureStream !== 'function') return;

    let rafId = 0;
    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) return;
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      ctx.save();
      // Espejo de todo el cuadro: video y puntos quedan alineados como en pantalla.
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      if (showRef.current) drawHands(ctx, handsRef.current, width, height);
      ctx.restore();
    };
    rafId = requestAnimationFrame(draw);

    const captured = canvas.captureStream(RECORDING_FPS);
    setStream(captured);

    return () => {
      cancelAnimationFrame(rafId);
      captured.getTracks().forEach((track) => track.stop());
      setStream(null);
    };
  }, [active, videoRef, handsRef]);

  return active ? stream : null;
}
