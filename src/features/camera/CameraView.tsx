import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ASPECT, fingerFlexErrors, palmFrame } from '../../services/recognition/handPose3d';
import { currentZScale } from '../../services/recognition/calibration';
import { scaleFlexion, thumbTipDistances } from '../../services/recognition/handPose3d';
import { CalibrationPanel } from './CalibrationPanel';
import { PRIVACY_BEFORE_PERMISSION, PRIVACY_SHORT } from '../../data/privacy';
import { IconLock } from '../../components/icons';
import { useSixSevenGesture } from '../../hooks/useSixSeven';
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
  const frameRef = useRef<HTMLDivElement>(null);
  // Guiño: las dos manos subiendo y bajando por turnos (six seven) inclinan la página.
  useSixSevenGesture(hands);
  const calibration = useCalibration();
  const [skippedCalibration, setSkippedCalibration] = useState(false);
  const videoAspect = () => {
    const v = camera.videoRef.current;
    return v && v.videoWidth > 0 && v.videoHeight > 0 ? v.videoWidth / v.videoHeight : DEFAULT_ASPECT;
  };
  const session = useCalibrationSession(recognizedHand, videoAspect());
  const needsCalibration = requireCalibration && !calibration && !skippedCalibration;
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
  const [rawGuide, setGuide] = useState<Array<[number, number, number]> | null>(null);
  // La guía se acorta a lo que esta persona alcanza a doblar (calibración): nunca pide más de lo que su mano da.
  const guide = useMemo(() => (rawGuide && calibration?.ratios ? scaleFlexion(rawGuide, calibration.ratios) : rawGuide), [rawGuide, calibration]);
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
    const liveFrame = palmFrame(recognizedHand.landmarks, aspect, recognizedHand.side, currentZScale());
    const errors = fingerFlexErrors(liveFrame, guide);
    const off = errors.filter((e) => e.degrees > GUIDE_TOLERANCE_DEG).sort((a, b) => b.degrees - a.degrees);
    // Contacto del pulgar con los otros dedos (la O lo necesita): si todos los dedos están bien pero la punta del pulgar
    // queda más lejos o más cerca de lo que muestra la figura, se dice.
    const liveTips = thumbTipDistances(liveFrame);
    const guideTips = thumbTipDistances(guide);
    const gap = liveTips.reduce((sum, d, i) => sum + (d - guideTips[i]), 0) / liveTips.length;
    const thumb: 'acerca' | 'separa' | null = Math.abs(gap) < 0.35 ? null : gap > 0 ? 'acerca' : 'separa';
    return { placed: errors.length - off.length, total: errors.length, worst: off[0]?.finger ?? null, thumb };
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
  // Mientras se calibra, sobre la mano solo van los puntos de la persona: la guía amarilla de la vocal no tiene sentido todavía.
  const calibrationOn = needsCalibration || session.phase !== 'idle';

  // En el celular la cámara queda muy abajo (después de elegir la vocal): al encenderla, la pantalla baja hasta ella
  // para que se vea que algo cambió y la mano quede a la vista.
  useEffect(() => {
    if (status !== 'active' || !window.matchMedia('(max-width: 52rem)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    frameRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [status]);

  return (
    <div className="camera-view">
      {status === 'active' && (
        <p className="privacy-line privacy-line--camera">
          <IconLock size={15} /> {PRIVACY_SHORT}
        </p>
      )}
      <div className="camera-stage">
        <div ref={frameRef} className="camera-view__frame" data-status={status}>
          <video ref={videoRef} className="camera-view__video" autoPlay muted playsInline />
          {status === 'active' && showLandmarks && (
            <HandLandmarksCanvas videoRef={videoRef} handsRef={latestHandsRef} guide={calibrationOn ? null : guide} guideSide={recognizedHand?.side} />
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
                <p className="camera-view__note">{PRIVACY_BEFORE_PERMISSION} La primera vez puede tardar unos segundos.</p>
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
            {status === 'active' && handStatus !== 'cargando' && handStatus !== 'error' && (needsCalibration || session.phase !== 'idle') ? (
              <CalibrationPanel
                session={session}
                handVisible={recognizedHand !== null}
                firstTime={!calibration}
                onSkipForNow={() => {
                  session.cancel();
                  setSkippedCalibration(true);
                }}
              />
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
                      {!fingerHint.worst && fingerHint.thumb === 'acerca' ? ' Acerca la punta del pulgar a la de los otros dedos.' : ''}
                      {!fingerHint.worst && fingerHint.thumb === 'separa' ? ' Separa un poco la punta del pulgar de los otros dedos.' : ''}
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
                session.start();
              }}
              disabled={session.phase === 'running'}
              title={calibration ? `Calibrada (${calibration.stepsDone ?? 0} de 7 posturas)` : 'Aún sin calibrar'}
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
