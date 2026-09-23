import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react';

export interface UseVideoCaptureResult {
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraEnabled: boolean;
  cameraLoading: boolean;
  cameraError: string | null;
  isRecording: boolean;
  activeVideoUrl: string | null;
  activeVideoName: string | null;
  videoQueued: boolean;
  toggleCamera: () => Promise<void>;
  stopCamera: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  handleUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  queueForLater: () => void;
}

/**
 * Graba (con MediaRecorder) o permite subir un video de la práctica, como
 * complemento a la cámara en vivo con seguimiento de manos (CameraView /
 * useCamera). Es una función distinta: aquí no hay landmarks ni MediaPipe,
 * solo un video para revisar o compartir después.
 */
export function useVideoCapture(fileNamePrefix: string): UseVideoCaptureResult {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoName, setRecordedVideoName] = useState<string | null>(null);
  const [manualVideoUrl, setManualVideoUrl] = useState<string | null>(null);
  const [manualVideoName, setManualVideoName] = useState<string | null>(null);
  const [videoQueued, setVideoQueued] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const activeVideoUrl = recordedVideoUrl ?? manualVideoUrl;
  const activeVideoName = recordedVideoUrl ? recordedVideoName : manualVideoName;

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordedVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(recordedVideoUrl);
      if (manualVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(manualVideoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    recordedChunksRef.current = [];
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;

    setCameraEnabled(false);
    setIsRecording(false);
    setCameraLoading(false);
    setCameraError(null);
  }

  async function toggleCamera() {
    if (cameraEnabled) {
      stopCamera();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Tu navegador no permite acceder a la cámara.');
      return;
    }

    setCameraLoading(true);
    setCameraError(null);

    try {
      // Sin audio: el video es para revisar la postura de la mano, no para
      // narrar la seña, y el sonido podría inducir a malinterpretarla.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          setCameraError('El navegador bloqueó la reproducción de la cámara.');
        });
      }
      setCameraEnabled(true);
    } catch {
      setCameraError('No se pudo activar la cámara. Revisa los permisos del navegador.');
    } finally {
      setCameraLoading(false);
    }
  }

  function startRecording() {
    if (!cameraEnabled || !streamRef.current) {
      setCameraError('Activa la cámara antes de grabar un video.');
      return;
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') return;

    const recorder = new MediaRecorder(streamRef.current);
    recordedChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
      const nextUrl = URL.createObjectURL(blob);
      if (recordedVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(nextUrl);
      setRecordedVideoName(`${fileNamePrefix}-${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
      setVideoQueued(false);
    };

    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
    setCameraError(null);
  }

  function stopRecording() {
    if (!recorderRef.current || recorderRef.current.state !== 'recording') return;
    recorderRef.current.stop();
    setIsRecording(false);
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    if (manualVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(manualVideoUrl);
    if (recordedVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(recordedVideoUrl);

    setManualVideoUrl(nextUrl);
    setRecordedVideoUrl(null);
    setManualVideoName(file.name);
    setVideoQueued(false);
    setCameraError(null);
    event.target.value = '';
  }

  function queueForLater() {
    if (!activeVideoUrl) {
      setCameraError('Primero graba o sube un video para dejarlo listo para enviar.');
      return;
    }
    setVideoQueued(true);
    setCameraError(null);
  }

  return {
    videoRef,
    cameraEnabled,
    cameraLoading,
    cameraError,
    isRecording,
    activeVideoUrl,
    activeVideoName,
    videoQueued,
    toggleCamera,
    stopCamera,
    startRecording,
    stopRecording,
    handleUpload,
    queueForLater,
  };
}
