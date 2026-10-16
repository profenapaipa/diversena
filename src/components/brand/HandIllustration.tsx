// Mano abierta descrita con los mismos 21 puntos que entrega el detector
// (muñeca, 4 por dedo). Es la "firma visual" de DiverSeña: lo que la cámara ve.
const POINTS: Array<[number, number]> = [
  [50, 93],
  [36, 84], [27, 73], [20, 63], [13, 55],
  [38, 57], [35, 41], [33, 31], [32, 21],
  [50, 55], [50, 37], [50, 26], [50, 15],
  [61, 57], [64, 41], [66, 31], [67, 22],
  [71, 62], [77, 50], [80, 42], [83, 35],
];

const BONES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const TIPS = new Set([4, 8, 12, 16, 20]);

export function HandIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Mano con sus 21 puntos de referencia">
      <g stroke="var(--brand-sky)" strokeWidth="1.6" strokeLinecap="round">
        {BONES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={POINTS[a][0]} y1={POINTS[a][1]} x2={POINTS[b][0]} y2={POINTS[b][1]} />
        ))}
      </g>
      {POINTS.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={TIPS.has(i) ? 2.8 : 2}
          fill={TIPS.has(i) ? 'var(--brand-sun)' : 'var(--surface)'}
          stroke="var(--brand-navy-ink)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
