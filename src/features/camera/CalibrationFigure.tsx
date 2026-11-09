import type { CalibrationStepId } from '../../services/recognition/calibration';

/**
 * Dibujos de la mano para la calibración: una figura por postura, con la palma, el dorso, el giro y hacia dónde
 * girar. Se arman con un modelo 3D simple de la mano (21 puntos) girado y proyectado, así que los ángulos del dibujo
 * son los de verdad. Colores sólidos y fijos (no cambian con el tema ni llevan transparencia): el dibujo vive dentro
 * del panel, no sobre la cámara, para no estorbar.
 */

type V = [number, number, number];
type Pose = 'open' | 'spread' | 'fist' | 'thumbIn';

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

/** Los 21 puntos de la mano en su propio marco (x a la derecha, y hacia los dedos, z hacia quien mira la palma). */
function buildHand(pose: Pose): V[] {
  const pts: V[] = [[0, 0, 0]];
  const thumb = pose === 'thumbIn' || pose === 'fist' ? THUMB_IN : THUMB_OUT;
  pts.push(...thumb);
  for (const finger of FINGERS) {
    const fan = rad(pose === 'spread' ? finger.fan : finger.fan * 0.15);
    const flat: V = [Math.sin(fan), Math.cos(fan), 0];
    let [x, y, z]: V = [finger.mcp[0], finger.mcp[1], 0];
    pts.push([x, y, z]);
    finger.bones.forEach((length, i) => {
      const phi = pose === 'fist' ? rad(FIST_CURL[i]) : 0;
      x += (flat[0] * Math.cos(phi)) * length;
      y += (flat[1] * Math.cos(phi)) * length;
      z += Math.sin(phi) * length;
      pts.push([x, y, z]);
    });
  }
  return pts;
}

const CHAINS: number[][] = [[0, 1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];

interface HandProps {
  pose: Pose;
  /** Giro alrededor del eje de los dedos: 0 = palma de frente, 90 = de canto, 180 = dorso. */
  yaw: number;
  scale: number;
  cx: number;
  baseY: number;
}

/** Una mano dibujada: silueta de la palma, huesos, juntas, puntas amarillas y, si se ve el dorso, las uñas. */
function Hand({ pose, yaw, scale, cx, baseY }: HandProps) {
  const t = rad(yaw);
  const rotated = buildHand(pose).map(([x, y, z]): V => [x * Math.cos(t) + z * Math.sin(t), y, -x * Math.sin(t) + z * Math.cos(t)]);
  const p = (i: number) => ({ x: cx + (rotated[i][0] - 0.25) * scale, y: baseY - rotated[i][1] * scale * 0.95 });
  const facing = Math.cos(t);
  // La palma tiene grosor: dos caras separadas en profundidad. De frente se superponen; de canto se ve un bloque y no una raya.
  const face = (depth: number) =>
    [0, 1, 5, 9, 13, 17]
      .map((i) => {
        const [x, y, z] = buildHand(pose)[i];
        const rx = x * Math.cos(t) + (z + depth) * Math.sin(t);
        return `${cx + (rx - 0.25) * scale},${baseY - y * scale * 0.95}`;
      })
      .join(' ');
  // Lo más lejano se dibuja primero, así lo de adelante tapa lo de atrás.
  const bones = CHAINS.flatMap((chain) => chain.slice(1).map((to, k) => ({ from: chain[k], to, z: (rotated[chain[k]][2] + rotated[to][2]) / 2 })));
  bones.sort((a, b) => a.z - b.z);
  const showNails = facing < -0.25 && pose !== 'fist';

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <polygon points={face(-0.16)} fill={COLOR.palmDark} stroke={COLOR.palmDark} strokeWidth={scale * 0.12} />
      <polygon points={face(0.16)} fill={COLOR.palm} stroke={COLOR.palm} strokeWidth={scale * 0.12} />
      {pose === 'fist' && (
        <rect
          x={p(17).x - scale * 0.12}
          y={p(9).y - scale * 0.1}
          width={p(5).x - p(17).x + scale * 0.24}
          height={scale * 0.5}
          rx={scale * 0.16}
          fill={COLOR.palm}
          stroke={COLOR.bone}
          strokeWidth={Math.max(1.4, scale * 0.06)}
        />
      )}
      {bones.map(({ from, to }) => (
        <line key={`${from}-${to}`} x1={p(from).x} y1={p(from).y} x2={p(to).x} y2={p(to).y} stroke={COLOR.bone} strokeWidth={Math.max(1.4, scale * 0.07)} />
      ))}
      {rotated.map((_, i) => (
        <circle key={i} cx={p(i).x} cy={p(i).y} r={[4, 8, 12, 16, 20].includes(i) ? scale * 0.075 : scale * 0.042} fill={[4, 8, 12, 16, 20].includes(i) ? COLOR.tip : COLOR.joint} />
      ))}
      {showNails &&
        [4, 8, 12, 16, 20].map((i) => (
          <ellipse key={`n${i}`} cx={p(i).x} cy={p(i).y} rx={scale * 0.11} ry={scale * 0.15} fill="none" stroke={COLOR.nail} strokeWidth={Math.max(1.2, scale * 0.04)} />
        ))}
    </g>
  );
}

/** Qué cara de la mano mira a la cámara, para decirlo con palabras. */
function sideLabel(yaw: number): string {
  if (yaw === 0) return 'PALMA hacia la cámara';
  if (yaw < 80) return `PALMA, girada unos ${yaw}°`;
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

interface CalibrationFigureProps {
  step: CalibrationStepId;
}

/** Figura de la postura que se pide, con la secuencia de giros cuando el paso es de giro. */
export function CalibrationFigure({ step }: CalibrationFigureProps) {
  const turnTarget = TURN_STEPS[step];
  const isTurn = turnTarget !== undefined;
  const yaw = turnTarget ?? 0;
  const pose: Pose = step === 'fist' ? 'fist' : step === 'spread' ? 'spread' : 'open';

  return (
    <figure className="cal-figure">
      <svg viewBox="0 0 220 200" role="img" aria-label={`Así se ve la postura: ${sideLabel(yaw)}`} className="cal-figure__svg">
        <rect width="220" height="200" rx="18" fill={COLOR.tile} />
        {step === 'thumb' ? (
          <>
            <Hand pose="open" yaw={0} scale={58} cx={62} baseY={172} />
            <Hand pose="thumbIn" yaw={0} scale={58} cx={158} baseY={172} />
            <path d="M 98 70 L 122 70" stroke={COLOR.arrow} strokeWidth="3" strokeLinecap="round" />
            <path d="M 117 63 L 124 70 L 117 77" fill="none" stroke={COLOR.arrow} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <Hand pose={pose} yaw={yaw} scale={pose === 'fist' ? 92 : isTurn ? 66 : 70} cx={110} baseY={pose === 'fist' ? 150 : 170} />
        )}
        {isTurn && (
          <g>
            <path d="M 34 186 Q 110 160 186 186" fill="none" stroke={COLOR.arrow} strokeWidth="3" strokeLinecap="round" />
            <path d="M 176 177 L 187 186 L 174 191" fill="none" stroke={COLOR.arrow} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
      <figcaption className="cal-figure__caption">
        {step === 'thumb' ? 'Pulgar afuera, luego adentro' : step === 'fist' ? 'Puño cerrado' : step === 'spread' ? 'Dedos separados y estirados' : sideLabel(yaw)}
      </figcaption>
      {isTurn && (
        <ol className="cal-sequence" aria-label="Los giros, en orden">
          {SEQUENCE.map((item) => (
            <li key={item.yaw} className={item.yaw === yaw ? 'cal-sequence__item cal-sequence__item--now' : 'cal-sequence__item'}>
              <svg viewBox="0 0 80 74" aria-hidden="true">
                <rect width="80" height="74" rx="10" fill={COLOR.tile} />
                <Hand pose="open" yaw={item.yaw} scale={24} cx={40} baseY={64} />
              </svg>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}
