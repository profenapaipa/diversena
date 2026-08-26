import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';

// Debe coincidir con la versión de "@mediapipe/tasks-vision" en package.json:
// el runtime Wasm se sirve desde el CDN de jsDelivr en vez de empaquetarlo
// (pesa ~34 MB) para no inflar el repositorio ni el sitio de GitHub Pages.
const TASKS_VISION_VERSION = '1.0.1';
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;

// Modelo oficial de Google para detección de landmarks de mano. Se descarga
// una sola vez y el navegador lo cachea: es un activo estático (como una
// fuente o un ícono), no un envío de datos del usuario.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

let landmarkerPromise: Promise<HandLandmarker> | null = null;

export function getHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE_URL).then((fileset) =>
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: 'VIDEO',
        numHands: 2,
      }),
    );
  }
  return landmarkerPromise;
}

export const HAND_CONNECTIONS = HandLandmarker.HAND_CONNECTIONS;

export type { HandLandmarkerResult };
