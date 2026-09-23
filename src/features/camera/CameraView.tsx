import { useMemo, useState } from 'react';
import type { Language, Sign } from '../../models/language';
import { useTrackedHand } from '../../hooks/useTrackedHand';
import { useMediaRecorder } from '../../hooks/useMediaRecorder';
import { getReference } from '../../services/recognition/referenceStore';
import { classifyAgainstReferences } from '../../services/recognition/signClassifier';
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
  const { camera, tracking, features } = useTrackedHand();
  const { status, error, videoRef, stream, start, stop } = camera;
  const { status: handStatus, hands } = tracking;
  const [showLandmarks, setShowLandmarks] = useState(true);
  const recorder = useMediaRecorder(stream, fileNamePrefix);

  const referenceCandidates = useMemo(() => {
    if (!language) return [];
    const signs = targetSign ? [targetSign] : language.signs;
    return signs.map((sign) => ({ sign, reference: getReference(language.id, sign.id) }));
  }, [language, targetSign]);

  const hasAnyReference = referenceCandidates.some((candidate) => candidate.reference !== null);

  const classification = useMemo(() => {
    if (!features || referenceCandidates.length === 0) return null;
    return classifyAgainstReferences(features, referenceCandidates);
  }, [features, referenceCandidates]);

  return (
    <div className="camera-view">
      <div className="camera-view__frame" data-status={status}>
        <video ref={videoRef} className="camera-view__video" autoPlay muted playsInline />
        {status === 'active' && showLandmarks && (
          <HandLandmarksCanvas videoRef={videoRef} hands={hands} />
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
            {HAND_STATUS_LABEL[handStatus]}
          </p>

          {language && (
            <div className="camera-view__result" role="status">
              {!hasAnyReference ? (
                <p className="practice-panel__note">
                  Todavía no hay referencias guardadas para {language.name}. Captúralas en
                  «Herramientas → Referencias».
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
