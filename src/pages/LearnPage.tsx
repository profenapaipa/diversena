import { useState } from 'react';
import { languages, getLanguageById, DEFAULT_LANGUAGE_ID } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { VowelSelector } from '../components/VowelSelector';
import { SignCard } from '../components/SignCard';
import { CameraView } from '../features/camera/CameraView';

export function LearnPage() {
  const [languageId, setLanguageId] = useState<string | null>(DEFAULT_LANGUAGE_ID);
  const [signId, setSignId] = useState<string | null>(null);

  const language = languageId ? getLanguageById(languageId) : undefined;
  const sign = language?.signs.find((s) => s.id === signId);

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Aprender</p>
        <h1>Elige una vocal y practícala</h1>
        <p className="lead">Mira cómo se hace la seña y luego hazla frente a la cámara: DiverSeña te dice si coincide.</p>
      </header>

      <h2>1. Lengua de señas</h2>
      <LanguageSelector
        languages={languages}
        selectedId={languageId}
        onSelect={(id) => {
          setLanguageId(id);
          setSignId(null);
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
            <CameraView language={language} targetSign={sign} fileNamePrefix="video-aprendizaje" />
          </div>
        </>
      )}
    </section>
  );
}
