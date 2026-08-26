import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/aprender', label: 'Aprender' },
  { to: '/identificar', label: 'Identificar' },
  { to: '/explorar', label: 'Explorar' },
];

export function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Navegación principal">
      <span className="nav-bar__brand">DiverSeña</span>
      <ul className="nav-bar__links">
        {LINKS.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'nav-bar__link nav-bar__link--active' : 'nav-bar__link'
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
