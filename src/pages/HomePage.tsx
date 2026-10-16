import { Link } from 'react-router-dom';
import { languages } from '../data/languages';

export function HomePage() {
  return (
    <section className="page">
      <h1>DiverSeña</h1>
      <p className="lead">
        Una aplicación educativa para aprender, practicar e identificar
        vocales en lengua de señas, usando solo la cámara del navegador.
      </p>

      <p>
        <strong>Las lenguas de señas son lenguas humanas de pleno derecho</strong>{' '}
        y presentan diferencias entre comunidades y países. La misma letra
        puede representarse mediante una configuración manual distinta según
        la lengua: por eso DiverSeña mantiene separadas, desde su arquitectura,
        las referencias de cada lengua. Ninguna seña se presenta aquí como
        universal.
      </p>

      <div className="home-actions">
        <Link className="button" to="/aprender">
          Aprender
        </Link>
        <Link className="button button--secondary" to="/identificar">
          Identificar
        </Link>
        <Link className="button button--secondary" to="/explorar">
          Explorar
        </Link>
      </div>

      <h2>Lenguas</h2>
      <ul className="language-status-list">
        {languages.map((language) => (
          <li key={language.id}>
            <strong>{language.name}</strong> ({language.shortName}) —{' '}
            {language.status === 'disponible' ? (
              <span className="status-badge status-badge--active">Disponible</span>
            ) : (
              <span className="lock-badge">🔒 Próximamente</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
