import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { FingerName, HandFeatureVector } from '../../models/handFeatures';

export interface Point2D {
  x: number;
  y: number;
}

export type { FingerName, HandFeatureVector };

const WRIST = 0;
const MIDDLE_MCP = 9;

// Cada dedo como una cadena de 4 landmarks consecutivos: articulación base,
// articulación media, articulación distal y punta. Para el pulgar los
// nombres anatómicos son distintos (CMC/MCP/IP/TIP) pero la forma de la
// cadena es la misma, así que se reutiliza el mismo procesamiento.
const FINGER_CHAINS = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
} as const;

/**
 * Traslada (origen = muñeca), escala (respecto a muñeca→nudillo medio) y
 * rota (esa misma referencia queda apuntando "hacia arriba") los landmarks.
 * El resultado es comparable entre manos de distinto tamaño, distinta
 * distancia a la cámara y distinta orientación en el plano de la imagen.
 *
 * Solo usa x/y: la coordenada z de MediaPipe es una estimación de
 * profundidad menos estable que x/y y no es necesaria para distinguir
 * configuraciones manuales en 2D.
 */
export function normalizeHandLandmarks(landmarks: NormalizedLandmark[]): Point2D[] {
  const wrist = landmarks[WRIST];

  const translated = landmarks.map((point) => ({
    x: point.x - wrist.x,
    y: point.y - wrist.y,
  }));

  const reference = translated[MIDDLE_MCP];
  const scale = Math.hypot(reference.x, reference.y) || 1;
  const scaled = translated.map((point) => ({ x: point.x / scale, y: point.y / scale }));

  // En coordenadas de imagen "y" crece hacia abajo, así que "hacia arriba"
  // corresponde a -90°.
  const referenceAngle = Math.atan2(reference.y / scale, reference.x / scale);
  const rotation = -Math.PI / 2 - referenceAngle;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return scaled.map((point) => ({
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }));
}

function angleAtVertexDegrees(a: Point2D, vertex: Point2D, b: Point2D): number {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
  const mag1 = Math.hypot(v1.x, v1.y) || 1;
  const mag2 = Math.hypot(v2.x, v2.y) || 1;
  const cos = (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2);
  return Math.acos(Math.min(1, Math.max(-1, cos))) * (180 / Math.PI);
}

/**
 * Extrae del hand normalizado las características geométricas que
 * distinguen una configuración manual de otra (sección 16). No conoce nada
 * sobre lenguas ni letras: solo describe la forma de la mano.
 */
export function extractHandFeatures(normalized: Point2D[]): HandFeatureVector {
  const fingerCurl = {} as Record<FingerName, number>;
  const fingertipDistance = {} as Record<FingerName, number>;
  const wrist = normalized[WRIST];

  for (const name of Object.keys(FINGER_CHAINS) as FingerName[]) {
    const [base, mid, distal, tip] = FINGER_CHAINS[name];
    fingerCurl[name] = angleAtVertexDegrees(normalized[base], normalized[mid], normalized[distal]);
    fingertipDistance[name] = Math.hypot(
      normalized[tip].x - wrist.x,
      normalized[tip].y - wrist.y,
    );
  }

  return { fingerCurl, fingertipDistance };
}
