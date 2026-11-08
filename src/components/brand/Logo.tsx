interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Símbolo de DiverSeña, versión Encuentro (decisión del equipo del 6 de noviembre
 * de 2026): dos manos que se encuentran alrededor de un sol, con los colores de
 * la bandera de la comunidad Sorda. La app es oscura, así que se usa la versión
 * para fondo oscuro (la mano de arriba en blanco). Los archivos salen del paquete
 * de logos del equipo; ver docs/MARCA.md.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <img
      className={className}
      src={`${import.meta.env.BASE_URL}marca/simbolo.svg`}
      height={size}
      style={{ width: 'auto' }}
      alt=""
      aria-hidden="true"
    />
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
