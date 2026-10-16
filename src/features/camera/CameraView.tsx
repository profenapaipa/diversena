import { useEffect, useMemo, useRef, useState } from 'react';
import type { Language, Sign } from '../../models/language';
import { useTrackedHand } from '../../hooks/useTrackedHand';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import { useReferenceSet } from '../../hooks/useReferenceSet';
import { useStableClassification } from '../../hooks/useStableClassification';
import { recordPracticeSuccess } from '../../services/profile/profileStore';
import { HandLandmarksCanvas } from './HandLandmarksCanvas';
import { RecordingControls } from './RecordingControls';

const STATUS_LABEL: Record<string, string> = {
  inactive: 'Cámara desactivada',
  requesting: 'Iniciando cámara…',
  active: 'Cámara activa',
  error: 'No se pudo usar la cámara',
};

const HAND_STATUS_LABEL: Record<string, string> = {
  inactivo: '',
  cargando: 'Cargando el detector de manos…',
  'sin-mano': 'No se detecta ninguna mano',
  'mano-detectada': 'Mano detectada',
  error: 'No se pudo cargar el detector de manos',
};

interface CameraViewProps {
  /** Si se da, además de mostrar la mano, clasifica en vivo contra las referencias guardadas de esta lengua. */
  language?: Language;
  /**
   * Con `language`: si se da, compara solo contra esta seña (modo practicar,
   * retroalimentación correcto/intenta de nuevo). Si se omite, compara
   * contra todas las señas de la lengua (modo identificar).
   */
  targetSign?: Sign;
  /** Prefijo del nombre de archivo para los videos grabados con esta vista. */
  fileNamePrefix?: string;
}

export function CameraView({ language, targetSign, fileNamePrefix = 'video-diversena' }: CameraViewProps) {
  const { camera, tracking, recognizedHand, features } = useTrackedHand();
  const { status, error, videoRef, stream, start, stop } = camera;
  const { status: handStatus, hands, latestHandsRef, fps } = tracking;
  const [showLandmarks, setShowLandmarks] = useState(true);
  const recorder = useMediaRecorder(stream, fileNamePrefix);
  const { loaded, loading: loadingReferences } = useReferenceSet(language);

  // En modo practicar se compara contra TODAS las señas y se pide que gane
  // la objetivo: así una "E" no cuenta como "A" solo por superar el umbral.
  const referenceCandidates = useMemo(() => {
    if (!language) return [];
    return language.signs.map((sign) => ({ sign, references: loaded.references[sign.id] ?? [] }));
  }, [language, loaded]);

  const hasAnyReference = referenceCandidates.some((candidate) => candidate.references.length > 0);
  const targetHasReferences =
    !targetSign || referenceCandidates.some((c) => c.sign.id === targetSign.id && c.references.length > 0);

  const stable = useStableClassification(features, referenceCandidates);
  const classification = targetSign ? (stable?.sign.id === targetSign.id ? stable : null) : stable;

  // Cada vez que la seña objetivo pasa a reconocerse de forma estable, cuenta como un acierto.
  const wasMatchingRef = useRef(false);
  useEffect(() => {
    const matching = Boolean(targetSign && classification);
    if (matching && !wasMatchingRef.current && language && targetSign) {
      recordPracticeSuccess(language.id, targetSign.id);
    }
    wasMatchingRef.current = matching;
  }, [classification, language, targetSign]);

  return (
    <div className="camera-view">
      <div className="camera-view__frame" data-status={status}>
        <video ref={videoRef} className="camera-view__video" autoPlay muted playsInline />
        {status === 'active' && showLandmarks && (
          <HandLandmarksCanvas videoRef={videoRef} handsRef={latestHandsRef} />
        )}
        {status !== 'active' && (
          <p className="camera-view__overlay-text">{STATUS_LABEL[status]}</p>
        )}
      </div>

      {status === 'active' ? (
        <button type="button" className="button button--secondary" onClick={stop}>
          ⏹️ Desactivar cámara
        </button>
      ) : (
        <button
          type="button"
          className="button"
          onClick={start}
          disabled={status === 'requesting'}
          aria-busy={status === 'requesting'}
        >
          🎥 Activar cámara
        </button>
      )}

      <p role="status" className="camera-view__status">
        {STATUS_LABEL[status]}
      </p>

      {status === 'error' && error && (
        <p role="alert" className="camera-view__error">
          {error.message}
        </p>
      )}

      {status === 'active' && (
        <div className="camera-view__tracking">
          <label className="camera-view__toggle">
            <input
              type="checkbox"
              checked={showLandmarks}
              onChange={(event) => setShowLandmarks(event.target.checked)}
            />
            Mostrar puntos de referencia
          </label>
          <p role="status" className="camera-view__status">
            {handStatus === 'mano-detectada'
              ? hands.length === 2
                ? `Dos manos detectadas · se reconoce la ${recognizedHand?.side}`
                : `Mano ${hands[0]?.side} detectada`
              : HAND_STATUS_LABEL[handStatus]}
            {fps > 0 && <span className="camera-view__fps"> · {fps} cuadros/s</span>}
          </p>

          {language && (
            <div className="camera-view__result" role="status">
              {loadingReferences && !hasAnyReference ? (
                <p className="practice-panel__note">Cargando datos de reconocimiento…</p>
              ) : !hasAnyReference || !targetHasReferences ? (
                <p className="practice-panel__note">
                  Todavía no hay datos de entrenamiento para{' '}
                  {targetSign ? `la vocal ${targetSign.letter} en ` : ''}
                  {language.name}. El equipo los está reuniendo en «Entrenar IA».
                </p>
              ) : targetSign ? (
                classification ? (
                  <p className="camera-view__result--match">
                    ✓ ¡Correcto! Coincide con la vocal {targetSign.letter}.
                  </p>
                ) : (
                  <p className="camera-view__result--no-match">
                    Todavía no coincide. Revisa la posición de los dedos.
                  </p>
                )
              ) : classification ? (
                <p className="camera-view__result--match">
                  Seña detectada: <strong>{classification.sign.letter}</strong> — confianza del
                  reconocimiento: {Math.round(classification.confidence * 100)}%
                </p>
              ) : (
                <p className="camera-view__result--no-match">
                  No se pudo identificar la seña. Muestra claramente la mano dentro del área de
                  cámara.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <RecordingControls recorder={recorder} cameraActive={status === 'active'} />
    </div>
  );
}
