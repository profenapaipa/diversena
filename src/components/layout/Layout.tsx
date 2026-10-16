import { Link, Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';

export function Layout() {
  return (
    <div className="app-shell">
      <header>
        <NavBar />
      </header>
      <main id="contenido-principal">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p>
          DiverSeña — proyecto educativo de código abierto sobre la diversidad
          de las lenguas de señas.
        </p>
        <p className="app-footer__tools">
          Equipo: <Link to="/herramientas/entrenar">Entrenar IA</Link> ·{' '}
          <Link to="/herramientas/referencias">Referencias rápidas</Link>
        </p>
      </footer>
    </div>
  );
}
