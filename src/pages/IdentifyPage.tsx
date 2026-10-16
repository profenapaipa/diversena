import { useState } from 'react';
import { languages, getLanguageById, DEFAULT_LANGUAGE_ID } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { CameraView } from '../features/camera/CameraView';

export function IdentifyPage() {
  const [languageId, setLanguageId] = useState<string | null>(DEFAULT_LANGUAGE_ID);
  const language = languageId ? getLanguageById(languageId) : undefined;

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Traducir</p>
        <h1>Haz una seña y la convertimos en texto</h1>
        <p className="lead">
          Ponte frente a la cámara con la mano completa dentro del cuadro. Si no estamos seguros, te
          sugerimos las señas más parecidas.
        </p>
      </header>

      <LanguageSelector languages={languages} selectedId={languageId} onSelect={setLanguageId} />

      {language && (
        <div className="practice-panel">
          <h2>{language.name}</h2>
          <CameraView language={language} fileNamePrefix="video-seña" />
        </div>
      )}
    </section>
  );
}
