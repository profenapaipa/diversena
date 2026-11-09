import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Reveal } from '../components/motion';
import { IdentityContent } from './IdentityPage';
import { ProjectContent } from './ProjectPage';

/** Los cuatro aportes que hacen posible la experiencia. Al elegir uno se iluminan las fases donde interviene. */
const CONTRIBUTIONS = [
  { id: 'pedagogico', title: 'Pedagógico', text: 'Se aprende haciendo, con un rol real para cada estudiante.' },
  { id: 'emprendimiento', title: 'Emprendimiento', text: 'Pensamos en quién lo usará y cómo mantenerlo vivo.' },
  { id: 'tecnologico', title: 'Tecnológico', text: 'Visión por computador en el navegador, sin cuentas.' },
  { id: 'critico', title: 'Crítico', text: 'Validamos con personas Sordas y decimos hasta dónde llega.' },
] as const;

/** La ruta del semillero: design thinking, con el aprendizaje basado en proyectos como forma de recorrerla. */
const ROUTE = [
  { step: '1', name: 'Empatizar', text: 'Escuchamos a personas Sordas y docentes de LSC. Esa validación sigue en camino.', tags: ['critico', 'pedagogico'] },
  { step: '2', name: 'Definir', text: 'Una pregunta de investigación y tres acciones que el proyecto debe cumplir.', tags: ['pedagogico', 'emprendimiento'] },
  { step: '3', name: 'Idear', text: 'Bocetos a mano. De un ojo entre dos manos nació el símbolo.', tags: ['pedagogico', 'emprendimiento'] },
  { step: '4', name: 'Prototipar', text: 'Una versión que funciona: 21 puntos en tu mano contra las señas del INSOR.', tags: ['tecnologico'] },
  { step: '5', name: 'Probar', text: 'La usamos con personas, miramos qué falla y la mejoramos.', tags: ['critico', 'tecnologico'] },
] as const;

type OpenKey = 'proyecto' | 'identidad';

export function AboutPage() {
  const [params] = useSearchParams();
  const open = params.get('abrir') as OpenKey | null;
  const [tag, setTag] = useState<string | null>(null);
  const active = CONTRIBUTIONS.find((item) => item.id === tag);

  return (
    <article className="page about">
      <header className="page-head">
        <p className="eyebrow">Quiénes somos</p>
        <h1>Aprendemos haciendo, con sentido</h1>
        <p className="lead">
          Somos el Semillero Maker de Tecnología con Sentido: estudiantes que aprenden construyendo herramientas para problemas reales.
          DiverSeña es la que hoy mostramos.
        </p>
      </header>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Cómo trabajamos</p>
          <h2>Una ruta que se recorre construyendo</h2>
        </div>
        <p className="identity-lead">
          Cinco fases de <strong>design thinking</strong>, recorridas con <strong>aprendizaje basado en proyectos</strong>: aprendemos
          mientras construimos algo real, con una entrega pública y la retroalimentación de quienes lo prueban.
        </p>
        <div className="about-filter" role="group" aria-label="Filtrar por aporte">
          {CONTRIBUTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`about-chip about-chip--${item.id}${tag === item.id ? ' about-chip--on' : ''}`}
              aria-pressed={tag === item.id}
              onClick={() => setTag(tag === item.id ? null : item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <p className="about-filter__hint" aria-live="polite">
          {active ? active.text : 'Elige un aporte y mira en qué fases interviene.'}
        </p>
        <ol className="about-route">
          {ROUTE.map((item, i) => {
            const lit = !tag || (item.tags as readonly string[]).includes(tag);
            return (
              <Reveal as="li" key={item.step} className={`about-route__item${lit ? '' : ' about-route__item--dim'}`} delay={i * 90}>
                <span className="about-route__num" aria-hidden="true">{item.step}</span>
                <div className="about-route__body">
                  <h3>{item.name}</h3>
                  <p>{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </section>

      <section className="section about-folds">
        <details className="about-fold" open={open === 'proyecto'}>
          <summary>
            <span>El proyecto</span>
            <small>El problema, lo que debe hacer la solución, cómo funciona y lo que sigue</small>
          </summary>
          <div className="about-fold__body">
            <ProjectContent />
          </div>
        </details>
        <details className="about-fold" open={open === 'identidad'}>
          <summary>
            <span>Identidad de marca</span>
            <small>El logo, los colores, sus usos y lo que significan</small>
          </summary>
          <div className="about-fold__body">
            <IdentityContent />
          </div>
        </details>
      </section>
    </article>
  );
}
