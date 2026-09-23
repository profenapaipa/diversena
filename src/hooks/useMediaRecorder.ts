import { useEffect, useRef, useState, type ChangeEvent } from 'react';

export interface UseMediaRecorderResult {
  isRecording: boolean;
  recordError: string | null;
  activeVideoUrl: string | null;
  activeVideoName: string | null;
  videoQueued: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  handleUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  queueForLater: () => void;
}

/**
 * Graba (con MediaRecorder) el mismo stream de la cámara en vivo, o permite
 * subir un video ya grabado — para revisar la práctica después. No pide su
 * propia cámara: usa el stream que le pase CameraView, así solo hay una
 * cámara activa a la vez, no dos.
 */
export function useMediaRecorder(stream: MediaStream | null, fileNamePrefix: string): UseMediaRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoName, setRecordedVideoName] = useState<string | null>(null);
  const [manualVideoUrl, setManualVideoUrl] = useState<string | null>(null);
  const [manualVideoName, setManualVideoName] = useState<string | null>(null);
  const [videoQueued, setVideoQueued] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const activeVideoUrl = recordedVideoUrl ?? manualVideoUrl;
  const activeVideoName = recordedVideoUrl ? recordedVideoName : manualVideoName;

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      if (recordedVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(recordedVideoUrl);
      if (manualVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(manualVideoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si la cámara se apaga a mitad de una grabación, se detiene sola.
  useEffect(() => {
    if (!stream && recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  }, [stream]);

  function startRecording() {
    if (!stream) {
      setRecordError('Activa la cámara antes de grabar un video.');
      return;
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') return;

    const recorder = new MediaRecorder(stream);
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
    setRecordError(null);
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
    setRecordError(null);
    event.target.value = '';
  }

  function queueForLater() {
    if (!activeVideoUrl) {
      setRecordError('Primero graba o sube un video para dejarlo listo para enviar.');
      return;
    }
    setVideoQueued(true);
    setRecordError(null);
  }

  return {
    isRecording,
    recordError,
    activeVideoUrl,
    activeVideoName,
    videoQueued,
    startRecording,
    stopRecording,
    handleUpload,
    queueForLater,
  };
}
