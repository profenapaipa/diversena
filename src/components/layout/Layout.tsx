import { Link, Outlet } from 'react-router-dom';
import { LogoMark } from '../brand/Logo';
import { SiteHeader, TabBar } from './NavBar';
import { useSixSevenKeys } from '../../hooks/useSixSeven';

export function Layout() {
  useSixSevenKeys();
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
              <strong>DiverSeña</strong> · aprender lengua de señas con la cámara. Proyecto del Semillero de
              Tecnología del colegio Injuv.
            </p>
          </div>
          <div className="flag-legend" aria-label="Colores de la bandera de la comunidad Sorda">
            <span><i className="swatch swatch--navy" /> Humanidad y unión</span>
            <span><i className="swatch swatch--sky" /> Comunidad Sorda</span>
            <span><i className="swatch swatch--sun" /> Luz y convivencia</span>
          </div>
          <nav className="site-footer__links" aria-label="Enlaces del pie de página">
            <Link to="/proyecto">El proyecto</Link>
            <Link to="/identidad">Identidad</Link>
          </nav>
        </div>
      </footer>
      <TabBar />
    </div>
  );
}
