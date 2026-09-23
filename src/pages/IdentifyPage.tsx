import { useState } from 'react';
import { languages, getLanguageById } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { CameraView } from '../features/camera/CameraView';
import { VideoCaptureView } from '../features/camera/VideoCaptureView';
import { useVideoCapture } from '../hooks/useVideoCapture';

export function IdentifyPage() {
  const [languageId, setLanguageId] = useState<string | null>(null);
  const videoCapture = useVideoCapture('video-seña');
  const language = languageId ? getLanguageById(languageId) : undefined;

  return (
    <section className="page">
      <h1>Identificar</h1>
      <p>Selecciona la lengua de señas que quieres usar para la identificación automática.</p>

      <LanguageSelector
        languages={languages}
        selectedId={languageId}
        onSelect={(id) => {
          setLanguageId(id);
          videoCapture.stopCamera();
        }}
      />

      {language && (
        <div className="practice-panel">
          <h2>{language.name}</h2>

          <div className="practice-panel__section">
            <h3>Identificación en vivo con seguimiento de manos</h3>
            <CameraView language={language} />
          </div>

          <div className="practice-panel__section">
            <h3>O graba o sube un video para revisar después</h3>
            <VideoCaptureView capture={videoCapture} />
          </div>
        </div>
      )}
    </section>
  );
}
