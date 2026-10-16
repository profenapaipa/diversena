import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { languages, getLanguageById, DEFAULT_LANGUAGE_ID } from '../data/languages';
import { LanguageSelector } from '../components/LanguageSelector';
import { HandLandmarksCanvas } from '../features/camera/HandLandmarksCanvas';
import { useTrackedHand } from '../hooks/useTrackedHand';
import type { ContributorInfo, SignerProfile, TrainingSample } from '../models/dataset';
import type { Sign } from '../models/language';
import {
  DATASET_CHANGED_EVENT,
  addSample,
  deleteSample,
  exportDataset,
  getSampleVideo,
  importDataset,
  listSamples,
  newSampleId,
} from '../services/dataset/datasetStore';
import { recordClip, videoExtension } from '../services/dataset/clipRecorder';
import { DATASET_SAMPLE_FPS, extractLandmarksFromVideo } from '../services/dataset/videoLandmarkExtractor';
import { MIN_HAND_COVERAGE } from '../services/recognition/referenceSet';
import { TARGET_CLIPS_PER_SIGN } from '../services/dataset/datasetGoals';

const CLIP_SECONDS = 3;
const COUNTDOWN_SECONDS = 3;
const CONTRIBUTOR_KEY = 'diversena.contributor.v1';

const SIGNER_LABEL: Record<SignerProfile, string> = {
  sorda: 'Persona Sorda usuaria de la lengua',
  interprete: 'Intérprete certificado/a',
  'oyente-fluido': 'Oyente con fluidez en la lengua',
  aprendiz: 'Aprendiz (estoy aprendiendo)',
};

interface StoredContributor extends ContributorInfo {
  consentAt: string | null;
}

function loadContributor(): StoredContributor {
  try {
    const raw = localStorage.getItem(CONTRIBUTOR_KEY);
    if (raw) return JSON.parse(raw) as StoredContributor;
  } catch {
    // sin almacenamiento: formulario vacío
  }
  return { alias: '', dominantHand: 'derecha', signerProfile: 'sorda', consentAt: null };
}

function persistContributor(contributor: StoredContributor): void {
  try {
    localStorage.setItem(CONTRIBUTOR_KEY, JSON.stringify(contributor));
  } catch {
    // no persistir no impide grabar
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sampleFileName(sample: TrainingSample, extension: string): string {
  const alias = sample.contributor.alias.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${sample.languageId}_${sample.label.toLowerCase()}_${alias}_${sample.id.slice(0, 8)}.${extension}`;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'countdown'; remaining: number }
  | { kind: 'recording' }
  | { kind: 'processing'; progress: number; label: string };

export function TrainingDataPage() {
  const [languageId, setLanguageId] = useState(DEFAULT_LANGUAGE_ID);
  const [signId, setSignId] = useState<string | null>(null);
  const [contributor, setContributor] = useState<StoredContributor>(loadContributor);
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const { camera, tracking } = useTrackedHand();
  const { status: cameraStatus, error: cameraError, videoRef, stream, start: startCamera, stop: stopCamera } = camera;
  const { latestHandsRef } = tracking;

  const language = getLanguageById(languageId);
  const sign = language?.signs.find((s) => s.id === signId);
  const contributorReady = contributor.alias.trim().length > 0 && contributor.consentAt !== null;
  const busy = phase.kind !== 'idle';

  const refresh = useCallback(() => {
    listSamples(languageId)
      .then(setSamples)
      .catch(() => setSamples([]));
  }, [languageId]);

  useEffect(() => {
    refresh();
    window.addEventListener(DATASET_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(DATASET_CHANGED_EVENT, refresh);
  }, [refresh]);

  function updateContributor(patch: Partial<StoredContributor>) {
    const next = { ...contributor, ...patch };
    setContributor(next);
    persistContributor(next);
  }

  /** Extrae landmarks, revisa calidad y guarda. Devuelve true si el clip quedó guardado. */
  async function processAndSave(
    video: Blob,
    target: Sign,
    source: TrainingSample['source'],
    fileName: string | null,
    knownDurationSec?: number,
  ): Promise<boolean> {
    const label = fileName ?? `clip de la vocal ${target.letter}`;
    setPhase({ kind: 'processing', progress: 0, label });
    try {
      const result = await extractLandmarksFromVideo(video, {
        knownDurationSec,
        onProgress: (progress) => setPhase({ kind: 'processing', progress, label }),
      });
      if (result.handCoverage < MIN_HAND_COVERAGE) {
        setMessage({
          ok: false,
          text: `${label}: la mano solo se vio en el ${Math.round(result.handCoverage * 100)} % del video. No se guardó; repítelo con la mano completa dentro del cuadro y buena luz.`,
        });
        return false;
      }
      const sample: TrainingSample = {
        id: newSampleId(),
        version: 1,
        languageId: target.languageId,
        signId: target.id,
        label: target.letter,
        source,
        originalFileName: fileName,
        contributor: {
          alias: contributor.alias.trim(),
          dominantHand: contributor.dominantHand,
          signerProfile: contributor.signerProfile,
        },
        consentAt: contributor.consentAt ?? new Date().toISOString(),
        createdAt: new Date().toISOString(),
        durationSec: Math.round(result.durationSec * 100) / 100,
        sampleFps: DATASET_SAMPLE_FPS,
        handCoverage: Math.round(result.handCoverage * 100) / 100,
        hasVideo: true,
        frames: result.frames,
      };
      await addSample(sample, video);
      setMessage({
        ok: true,
        text: `✓ ${label} guardado (mano visible en el ${Math.round(result.handCoverage * 100)} % del video).`,
      });
      return true;
    } catch (err) {
      setMessage({ ok: false, text: `${label}: ${err instanceof Error ? err.message : 'no se pudo procesar.'}` });
      return false;
    }
  }

  async function handleRecord() {
    if (!sign || !stream || busy) return;
    setMessage(null);
    for (let remaining = COUNTDOWN_SECONDS; remaining > 0; remaining--) {
      setPhase({ kind: 'countdown', remaining });
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }
    setPhase({ kind: 'recording' });
    try {
      const video = await recordClip(stream, CLIP_SECONDS);
      await processAndSave(video, sign, 'camara', null, CLIP_SECONDS);
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'La grabación falló.' });
    } finally {
      setPhase({ kind: 'idle' });
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!sign || files.length === 0) return;
    setMessage(null);
    let saved = 0;
    for (const file of files) {
      if (await processAndSave(file, sign, 'archivo', file.name)) saved++;
    }
    setPhase({ kind: 'idle' });
    if (files.length > 1) {
      setMessage({ ok: saved === files.length, text: `${saved} de ${files.length} videos guardados.` });
    }
  }

  async function handleExport() {
    const json = await exportDataset(languageId);
    downloadBlob(new Blob([json], { type: 'application/json' }), `${languageId}.json`);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const count = await importDataset(await file.text());
      setMessage({ ok: true, text: `✓ Se importaron ${count} clips.` });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'No se pudo importar.' });
    }
  }

  async function handleDownloadVideo(sample: TrainingSample) {
    const video = await getSampleVideo(sample.id);
    if (video) downloadBlob(video, sampleFileName(sample, videoExtension(video)));
  }

  async function handleDownloadAllVideos() {
    for (const sample of samples.filter((s) => s.hasVideo)) {
      await handleDownloadVideo(sample);
      // Pausa corta: los navegadores bloquean muchas descargas simultáneas.
      await new Promise((resolve) => window.setTimeout(resolve, 400));
    }
  }

  async function handleDelete(sample: TrainingSample) {
    if (window.confirm(`¿Borrar este clip de la vocal ${sample.label}?`)) await deleteSample(sample.id);
  }

  const countFor = (id: string) => samples.filter((s) => s.signId === id).length;
  const signSamples = samples.filter((s) => s.signId === signId);

  return (
    <section className="page">
      <h1>Entrenar la IA</h1>
      <p className="lead">
        Aquí el equipo reúne los videos con los que DiverSeña aprende a reconocer cada seña. Cada clip
        es una persona haciendo <strong>una sola seña</strong>; la app extrae los puntos de la mano y
        el reconocimiento los usa de inmediato en este navegador.
      </p>

      <details className="guide" open={samples.length === 0}>
        <summary>📋 Indicaciones para grabar buenos clips</summary>
        <ol>
          <li>
            <strong>Una seña por clip</strong>, de {CLIP_SECONDS} s: empieza con la mano ya en posición y
            mantenla quieta. Si subes videos, recórtalos para que cada uno tenga solo una seña.
          </li>
          <li>
            <strong>Mano completa dentro del cuadro</strong>, a la altura del pecho, con la cara
            visible. Muñeca y los cinco dedos deben verse todo el tiempo.
          </li>
          <li>
            <strong>Luz de frente</strong> (ventana o lámpara detrás de la cámara, no detrás de la
            persona). Fondo sencillo, sin otras manos ni personas.
          </li>
          <li>
            <strong>Variedad, no repetición idéntica</strong>: cambia un poco la distancia, el ángulo, la
            luz, el fondo, la ropa y el día. Lo ideal es que cada seña tenga clips de{' '}
            <strong>al menos 8 personas distintas</strong>, con mano derecha e izquierda.
          </li>
          <li>
            <strong>Meta: {TARGET_CLIPS_PER_SIGN} clips por seña</strong> como mínimo para una primera
            versión confiable.
          </li>
          <li>
            <strong>Quién graba importa</strong>: las referencias deben venir de personas Sordas
            usuarias de la lengua o de intérpretes certificados. Los clips de aprendices sirven para
            pruebas, pero se marcan aparte.
          </li>
          <li>
            <strong>Consentimiento</strong>: cada persona que aparezca debe aceptarlo. Con menores de
            edad, se necesita además la autorización de su acudiente. Usa seudónimos, nunca nombres
            completos ni documentos.
          </li>
          <li>
            Al terminar la sesión, <strong>exporta el dataset</strong> y envíalo al equipo. Guía
            completa en <code>docs/ENTRENAMIENTO-IA.md</code> del repositorio.
          </li>
        </ol>
      </details>

      <h2>1. ¿Quién graba?</h2>
      <div className="profile-form">
        <label className="field">
          <span>Seudónimo (sin nombre completo)</span>
          <input
            value={contributor.alias}
            maxLength={30}
            onChange={(event) => updateContributor({ alias: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Perfil de quien hace la seña</span>
          <select
            value={contributor.signerProfile}
            onChange={(event) => updateContributor({ signerProfile: event.target.value as SignerProfile })}
          >
            {Object.entries(SIGNER_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Mano con la que hace la seña</span>
          <select
            value={contributor.dominantHand}
            onChange={(event) =>
              updateContributor({ dominantHand: event.target.value as ContributorInfo['dominantHand'] })
            }
          >
            <option value="derecha">Derecha</option>
            <option value="izquierda">Izquierda</option>
          </select>
        </label>
        <label className="camera-view__toggle consent">
          <input
            type="checkbox"
            checked={contributor.consentAt !== null}
            onChange={(event) =>
              updateContributor({ consentAt: event.target.checked ? new Date().toISOString() : null })
            }
          />
          <span>
            Autorizo que los videos y los puntos de mi mano se usen para entrenar el reconocimiento de
            DiverSeña. Sé que puedo pedir que se borren. (Si es menor de edad, su acudiente lo autorizó.)
          </span>
        </label>
      </div>

      <h2>2. Lengua y seña</h2>
      <LanguageSelector
        allowLocked
        languages={languages}
        selectedId={languageId}
        onSelect={(id) => {
          setLanguageId(id);
          setSignId(null);
        }}
      />

      {language && (
        <div className="option-grid" role="group" aria-label="Selecciona la seña a grabar">
          {language.signs.map((s) => {
            const count = countFor(s.id);
            const isSelected = s.id === signId;
            return (
              <button
                key={s.id}
                type="button"
                className={isSelected ? 'option-card option-card--selected' : 'option-card'}
                aria-pressed={isSelected}
                onClick={() => setSignId(s.id)}
              >
                <span className="option-card__letter">{s.letter}</span>
                <span className="option-card__subtitle">
                  {count}/{TARGET_CLIPS_PER_SIGN} clips
                </span>
                <span className="meter" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (count / TARGET_CLIPS_PER_SIGN) * 100)}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {sign && language && (
        <div className="practice-panel">
          <h2>
            3. Grabar la vocal {sign.letter} — {language.shortName}
          </h2>
          {!contributorReady && (
            <p className="camera-view__error">Completa el seudónimo y el consentimiento (paso 1) para grabar.</p>
          )}

          <div className="camera-view">
            <div className="camera-view__frame" data-status={cameraStatus}>
              <video ref={videoRef} className="camera-view__video" autoPlay muted playsInline />
              {cameraStatus === 'active' && (
                <HandLandmarksCanvas videoRef={videoRef} handsRef={latestHandsRef} />
              )}
              {phase.kind === 'countdown' && <p className="capture-overlay">{phase.remaining}</p>}
              {phase.kind === 'recording' && <p className="capture-overlay capture-overlay--rec">● Grabando</p>}
              {cameraStatus !== 'active' && (
                <p className="camera-view__overlay-text">
                  {cameraStatus === 'requesting' ? 'Iniciando cámara…' : 'Cámara desactivada'}
                </p>
              )}
            </div>

            <div className="video-actions">
              {cameraStatus === 'active' ? (
                <>
                  <button
                    type="button"
                    className="button"
                    onClick={handleRecord}
                    disabled={!contributorReady || busy}
                  >
                    ⏺ Grabar clip ({CLIP_SECONDS} s)
                  </button>
                  <button type="button" className="button button--secondary" onClick={stopCamera} disabled={busy}>
                    Apagar cámara
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="button"
                  onClick={startCamera}
                  disabled={cameraStatus === 'requesting'}
                >
                  🎥 Activar cámara
                </button>
              )}
              <label
                className={`button button--secondary button--file${!contributorReady || busy ? ' button--disabled' : ''}`}
              >
                ⬆ Subir videos de la vocal {sign.letter}
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  disabled={!contributorReady || busy}
                  onChange={handleUpload}
                />
              </label>
            </div>
            {cameraError && (
              <p role="alert" className="camera-view__error">
                {cameraError.message}
              </p>
            )}

            {phase.kind === 'processing' && (
              <div role="status" className="processing">
                <span>Analizando {phase.label}…</span>
                <span className="meter meter--wide" aria-hidden="true">
                  <span style={{ width: `${Math.round(phase.progress * 100)}%` }} />
                </span>
              </div>
            )}
            {message && (
              <p role="status" className={message.ok ? 'camera-view__result--match' : 'camera-view__error'}>
                {message.text}
              </p>
            )}
          </div>

          {signSamples.length > 0 && (
            <>
              <h3>Clips de la vocal {sign.letter} en este navegador ({signSamples.length})</h3>
              <table className="sample-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Quién</th>
                    <th>Origen</th>
                    <th>Mano visible</th>
                    <th>
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {signSamples.map((sample) => (
                    <tr key={sample.id}>
                      <td>{new Date(sample.createdAt).toLocaleString('es-CO')}</td>
                      <td>
                        {sample.contributor.alias}
                        <span className="option-card__subtitle"> · {SIGNER_LABEL[sample.contributor.signerProfile]}</span>
                      </td>
                      <td>{sample.source === 'camara' ? 'Cámara' : (sample.originalFileName ?? 'Archivo')}</td>
                      <td>{Math.round(sample.handCoverage * 100)} %</td>
                      <td className="sample-table__actions">
                        {sample.hasVideo && (
                          <button type="button" className="link-button" onClick={() => handleDownloadVideo(sample)}>
                            Video
                          </button>
                        )}
                        <button type="button" className="link-button" onClick={() => handleDelete(sample)}>
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      <h2>4. Compartir con el equipo</h2>
      <p>
        El dataset vive en este navegador. Al terminar, <strong>exporta</strong> el archivo{' '}
        <code>{languageId}.json</code> (solo puntos de la mano, sin imagen) y súbelo a la carpeta del
        equipo. Los videos originales se descargan aparte para archivarlos.
      </p>
      <div className="video-actions">
        <button type="button" className="button" onClick={handleExport} disabled={samples.length === 0}>
          Exportar dataset {language?.shortName} ({samples.length} clips)
        </button>
        <label className="button button--secondary button--file">
          Importar dataset (.json)
          <input type="file" accept="application/json,.json" onChange={handleImport} />
        </label>
        <button
          type="button"
          className="button button--secondary"
          onClick={handleDownloadAllVideos}
          disabled={!samples.some((s) => s.hasVideo)}
        >
          Descargar todos los videos
        </button>
      </div>
    </section>
  );
}
