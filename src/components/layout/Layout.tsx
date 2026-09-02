import { Outlet } from 'react-router-dom';
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
      </footer>
    </div>
  );
}
