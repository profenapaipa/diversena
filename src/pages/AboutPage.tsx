import { useSearchParams } from 'react-router-dom';
import { IdentityContent } from './IdentityPage';
import { ProjectContent } from './ProjectPage';

/** Los cuatro aportes que hacen posible la experiencia, con lo que cada uno significa en DiverSeña. */
const CONTRIBUTIONS = [
  {
    id: 'pedagogico',
    title: 'Pedagógico',
    text: 'Se aprende haciendo. Cada estudiante asume un rol real en el proyecto, y equivocarse y corregir hace parte del camino.',
  },
  {
    id: 'emprendimiento',
    title: 'Emprendimiento',
    text: 'Pensamos en quién usará la herramienta, cómo llegar hasta esas personas y cómo mantenerla viva más allá de una entrega.',
  },
  {
    id: 'tecnologico',
    title: 'Tecnológico',
    text: 'Visión por computador que corre en el navegador, sin instalar nada y sin cuentas. La tecnología acompaña; no reemplaza a quien enseña.',
  },
  {
    id: 'critico',
    title: 'Crítico',
    text: 'Nos preguntamos qué nos falta saber: validar cada seña con personas Sordas, no presentar una seña como universal y decir con claridad hasta dónde llega el reconocimiento.',
  },
] as const;

/** La ruta del semillero: design thinking, con el aprendizaje basado en proyectos como forma de recorrerla. */
const ROUTE = [
  {
    step: '1',
    name: 'Empatizar',
    text: 'Leemos investigaciones y buscamos la mirada de personas Sordas, intérpretes y docentes de LSC para entender qué se necesita antes de proponer algo. Esa validación sigue en camino.',
    tags: ['critico', 'pedagogico'],
  },
  {
    step: '2',
    name: 'Definir',
    text: 'Convertimos lo que entendimos en una pregunta de investigación y en tres acciones concretas que el proyecto debe cumplir.',
    tags: ['pedagogico', 'emprendimiento'],
  },
  {
    step: '3',
    name: 'Idear',
    text: 'Cada equipo propone ideas y bocetos a mano. De un dibujo de un ojo entre dos manos nació más tarde el símbolo de DiverSeña.',
    tags: ['pedagogico', 'emprendimiento'],
  },
  {
    step: '4',
    name: 'Prototipar',
    text: 'Construimos una primera versión que funciona: la cámara marca 21 puntos en tu mano y los compara con las señas del Diccionario de LSC del INSOR.',
    tags: ['tecnologico'],
  },
  {
    step: '5',
    name: 'Probar',
    text: 'La probamos con personas, miramos qué reconoce bien y qué no, y la mejoramos. Cada versión sale de lo que la prueba nos enseña.',
    tags: ['critico', 'tecnologico'],
  },
] as const;

const TAG_LABEL: Record<string, string> = Object.fromEntries(CONTRIBUTIONS.map((item) => [item.id, item.title]));

type OpenKey = 'proyecto' | 'identidad';

export function AboutPage() {
  const [params] = useSearchParams();
  const open = params.get('abrir') as OpenKey | null;

  return (
    <article className="page about">
      <header className="page-head">
        <p className="eyebrow">Quiénes somos</p>
        <h1>Aprendemos haciendo, con sentido</h1>
        <p className="lead">
          Somos el Semillero Maker de Tecnología con Sentido: un espacio donde estudiantes aprenden construyendo herramientas para
          problemas reales de su entorno. DiverSeña es la que hoy mostramos.
        </p>
      </header>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Cómo trabajamos</p>
          <h2>Una ruta que se recorre construyendo</h2>
        </div>
        <p className="identity-lead">
          Seguimos las cinco fases del <strong>design thinking</strong> (empatizar, definir, idear, prototipar y probar) y las
          recorremos con el <strong>aprendizaje basado en proyectos</strong>: no estudiamos primero para construir después, sino
          que aprendemos mientras construimos algo real, con una entrega pública al final y la retroalimentación de quienes lo
          prueban.
        </p>
        <ol className="about-route">
          {ROUTE.map((item) => (
            <li key={item.step} className="about-route__item">
              <span className="about-route__num" aria-hidden="true">{item.step}</span>
              <div className="about-route__body">
                <h3>{item.name}</h3>
                <p>{item.text}</p>
                <ul className="about-tags" aria-label="Aportes que intervienen en esta fase">
                  {item.tags.map((tag) => (
                    <li key={tag} className={`about-tag about-tag--${tag}`}>{TAG_LABEL[tag]}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Lo que lo hace posible</p>
          <h2>Cuatro miradas en una misma experiencia</h2>
        </div>
        <ul className="about-contrib">
          {CONTRIBUTIONS.map((item) => (
            <li key={item.id} className={`card about-contrib__card about-contrib__card--${item.id}`}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
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
