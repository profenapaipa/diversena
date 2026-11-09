import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IntroCarousel } from '../components/IntroCarousel';
import { hasSeenIntro } from '../components/introSeen';
import { languages } from '../data/languages';
import { HandIllustration } from '../components/brand/HandIllustration';
import { IconArrowRight, IconBook, IconCamera, IconGlobe } from '../components/icons';
import { CountUp, Reveal, prefersReducedMotion } from '../components/motion';

const VOWELS = ['A', 'E', 'I', 'O', 'U'];

/** Cómo funciona, en tres nodos. Los textos son cortos: el esquema cuenta el resto. */
const STEPS = [
  { title: 'Te ve', text: 'Tu mano, en tu celular o computador.' },
  { title: 'Marca 21 puntos', text: 'Ubica la posición de cada dedo.' },
  { title: 'Compara', text: 'Te muestra la letra a la que más se parece.' },
];

export function HomePage() {
  // La primera vez se muestra la introducción; después, un botón la vuelve a abrir.
  const [showIntro, setShowIntro] = useState(() => !hasSeenIntro());
  // La burbuja del hero recorre las cinco vocales; con «reducir movimiento» queda fija en la A.
  const [vowel, setVowel] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion() || showIntro) return;
    const timer = window.setInterval(() => setVowel((v) => (v + 1) % VOWELS.length), 2400);
    return () => window.clearInterval(timer);
  }, [showIntro]);

  return (
    <div className="home">
      {showIntro && <IntroCarousel onClose={() => setShowIntro(false)} />}
      <section className="hero">
        <div className="hero__text">
          <p className="eyebrow">Lengua de Señas Colombiana · LSC</p>
          <h1>Aprende lengua de señas con tu cámara</h1>
          <p className="lead">Muestra tu mano y mira si tu seña se parece a la de referencia. Empezamos por las cinco vocales.</p>
          <div className="hero__actions">
            <Link className="button button--lg" to="/aprender">
              <IconBook /> Empezar a aprender
            </Link>
            <Link className="button button--lg button--secondary" to="/identificar">
              <IconCamera /> Identificar una seña
            </Link>
          </div>
          <button type="button" className="link-button" onClick={() => setShowIntro(true)}>
            Ver la introducción
          </button>
        </div>
        <div className="hero__art" aria-hidden="true">
          <div className="hero__screen">
            <HandIllustration key={vowel} className="hero__hand hero__hand--pop" />
            <span key={`b${vowel}`} className="hero__bubble hero__bubble--pop">{VOWELS[vowel]}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Cómo funciona</p>
          <h2>De tu mano a la letra</h2>
        </div>
        <ol className="how">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} className="how__node" delay={i * 140}>
              <span className="how__icon" aria-hidden="true">
                {i === 0 && <IconCamera size={30} />}
                {i === 1 && <HandIllustration className="how__hand" />}
                {i === 2 && <span className="how__letter">A</span>}
              </span>
              <h3><span className="how__num">{i + 1}</span> {step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Qué puedes hacer</p>
          <h2>Tres maneras de usar DiverSeña</h2>
        </div>
        <div className="feature-grid">
          <Reveal className="feature-wrap">
            <Link to="/aprender" className="feature">
              <span className="feature__scene" aria-hidden="true">
                {VOWELS.map((v, i) => (
                  <span key={v} className="chip-vowel" style={{ animationDelay: `${i * 0.5}s` }}>{v}</span>
                ))}
              </span>
              <h3>Aprender</h3>
              <p>Elige una vocal y practícala.</p>
              <span className="feature__go">Ir a aprender <IconArrowRight size={18} /></span>
            </Link>
          </Reveal>
          <Reveal className="feature-wrap" delay={120}>
            <Link to="/identificar" className="feature">
              <span className="feature__scene feature__scene--translate" aria-hidden="true">
                <HandIllustration className="feature__hand" />
                <span className="feature__arrow">›</span>
                <span className="feature__bubble">E</span>
              </span>
              <h3>Identificar</h3>
              <p>Haz la seña y mira a qué letra se parece.</p>
              <span className="feature__go">Ir a identificar <IconArrowRight size={18} /></span>
            </Link>
          </Reveal>
          <Reveal className="feature-wrap" delay={240}>
            <Link to="/explorar" className="feature">
              <span className="feature__scene feature__scene--langs" aria-hidden="true">
                <IconGlobe size={30} />
                {languages.map((language) => (
                  <span key={language.id} className={`lang-chip${language.status === 'disponible' ? ' lang-chip--on' : ''}`}>
                    {language.shortName}
                  </span>
                ))}
              </span>
              <h3>Explorar</h3>
              <p>Cada lengua tiene sus propias letras.</p>
              <span className="feature__go">Ir a explorar <IconArrowRight size={18} /></span>
            </Link>
          </Reveal>
        </div>
        <p className="note home__universal">Ninguna seña es universal: cada país tiene su lengua de señas.</p>
      </section>

      <Reveal as="section" className="section origin-banner">
        <div>
          <p className="eyebrow">Hecho en el aula</p>
          <h2>
            <CountUp to={5} /> vocales hoy, más señas después
          </h2>
          <p>DiverSeña está en construcción: falta validar cada seña con personas Sordas y docentes de LSC.</p>
        </div>
        <Link className="button button--secondary" to="/quienes-somos">
          Conoce quiénes somos <IconArrowRight size={18} />
        </Link>
        <Link className="button button--secondary" to="/contacto">
          Escríbenos
        </Link>
      </Reveal>
    </div>
  );
}
