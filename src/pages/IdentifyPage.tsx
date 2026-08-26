import { useState } from 'react';
import { languages, getLanguageById } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { CameraView } from '../features/camera/CameraView';

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
          <CameraView />
          <p className="practice-panel__note">
            La detección de la mano y el clasificador de señas llegarán en una
            fase posterior; por ahora la cámara solo se muestra en vivo.
          </p>
        </div>
      )}
    </section>
  );
}
