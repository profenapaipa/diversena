import { useState } from 'react';
import { languages, getLanguageById } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { VowelSelector } from '../components/VowelSelector';
import { SignCard } from '../components/SignCard';
import { CameraView } from '../features/camera/CameraView';
import { VideoCaptureView } from '../features/camera/VideoCaptureView';
import { useVideoCapture } from '../hooks/useVideoCapture';

export function LearnPage() {
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [signId, setSignId] = useState<string | null>(null);
  const videoCapture = useVideoCapture('video-aprendizaje');

  const language = languageId ? getLanguageById(languageId) : undefined;
  const sign = language?.signs.find((s) => s.id === signId);

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
          videoCapture.stopCamera();
        }}
      />

      {language && (
        <>
          <h2>2. Vocal</h2>
          <VowelSelector
            signs={language.signs}
            selectedId={signId}
            onSelect={(id) => setSignId(id)}
          />
        </>
      )}

      {sign && (
        <>
          <SignCard sign={sign} />

          <div className="practice-panel">
            <h2>¿Quieres practicar?</h2>

            <div className="practice-panel__section">
              <h3>Practica en vivo con seguimiento de manos</h3>
              <CameraView language={language} targetSign={sign} />
            </div>

            <div className="practice-panel__section">
              <h3>O graba o sube un video para revisar después</h3>
              <VideoCaptureView capture={videoCapture} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
