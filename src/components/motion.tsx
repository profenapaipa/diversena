import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/** ¿La persona pidió reducir el movimiento? Con eso activado nada se anima: todo aparece ya en su valor final. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}

/** Un solo observador para todos los elementos: avisa una vez cuando uno entra en pantalla y lo deja de observar. */
let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function observeOnce(element: Element, onVisible: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    onVisible();
    return () => undefined;
  }
  sharedObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        callbacks.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  callbacks.set(element, onVisible);
  sharedObserver.observe(element);
  return () => {
    callbacks.delete(element);
    sharedObserver?.unobserve(element);
  };
}

/** `true` cuando el elemento de `ref` entra en pantalla por primera vez (o de inmediato si se reduce el movimiento). */
export function useInView<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (prefersReducedMotion()) {
      setSeen(true);
      return;
    }
    return observeOnce(ref.current, () => setSeen(true));
  }, []);
  return [ref, seen];
}

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Retraso en milisegundos, para que varios elementos seguidos entren uno tras otro. */
  delay?: number;
}

/** Hace aparecer su contenido con un fundido corto y un leve ascenso al llegar a la pantalla. */
export function Reveal({ children, as: Tag = 'div', className = '', delay = 0 }: RevealProps) {
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <Tag ref={ref} className={`reveal${seen ? ' is-visible' : ''} ${className}`.trim()} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}

/** Número que sube de 0 al valor final cuando se ve en pantalla. Sin animación si se reduce el movimiento. */
export function CountUp({ to, durationMs = 900 }: { to: number; durationMs?: number }) {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [value, setValue] = useState(prefersReducedMotion() ? to : 0);
  useEffect(() => {
    if (!seen || prefersReducedMotion()) {
      if (seen) setValue(to);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(to * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, to, durationMs]);
  return <span ref={ref}>{value}</span>;
}
