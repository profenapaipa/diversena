import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="page">
      <h1>DiverSeña</h1>
      <p className="lead">
        Una aplicación educativa para aprender, practicar e identificar
        vocales en distintas lenguas de señas.
      </p>

      <p>
        <strong>Las lenguas de señas son lenguas humanas de pleno derecho</strong>{' '}
        y presentan diferencias entre comunidades y países. La misma letra
        puede representarse mediante una configuración manual distinta según
        la lengua: por eso DiverSeña mantiene separadas, desde su arquitectura,
        las referencias de la Lengua de Señas Colombiana (LSC), la Lengua de
        Señas Mexicana (LSM) y la Lengua de Señas Ecuatoriana (LSEC). Ninguna
        seña se presenta aquí como universal.
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
    </section>
  );
}
