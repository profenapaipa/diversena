import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HandIllustration } from './brand/HandIllustration';
import { LogoMark } from './brand/Logo';
import { IconArrowRight, IconBook, IconClose, IconLock } from './icons';
import { PRIVACY_LONG } from '../data/privacy';
import { markIntroSeen } from './introSeen';

const BASE = import.meta.env.BASE_URL;

interface Slide {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  visual: ReactNode;
}

const SLIDES: Slide[] = [
  {
    id: 'que-es',
    eyebrow: 'Bienvenida',
    title: 'Aprende lengua de señas con tu cámara',
    text: 'DiverSeña ve tus manos y te dice si tu seña se parece a la de referencia. Empezamos por las cinco vocales de la Lengua de Señas Colombiana.',
    visual: (
      <div className="intro-visual intro-visual--brand">
        <LogoMark size={84} />
        <HandIllustration className="intro-visual__hand" />
        <ul className="intro-chips">
          <li>Sin instalar nada</li>
          <li>Solo usa 21 puntos de tus manos</li>
          <li>Desde el celular o el computador</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'privacidad',
    eyebrow: 'Tu privacidad',
    title: 'Tu imagen se queda contigo',
    text: PRIVACY_LONG,
    visual: (
      <div className="intro-visual intro-visual--privacy" role="img" aria-label="De tu cámara salen solo 21 puntos de tus manos, y de ellos sale la letra. Tu imagen no se guarda ni se envía.">
        <div className="privacy-flow" aria-hidden="true">
          <div className="privacy-flow__step">
            <span className="privacy-flow__icon">Cámara</span>
            <small>Tu imagen se queda en tu equipo</small>
          </div>
          <span className="privacy-flow__arrow">›</span>
          <div className="privacy-flow__step privacy-flow__step--key">
            <HandIllustration className="privacy-flow__hand" />
            <small>Solo 21 puntos por mano</small>
          </div>
          <span className="privacy-flow__arrow">›</span>
          <div className="privacy-flow__step">
            <span className="privacy-flow__icon privacy-flow__icon--letter">A</span>
            <small>La letra</small>
          </div>
        </div>
        <ul className="intro-chips intro-chips--ink">
          <li><IconLock size={14} /> No se guarda</li>
          <li><IconLock size={14} /> No se envía</li>
          <li><IconLock size={14} /> No reconoce tu rostro</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'aprender',
    eyebrow: 'Aprender',
    title: 'Practica con una guía sobre tu mano',
    text: 'Elige una vocal, mira cómo se hace y pon tu mano. Los puntos amarillos te muestran dónde deben quedar los tuyos, ajustados al tamaño de tu mano.',
    visual: (
      <div className="intro-visual intro-visual--shot">
        <img src={`${BASE}intro/aprender.jpg`} alt="La cámara marca los 21 puntos de una mano en verde y la guía amarilla muestra dónde deberían quedar" width={776} height={570} />
        <span className="intro-visual__tag">
          <i className="swatch swatch--sun" /> Guía
        </span>
      </div>
    ),
  },
  {
    id: 'traducir',
    eyebrow: 'Traducir',
    title: 'Haz una vocal y te decimos cuál es',
    text: 'En Traducir haces la seña y te mostramos la letra que más se parece, con su porcentaje de parecido. Si no estamos seguros, te sugerimos las más cercanas.',
    visual: (
      <div className="intro-visual intro-visual--result" role="img" aria-label="Ejemplo de resultado: la vocal A con un parecido alto con la referencia">
        <span className="intro-result__badge">Ejemplo</span>
        <span className="intro-result__letter">A</span>
        <span className="intro-result__label">Parecido con la referencia</span>
        <span className="meter meter--wide"><span style={{ width: '88%' }} /></span>
        <span className="intro-result__hint">«¿Quizás quisiste decir…?» cuando no hay una seguridad suficiente</span>
      </div>
    ),
  },
  {
    id: 'empezar',
    eyebrow: 'Por dónde empezar',
    title: 'Tres pasos y listo',
    text: 'Es mejor ir en este orden la primera vez.',
    visual: (
      <ol className="intro-steps">
        <li>
          <span className="intro-steps__num" aria-hidden="true">1</span>
          <span><strong>Calibra tu mano.</strong> Unas 7 posturas guiadas, una sola vez, para que todo se ajuste a tu mano.</span>
        </li>
        <li>
          <span className="intro-steps__num" aria-hidden="true">2</span>
          <span><strong>Elige una vocal en Aprender</strong> y sigue la guía hasta que te diga «¡Lo lograste!».</span>
        </li>
        <li>
          <span className="intro-steps__num" aria-hidden="true">3</span>
          <span><strong>Prueba Traducir</strong> y mira qué vocal reconoce.</span>
        </li>
      </ol>
    ),
  },
];

interface IntroCarouselProps {
  onClose: () => void;
}

/**
 * Introducción en pantallas: qué hace DiverSeña, qué se puede hacer y por dónde empezar.
 * Se desliza con el dedo en el celular y con las flechas del teclado o los botones en el
 * computador. Se puede saltar en cualquier momento (Escape o la X).
 */
export function IntroCarousel({ onClose }: IntroCarouselProps) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const last = index === SLIDES.length - 1;

  const close = useCallback(() => {
    markIntroSeen();
    onClose();
  }, [onClose]);

  const go = useCallback((to: number) => setIndex(Math.min(SLIDES.length - 1, Math.max(0, to))), []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') go(index + 1);
      else if (event.key === 'ArrowLeft') go(index - 1);
      else if (event.key === 'Tab' && dialogRef.current) {
        // Mantiene el foco dentro del cuadro mientras está abierto (también desde el propio contenedor).
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        const active = document.activeElement;
        const inside = dialogRef.current.contains(active) && active !== dialogRef.current;
        if (event.shiftKey && (!inside || active === first)) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && (!inside || active === lastEl)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close, go, index]);

  return (
    <div className="intro-backdrop" onClick={(event) => event.target === event.currentTarget && close()}>
      <div
        ref={dialogRef}
        className="intro"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        tabIndex={-1}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = event.changedTouches[0].clientX - touchStart.current;
          touchStart.current = null;
          if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1));
        }}
      >
        <button type="button" className="intro__close" onClick={close} aria-label="Saltar la introducción">
          <IconClose size={20} />
          <span>Saltar</span>
        </button>

        <div className="intro__viewport">
          <div className="intro__track" style={{ transform: `translateX(-${index * 100}%)` }}>
            {SLIDES.map((slide, i) => (
              <section
                key={slide.id}
                className="intro__slide"
                aria-hidden={i !== index}
                aria-roledescription="diapositiva"
                aria-label={`${i + 1} de ${SLIDES.length}`}
              >
                <div className="intro__visual">{slide.visual}</div>
                <div className="intro__copy">
                  <p className="eyebrow">{slide.eyebrow}</p>
                  <h2 id={i === index ? 'intro-title' : undefined}>{slide.title}</h2>
                  <p>{slide.text}</p>
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="intro__footer">
          <div className="intro__dots" role="group" aria-label="Pantallas de la introducción">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Ir a la pantalla ${i + 1}: ${slide.eyebrow}`}
                className={i === index ? 'intro__dot intro__dot--active' : 'intro__dot'}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <div className="intro__nav">
            <button type="button" className="button button--ghost" onClick={() => go(index - 1)} disabled={index === 0}>
              Anterior
            </button>
            {last ? (
              <Link className="button" to="/aprender" onClick={close}>
                <IconBook /> Empezar a aprender
              </Link>
            ) : (
              <button type="button" className="button" onClick={() => go(index + 1)}>
                Siguiente <IconArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
