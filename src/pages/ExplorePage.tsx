import { useState } from 'react';
import { languages, getLanguageById, DEFAULT_LANGUAGE_ID } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { SignCard } from '../components/SignCard';

export function ExplorePage() {
  const [languageId, setLanguageId] = useState<string | null>(DEFAULT_LANGUAGE_ID);
  const language = languageId ? getLanguageById(languageId) : undefined;

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Explorar</p>
        <h1>La misma letra, distintas lenguas</h1>
      </header>
      <p>
        Recorre las lenguas de señas de DiverSeña. Cada una tiene sus propias
        referencias: la misma letra puede realizarse de forma distinta en cada
        lengua. Empezamos por la Lengua de Señas Colombiana; las demás se
        abrirán cuando tengan su propio contenido y datos de entrenamiento.
      </p>

      <LanguageSelector languages={languages} selectedId={languageId} onSelect={setLanguageId} />

      {language && (
        <div className="sign-grid">
          {language.signs.map((sign) => (
            <SignCard key={sign.id} sign={sign} />
          ))}
        </div>
      )}
    </section>
  );
}
