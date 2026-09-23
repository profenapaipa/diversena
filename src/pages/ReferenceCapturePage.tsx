import { useState, type ChangeEvent } from 'react';
import { languages, getLanguageById } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { VowelSelector } from '../components/VowelSelector';
import { HandLandmarksCanvas } from '../features/camera/HandLandmarksCanvas';
import { useTrackedHand } from '../hooks/useTrackedHand';
import {
  clearReference,
  exportReferences,
  getReference,
  importReferences,
  saveReference,
} from '../services/recognition/referenceStore';

const STATUS_LABEL: Record<string, string> = {
  inactive: 'Cámara desactivada',
  requesting: 'Iniciando cámara…',
  active: 'Cámara activa',
  error: 'No se pudo usar la cámara',
};

export function ReferenceCapturePage() {
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [signId, setSignId] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(0); // fuerza releer localStorage tras guardar/borrar
  const { camera, tracking, features } = useTrackedHand();
  const { status, error, videoRef, start, stop } = camera;
  const { hands } = tracking;

  const language = languageId ? getLanguageById(languageId) : undefined;
  const sign = language?.signs.find((s) => s.id === signId);
  const existingReference = language && sign ? getReference(language.id, sign.id) : null;

  function handleSave() {
    if (!language || !sign || !features) return;
    saveReference(language.id, sign.id, features);
    setSavedTick((n) => n + 1);
  }

  function handleClear() {
    if (!language || !sign) return;
    clearReference(language.id, sign.id);
    setSavedTick((n) => n + 1);
  }

  function handleDownload() {
    const blob = new Blob([exportReferences()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diversena-referencias.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      importReferences(text);
      setSavedTick((n) => n + 1);
    });
    event.target.value = '';
  }

  return (
    <section className="page">
      <h1>Capturar referencias</h1>
      <p>
        Herramienta interna del equipo: alguien que sepa la lengua de señas hace cada vocal frente
        a la cámara y la guarda aquí como referencia real. El clasificador de Aprender/Identificar
        compara la mano en vivo contra estas referencias — sin esto, no puede identificar nada.
      </p>
      <p className="practice-panel__note">
        Las referencias se guardan solo en este navegador. Usa «Descargar» para compartirlas con el
        resto del equipo, y «Importar» para cargar las que te compartan.
      </p>

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
        <div className="practice-panel">
          <h2>
            Vocal {sign.letter} — {language?.name}
          </h2>
          <p className="practice-panel__note" key={savedTick}>
            {existingReference
              ? 'Ya existe una referencia guardada para esta seña. Guardar de nuevo la reemplaza.'
              : 'Todavía no hay una referencia guardada para esta seña.'}
          </p>

          <div className="camera-view">
            <div className="camera-view__frame" data-status={status}>
              <video ref={videoRef} className="camera-view__video" autoPlay muted playsInline />
              {status === 'active' && <HandLandmarksCanvas videoRef={videoRef} hands={hands} />}
              {status !== 'active' && (
                <p className="camera-view__overlay-text">{STATUS_LABEL[status]}</p>
              )}
            </div>

            {status === 'active' ? (
              <button type="button" className="button button--secondary" onClick={stop}>
                ⏹️ Desactivar cámara
              </button>
            ) : (
              <button type="button" className="button" onClick={start} disabled={status === 'requesting'}>
                🎥 Activar cámara
              </button>
            )}

            {status === 'error' && error && (
              <p role="alert" className="camera-view__error">
                {error.message}
              </p>
            )}

            <div className="video-actions">
              <button type="button" className="button" onClick={handleSave} disabled={!features}>
                Guardar esta postura como referencia
              </button>
              {existingReference && (
                <button type="button" className="button button--secondary" onClick={handleClear}>
                  Borrar referencia
                </button>
              )}
            </div>
            {!features && status === 'active' && (
              <p className="practice-panel__note">
                Muestra la mano claramente frente a la cámara para poder guardarla.
              </p>
            )}
          </div>
        </div>
      )}

      <h2>Compartir referencias con el equipo</h2>
      <div className="video-actions">
        <button type="button" className="button" onClick={handleDownload}>
          Descargar referencias (.json)
        </button>
        <label className="button button--secondary button--file">
          Importar archivo .json
          <input type="file" accept="application/json" onChange={handleImport} />
        </label>
      </div>
    </section>
  );
}
