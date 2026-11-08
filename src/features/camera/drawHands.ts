import type { TrackedHand } from '../../hooks/useHandLandmarker';
import { HAND_CONNECTIONS } from '../../services/mediapipe/handTrackingService';
import { palmBasis, palmFrame, projectPose, tipErrors } from '../../services/recognition/handPose3d';

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

/** Una punta a menos de esta distancia de la guía (en tamaños de palma) cuenta como bien puesta. */
export const GUIDE_TOLERANCE = 0.45;

const GUIDE_COLOR = '#ffd83d';
const OK_COLOR = '#22c55e';
const OFF_COLOR = '#fb923c';
const TIPS = [4, 8, 12, 16, 20];

/**
 * Dibuja la pose ideal de la vocal (guía amarilla, punteada) sobre la mano en
 * vivo, con el mismo tamaño y la misma orientación 3D que la mano. Las puntas
 * de los dedos de la mano en vivo se pintan verdes si ya están donde deben y
 * naranja, con una línea hasta su lugar, si les falta ajustar.
 */
export function drawGuide(
  ctx: CanvasRenderingContext2D,
  hand: TrackedHand,
  guidePose: Array<[number, number, number]>,
  width: number,
  height: number,
): void {
  const aspect = width / height;
  const basis = palmBasis(hand.landmarks, aspect, hand.side);
  const target = projectPose(guidePose, basis, aspect);
  const liveFrame = palmFrame(hand.landmarks, aspect, hand.side);
  const errors = tipErrors(liveFrame, guidePose);
  const radius = Math.max(3, width / 180);

  ctx.save();
  ctx.setLineDash([radius * 2, radius * 1.5]);
  ctx.lineWidth = Math.max(2, width / 260);
  ctx.strokeStyle = GUIDE_COLOR;
  ctx.beginPath();
  for (const { start, end } of HAND_CONNECTIONS) {
    ctx.moveTo(target[start].x * width, target[start].y * height);
    ctx.lineTo(target[end].x * width, target[end].y * height);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 216, 61, 0.35)';
  ctx.lineWidth = 2;
  for (const p of target) {
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, radius * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  TIPS.forEach((tip, i) => {
    const ok = errors[i].error <= GUIDE_TOLERANCE;
    const live = hand.landmarks[tip];
    const goal = target[tip];
    ctx.strokeStyle = ok ? OK_COLOR : OFF_COLOR;
    ctx.fillStyle = ok ? OK_COLOR : OFF_COLOR;
    if (!ok) {
      ctx.setLineDash([radius, radius]);
      ctx.beginPath();
      ctx.moveTo(live.x * width, live.y * height);
      ctx.lineTo(goal.x * width, goal.y * height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.arc(live.x * width, live.y * height, radius * 1.9, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}
