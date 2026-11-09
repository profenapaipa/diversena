import { FilesetResolver } from '@mediapipe/tasks-vision';

// El runtime Wasm y los modelos se sirven desde el propio sitio (public/mediapipe), no solo desde CDN de terceros:
// el 9 de noviembre de 2026 el lector se quedaba en "Preparando el detector" porque dependía de dos CDN (~20 MB) que se
// descargaban a la vez al abrir la página. Se incluyen solo las dos variantes que el navegador elige (con y sin SIMD).
// Si algo falla en el sitio propio, se intenta el CDN de jsDelivr. La versión debe coincidir con package.json.
const TASKS_VISION_VERSION = '1.0.1';
const LOCAL_WASM_URL = new URL(`${import.meta.env.BASE_URL}mediapipe/wasm`, window.location.href).href;
const CDN_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;

/** Ruta de un modelo en el sitio propio (absoluta, porque el runtime la resuelve desde un worker). */
export function localModelUrl(file: string): string {
  return new URL(`${import.meta.env.BASE_URL}mediapipe/models/${file}`, window.location.href).href;
}

/** Prueba cada dirección en orden y devuelve el primer resultado que no falle. */
export async function tryUrls<T>(urls: string[], create: (url: string) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const url of urls) {
    try {
      return await create(url);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

let filesetPromise: Promise<VisionFileset> | null = null;

/** Runtime Wasm compartido por todas las tareas de visión (manos, rostro). */
export function getVisionFileset(): Promise<VisionFileset> {
  if (!filesetPromise) {
    filesetPromise = tryUrls([LOCAL_WASM_URL, CDN_WASM_URL], (url) => FilesetResolver.forVisionTasks(url)).catch((err: unknown) => {
      filesetPromise = null; // permitir reintentar si falló la red
      throw err;
    });
  }
  return filesetPromise;
}

/**
 * Crea una tarea intentando primero la GPU (WebGL), que en la mayoría de
 * equipos es varias veces más rápida, y cae a CPU si el navegador o el
 * equipo no la soportan — así la app nunca se queda sin detección.
 */
export async function createWithGpuFallback<T>(
  create: (delegate: 'GPU' | 'CPU') => Promise<T>,
): Promise<T> {
  try {
    return await create('GPU');
  } catch {
    return create('CPU');
  }
}

/**
 * El primer cuadro que procesa una tarea en GPU compila sus shaders y puede
 * tardar varios segundos. Procesar una imagen vacía apenas se crea la tarea
 * (durante la precarga) evita que esa espera ocurra con la cámara encendida.
 */
export function warmUp(task: { detectForVideo: (image: HTMLCanvasElement, timestamp: number) => unknown }): void {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  canvas.getContext('2d')?.fillRect(0, 0, 64, 64);
  try {
    task.detectForVideo(canvas, performance.now());
  } catch {
    // Solo es una optimización: si falla, el primer cuadro real hará el trabajo.
  }
}
