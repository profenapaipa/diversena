import {
  AUDIENCE,
  DECISIONS,
  NEXT_STEPS,
  PROBLEM,
  QUESTION,
  REFERENCES,
  REQUIREMENTS,
} from '../data/project';

const REQ_LABEL = { cumplido: 'Cumplido', 'en-progreso': 'En progreso', pendiente: 'Pendiente' } as const;
const REQ_TONE = { cumplido: 'badge--ok', 'en-progreso': 'badge--warn', pendiente: 'badge--crit' } as const;

export function ProjectContent() {
  return (
    <div className="project">
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
        <p className="note">Los tres requisitos del proyecto y cómo se comprueban.</p>
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
            <p>Lo que ve tu cámara, dentro de tu equipo: la imagen no se guarda ni se envía.</p>
          </div>
          <span className="flow__arrow" aria-hidden="true">→</span>
          <div className="flow__box flow__box--core" role="listitem">
            <p className="eyebrow">Procesa</p>
            <p>El detector ubica 21 puntos en cada mano. De ahí en adelante solo se usan esos puntos: se comparan con las señas de referencia y se elige la más parecida.</p>
          </div>
          <span className="flow__arrow" aria-hidden="true">→</span>
          <div className="flow__box" role="listitem">
            <p className="eyebrow">Sale</p>
            <p>La letra en pantalla para que la otra persona la lea, o sugerencias si no está segura.</p>
          </div>
        </div>
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
            Si eres una persona Sorda, intérprete o docente de LSC, tu mirada nos ayuda a validar cada seña. Cuéntanos
            qué le falta a DiverSeña.
          </p>
        </div>
      </section>
    </div>
  );
}
