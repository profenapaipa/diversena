import type { TrackedHand } from '../../hooks/useHandLandmarker';
import { HAND_CONNECTIONS } from '../../services/mediapipe/handTrackingService';

// Un color por mano, para distinguirlas cuando aparecen las dos.
const HAND_COLOR = { derecha: '#22c55e', izquierda: '#38bdf8' } as const;

/**
 * Dibuja los landmarks y sus conexiones en coordenadas del cuadro real (sin
 * espejar). Lo usan el canvas en pantalla y el video grabado, para que ambos
 * se vean iguales.
 */
export function drawHands(ctx: CanvasRenderingContext2D, hands: TrackedHand[], width: number, height: number): void {
  ctx.lineWidth = Math.max(2, width / 240);
  const radius = Math.max(3, width / 180);

  for (const { landmarks: hand, side } of hands) {
    ctx.strokeStyle = HAND_COLOR[side];
    ctx.fillStyle = HAND_COLOR[side];
    ctx.beginPath();
    for (const { start, end } of HAND_CONNECTIONS) {
      const a = hand[start];
      const b = hand[end];
      if (!a || !b) continue;
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
    }
    ctx.stroke();

    ctx.beginPath();
    for (const point of hand) {
      ctx.moveTo(point.x * width + radius, point.y * height);
      ctx.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}
