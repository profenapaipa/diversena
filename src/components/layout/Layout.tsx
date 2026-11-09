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
              <strong>DiverSeña</strong> · Proyecto del Semillero de Tecnología del colegio Injuv.
            </p>
          </div>
          <nav className="site-footer__links" aria-label="Enlaces del pie de página">
            <Link to="/quienes-somos">Quiénes somos</Link>
            <Link to="/quienes-somos?abrir=identidad">Identidad</Link>
            <Link to="/contacto">Contacto</Link>
          </nav>
        </div>
      </footer>
      <TabBar />
    </div>
  );
}
