import { useState } from 'react';
import { languages, getLanguageById } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { SignCard } from '../components/SignCard';

export function ExplorePage() {
  const [languageId, setLanguageId] = useState<string | null>(null);
  const language = languageId ? getLanguageById(languageId) : undefined;

  return (
    <section className="page">
      <h1>Explorar</h1>
      <p>
        Recorre las lenguas de señas disponibles en DiverSeña. Cada una tiene
        sus propias referencias: la misma letra puede realizarse de forma
        distinta en cada lengua.
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
