import { useCallback, useState } from 'react';
import type { Sign } from '../models/language';
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

  // Avance de esta visita: las vocales que ya se reconocieron al practicar. No se guarda
  // en ninguna parte (el progreso que se conserva es el del perfil, y solo si hay uno).
  const [practiced, setPracticed] = useState<Record<string, true>>({});
  const handleMatch = useCallback((matched: Sign) => {
    setPracticed((current) => (current[matched.id] ? current : { ...current, [matched.id]: true }));
  }, []);
  const total = language?.signs.length ?? 0;
  const done = language ? language.signs.filter((s) => practiced[s.id]).length : 0;
  const percent = total ? Math.round((done / total) * 100) : 0;

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
          <div className="session-progress" role="status">
            <p className="session-progress__title">
              Tu avance en esta visita: {done} de {total} vocales ({percent} %)
            </p>
            <span className="meter meter--wide" aria-hidden="true">
              <span style={{ width: `${percent}%` }} />
            </span>
            <ul className="session-progress__list" aria-label="Vocales practicadas">
              {language.signs.map((s) => (
                <li key={s.id} className={practiced[s.id] ? 'is-done' : undefined}>
                  {s.letter}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {sign && (
        <>
          <SignCard sign={sign} />
          <p className="practice-panel__note">
            Referencia: Diccionario de LSC del INSOR. Falta validar estas señas con personas Sordas y docentes de LSC.
          </p>

          <div className="practice-panel">
            <h2>¿Quieres practicar?</h2>
            <CameraView language={language} targetSign={sign} fileNamePrefix="video-aprendizaje" onMatch={handleMatch} />
          </div>
        </>
      )}
    </section>
  );
}
