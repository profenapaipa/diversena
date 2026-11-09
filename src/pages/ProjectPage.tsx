import { Link } from 'react-router-dom';
import { DECISIONS, QUESTION, REFERENCES } from '../data/project';
import { Reveal } from '../components/motion';

/** Para quién es: cada quien con lo que la herramienta le da. La docencia va primero: guía, y la herramienta acompaña. */
const ROLES = [
  {
    id: 'docentes',
    title: 'Docentes',
    text: 'Un apoyo para sus clases: sus estudiantes practican entre sesiones con una referencia común.',
  },
  {
    id: 'estudiantes',
    title: 'Estudiantes',
    text: 'Practican a su ritmo, con la cámara y consejos para acomodar los dedos.',
  },
  {
    id: 'familias',
    title: 'Familias',
    text: 'Aprenden en casa, juntas, desde el celular o el computador.',
  },
] as const;

/** Lo que sigue, en tres pasos. */
const NEXT = [
  'Probarla en clase con docentes de LSC',
  'Validar cada seña con personas Sordas',
  'Sumar más señas y, después, otras lenguas',
];

/**
 * El proyecto: qué es DiverSeña como herramienta, para quién, la pregunta que la guía y lo que sigue. No habla de cómo
 * funciona por dentro (eso está en la portada). El detalle técnico y las fuentes quedan plegados.
 */
export function ProjectContent() {
  return (
    <div className="project">
      <section className="section">
        <h2>Qué es</h2>
        <p className="project__lead">
          Una herramienta de software que complementa el aprendizaje de la lengua de señas en el aula y fuera de ella.
        </p>
        <p className="note">No reemplaza a quien enseña: la docencia guía y DiverSeña acompaña la práctica.</p>
      </section>

      <section className="section">
        <h2>Para quién</h2>
        <ul className="roles">
          {ROLES.map((role, i) => (
            <Reveal as="li" key={role.id} className={`roles__card roles__card--${role.id}`} delay={i * 100}>
              <h3>{role.title}</h3>
              <p>{role.text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>La pregunta</h2>
        <p className="quote">{QUESTION}</p>
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
          <strong>¿Eres docente de LSC, intérprete o una persona Sorda?</strong> Queremos probarla contigo y que revises cada seña.
        </p>
        <Link className="button button--secondary" to="/contacto">Escríbenos</Link>
      </div>
    </div>
  );
}
