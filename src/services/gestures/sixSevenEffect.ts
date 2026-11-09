/**
 * Efecto del «six seven»: la página se inclina hacia los dos lados y aparece un
 * «6 7» que sube y baja como las manos. Es un guiño para romper el tono tranquilo
 * de la plataforma; dura unos dos segundos y no bloquea nada.
 * Con «reducir movimiento» activado solo aparece el aviso, sin inclinar la página.
 */
const DURATION_MS = 2200;
let playing = false;

export function playSixSeven(): void {
  if (playing || typeof document === 'undefined') return;
  playing = true;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const root = document.documentElement;
  if (!reduce) root.classList.add('six-seven-tilt');

  const burst = document.createElement('div');
  burst.className = 'six-seven-burst';
  burst.setAttribute('role', 'status');
  burst.innerHTML =
    '<span class="six-seven-burst__six" aria-hidden="true">6</span>' +
    '<span class="six-seven-burst__seven" aria-hidden="true">7</span>' +
    '<span class="six-seven-burst__label">¡Six-seven!</span>';
  document.body.appendChild(burst);

  window.setTimeout(() => {
    root.classList.remove('six-seven-tilt');
    burst.remove();
    playing = false;
  }, DURATION_MS);
}
