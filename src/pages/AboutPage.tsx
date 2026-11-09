import { useSearchParams } from 'react-router-dom';
import { DesignThinking } from '../components/DesignThinking';
import { IdentityContent } from './IdentityPage';
import { ProjectContent } from './ProjectPage';

type OpenKey = 'proyecto' | 'identidad';

export function AboutPage() {
  const [params] = useSearchParams();
  const open = params.get('abrir') as OpenKey | null;

  return (
    <article className="page about">
      <header className="page-head">
        <p className="eyebrow">Quiénes somos</p>
        <h1>Aprendemos haciendo, con sentido</h1>
        <p className="lead">Somos el Semillero Maker de Tecnología con Sentido. Construimos herramientas para problemas reales; la docencia guía y la tecnología acompaña.</p>
      </header>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">Cómo trabajamos</p>
          <h2>Del problema a la prueba</h2>
        </div>
        <DesignThinking />
      </section>

      <section className="section about-folds">
        <details className="about-fold" open={open === 'proyecto'}>
          <summary>
            <span>El proyecto</span>
            <small>Problema, pregunta y próximos pasos</small>
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
