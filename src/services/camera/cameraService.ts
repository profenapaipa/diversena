export type CameraErrorReason =
  | 'unsupported'
  | 'permission-denied'
  | 'not-found'
  | 'in-use'
  | 'lost'
  | 'unknown';

export interface CameraError {
  reason: CameraErrorReason;
  message: string;
}

export interface CameraHandle {
  stream: MediaStream;
  stop: () => void;
}

// 640×480 a 30 fps: suficiente para detectar los 21 puntos de la mano con
// precisión, y mucho más liviano que el 1080p que muchas cámaras entregan
// por defecto (menos píxeles que copiar a la GPU en cada cuadro).
const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 30, max: 30 },
  },
  audio: false,
};

/**
 * Única puerta de entrada a getUserMedia. No guarda ni transmite frames:
 * solo entrega el MediaStream para que el video se muestre localmente.
 */
export async function startCamera(
  onLost?: () => void,
  constraints: MediaStreamConstraints = DEFAULT_CONSTRAINTS,
): Promise<CameraHandle> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw toCameraError(new Error('getUserMedia unsupported'));
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    throw toCameraError(err);
  }

  const stop = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  if (onLost) {
    const [track] = stream.getVideoTracks();
    track?.addEventListener('ended', onLost);
  }

  return { stream, stop };
}

function toCameraError(err: unknown): CameraError {
  if (err instanceof Error && err.message === 'getUserMedia unsupported') {
    return {
      reason: 'unsupported',
      message: 'Este navegador no permite acceder a la cámara.',
    };
  }

  const name = err instanceof DOMException ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return {
        reason: 'permission-denied',
        message: 'Permiso de cámara denegado. Actívalo en la configuración del navegador.',
      };
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'NotSupportedError':
      return { reason: 'not-found', message: 'No se encontró ninguna cámara disponible.' };
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        reason: 'in-use',
        message: 'La cámara está siendo usada por otra aplicación.',
      };
    case 'SecurityError':
      return {
        reason: 'permission-denied',
        message: 'El navegador bloqueó el acceso a la cámara en este contexto.',
      };
    default:
      return { reason: 'unknown', message: 'No se pudo iniciar la cámara.' };
  }
}
