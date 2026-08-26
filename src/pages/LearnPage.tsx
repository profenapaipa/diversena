import { useState } from 'react';
import { languages, getLanguageById } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { VowelSelector } from '../components/VowelSelector';
import { SignCard } from '../components/SignCard';

export function LearnPage() {
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [signId, setSignId] = useState<string | null>(null);

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
        }}
      />

      {language && (
        <>
          <h2>2. Vocal</h2>
          <VowelSelector signs={language.signs} selectedId={signId} onSelect={setSignId} />
        </>
      )}

      {sign && (
        <>
          <SignCard sign={sign} />

          <div className="practice-panel">
            <h2>¿Quieres practicar?</h2>
            <button type="button" className="button" disabled>
              🎥 Activar cámara (próximamente)
            </button>
            <p className="practice-panel__note">
              La práctica frente a cámara y el análisis de la seña estarán
              disponibles en una fase posterior del desarrollo.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
