import { NavLink } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/aprender', label: 'Aprender' },
  { to: '/identificar', label: 'Identificar' },
  { to: '/explorar', label: 'Explorar' },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-bar__link nav-bar__link--active' : 'nav-bar__link';
}

export function NavBar() {
  const profile = useProfile();

  return (
    <nav className="nav-bar" aria-label="Navegación principal">
      <span className="nav-bar__brand">DiverSeña</span>
      <ul className="nav-bar__links">
        {LINKS.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={linkClass}>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <NavLink to="/perfil" className={(state) => `${linkClass(state)} nav-bar__profile`}>
        {profile?.avatar ? (
          <img className="avatar" src={profile.avatar} alt="" />
        ) : (
          <span className="avatar avatar--empty" aria-hidden="true">
            {profile ? profile.name.charAt(0).toUpperCase() : '👤'}
          </span>
        )}
        {profile ? profile.name : 'Crear perfil'}
      </NavLink>
    </nav>
  );
}
