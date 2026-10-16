import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { Logo } from '../brand/Logo';
import {
  IconBook,
  IconCamera,
  IconChart,
  IconClose,
  IconFlag,
  IconGlobe,
  IconHome,
  IconMenu,
  IconUser,
} from '../icons';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const MAIN_LINKS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: <IconHome />, end: true },
  { to: '/aprender', label: 'Aprender', icon: <IconBook /> },
  { to: '/identificar', label: 'Traducir', icon: <IconCamera /> },
  { to: '/explorar', label: 'Explorar', icon: <IconGlobe /> },
  { to: '/proyecto', label: 'El proyecto', icon: <IconFlag /> },
];

/** Barra inferior en celular: las dos acciones del boceto (libro y cámara) a un toque. */
const TAB_LINKS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: <IconHome />, end: true },
  { to: '/aprender', label: 'Aprender', icon: <IconBook /> },
  { to: '/identificar', label: 'Traducir', icon: <IconCamera /> },
  { to: '/perfil', label: 'Perfil', icon: <IconUser /> },
];

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-link nav-link--active' : 'nav-link';
}

function ProfileAvatar() {
  const profile = useProfile();
  if (profile?.avatar) return <img className="avatar" src={profile.avatar} alt="" />;
  return (
    <span className="avatar avatar--empty" aria-hidden="true">
      {profile ? profile.name.charAt(0).toUpperCase() : <IconUser size={18} />}
    </span>
  );
}

export function SiteHeader() {
  const profile = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/perfil" className="site-header__avatar" aria-label={profile ? `Perfil de ${profile.name}` : 'Crear perfil'}>
          <ProfileAvatar />
        </Link>
        <Link to="/" className="site-header__brand" aria-label="DiverSeña, inicio">
          <Logo size={34} />
        </Link>

        <nav className="site-nav" aria-label="Navegación principal">
          {MAIN_LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/perfil" className={(state) => `${navClass(state)} site-header__profile`}>
          <ProfileAvatar />
          <span>{profile ? profile.name : 'Crear perfil'}</span>
        </NavLink>

        <button
          type="button"
          className="icon-button site-header__menu"
          aria-expanded={menuOpen}
          aria-controls="menu-movil"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {menuOpen && (
        <nav id="menu-movil" className="drawer" aria-label="Menú">
          {MAIN_LINKS.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass} onClick={close}>
              {icon}
              {label}
            </NavLink>
          ))}
          <NavLink to="/perfil" className={navClass} onClick={close}>
            <IconUser />
            {profile ? 'Mi perfil' : 'Crear perfil'}
          </NavLink>
          <NavLink to="/panel" className={navClass} onClick={close}>
            <IconChart />
            Panel del equipo
          </NavLink>
        </nav>
      )}
    </header>
  );
}

export function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Accesos rápidos">
      {TAB_LINKS.map(({ to, label, icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'tab tab--active' : 'tab')}>
          {icon}
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
