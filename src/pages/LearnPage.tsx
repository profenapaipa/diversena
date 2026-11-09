import { useCallback, useState } from 'react';
import type { Sign } from '../models/language';
import { getLanguageById, DEFAULT_LANGUAGE_ID } from '../data/languages';
import { VowelSelector } from '../components/VowelSelector';
import { SignCard } from '../components/SignCard';
import { CameraView } from '../features/camera/CameraView';

export function LearnPage() {
  // Hoy solo la LSC está disponible, así que no se pide elegir lengua, y la A ya viene elegida: la cámara queda a un clic.
  const language = getLanguageById(DEFAULT_LANGUAGE_ID);
  const [signId, setSignId] = useState<string | null>(language?.signs[0]?.id ?? null);
  const sign = language?.signs.find((s) => s.id === signId);

  // Avance de esta visita: las vocales que ya se reconocieron al practicar. No se guarda
  // en ninguna parte (el progreso que se conserva es el del perfil, y solo si hay uno).
  const [practiced, setPracticed] = useState<Record<string, true>>({});
  const handleMatch = useCallback((matched: Sign) => {
    setPracticed((current) => (current[matched.id] ? current : { ...current, [matched.id]: true }));
  }, []);
  const total = language?.signs.length ?? 0;
  const done = language ? language.signs.filter((s) => practiced[s.id]).length : 0;

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Aprender</p>
        <h1>Elige una vocal y practícala</h1>
        <p className="lead">Los puntos amarillos muestran dónde deben quedar los de tu mano.</p>
        <p className="lead lead--note">
          Lengua de Señas Colombiana. Las señas siguen el Diccionario de LSC del INSOR y falta validarlas con personas Sordas y
          docentes de LSC.
        </p>
      </header>

      {language && (
        <>
          <h2>1. Elige una vocal</h2>
          <VowelSelector
            signs={language.signs}
            selectedId={signId}
            onSelect={(id) => setSignId(id)}
          />
          <div className="session-progress" role="status">
            <p className="session-progress__title">
              Tu avance en esta visita: {done} de {total} vocales
            </p>
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
        <div className="learn-layout">
          <SignCard sign={sign} />

          <div className="practice-panel">
            <h2>2. Practica con tu cámara</h2>
            <CameraView
              language={language}
              targetSign={sign}
              fileNamePrefix="video-aprendizaje"
              onMatch={handleMatch}
              showRecording={false}
              requireCalibration
            />
          </div>
        </div>
      )}
    </section>
  );
}
