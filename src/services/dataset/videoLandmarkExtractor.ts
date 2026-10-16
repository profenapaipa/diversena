import type { LandmarkPoint, SampleFrame } from '../../models/dataset';
import { getDatasetHandLandmarker } from '../mediapipe/handTrackingService';

/** Cuadros por segundo que se analizan de cada clip: suficiente para el movimiento de una seña. */
export const DATASET_SAMPLE_FPS = 15;
/** Un clip de entrenamiento es UNA seña: más largo que esto casi siempre trae varias mezcladas. */
export const MAX_CLIP_SECONDS = 30;

export interface ExtractionResult {
  frames: SampleFrame[];
  durationSec: number;
  handCoverage: number;
}

interface ExtractOptions {
  /** Duración conocida (p. ej. la del grabador) por si el archivo no la declara. */
  knownDurationSec?: number;
  onProgress?: (fraction: number) => void;
}

function waitForEvent(target: HTMLVideoElement, event: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      target.removeEventListener(event, onEvent);
      reject(new Error(`Tiempo agotado esperando "${event}" del video`));
    }, timeoutMs);
    const onEvent = () => {
      window.clearTimeout(timer);
      resolve();
    };
    target.addEventListener(event, onEvent, { once: true });
  });
}

async function seek(video: HTMLVideoElement, time: number): Promise<void> {
  const seeked = waitForEvent(video, 'seeked', 5000);
  video.currentTime = time;
  await seeked;
}

/**
 * Los .webm que produce MediaRecorder en Chrome no declaran su duración
 * (`Infinity`) hasta que se busca el final. Este es el truco estándar para
 * obtenerla sin reproducir el video completo.
 */
async function resolveDuration(video: HTMLVideoElement, fallback?: number): Promise<number> {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;
  try {
    await seek(video, 1e7);
  } catch {
    // seguimos con el respaldo
  }
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;
  return fallback ?? 0;
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Recorre el video a `DATASET_SAMPLE_FPS` cuadros por segundo buscando
 * cuadro a cuadro (no reproduciéndolo), y extrae los landmarks de hasta dos
 * manos en cada uno. Todo ocurre en el navegador: el video no sale del equipo.
 */
export async function extractLandmarksFromVideo(
  source: Blob,
  { knownDurationSec, onProgress }: ExtractOptions = {},
): Promise<ExtractionResult> {
  const landmarker = await getDatasetHandLandmarker();
  const url = URL.createObjectURL(source);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  try {
    const loaded = waitForEvent(video, 'loadeddata', 15000);
    video.src = url;
    await loaded;

    const durationSec = await resolveDuration(video, knownDurationSec);
    if (durationSec <= 0) throw new Error('No se pudo leer la duración del video.');
    if (durationSec > MAX_CLIP_SECONDS) {
      throw new Error(
        `El video dura ${Math.round(durationSec)} s. Recórtalo a un clip de una sola seña (máximo ${MAX_CLIP_SECONDS} s).`,
      );
    }

    const step = 1 / DATASET_SAMPLE_FPS;
    const totalSteps = Math.max(1, Math.floor(durationSec / step));
    const frames: SampleFrame[] = [];
    let framesWithHand = 0;
    let timestamp = performance.now();

    for (let i = 0; i < totalSteps; i++) {
      const t = Math.min(i * step, Math.max(0, durationSec - 0.001));
      await seek(video, t);
      // La instancia de dataset tiene su propia línea de tiempo: solo debe crecer.
      timestamp = Math.max(performance.now(), timestamp + 1);
      const result = landmarker.detectForVideo(video, timestamp);

      const hands: LandmarkPoint[][] = result.landmarks.map((hand) =>
        hand.map(({ x, y, z }) => ({ x: round(x), y: round(y), z: round(z) })),
      );
      const handedness = result.handedness.map((categories) => categories[0]?.categoryName ?? '');
      if (hands.length > 0) framesWithHand++;
      frames.push({ t: round(t), hands, handedness });
      onProgress?.((i + 1) / totalSteps);
    }

    return { frames, durationSec, handCoverage: framesWithHand / frames.length };
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
