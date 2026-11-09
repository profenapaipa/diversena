import { useEffect, useState } from 'react';
import type { CalibrationStepId } from '../../services/recognition/calibration';
import { prefersReducedMotion } from '../../components/motion';

/**
 * Animaciones de la mano para la calibración: cada postura se muestra en movimiento (como un GIF corto que se repite),
 * con la palma, el dorso, el giro y hacia dónde girar. Se arman con un modelo 3D simple de la mano (21 puntos) que se
 * gira y se proyecta, así que los ángulos del dibujo son los de verdad. Colores sólidos y fijos, dentro del panel y no
 * sobre la cámara. Con «reducir movimiento» se muestra la postura final, quieta.
 */

type V = [number, number, number];

const COLOR = { tile: '#1d2394', palm: '#2f45c4', palmDark: '#25369f', bone: '#7cc4ff', joint: '#ffffff', tip: '#ffd83d', nail: '#ffffff', arrow: '#ffd83d' };

/** Nudillo (x, y), largo de cada hueso y apertura del dedo en abanico (grados), en unidades de palma. */
const FINGERS: Array<{ mcp: [number, number]; bones: [number, number, number]; fan: number }> = [
  { mcp: [0.32, 1.0], bones: [0.4, 0.26, 0.22], fan: 12 },
  { mcp: [0.06, 1.02], bones: [0.46, 0.3, 0.24], fan: 2 },
  { mcp: [-0.2, 0.97], bones: [0.42, 0.28, 0.22], fan: -8 },
  { mcp: [-0.44, 0.86], bones: [0.32, 0.2, 0.18], fan: -20 },
];
const THUMB_OUT: V[] = [[0.38, 0.2, 0.1], [0.66, 0.42, 0.18], [0.86, 0.58, 0.2], [1.02, 0.72, 0.2]];
const THUMB_IN: V[] = [[0.3, 0.2, 0.12], [0.42, 0.42, 0.3], [0.3, 0.62, 0.42], [0.12, 0.74, 0.46]];
/** Flexión acumulada de cada articulación del puño (grados). */
const FIST_CURL = [82, 168, 236];

const rad = (d: number) => (d * Math.PI) / 180;

/** Forma de la mano: cuánto está cerrada (0 a 1), cuánto están separados los dedos (0 a 1) y dónde está el pulgar (0 afuera, 1 adentro). */
interface Shape {
  curl: number;
  spread: number;
  thumb: number;
}
const OPEN_HAND: Shape = { curl: 0, spread: 0.15, thumb: 0 };

/** Los 21 puntos de la mano en su propio marco (x a la derecha, y hacia los dedos, z hacia quien mira la palma). */
function buildHand({ curl, spread, thumb }: Shape): V[] {
  const pts: V[] = [[0, 0, 0]];
  const k = Math.max(thumb, curl);
  for (let i = 0; i < 4; i++) {
    pts.push([
      THUMB_OUT[i][0] + (THUMB_IN[i][0] - THUMB_OUT[i][0]) * k,
      THUMB_OUT[i][1] + (THUMB_IN[i][1] - THUMB_OUT[i][1]) * k,
      THUMB_OUT[i][2] + (THUMB_IN[i][2] - THUMB_OUT[i][2]) * k,
    ]);
  }
  for (const finger of FINGERS) {
    const fan = rad(finger.fan * spread);
    const flat: V = [Math.sin(fan), Math.cos(fan), 0];
    let [x, y, z]: V = [finger.mcp[0], finger.mcp[1], 0];
    pts.push([x, y, z]);
    finger.bones.forEach((length, i) => {
      const phi = rad(FIST_CURL[i]) * curl;
      x += flat[0] * Math.cos(phi) * length;
      y += flat[1] * Math.cos(phi) * length;
      z += Math.sin(phi) * length;
      pts.push([x, y, z]);
    });
  }
  return pts;
}

const CHAINS: number[][] = [[0, 1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
const TIP_POINTS = [4, 8, 12, 16, 20];

interface HandProps {
  shape: Shape;
  /** Giro alrededor del eje de los dedos: 0 = palma de frente, 90 = de canto, 180 = dorso. */
  yaw: number;
  scale: number;
  cx: number;
  baseY: number;
}

/** Una mano dibujada: silueta de la palma con grosor, huesos, juntas, puntas amarillas y, si se ve el dorso, las uñas. */
function Hand({ shape, yaw, scale, cx, baseY }: HandProps) {
  const t = rad(yaw);
  const local = buildHand(shape);
  const rotated = local.map(([x, y, z]): V => [x * Math.cos(t) + z * Math.sin(t), y, -x * Math.sin(t) + z * Math.cos(t)]);
  const p = (i: number) => ({ x: cx + (rotated[i][0] - 0.25) * scale, y: baseY - rotated[i][1] * scale * 0.95 });
  const facing = Math.cos(t);
  // La palma tiene grosor: dos caras separadas en profundidad. De frente se superponen; de canto se ve un bloque y no una raya.
  const face = (depth: number) =>
    [0, 1, 5, 9, 13, 17]
      .map((i) => {
        const [x, y, z] = local[i];
        const rx = x * Math.cos(t) + (z + depth) * Math.sin(t);
        return `${cx + (rx - 0.25) * scale},${baseY - y * scale * 0.95}`;
      })
      .join(' ');
  // Lo más lejano se dibuja primero, así lo de adelante tapa lo de atrás.
  const bones = CHAINS.flatMap((chain) => chain.slice(1).map((to, k) => ({ from: chain[k], to, z: (rotated[chain[k]][2] + rotated[to][2]) / 2 })));
  bones.sort((a, b) => a.z - b.z);
  const showNails = facing < -0.25 && shape.curl < 0.5;

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <polygon points={face(-0.16)} fill={COLOR.palmDark} stroke={COLOR.palmDark} strokeWidth={scale * 0.12} />
      <polygon points={face(0.16)} fill={COLOR.palm} stroke={COLOR.palm} strokeWidth={scale * 0.12} />
      {shape.curl > 0.6 && (
        <rect
          x={p(17).x - scale * 0.12}
          y={p(9).y - scale * 0.1}
          width={p(5).x - p(17).x + scale * 0.24}
          height={scale * 0.5}
          rx={scale * 0.16}
          fill={COLOR.palm}
          stroke={COLOR.bone}
          strokeWidth={Math.max(1.4, scale * 0.06)}
          opacity={(shape.curl - 0.6) / 0.4}
        />
      )}
      {bones.map(({ from, to }) => (
        <line key={`${from}-${to}`} x1={p(from).x} y1={p(from).y} x2={p(to).x} y2={p(to).y} stroke={COLOR.bone} strokeWidth={Math.max(1.4, scale * 0.07)} />
      ))}
      {rotated.map((_, i) => (
        <circle key={i} cx={p(i).x} cy={p(i).y} r={TIP_POINTS.includes(i) ? scale * 0.075 : scale * 0.042} fill={TIP_POINTS.includes(i) ? COLOR.tip : COLOR.joint} />
      ))}
      {showNails &&
        TIP_POINTS.map((i) => (
          <ellipse key={`n${i}`} cx={p(i).x} cy={p(i).y} rx={scale * 0.11} ry={scale * 0.15} fill="none" stroke={COLOR.nail} strokeWidth={Math.max(1.2, scale * 0.04)} />
        ))}
    </g>
  );
}

/** Qué cara de la mano mira a la cámara, para decirlo con palabras. */
function sideLabel(yaw: number): string {
  if (yaw < 3) return 'PALMA hacia la cámara';
  if (yaw < 80) return `PALMA, girada ${Math.round(yaw / 5) * 5}°`;
  if (yaw < 135) return 'DE CANTO, a 90° (de lado)';
  return 'DORSO hacia la cámara (las uñas)';
}

const TURN_STEPS: Partial<Record<CalibrationStepId, number>> = { turn45: 45, turn90: 90, turn180: 180 };
const SEQUENCE: Array<{ yaw: number; label: string }> = [
  { yaw: 0, label: 'De frente' },
  { yaw: 45, label: '45°' },
  { yaw: 90, label: 'De canto' },
  { yaw: 180, label: 'Dorso' },
];

/**
 * Vaivén suave de 0 a 1 y de vuelta, con una pausa en cada extremo para que se alcance a leer la postura.
 * Con «reducir movimiento» devuelve 1 (la postura final) y no anima.
 */
function useLoop(periodMs: number, active: boolean): number {
  const [value, setValue] = useState(1);
  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setValue(1);
      return;
    }
    let frame = 0;
    let last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < 42) return; // unos 24 cuadros por segundo: suficiente para el dibujo y ligero junto a la cámara
      last = now;
      const phase = ((now - start) % periodMs) / periodMs;
      // 0 → 1 en el primer 40 %, pausa, 1 → 0 en el 40 % siguiente, pausa
      const ramp = phase < 0.4 ? phase / 0.4 : phase < 0.5 ? 1 : phase < 0.9 ? 1 - (phase - 0.5) / 0.4 : 0;
      setValue(ramp * ramp * (3 - 2 * ramp));
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [periodMs, active]);
  return value;
}

interface CalibrationFigureProps {
  step: CalibrationStepId;
}

/** Animación de la postura que se pide, con la secuencia de giros cuando el paso es de giro. */
export function CalibrationFigure({ step }: CalibrationFigureProps) {
  const turnTarget = TURN_STEPS[step];
  const isTurn = turnTarget !== undefined;
  const moves = step !== 'open';
  const k = useLoop(step === 'turn180' ? 4600 : 3600, moves);

  let yaw = 0;
  let shape: Shape = OPEN_HAND;
  if (isTurn) yaw = turnTarget * k;
  else if (step === 'fist') shape = { curl: k, spread: 0.15, thumb: 0 };
  else if (step === 'spread') shape = { curl: 0, spread: 0.15 + 0.85 * k, thumb: 0 };
  else if (step === 'thumb') shape = { curl: 0, spread: 0.15, thumb: k };

  const caption =
    step === 'thumb' ? (k < 0.5 ? 'Pulgar afuera' : 'Pulgar adentro, sobre la palma')
    : step === 'fist' ? (k < 0.5 ? 'Mano abierta' : 'Puño cerrado')
    : step === 'spread' ? (k < 0.5 ? 'Dedos juntos' : 'Dedos separados y estirados')
    : isTurn ? sideLabel(yaw)
    : 'PALMA hacia la cámara, dedos abiertos';
  const target = turnTarget ?? 0;

  return (
    <figure className="cal-figure">
      <svg viewBox="0 0 220 200" role="img" aria-label={`Así se hace: ${caption}`} className="cal-figure__svg">
        <rect width="220" height="200" rx="18" fill={COLOR.tile} />
        <Hand shape={shape} yaw={yaw} scale={isTurn ? 66 : 68} cx={110} baseY={170} />
        {isTurn && (
          <g>
            <path d="M 34 186 Q 110 160 186 186" fill="none" stroke={COLOR.arrow} strokeWidth="3" strokeLinecap="round" />
            <path d="M 176 177 L 187 186 L 174 191" fill="none" stroke={COLOR.arrow} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Marcador del giro que va avanzando por la flecha */}
            <circle cx={34 + 152 * (yaw / 180)} cy={186 - 24 * Math.sin(Math.PI * (yaw / 180)) * 0.9} r="5" fill="#fff" />
          </g>
        )}
        {!isTurn && moves && (
          <g aria-hidden="true">
            <circle cx="196" cy="24" r="5" fill={COLOR.arrow} opacity={k > 0.5 ? 1 : 0.35} />
            <circle cx="180" cy="24" r="5" fill={COLOR.arrow} opacity={k > 0.5 ? 0.35 : 1} />
          </g>
        )}
      </svg>
      <figcaption className="cal-figure__caption" aria-live="off">{caption}</figcaption>
      {isTurn && (
        <ol className="cal-sequence" aria-label="Los giros, en orden">
          {SEQUENCE.map((item) => (
            <li key={item.yaw} className={item.yaw === target ? 'cal-sequence__item cal-sequence__item--now' : 'cal-sequence__item'}>
              <svg viewBox="0 0 80 74" aria-hidden="true">
                <rect width="80" height="74" rx="10" fill={COLOR.tile} />
                <Hand shape={OPEN_HAND} yaw={item.yaw} scale={24} cx={40} baseY={64} />
              </svg>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}
