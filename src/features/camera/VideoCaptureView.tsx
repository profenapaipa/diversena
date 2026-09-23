import type { UseVideoCaptureResult } from '../../hooks/useVideoCapture';

interface VideoCaptureViewProps {
  capture: UseVideoCaptureResult;
}

/**
 * Grabar o subir un video de la práctica, para revisarlo o compartirlo
 * después — complementa (no reemplaza) la cámara en vivo con seguimiento de
 * manos de CameraView.
 */
export function VideoCaptureView({ capture }: VideoCaptureViewProps) {
  const {
    videoRef,
    cameraEnabled,
    cameraLoading,
    cameraError,
    isRecording,
    activeVideoUrl,
    activeVideoName,
    videoQueued,
    toggleCamera,
    startRecording,
    stopRecording,
    handleUpload,
    queueForLater,
  } = capture;

  return (
    <div>
      <div className="video-actions">
        <button type="button" className="button" onClick={() => void toggleCamera()} disabled={cameraLoading}>
          {cameraLoading ? 'Conectando...' : cameraEnabled ? 'Apagar cámara' : 'Activar cámara'}
        </button>

        {cameraEnabled && (
          <button
            type="button"
            className="button button--secondary"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? 'Detener grabación' : 'Grabar video'}
          </button>
        )}

        <label className="button button--secondary button--file">
          Subir video
          <input type="file" accept="video/*" onChange={handleUpload} />
        </label>
      </div>

      <div className="camera-preview-shell">
        {cameraEnabled ? (
          <video
            ref={videoRef}
            className="camera-preview"
            autoPlay
            playsInline
            muted
            aria-label="Vista previa de la cámara"
          />
        ) : (
          <div className="camera-preview camera-preview--placeholder">
            La vista previa de la cámara aparecerá aquí cuando la actives.
          </div>
        )}
      </div>

      {activeVideoUrl ? (
        <div className="uploaded-video-box">
          <video className="uploaded-video" src={activeVideoUrl} controls playsInline />
          <div className="uploaded-video__meta">
            <strong>{activeVideoName}</strong>
            <span>
              {videoQueued ? 'Listo para enviarse cuando lo necesites.' : 'Video listo para usar cuando haga falta.'}
            </span>
          </div>
          <button type="button" className="button" onClick={queueForLater}>
            {videoQueued ? 'Video guardado' : 'Guardar para enviar después'}
          </button>
        </div>
      ) : (
        <p className="practice-panel__note">
          Activa la cámara para grabar un video, o sube uno ya grabado.
        </p>
      )}

      {cameraError && <p className="practice-panel__error">{cameraError}</p>}
    </div>
  );
}
