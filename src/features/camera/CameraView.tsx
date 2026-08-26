import { useState } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useHandLandmarker } from '../../hooks/useHandLandmarker';
import { HandLandmarksCanvas } from './HandLandmarksCanvas';

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

export function CameraView() {
  const { status, error, videoRef, start, stop } = useCamera();
  const [showLandmarks, setShowLandmarks] = useState(true);
  const { status: handStatus, hands } = useHandLandmarker(videoRef, status === 'active');

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
        </div>
      )}
    </div>
  );
}
