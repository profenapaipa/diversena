import { HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { createWithGpuFallback, getVisionFileset, warmUp } from './visionRuntime';

// Modelo oficial de Google para detección de landmarks de mano. Se descarga
// una sola vez y el navegador lo cachea: es un activo estático (como una
// fuente o un ícono), no un envío de datos del usuario.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

async function createHandLandmarker(numHands: number): Promise<HandLandmarker> {
  const fileset = await getVisionFileset();
  const landmarker = await createWithGpuFallback((delegate) =>
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numHands,
      // Con la mano en movimiento (el six seven, un giro rápido) el detector pierde la mano si el umbral es alto. Se bajan
      // un poco los umbrales de presencia y de seguimiento: se mantiene la mano más tiempo; las manos fantasma se siguen
      // filtrando con el suavizado y la votación del reconocimiento.
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.45,
      minTrackingConfidence: 0.4,
    }),
  );
  warmUp(landmarker);
  return landmarker;
}

let liveLandmarkerPromise: Promise<HandLandmarker> | null = null;
let datasetLandmarkerPromise: Promise<HandLandmarker> | null = null;

/**
 * Detector para la cámara en vivo (aprender/identificar). Sigue las dos
 * manos; el reconocimiento elige cuál usar (ver `useTrackedHand`).
 */
export function getHandLandmarker(): Promise<HandLandmarker> {
  if (!liveLandmarkerPromise) {
    liveLandmarkerPromise = createHandLandmarker(2).catch((err: unknown) => {
      liveLandmarkerPromise = null;
      throw err;
    });
  }
  return liveLandmarkerPromise;
}

/**
 * Detector para extraer landmarks de videos de entrenamiento. Instancia
 * propia (con su propia línea de tiempo) y hasta dos manos: el dataset debe
 * servir también para palabras y frases a dos manos más adelante.
 */
export function getDatasetHandLandmarker(): Promise<HandLandmarker> {
  if (!datasetLandmarkerPromise) {
    datasetLandmarkerPromise = createHandLandmarker(2).catch((err: unknown) => {
      datasetLandmarkerPromise = null;
      throw err;
    });
  }
  return datasetLandmarkerPromise;
}

/**
 * Empieza a descargar el modelo en segundo plano (al abrir la app), para que
 * al encender la cámara la detección arranque casi de inmediato.
 */
export function preloadHandLandmarker(): void {
  getHandLandmarker().catch(() => {
    // Sin red: el error se mostrará cuando el usuario encienda la cámara.
  });
}

export const HAND_CONNECTIONS = HandLandmarker.HAND_CONNECTIONS;

export type { HandLandmarkerResult };
