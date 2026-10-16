import { useState } from 'react';
import { languages, getLanguageById, DEFAULT_LANGUAGE_ID } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { CameraView } from '../features/camera/CameraView';

export function IdentifyPage() {
  const [languageId, setLanguageId] = useState<string | null>(DEFAULT_LANGUAGE_ID);
  const language = languageId ? getLanguageById(languageId) : undefined;

  return (
    <section className="page">
      <h1>Identificar</h1>
      <p>Selecciona la lengua de señas que quieres usar para la identificación automática.</p>

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
