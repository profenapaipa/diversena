import { Link } from 'react-router-dom';
import { languages } from '../data/languages';
import { PROJECT_ORIGIN } from '../data/project';
import { HandIllustration } from '../components/brand/HandIllustration';
import { IconArrowRight, IconBook, IconCamera, IconGlobe } from '../components/icons';

const STEPS = [
  {
    title: 'La cámara ve tu mano',
    text: 'Te ubicas frente a la cámara y haces la seña. No se graba ni se envía nada: todo pasa en tu equipo.',
  },
  {
    title: 'Compara con lo que aprendió',
    text: 'DiverSeña marca 21 puntos en cada mano y los compara con señas de referencia grabadas por personas que usan la lengua.',
  },
  {
    title: 'Te muestra la letra',
    text: 'Aparece la seña reconocida. Si no está segura, te sugiere las más parecidas: «¿quizás quisiste decir…?».',
  },
];

export function HomePage() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero__text">
          <p className="eyebrow">Lengua de Señas Colombiana · LSC</p>
          <h1>Aprende lengua de señas con tu cámara</h1>
          <p className="lead">
            DiverSeña reconoce tus manos en tiempo real y te dice si la seña está bien hecha. Empezamos por
            las vocales, desde cualquier navegador y sin instalar nada.
          </p>
          <div className="hero__actions">
            <Link className="button button--lg" to="/aprender">
              <IconBook /> Empezar a aprender
            </Link>
            <Link className="button button--lg button--secondary" to="/identificar">
              <IconCamera /> Traducir una seña
            </Link>
          </div>
        </div>
        <div className="hero__art" aria-hidden="true">
          <div className="hero__screen">
            <HandIllustration className="hero__hand" />
            <span className="hero__bubble">A</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Cómo funciona</p>
          <h2>De tu mano a la letra, en menos de un segundo</h2>
        </div>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.title} className="step">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Qué puedes hacer</p>
          <h2>Tres maneras de usar DiverSeña</h2>
        </div>
        <div className="feature-grid">
          <Link to="/aprender" className="feature">
            <span className="feature__icon"><IconBook size={26} /></span>
            <h3>Aprender</h3>
            <p>Elige una vocal, mira cómo se hace y practícala con retroalimentación al instante.</p>
            <span className="feature__go">Ir a aprender <IconArrowRight size={18} /></span>
          </Link>
          <Link to="/identificar" className="feature">
            <span className="feature__icon"><IconCamera size={26} /></span>
            <h3>Traducir</h3>
            <p>Haz una seña frente a la cámara y DiverSeña te dice qué letra es.</p>
            <span className="feature__go">Ir a traducir <IconArrowRight size={18} /></span>
          </Link>
          <Link to="/explorar" className="feature">
            <span className="feature__icon"><IconGlobe size={26} /></span>
            <h3>Explorar</h3>
            <p>Descubre cómo cambia la misma letra entre lenguas de señas de distintos países.</p>
            <span className="feature__go">Ir a explorar <IconArrowRight size={18} /></span>
          </Link>
        </div>
      </section>

      <section className="section section--split">
        <div>
          <p className="eyebrow">Respeto por la lengua</p>
          <h2>Cada país tiene su lengua de señas</h2>
          <p>
            Las lenguas de señas son lenguas completas, con su propia gramática, y cambian entre países y
            comunidades. Por eso DiverSeña no presenta ninguna seña como universal: empezamos por la
            Lengua de Señas Colombiana y abriremos las demás cuando tengan contenido validado por sus
            comunidades.
          </p>
        </div>
        <ul className="language-list">
          {languages.map((language) => (
            <li key={language.id}>
              <span>
                <strong>{language.shortName}</strong> {language.country}
              </span>
              {language.status === 'disponible' ? (
                <span className="badge badge--ok">Disponible</span>
              ) : (
                <span className="badge badge--soon">🔒 Próximamente</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="section origin-banner">
        <div>
          <p className="eyebrow">Hecho en el aula</p>
          <h2>Un proyecto estudiantil que quiere crecer</h2>
          <p>
            DiverSeña nació en el {PROJECT_ORIGIN.program} {PROJECT_ORIGIN.period}, en el equipo de{' '}
            {PROJECT_ORIGIN.members.join(', ')} (grado {PROJECT_ORIGIN.grade}). Hoy busca convertirse en una
            herramienta sostenible para colegios, familias e instituciones.
          </p>
        </div>
        <Link className="button button--secondary" to="/proyecto">
          Conoce el proyecto <IconArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
