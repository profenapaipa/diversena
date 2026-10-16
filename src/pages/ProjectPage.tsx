import { Link } from 'react-router-dom';
import {
  AUDIENCE,
  DECISIONS,
  NEXT_STEPS,
  PHASES,
  PROBLEM,
  PROJECT_ORIGIN,
  QUESTION,
  REFERENCES,
  REQUIREMENTS,
} from '../data/project';

const REQ_LABEL = { cumplido: 'Cumplido', 'en-progreso': 'En progreso', pendiente: 'Pendiente' } as const;
const REQ_TONE = { cumplido: 'badge--ok', 'en-progreso': 'badge--warn', pendiente: 'badge--crit' } as const;

export function ProjectPage() {
  return (
    <article className="page project">
      <header className="page-head">
        <p className="eyebrow">
          {PROJECT_ORIGIN.program} · {PROJECT_ORIGIN.period}
        </p>
        <h1>El proyecto</h1>
        <p className="lead">
          DiverSeña empezó como el «Lector de lengua de señas» del Equipo 6 y hoy es un prototipo web que
          reconoce señas con la cámara. Esta es su historia, documentada fase por fase.
        </p>
        <p className="team-line">
          <strong>Equipo:</strong> {PROJECT_ORIGIN.members.join(', ')} · grado {PROJECT_ORIGIN.grade}
        </p>
      </header>

      <section className="section section--split">
        <div>
          <h2>El problema</h2>
          <p>{PROBLEM}</p>
        </div>
        <div className="card card--tint">
          <p className="eyebrow">Pregunta de investigación</p>
          <p className="quote">{QUESTION}</p>
          <p className="eyebrow">Para quién</p>
          <p>{AUDIENCE}</p>
        </div>
      </section>

      <section className="section">
        <h2>Qué debe hacer la solución</h2>
        <p className="note">Los tres requisitos de la ficha técnica del equipo y cómo se comprueban.</p>
        <div className="req-grid">
          {REQUIREMENTS.map((req) => (
            <div key={req.action} className="card">
              <span className={`badge ${REQ_TONE[req.status]}`}>{REQ_LABEL[req.status]}</span>
              <h3>{req.action}</h3>
              <p className="note">
                <strong>Cómo se prueba:</strong> {req.test}
              </p>
              <p>{req.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Cómo funciona</h2>
        <div className="flow" role="list">
          <div className="flow__box" role="listitem">
            <p className="eyebrow">Entra</p>
            <p>La imagen de la cámara con la persona haciendo una seña.</p>
          </div>
          <span className="flow__arrow" aria-hidden="true">→</span>
          <div className="flow__box flow__box--core" role="listitem">
            <p className="eyebrow">Procesa</p>
            <p>Toma los 21 puntos de cada mano, los compara con las señas de referencia y elige la más parecida.</p>
          </div>
          <span className="flow__arrow" aria-hidden="true">→</span>
          <div className="flow__box" role="listitem">
            <p className="eyebrow">Sale</p>
            <p>La letra en pantalla para que la otra persona la lea, o sugerencias si no está segura.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Ruta del semestre</h2>
        <p className="note">Metodología Design Thinking: lo que hizo el equipo en cada fase y lo que produjo.</p>
        <ol className="timeline">
          {PHASES.map((phase) => (
            <li key={phase.name}>
              <span className="timeline__date">{phase.dates}</span>
              <div>
                <h3>{phase.name}</h3>
                <p>{phase.did}</p>
                <p className="note">Resultado: {phase.produced}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <h2>Decisiones técnicas</h2>
        <div className="decision-grid">
          {DECISIONS.map((decision) => (
            <div key={decision.title} className="card">
              <h3>{decision.title}</h3>
              <p>{decision.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Antecedentes</h2>
        <p className="note">Investigaciones en las que se apoya el proyecto (APA 7).</p>
        <ul className="references">
          {REFERENCES.map((ref) => (
            <li key={ref.doi}>
              <p>{ref.apa}</p>
              <p className="note">
                {ref.finding}{' '}
                <a href={ref.doi} target="_blank" rel="noreferrer">
                  Ver fuente
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section section--split">
        <div>
          <h2>Lo que sigue</h2>
          <ol className="next-steps">
            {NEXT_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="card card--tint">
          <h3>¿Quieres ayudar?</h3>
          <p>
            Si eres una persona Sorda o intérprete de LSC, puedes grabar clips de entrenamiento para que
            DiverSeña reconozca mejor cada seña.
          </p>
          <Link className="button" to="/panel">
            Ir al panel del equipo
          </Link>
        </div>
      </section>
    </article>
  );
}
