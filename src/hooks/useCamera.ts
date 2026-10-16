import { useCallback, useEffect, useRef, useState } from 'react';
import { startCamera, type CameraError, type CameraHandle } from '../services/camera/cameraService';

export type CameraStatus = 'inactive' | 'requesting' | 'active' | 'error';

export interface UseCameraResult {
  status: CameraStatus;
  error: CameraError | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** El MediaStream activo, o null si la cámara no está encendida. Útil para grabar (MediaRecorder). */
  stream: MediaStream | null;
  start: () => void;
  stop: () => void;
}

export function useCamera(): UseCameraResult {
  const [status, setStatus] = useState<CameraStatus>('inactive');
  const [error, setError] = useState<CameraError | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handleRef = useRef<CameraHandle | null>(null);

  const stop = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setStatus('inactive');
    setError(null);
  }, []);

  const handleLost = useCallback(() => {
    handleRef.current = null;
    setStream(null);
    setStatus('error');
    setError({ reason: 'lost', message: 'Se perdió la conexión con la cámara.' });
  }, []);

  const start = useCallback(() => {
    setStatus('requesting');
    setError(null);

    startCamera(handleLost)
      .then((handle) => {
        handleRef.current = handle;
        if (videoRef.current) {
          videoRef.current.srcObject = handle.stream;
        }
        setStream(handle.stream);
        setStatus('active');
      })
      .catch((err: CameraError) => {
        setStatus('error');
        setError(err);
      });
  }, [handleLost]);

  // Conectar el stream al <video> y reproducirlo de forma explícita: en
  // algunos navegadores `autoPlay` no arranca solo (la "cámara negra" que
  // reportaba el equipo), y si el <video> se vuelve a montar pierde el stream.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    video.play().catch(() => {
      // Bloqueado hasta que la persona interactúe: el siguiente clic lo arranca.
    });
  }, [stream]);

  useEffect(() => {
    return () => {
      handleRef.current?.stop();
    };
  }, []);

  return { status, error, videoRef, stream, start, stop };
}
