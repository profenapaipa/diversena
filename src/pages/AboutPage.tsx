import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Reveal } from '../components/motion';
import { IdentityContent } from './IdentityPage';
import { ProjectContent } from './ProjectPage';

/** Los cuatro aportes. Al elegir uno se iluminan las fases donde interviene. */
const CONTRIBUTIONS = [
  { id: 'pedagogico', title: 'Pedagógico', text: 'Se aprende haciendo.' },
  { id: 'emprendimiento', title: 'Emprendimiento', text: 'Pensar en quién lo usa y cómo sostenerlo.' },
  { id: 'tecnologico', title: 'Tecnológico', text: 'Visión por computador en el navegador.' },
  { id: 'critico', title: 'Crítico', text: 'Validar con personas Sordas.' },
] as const;

/** Design thinking, recorrido con aprendizaje basado en proyectos. */
const ROUTE = [
  { step: '1', name: 'Empatizar', text: 'Escuchar a personas Sordas y docentes de LSC', tags: ['critico', 'pedagogico'] },
  { step: '2', name: 'Definir', text: 'Una pregunta y tres acciones concretas', tags: ['pedagogico', 'emprendimiento'] },
  { step: '3', name: 'Idear', text: 'Bocetos a mano: de ahí nació el símbolo', tags: ['pedagogico', 'emprendimiento'] },
  { step: '4', name: 'Prototipar', text: '21 puntos en tu mano contra las señas del INSOR', tags: ['tecnologico'] },
  { step: '5', name: 'Probar', text: 'Usarla con personas y mejorarla', tags: ['critico', 'tecnologico'] },
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
        <p className="lead">Somos el Semillero Maker de Tecnología con Sentido. Aprendemos construyendo herramientas para problemas reales.</p>
      </header>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Cómo trabajamos</p>
          <h2>Design thinking, aprendiendo haciendo</h2>
        </div>
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
          {active ? active.text : 'Toca un aporte y mira dónde interviene.'}
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
            <small>Problema, funcionamiento y próximos pasos</small>
          </summary>
          <div className="about-fold__body">
            <ProjectContent />
          </div>
        </details>
        <details className="about-fold" open={open === 'identidad'}>
          <summary>
            <span>Identidad de marca</span>
            <small>Logo, colores y significado</small>
          </summary>
          <div className="about-fold__body">
            <IdentityContent />
          </div>
        </details>
      </section>
    </article>
  );
}
