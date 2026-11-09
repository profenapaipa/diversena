import { AUDIENCE, DECISIONS, PROBLEM, QUESTION, REFERENCES, REQUIREMENTS } from '../data/project';
import { Link } from 'react-router-dom';
import { CountUp, Reveal } from '../components/motion';

const REQ_LABEL = { cumplido: 'Cumplido', 'en-progreso': 'En progreso', pendiente: 'Pendiente' } as const;
const REQ_TONE = { cumplido: 'badge--ok', 'en-progreso': 'badge--warn', pendiente: 'badge--crit' } as const;

/** Cómo funciona, en tres cajas de pocas palabras. */
const FLOW = [
  { label: 'Entra', text: 'Lo que ve tu cámara, en tu celular o computador.' },
  { label: 'Procesa', text: '21 puntos por mano, contra las señas de referencia.' },
  { label: 'Sale', text: 'La letra, o sugerencias si no está segura.' },
];

/** Lo que sigue, en tres pasos. */
const NEXT = ['Más clips con personas Sordas e intérpretes', 'Validar cada seña con la comunidad Sorda', 'Más señas y, después, otras lenguas'];

/** El proyecto, en lo esencial: el problema, lo que debe hacer, cómo funciona y lo que sigue. El detalle queda plegado. */
export function ProjectContent() {
  return (
    <div className="project">
      <Reveal className="stats">
        <div className="stat"><strong><CountUp to={21} /></strong><span>puntos por mano</span></div>
        <div className="stat"><strong><CountUp to={5} /></strong><span>vocales</span></div>
        <div className="stat"><strong><CountUp to={1} />/3</strong><span>lenguas disponibles</span></div>
      </Reveal>

      <section className="section">
        <h2>El problema</h2>
        <p className="project__lead">{PROBLEM}</p>
        <p className="note">{AUDIENCE}</p>
      </section>

      <section className="section">
        <h2>La pregunta</h2>
        <p className="quote">{QUESTION}</p>
      </section>

      <section className="section">
        <h2>Qué debe hacer</h2>
        <ul className="req-list">
          {REQUIREMENTS.map((req) => (
            <li key={req.action}>
              <span className={`badge ${REQ_TONE[req.status]}`}>{REQ_LABEL[req.status]}</span>
              <span>{req.action}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>Cómo funciona</h2>
        <div className="flow" role="list">
          {FLOW.map((box, i) => (
            <div key={box.label} className="contents" role="presentation">
              <div className={`flow__box${i === 1 ? ' flow__box--core' : ''}`} role="listitem">
                <p className="eyebrow">{box.label}</p>
                <p>{box.text}</p>
              </div>
              {i < FLOW.length - 1 && <span className="flow__arrow" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Lo que sigue</h2>
        <ol className="next-line">
          {NEXT.map((step, i) => (
            <li key={step}>
              <span className="next-line__num" aria-hidden="true">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <details className="section sources">
        <summary>
          <h2>Decisiones y fuentes</h2>
          <small>Para quien quiera el detalle</small>
        </summary>
        <ul className="decision-chips">
          {DECISIONS.map((decision) => (
            <li key={decision.title} className="chip-note">{decision.title}</li>
          ))}
        </ul>
        <ul className="references">
          {REFERENCES.map((ref) => (
            <li key={ref.doi}>
              <p className="note">
                {ref.finding}{' '}
                <a href={ref.doi} target="_blank" rel="noreferrer">
                  Ver fuente
                </a>
              </p>
            </li>
          ))}
        </ul>
      </details>

      <div className="project__help">
        <p>
          <strong>¿Eres una persona Sorda, intérprete o docente de LSC?</strong> Tu revisión nos ayuda a validar cada seña.
        </p>
        <Link className="button button--secondary" to="/contacto">Escríbenos</Link>
      </div>
    </div>
  );
}
