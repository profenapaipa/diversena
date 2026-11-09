import type { useCalibrationSession } from '../../hooks/useCalibrationSession';
import { CalibrationFigure } from './CalibrationFigure';

type Session = ReturnType<typeof useCalibrationSession>;

interface CalibrationPanelProps {
  session: Session;
  /** ¿Hay una mano a la vista ahora mismo? */
  handVisible: boolean;
  /** Primera vez: se ofrece omitir. Si ya hay calibración (volver a calibrar), se ofrece cancelar. */
  firstTime: boolean;
  onSkipForNow: () => void;
}

/** Marca de cada paso en la lista: check cuando se cumplió, punto cuando se omitió, número mientras espera. */
function StepMark({ state, number }: { state: 'done' | 'skipped' | 'current' | 'pending'; number: number }) {
  if (state === 'done') return <span className="cal-step__mark cal-step__mark--done" aria-hidden="true">✓</span>;
  if (state === 'skipped') return <span className="cal-step__mark cal-step__mark--skipped" aria-hidden="true">–</span>;
  return (
    <span className={`cal-step__mark${state === 'current' ? ' cal-step__mark--current' : ''}`} aria-hidden="true">
      {number}
    </span>
  );
}

/**
 * Calibración guiada de la mano: siete posturas, cada una con su objetivo y su check.
 * Los pasos se completan solos al sostener la postura; también se pueden omitir.
 */
export function CalibrationPanel({ session, handVisible, firstTime, onSkipForNow }: CalibrationPanelProps) {
  const { phase, run, steps } = session;
  const total = steps.length;
  const stateOf = (i: number): 'done' | 'skipped' | 'current' | 'pending' => {
    if (i < run.done.length) return run.done[i] ? 'done' : 'skipped';
    return i === run.index && phase === 'running' ? 'current' : 'pending';
  };

  const list = (
    <ol className="cal-steps">
      {steps.map((step, i) => (
        <li key={step.id} className={`cal-step cal-step--${stateOf(i)}`} aria-current={stateOf(i) === 'current' ? 'step' : undefined}>
          <StepMark state={stateOf(i)} number={i + 1} />
          <span>{step.label}</span>
        </li>
      ))}
    </ol>
  );

  if (phase === 'running') {
    const step = steps[Math.min(run.index, total - 1)];
    const percent = Math.round(run.progress * 100);
    return (
      <div className="calibration">
        <p className="eyebrow">
          Calibrar tu mano · paso {Math.min(run.index + 1, total)} de {total}
        </p>
        <CalibrationFigure step={step.id} />
        <p className="result-panel__verdict">{step.title}</p>
        <p className="result-panel__hint">{step.hint}</p>
        <span className="meter meter--wide" role="img" aria-label={`Paso al ${percent} %`}>
          <span style={{ width: `${percent}%` }} />
        </span>
        <p className="result-panel__hint calibration__live">
          {!handVisible
            ? 'No veo tu mano. Muéstrala a la cámara.'
            : step.id === 'turn45' || step.id === 'turn90' || step.id === 'turn180'
              ? `Giro actual: ${run.turn}°`
              : step.id === 'thumb'
                ? `Pulgar afuera ${run.thumbOut ? '✓' : '·'} · adentro ${run.thumbIn ? '✓' : '·'}`
                : 'Te estoy viendo. Sostén la postura.'}
        </p>
        {list}
        <p className="result-panel__hint">{step.purpose}</p>
        <div className="calibration__actions">
          <button type="button" className="button button--ghost" onClick={session.skip}>
            Omitir este paso
          </button>
          <button type="button" className="button button--ghost" onClick={session.cancel}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    const done = run.done.filter(Boolean).length;
    return (
      <div className="calibration">
        <p className="eyebrow">Calibración completa</p>
        <p className="result-panel__verdict calibration__ok">
          <span aria-hidden="true">✓ </span>
          Tu mano está calibrada
        </p>
        <p className="result-panel__hint">
          Completaste {done} de {total} posturas. Desde ahora la guía y el reconocimiento se ajustan al tamaño, a los giros y a lo
          que doblan tus dedos. Dura mientras uses este navegador; si cambias de mano, vuelve a calibrar.
        </p>
        {list}
        <button type="button" className="button" onClick={session.dismiss}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="calibration">
      <p className="eyebrow">Calibrar tu mano</p>
      <p className="result-panel__verdict">Primero, conozcamos tu mano</p>
      <p className="result-panel__hint">
        Son {total} posturas guiadas, de unos 30 segundos en total, y se hacen una sola vez. Así medimos el tamaño de tu mano,
        cuánto giras y cuánto doblas cada dedo, para que la guía nunca te pida una postura que tu mano no alcanza.
      </p>
      {phase === 'failed' && (
        <p className="result-panel__hint calibration__warn">
          No alcanzamos a ver tu mano abierta lo suficiente. Acércala un poco, con buena luz, y vuelve a intentar.
        </p>
      )}
      {list}
      <button type="button" className="button" onClick={session.start}>
        Empezar calibración
      </button>
      <button type="button" className="button button--ghost" onClick={firstTime ? onSkipForNow : session.cancel}>
        {firstTime ? 'Omitir por ahora' : 'Cancelar'}
      </button>
    </div>
  );
}
