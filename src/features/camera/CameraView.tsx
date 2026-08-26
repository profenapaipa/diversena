import { useCamera } from '../../hooks/useCamera';

const STATUS_LABEL: Record<string, string> = {
  inactive: 'Cámara desactivada',
  requesting: 'Iniciando cámara…',
  active: 'Cámara activa',
  error: 'No se pudo usar la cámara',
};

export function CameraView() {
  const { status, error, videoRef, start, stop } = useCamera();

  return (
    <div className="camera-view">
      <div className="camera-view__frame" data-status={status}>
        <video ref={videoRef} className="camera-view__video" autoPlay muted playsInline />
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
    </div>
  );
}
