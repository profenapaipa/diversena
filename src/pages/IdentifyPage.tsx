import { useEffect, useRef, useState } from 'react';
import { languages, getLanguageById } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';

export function IdentifyPage() {
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const language = languageId ? getLanguageById(languageId) : undefined;

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!cameraEnabled || !video || !stream) {
      return;
    }

    video.srcObject = stream;
    void video.play().catch(() => {
      setCameraError('El navegador bloqueó la reproducción de la cámara.');
    });
  }, [cameraEnabled]);

  async function toggleCamera() {
    if (cameraEnabled) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraEnabled(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Tu navegador no permite acceder a la cámara.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraError(null);
      setCameraEnabled(true);
    } catch {
      setCameraError('No se pudo activar la cámara. Revisa los permisos del navegador.');
    }
  }

  return (
    <section className="page">
      <h1>Identificar</h1>
      <p>Selecciona la lengua de señas que quieres usar para la identificación automática.</p>

      <LanguageSelector languages={languages} selectedId={languageId} onSelect={setLanguageId} />

      {language && (
        <div className="practice-panel">
          <h2>{language.name}</h2>
          <button type="button" className="button" onClick={toggleCamera}>
            {cameraEnabled ? 'Apagar cámara' : 'Activar cámara'}
          </button>
          {cameraEnabled && (
            <video
              ref={videoRef}
              className="camera-preview"
              autoPlay
              playsInline
              muted
              aria-label="Vista previa de la cámara"
            />
          )}
          {cameraError && <p className="practice-panel__error">{cameraError}</p>}
        </div>
      )}
    </section>
  );
}
