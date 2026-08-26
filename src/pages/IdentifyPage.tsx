import { useState } from 'react';
import { languages, getLanguageById } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';

export function IdentifyPage() {
  const [languageId, setLanguageId] = useState<string | null>(null);
  const language = languageId ? getLanguageById(languageId) : undefined;

  return (
    <section className="page">
      <h1>Identificar</h1>
      <p>Selecciona la lengua de señas que quieres usar para la identificación automática.</p>

      <LanguageSelector languages={languages} selectedId={languageId} onSelect={setLanguageId} />

      {language && (
        <div className="practice-panel">
          <h2>{language.name}</h2>
          <button type="button" className="button" disabled>
            🎥 Activar cámara (próximamente)
          </button>
          <p className="practice-panel__note">
            La identificación en vivo mediante cámara y el clasificador de
            señas se incorporarán en una fase posterior del desarrollo.
          </p>
        </div>
      )}
    </section>
  );
}
