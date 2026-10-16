interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Símbolo de DiverSeña: el ojo del boceto original del equipo (la lengua de
 * señas se ve, no se oye) con los colores de la bandera de la comunidad
 * Sorda: azul oscuro (humanidad, unión), azul claro (color mundial de la
 * comunidad Sorda) y amarillo (luz, convivencia). Ver docs/MARCA.md.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="16" fill="var(--brand-navy)" />
      <path
        d="M8 33c6.5-11 15-16.5 24-16.5S49.5 22 56 33c-6.5 11-15 16.5-24 16.5S14.5 44 8 33z"
        fill="none"
        stroke="var(--brand-sky)"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="33" r="9" fill="var(--brand-sun)" />
      <circle cx="32" cy="33" r="3.8" fill="var(--brand-navy)" />
    </svg>
  );
}

/** Logotipo completo: símbolo + nombre, con "Seña" en azul claro. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo__word">
        Diver<span className="logo__accent">Seña</span>
      </span>
    </span>
  );
}
