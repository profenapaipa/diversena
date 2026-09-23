import type { UseMediaRecorderResult } from '../../hooks/useMediaRecorder';

interface RecordingControlsProps {
  recorder: UseMediaRecorderResult;
  /** Si la cámara (compartida con el seguimiento en vivo) está encendida. */
  cameraActive: boolean;
}

/**
 * Grabar (usando la misma cámara que ya está activa arriba) o subir un video
 * de la práctica, para revisarlo o compartirlo después. No enciende su
 * propia cámara — por eso solo hay una cámara en la página, no dos.
 */
export function RecordingControls({ recorder, cameraActive }: RecordingControlsProps) {
  const {
    isRecording,
    recordError,
    activeVideoUrl,
    activeVideoName,
    videoQueued,
    startRecording,
    stopRecording,
    handleUpload,
    queueForLater,
  } = recorder;

  return (
    <div>
      <div className="video-actions">
        {cameraActive && (
          <button
            type="button"
            className="button button--secondary"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? '⏹️ Detener grabación' : '⏺️ Grabar video'}
          </button>
        )}

        <label className="button button--secondary button--file">
          Subir video
          <input type="file" accept="video/*" onChange={handleUpload} />
        </label>
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
          {cameraActive
            ? 'Graba un video con la cámara de arriba, o sube uno ya grabado.'
            : 'Activa la cámara para grabar un video, o sube uno ya grabado.'}
        </p>
      )}

      {recordError && <p className="practice-panel__error">{recordError}</p>}
    </div>
  );
}
