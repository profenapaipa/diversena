import type { TrackedHand } from '../../hooks/useHandLandmarker';
import { HAND_CONNECTIONS } from '../../services/mediapipe/handTrackingService';
import { fingerAngleErrors, palmBasis, palmFrame, projectPose, retargetPose } from '../../services/recognition/handPose3d';

// Un color por mano, para distinguirlas cuando aparecen las dos.
const HAND_COLOR = { derecha: 'rgba(34, 197, 94, 0.6)', izquierda: 'rgba(56, 189, 248, 0.6)' } as const;

/**
 * Dibuja los landmarks y sus conexiones en coordenadas del cuadro real (sin
 * espejar). Lo usan el canvas en pantalla y el video grabado, para que ambos
 * se vean iguales.
 */
export function drawHands(ctx: CanvasRenderingContext2D, hands: TrackedHand[], width: number, height: number): void {
  ctx.lineWidth = Math.max(1.5, width / 320);
  const radius = Math.max(2.5, width / 220);

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

/** Un dedo cuyos huesos se apartan menos de estos grados de la guía cuenta como bien puesto (la postura natural de una mano relajada). */
export const GUIDE_TOLERANCE_DEG = 25;

const GUIDE_COLOR = 'rgba(255, 216, 61, 0.55)';
const OK_COLOR = 'rgba(34, 197, 94, 0.75)';
const OFF_COLOR = 'rgba(251, 146, 60, 0.8)';
const TIPS = [4, 8, 12, 16, 20];

/**
 * Dibuja la pose ideal de la vocal (guía amarilla, punteada y translúcida) sobre
 * la mano en vivo. La guía NO es la mano de la foto puesta encima: se arma con
 * tus nudillos y el largo de cada uno de tus huesos (ver `retargetPose`), y solo
 * toma de la referencia hacia dónde apunta cada hueso. Así lo que pide siempre
 * cabe en tu mano. Las puntas se pintan verdes si el dedo ya apunta donde debe
 * (con 25° de margen) y naranja, con una línea hasta su lugar, si no.
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
  const liveFrame = palmFrame(hand.landmarks, aspect, hand.side);
  const fitted = retargetPose(liveFrame, guidePose);
  const target = projectPose(fitted, basis, aspect);
  const errors = fingerAngleErrors(liveFrame, guidePose);
  const radius = Math.max(2.5, width / 220);

  ctx.save();
  ctx.setLineDash([radius * 2, radius * 1.6]);
  ctx.lineWidth = Math.max(1.5, width / 340);
  ctx.strokeStyle = GUIDE_COLOR;
  ctx.beginPath();
  for (const { start, end } of HAND_CONNECTIONS) {
    ctx.moveTo(target[start].x * width, target[start].y * height);
    ctx.lineTo(target[end].x * width, target[end].y * height);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 216, 61, 0.25)';
  for (const p of target) {
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, radius * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  TIPS.forEach((tip, i) => {
    const ok = errors[i].degrees <= GUIDE_TOLERANCE_DEG;
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
    ctx.arc(live.x * width, live.y * height, radius * 1.6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}
