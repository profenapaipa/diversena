import { useEffect, useState, type ReactNode } from 'react';
import { prefersReducedMotion, useInView } from './motion';

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

/**
 * Design thinking, recorrido con aprendizaje basado en proyectos. Cada fase dice qué hacemos en general y qué salió de
 * ahí en DiverSeña.
 */
const PHASES = [
  {
    name: 'Empatizar',
    does: 'Escuchar y leer antes de proponer.',
    result: 'Investigaciones y la voz de personas Sordas y docentes de LSC, que sigue en camino.',
    icon: svg(<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />),
  },
  {
    name: 'Definir',
    does: 'Convertir lo escuchado en una pregunta.',
    result: 'Una pregunta de investigación y tres acciones que el proyecto debe cumplir.',
    icon: svg(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>),
  },
  {
    name: 'Idear',
    does: 'Dibujar muchas ideas, sin juzgarlas todavía.',
    result: 'De un ojo entre dos manos nació el símbolo Encuentro.',
    icon: svg(<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z" /></>),
  },
  {
    name: 'Prototipar',
    does: 'Construir pronto algo que se pueda tocar.',
    result: 'La cámara marca 21 puntos en tu mano y los compara con las señas del INSOR.',
    icon: svg(<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" />),
  },
  {
    name: 'Probar',
    does: 'Usarlo con personas y aprender de lo que falla.',
    result: 'Cada versión sale de lo que la prueba nos enseña.',
    icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>),
  },
] as const;

/** Aprendizaje basado en proyectos más design thinking, como un recorrido que se toca: cada fase se abre al elegirla. */
export function DesignThinking() {
  const [active, setActive] = useState(0);
  // Al llegar a la sección, el recorrido avanza solo; en cuanto la persona toca una fase, queda en sus manos.
  const [auto, setAuto] = useState(true);
  const [ref, seen] = useInView<HTMLDivElement>();

  useEffect(() => {
    if (!auto || !seen || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % PHASES.length), 3200);
    return () => window.clearInterval(timer);
  }, [auto, seen]);

  const phase = PHASES[active];
  const pick = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  return (
    <div className="dt" ref={ref}>
      <ol className="dt__track" aria-label="Las cinco fases">
        {PHASES.map((item, i) => {
          return (
            <li key={item.name} className="dt__stop">
              <button
                type="button"
                className={`dt__dot${i === active ? ' dt__dot--active' : ''}${i < active ? ' dt__dot--done' : ''}`}
                aria-pressed={i === active}
                aria-label={`Fase ${i + 1}: ${item.name}`}
                onClick={() => pick(i)}
              >
                {i + 1}
              </button>
              <span className={`dt__name${i === active ? ' dt__name--active' : ''}`}>{item.name}</span>
            </li>
          );
        })}
      </ol>

      <div className="dt__card" aria-live="polite" key={active}>
        <span className="dt__icon" aria-hidden="true">{phase.icon}</span>
        <div>
          <h3>{phase.name}</h3>
          <p className="dt__does">{phase.does}</p>
          <p className="dt__result"><strong>En DiverSeña:</strong> {phase.result}</p>
        </div>
      </div>
    </div>
  );
}
