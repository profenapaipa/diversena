import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { languages, getLanguageById } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { VowelSelector } from '../components/VowelSelector';
import { SignCard } from '../components/SignCard';

export function LearnPage() {
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [signId, setSignId] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoName, setRecordedVideoName] = useState('video-aprendizaje.webm');
  const [manualVideoUrl, setManualVideoUrl] = useState<string | null>(null);
  const [manualVideoName, setManualVideoName] = useState('video-subido.mp4');
  const [videoQueued, setVideoQueued] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const language = languageId ? getLanguageById(languageId) : undefined;
  const sign = language?.signs.find((s) => s.id === signId);
  const activeVideoUrl = recordedVideoUrl ?? manualVideoUrl;

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (recordedVideoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(recordedVideoUrl);
      }

      if (manualVideoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(manualVideoUrl);
      }
    };
  }, [manualVideoUrl, recordedVideoUrl]);

  useEffect(() => {
    if (!cameraEnabled) {
      return;
    }

    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) {
      return;
    }

    video.srcObject = stream;
    void video.play().catch(() => {
      setCameraError('El navegador bloqueó la reproducción de la cámara.');
    });
  }, [cameraEnabled, signId]);

  function stopCamera() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    recordedChunksRef.current = [];
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraEnabled(false);
    setIsRecording(false);
    setCameraLoading(false);
    setCameraError(null);
  }

  async function toggleCamera() {
    if (!sign) {
      setCameraError('Selecciona una vocal para practicar antes de activar la cámara.');
      return;
    }

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setCameraEnabled(true);
    } catch {
      setCameraError('No se pudo activar la cámara. Revisa los permisos del navegador.');
    } finally {
      setCameraLoading(false);
    }
  }

  function startRecordingVideo() {
    if (!cameraEnabled || !streamRef.current) {
      setCameraError('Activa la cámara antes de grabar un video.');
      return;
    }

    if (recorderRef.current && recorderRef.current.state === 'recording') {
      return;
    }

    const recorder = new MediaRecorder(streamRef.current);
    recordedChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: recorder.mimeType || 'video/webm',
      });
      const nextUrl = URL.createObjectURL(blob);

      if (recordedVideoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(recordedVideoUrl);
      }

      setRecordedVideoUrl(nextUrl);
      setRecordedVideoName(`video-aprendizaje-${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
      setVideoQueued(false);
    };

    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
    setCameraError(null);
  }

  function stopRecordingVideo() {
    if (!recorderRef.current || recorderRef.current.state !== 'recording') {
      return;
    }

    recorderRef.current.stop();
    setIsRecording(false);
  }

  function handleManualVideoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    if (manualVideoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(manualVideoUrl);
    }

    if (recordedVideoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(recordedVideoUrl);
    }

    setManualVideoUrl(nextUrl);
    setRecordedVideoUrl(null);
    setManualVideoName(file.name);
    setVideoQueued(false);
    setCameraError(null);
    event.target.value = '';
  }

  function queueVideoForLater() {
    if (!activeVideoUrl) {
      setCameraError('Primero graba o sube un video para dejarlo listo para enviar.');
      return;
    }

    setVideoQueued(true);
    setCameraError(null);
  }

  return (
    <section className="page">
      <h1>Aprender</h1>
      <p>Selecciona una lengua de señas y luego una vocal para ver su contenido educativo.</p>

      <h2>1. Lengua de señas</h2>
      <LanguageSelector
        languages={languages}
        selectedId={languageId}
        onSelect={(id) => {
          setLanguageId(id);
          setSignId(null);
          stopCamera();
        }}
      />

      {language && (
        <>
          <h2>2. Vocal</h2>
          <VowelSelector signs={language.signs} selectedId={signId} onSelect={(id) => {
            setSignId(id);
            setVideoQueued(false);
          }} />
        </>
      )}

      {sign && (
        <>
          <SignCard sign={sign} />

          <div className="practice-panel">
            <h2>¿Quieres practicar?</h2>

            <div className="video-actions">
              <button
                type="button"
                className="button"
                onClick={toggleCamera}
                disabled={cameraLoading}
              >
                {cameraLoading ? 'Conectando...' : cameraEnabled ? 'Apagar cámara' : 'Activar cámara'}
              </button>

              {cameraEnabled && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={isRecording ? stopRecordingVideo : startRecordingVideo}
                >
                  {isRecording ? 'Detener grabación' : 'Grabar video'}
                </button>
              )}

              <label className="button button--secondary button--file">
                Subir video
                <input type="file" accept="video/*" onChange={handleManualVideoUpload} />
              </label>
            </div>

            <div className="camera-preview-shell">
              {cameraEnabled ? (
                <video
                  ref={videoRef}
                  className="camera-preview"
                  autoPlay
                  playsInline
                  muted
                  aria-label="Vista previa de la cámara"
                />
              ) : (
                <div className="camera-preview camera-preview--placeholder">
                  La vista previa de la cámara aparecerá aquí cuando la actives.
                </div>
              )}
            </div>

            {activeVideoUrl ? (
              <div className="uploaded-video-box">
                <video className="uploaded-video" src={activeVideoUrl} controls playsInline />
                <div className="uploaded-video__meta">
                  <strong>{recordedVideoUrl ? recordedVideoName : manualVideoName}</strong>
                  <span>{videoQueued ? 'Listo para enviarse cuando lo necesites.' : 'Video listo para usar cuando haga falta.'}</span>
                </div>
                <button type="button" className="button" onClick={queueVideoForLater}>
                  {videoQueued ? 'Video guardado' : 'Guardar para enviar después'}
                </button>
              </div>
            ) : (
              <p className="practice-panel__note">
                {cameraEnabled
                  ? 'La cámara está lista para practicar la seña y puedes grabar o subir un video cuando lo necesites.'
                  : 'Activa la cámara o sube un video para practicar la seña.'}
              </p>
            )}

            {cameraError && <p className="practice-panel__error">{cameraError}</p>}
          </div>
        </>
      )}
    </section>
  );
}
