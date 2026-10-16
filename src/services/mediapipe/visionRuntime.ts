import { FilesetResolver } from '@mediapipe/tasks-vision';

// Debe coincidir con la versión de "@mediapipe/tasks-vision" en package.json:
// el runtime Wasm se sirve desde el CDN de jsDelivr en vez de empaquetarlo
// (pesa ~34 MB) para no inflar el repositorio ni el sitio de GitHub Pages.
const TASKS_VISION_VERSION = '1.0.1';
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;

type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

let filesetPromise: Promise<VisionFileset> | null = null;

/** Runtime Wasm compartido por todas las tareas de visión (manos, rostro). */
export function getVisionFileset(): Promise<VisionFileset> {
  if (!filesetPromise) {
    filesetPromise = FilesetResolver.forVisionTasks(WASM_BASE_URL).catch((err: unknown) => {
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
