import { useEffect, useRef, type RefObject } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { HAND_CONNECTIONS } from '../../services/mediapipe/handTrackingService';

interface HandLandmarksCanvasProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  hands: NormalizedLandmark[][];
}

/**
 * Dibuja los landmarks y sus conexiones sobre un canvas del mismo tamaño que
 * el video. El canvas comparte el mismo espejo CSS que el video (ver
 * index.css): como las coordenadas normalizadas vienen del cuadro real (sin
 * espejar), espejar el canvas junto al video los mantiene alineados sin
 * tener que invertir manualmente ninguna coordenada.
 */
export function HandLandmarksCanvas({ videoRef, hands }: HandLandmarksCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !video || !ctx) return;

    canvas.width = video.videoWidth || canvas.clientWidth;
    canvas.height = video.videoHeight || canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = '#22c55e';

    for (const hand of hands) {
      for (const { start, end } of HAND_CONNECTIONS) {
        const a = hand[start];
        const b = hand[end];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
        ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
        ctx.stroke();
      }
      for (const point of hand) {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [hands, videoRef]);

  return <canvas ref={canvasRef} className="hand-landmarks-canvas" aria-hidden="true" />;
}
