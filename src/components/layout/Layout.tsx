import { Link, Outlet } from 'react-router-dom';
import { LogoMark } from '../brand/Logo';
import { SiteHeader, TabBar } from './NavBar';

export function Layout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido-principal">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <LogoMark size={28} />
            <p>
              <strong>DiverSeña</strong> · aprender lengua de señas con la cámara. Nació en el Semillero de
              Tecnología Maker 2026-II.
            </p>
          </div>
          <div className="flag-legend" aria-label="Colores de la bandera de la comunidad Sorda">
            <span><i className="swatch swatch--navy" /> Humanidad y unión</span>
            <span><i className="swatch swatch--sky" /> Comunidad Sorda</span>
            <span><i className="swatch swatch--sun" /> Luz y convivencia</span>
          </div>
          <nav className="site-footer__links" aria-label="Enlaces del pie de página">
            <Link to="/proyecto">El proyecto</Link>
            <Link to="/panel">Panel del equipo</Link>
            <a href="https://github.com/profenapaipa/diversena" target="_blank" rel="noreferrer">
              Código en GitHub
            </a>
          </nav>
        </div>
      </footer>
      <TabBar />
    </div>
  );
}
