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
        <h1>Una letra, varias lenguas</h1>
      </header>
      <p>
        Cada lengua de señas tiene sus propias señas: una misma letra puede hacerse distinto en cada una. Empezamos por la
        Lengua de Señas Colombiana. La mexicana y la ecuatoriana se abrirán cuando las hayamos construido con personas de esas
        comunidades.
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
