import { useEffect, useRef, type RefObject } from 'react';
import type { TrackedHand } from '../../hooks/useHandLandmarker';
import { drawHands } from './drawHands';

interface HandLandmarksCanvasProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Manos más recientes; se leen en cada cuadro de animación, sin pasar por el estado de React. */
  handsRef: RefObject<TrackedHand[]>;
}

/**
 * Dibuja los landmarks y sus conexiones sobre un canvas del mismo tamaño que
 * el video. El canvas comparte el mismo espejo CSS que el video (ver
 * index.css): como las coordenadas normalizadas vienen del cuadro real (sin
 * espejar), espejar el canvas junto al video los mantiene alineados sin
 * tener que invertir manualmente ninguna coordenada.
 *
 * Tiene su propio bucle de animación: dibuja a la tasa de la pantalla aunque
 * React solo se actualice unas pocas veces por segundo.
 */
export function HandLandmarksCanvas({ videoRef, handsRef }: HandLandmarksCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    let lastDrawn: TrackedHand[] | null = null;

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas?.getContext('2d');
      const hands = handsRef.current;
      if (!canvas || !video || !ctx || hands === lastDrawn) return;
      lastDrawn = hands;

      const width = video.videoWidth || canvas.clientWidth;
      const height = video.videoHeight || canvas.clientHeight;
      // Cambiar width/height borra y realoca el canvas: solo si de verdad cambió.
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      drawHands(ctx, hands, width, height);
    };
    rafId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafId);
  }, [handsRef, videoRef]);

  return <canvas ref={canvasRef} className="hand-landmarks-canvas" aria-hidden="true" />;
}
