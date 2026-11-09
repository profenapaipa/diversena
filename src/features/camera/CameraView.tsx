import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ASPECT, fingerAngleErrors, palmFrame } from '../../services/recognition/handPose3d';
import { currentZScale, saveCalibration } from '../../services/recognition/calibration';
import { useCalibration } from '../../hooks/useCalibration';
import { useCalibrationSession } from '../../hooks/useCalibrationSession';
import { loadTargetPose } from '../../services/recognition/targetPose';
import { GUIDE_TOLERANCE_DEG } from './drawHands';
import type { Language, Sign } from '../../models/language';
import { useTrackedHand } from '../../hooks/useTrackedHand';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import { useAnnotatedStream } from '../../hooks/useAnnotatedStream';
import { useReferenceSet } from '../../hooks/useReferenceSet';
import { useStableClassification } from '../../hooks/useStableClassification';
import { recordPracticeSuccess } from '../../services/profile/profileStore';
import { rankSigns } from '../../services/recognition/signClassifier';
import { IconCamera } from '../../components/icons';
import { HandLandmarksCanvas } from './HandLandmarksCanvas';
import { RecordingControls } from './RecordingControls';

const STATUS_LABEL: Record<string, string> = {
  inactive: 'Cámara apagada',
  requesting: 'Iniciando cámara…',
  active: 'Cámara activa',
  error: 'No se pudo usar la cámara',
};

/** Mensaje accionable para quien no pudo encender la cámara (el del navegador suele ser técnico). */
function friendlyCameraError(reason: string, fallback: string): string {
  if (/denied|permission|NotAllowed/i.test(reason + fallback)) {
    return 'Permite el acceso a la cámara en el candado de la barra de direcciones y pulsa Reintentar.';
  }
  if (/not-?found/i.test(reason + fallback)) return 'No encontramos una cámara en este equipo.';
  return fallback;
}

const HAND_STATUS_LABEL: Record<string, string> = {
  inactivo: '',
  cargando: 'Preparando el detector de manos…',
  'sin-mano': 'Muestra tu mano a la cámara',
  'mano-detectada': 'Mano detectada',
  error: 'No se pudo cargar el detector de manos. Revisa tu conexión a internet.',
};

interface CameraViewProps {
  /** Si se da, además de mostrar la mano, clasifica en vivo contra las referencias de esta lengua. */
  language?: Language;
  /**
   * Con `language`: si se da, es el modo practicar (¿la seña que hago es
   * esta?). Si se omite, es el modo traducir (¿qué seña estoy haciendo?).
   */
  targetSign?: Sign;
  /** Prefijo del nombre de archivo para los videos grabados con esta vista. */
  fileNamePrefix?: string;
  /** Modo practicar: se llama cada vez que la seña objetivo pasa a reconocerse de forma estable. */
  onMatch?: (sign: Sign) => void;
  /** Controles de grabar y subir video (herramientas del equipo). Por defecto se muestran. */
  showRecording?: boolean;
  /** Pide calibrar la mano la primera vez (una vez por persona) antes de reconocer. */
  requireCalibration?: boolean;
}

export function CameraView({ language, targetSign, fileNamePrefix = 'video-diversena', onMatch, showRecording = true, requireCalibration = false }: CameraViewProps) {
  const { camera, tracking, recognizedHand, features } = useTrackedHand();
  const { status, error, videoRef, start, stop } = camera;
  const { status: handStatus, hands, latestHandsRef } = tracking;
  const [showLandmarks, setShowLandmarks] = useState(true);
  const calibration = useCalibration();
  const [skippedCalibration, setSkippedCalibration] = useState(false);
  const videoAspect = () => {
    const v = camera.videoRef.current;
    return v && v.videoWidth > 0 && v.videoHeight > 0 ? v.videoWidth / v.videoHeight : DEFAULT_ASPECT;
  };
  const session = useCalibrationSession(recognizedHand, videoAspect());
  const needsCalibration = requireCalibration && !calibration && !skippedCalibration;
  const calibrating = session.phase === 'running';
  // Se graba la vista anotada (video + puntos), no la cámara cruda.
  const annotatedStream = useAnnotatedStream(videoRef, latestHandsRef, status === 'active', showLandmarks);
  const recorder = useMediaRecorder(annotatedStream, fileNamePrefix);
  const { loaded, loading: loadingReferences } = useReferenceSet(language);

  // En modo practicar se compara contra TODAS las señas y se pide que gane
  // la objetivo: así una "E" no cuenta como "A" solo por superar el umbral.
  const referenceCandidates = useMemo(() => {
    if (!language) return [];
    return language.signs.map((sign) => ({ sign, references: loaded.references[sign.id] ?? [] }));
  }, [language, loaded]);

  // Guía: la pose ideal de la vocal se dibuja sobre la mano (solo en modo practicar).
  const [guide, setGuide] = useState<Array<[number, number, number]> | null>(null);
  useEffect(() => {
    let cancelled = false;
    setGuide(null);
    if (language && targetSign) {
      loadTargetPose(language, targetSign).then((pose) => {
        if (!cancelled) setGuide(pose);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [language, targetSign]);

  // Qué dedos faltan por poner en su lugar, para decirlo con palabras.
  const fingerHint = useMemo(() => {
    if (!guide || !recognizedHand) return null;
    const video = camera.videoRef.current;
    const aspect = video && video.videoWidth > 0 && video.videoHeight > 0 ? video.videoWidth / video.videoHeight : DEFAULT_ASPECT;
    const errors = fingerAngleErrors(palmFrame(recognizedHand.landmarks, aspect, recognizedHand.side, currentZScale()), guide);
    const off = errors.filter((e) => e.degrees > GUIDE_TOLERANCE_DEG).sort((a, b) => b.degrees - a.degrees);
    return { placed: errors.length - off.length, total: errors.length, worst: off[0]?.finger ?? null };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- el video se lee al calcular
  }, [guide, recognizedHand]);

  const hasAnyReference = referenceCandidates.some((candidate) => candidate.references.length > 0);
  const targetHasReferences =
    !targetSign || referenceCandidates.some((c) => c.sign.id === targetSign.id && c.references.length > 0);

  const stable = useStableClassification(features, referenceCandidates);
  const classification = targetSign ? (stable?.sign.id === targetSign.id ? stable : null) : stable;
  const similarity = classification ? Math.round(classification.confidence * 100) : null;

  // "¿Quizás quisiste decir…?" (boceto del equipo): cuando no hay un
  // resultado seguro, las señas que más se parecen a lo que hace la mano.
  const suggestions = useMemo(() => {
    if (!features || classification) return [];
    return rankSigns(features, referenceCandidates, 3);
  }, [features, classification, referenceCandidates]);

  // Cada vez que la seña objetivo pasa a reconocerse de forma estable, cuenta como un acierto.
  const wasMatchingRef = useRef(false);
  useEffect(() => {
    const matching = Boolean(targetSign && classification);
    if (matching && !wasMatchingRef.current && language && targetSign) {
      recordPracticeSuccess(language.id, targetSign.id);
      onMatch?.(targetSign);
    }
    wasMatchingRef.current = matching;
  }, [classification, language, targetSign, onMatch]);

  const handLabel =
    handStatus === 'mano-detectada'
      ? hands.length === 2
        ? `Dos manos · se lee la ${recognizedHand?.side}`
        : `Mano ${hands[0]?.side} detectada`
      : HAND_STATUS_LABEL[handStatus];

  const showResult = language && status === 'active';

  return (
    <div className="camera-view">
      <div className="camera-stage">
        <div className="camera-view__frame" data-status={status}>
          <video ref={videoRef} className="camera-view__video" autoPlay muted playsInline />
          {status === 'active' && showLandmarks && (
            <HandLandmarksCanvas videoRef={videoRef} handsRef={latestHandsRef} guide={guide} guideSide={recognizedHand?.side} />
          )}
          {status !== 'active' && (
            <div className="camera-view__overlay-text">
              <IconCamera size={40} />
              <p>{status === 'error' && error ? friendlyCameraError(error.reason, error.message) : STATUS_LABEL[status]}</p>
              <button
                type="button"
                className="button"
                onClick={start}
                disabled={status === 'requesting'}
                aria-busy={status === 'requesting'}
              >
                {status === 'error' ? 'Reintentar' : 'Activar cámara'}
              </button>
              {status !== 'error' && (
                <p className="camera-view__note">Tu cámara no se graba ni se envía. La primera vez puede tardar unos segundos.</p>
              )}
            </div>
          )}
          {status === 'active' && (
            <span className="camera-chip" role="status">
              <span className={`camera-chip__dot camera-chip__dot--${handStatus}`} aria-hidden="true" />
              {handLabel}
            </span>
          )}
        </div>

        {showResult && (
          <aside className="result-panel" aria-live="polite">
            <p className="eyebrow">{targetSign ? `Practicando la ${targetSign.letter}` : 'Traducción'}</p>
            {status === 'active' && handStatus !== 'cargando' && handStatus !== 'error' && (needsCalibration || calibrating) ? (
              <div className="calibration">
                <p className="eyebrow">Calibrar tu mano</p>
                {calibrating ? (
                  <>
                    <p className="result-panel__verdict">Abre la mano y gírala despacio</p>
                    <p className="result-panel__hint">
                      Muéstrala de frente y gírala suavemente hacia los lados, como mostrando el dorso y la palma. Mantén los dedos
                      abiertos.
                    </p>
                    <span className="meter meter--wide" role="img" aria-label={`Calibración al ${Math.round(session.progress * 100)} %`}>
                      <span style={{ width: `${Math.round(session.progress * 100)}%` }} />
                    </span>
                    <p className="result-panel__hint">
                      {recognizedHand && session.collected > 0 ? 'Te estoy viendo. ' : 'Muestra tu mano abierta. '}
                      Cuadros: {session.collected} de {session.needed}
                    </p>
                    <button type="button" className="button button--ghost" onClick={session.cancel}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <p className="result-panel__verdict">Primero, conozcamos tu mano</p>
                    <p className="result-panel__hint">
                      Tarda unos 8 segundos y se hace una sola vez. Así medimos el tamaño y los dedos de tu mano, y la
                      guía se ajusta a ella aunque la gires.
                    </p>
                    {session.phase === 'failed' && (
                      <p className="result-panel__hint calibration__warn">
                        No te vimos la mano abierta el tiempo suficiente. Acércala un poco y vuelve a intentar.
                      </p>
                    )}
                    <button type="button" className="button" onClick={session.start} disabled={!recognizedHand}>
                      {recognizedHand ? 'Calibrar mi mano' : 'Muestra tu mano para empezar'}
                    </button>
                    <button type="button" className="button button--ghost" onClick={() => setSkippedCalibration(true)}>
                      Omitir por ahora
                    </button>
                  </>
                )}
              </div>
            ) : handStatus === 'cargando' ? (
              <>
                <p className="result-panel__verdict">Preparando el detector…</p>
                <span className="meter meter--wide meter--busy" aria-hidden="true">
                  <span />
                </span>
                <p className="result-panel__hint">La primera vez tarda unos segundos. No cierres la página.</p>
              </>
            ) : handStatus === 'error' ? (
              <>
                <p className="result-panel__verdict">No se pudo cargar el detector</p>
                <p className="result-panel__hint">Revisa tu conexión a internet y vuelve a intentarlo.</p>
                <button type="button" className="button" onClick={() => window.location.reload()}>
                  Reintentar
                </button>
              </>
            ) : loadingReferences && !hasAnyReference ? (
              <p className="result-panel__hint">Cargando datos de reconocimiento…</p>
            ) : !hasAnyReference || !targetHasReferences ? (
              <p className="result-panel__hint">
                Aún no hay datos de entrenamiento para{' '}
                {targetSign ? `la vocal ${targetSign.letter}` : language.shortName}. El equipo los está
                reuniendo en el Panel del equipo.
              </p>
            ) : classification ? (
              <>
                <p className="result-panel__letter result-panel__letter--ok">{classification.sign.letter}</p>
                <p className="result-panel__verdict">
                  {targetSign ? `¡Lo lograste! Reconocimos tu ${targetSign.letter}` : `Vocal ${classification.sign.letter}`}
                </p>
                <p className="result-panel__pct">{similarity} %</p>
                <span
                  className="meter meter--wide"
                  role="img"
                  aria-label={`Parecido con la referencia: ${similarity} %`}
                >
                  <span style={{ width: `${similarity}%` }} />
                </span>
                <p className="result-panel__hint">Parecido con la referencia</p>
              </>
            ) : (
              <>
                <p className="result-panel__letter" aria-hidden="true">
                  ?
                </p>
                <p className="result-panel__verdict">
                  {!features ? 'Muestra tu mano' : targetSign ? 'Todavía no coincide' : 'No estoy seguro'}
                </p>
                {targetSign && fingerHint ? (
                  <div className="suggestions">
                    <p className="result-panel__hint">
                      {fingerHint.placed} de {fingerHint.total} dedos en su lugar
                      {fingerHint.worst ? `. Ajusta el ${fingerHint.worst}.` : '.'}
                    </p>
                    {targetSign.description && <p className="result-panel__hint">Recuerda: {targetSign.description}</p>}
                    {suggestions[0] && suggestions[0].sign.id !== targetSign.id && (
                      <p className="result-panel__hint">Ahora se parece más a la {suggestions[0].sign.letter}.</p>
                    )}
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="suggestions">
                    <p className="result-panel__hint">¿Quizás quisiste decir…?</p>
                    <ul>
                      {suggestions.map(({ sign, confidence }) => (
                        <li key={sign.id}>
                          <span className="suggestions__letter">{sign.letter}</span>
                          <span className="meter" aria-hidden="true">
                            <span style={{ width: `${Math.round(confidence * 100)}%` }} />
                          </span>
                          <span className="suggestions__pct">{Math.round(confidence * 100)} %</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  features && (
                    <p className="result-panel__hint">
                      {targetSign
                        ? 'Revisa la posición de los dedos y del pulgar.'
                        : 'Haz la seña con la mano completa dentro del cuadro.'}
                    </p>
                  )
                )}
              </>
            )}
          </aside>
        )}
      </div>

      {status === 'active' && (
        <div className="camera-toolbar">
          <label className="camera-view__toggle">
            <input
              type="checkbox"
              checked={showLandmarks}
              onChange={(event) => setShowLandmarks(event.target.checked)}
            />
            Mostrar puntos de la mano
          </label>
          {requireCalibration && (
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                setSkippedCalibration(false);
                saveCalibration(null);
              }}
              title={calibration ? `Calibrada: giro visto ${calibration.turnDegrees}°` : 'Aún sin calibrar'}
            >
              {calibration ? 'Volver a calibrar' : 'Calibrar mi mano'}
            </button>
          )}
          <button type="button" className="button button--ghost" onClick={stop}>
            Apagar cámara
          </button>
        </div>
      )}

      {showRecording && <RecordingControls recorder={recorder} cameraActive={status === 'active'} />}
    </div>
  );
}
