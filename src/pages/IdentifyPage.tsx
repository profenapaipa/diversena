import { getLanguageById, DEFAULT_LANGUAGE_ID } from '../data/languages';
import { CameraView } from '../features/camera/CameraView';

export function IdentifyPage() {
  // Hoy solo la LSC está disponible: no se pide elegir lengua para no poner un paso con una sola opción.
  const language = getLanguageById(DEFAULT_LANGUAGE_ID);

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Traducir</p>
        <h1>Haz una seña y la convertimos en texto</h1>
        <p className="lead">
          Ponte frente a la cámara con la mano completa dentro del cuadro. Si no estamos seguros, te
          sugerimos las señas más parecidas.
        </p>
        <p className="lead">
          Por ahora solo conozco las cinco vocales de la LSC: <strong>A, E, I, O, U</strong>. Si haces otra seña, no sabré
          cuál es.
        </p>
      </header>

      {language && (
        <div className="practice-panel">
          <h2>Lengua de Señas Colombiana (LSC)</h2>
          <CameraView language={language} fileNamePrefix="video-seña" showRecording={false} requireCalibration />
        </div>
      )}
    </section>
  );
}
