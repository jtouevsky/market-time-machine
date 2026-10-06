import { useEffect, useMemo, useRef } from 'react';

/**
 * Flowing metallic ribbons for the time portal.
 * Each ribbon is a tapered filled shape built from a drifting Bézier centreline, painted with a
 * chrome gradient, plus a specular band that slides along it. Drawn in SVG so edges stay crisp.
 */
interface RibbonSpec {
  p: [number, number][]; // 4 control points in a 1000×1000 box
  width: number;         // max thickness
  speed: number;         // drift speed
  phase: number;
  layer: 'back' | 'front';
  glint: number;         // seconds for the specular sweep
}

const RIBBONS: RibbonSpec[] = [
  { p: [[-260, 230], [260, 110], [560, 430], [1260, 290]], width: 15, speed: 0.07, phase: 0.2, layer: 'back', glint: 9 },
  { p: [[-240, 660], [300, 510], [660, 770], [1240, 550]], width: 22, speed: 0.05, phase: 1.4, layer: 'back', glint: 11 },
  { p: [[-260, 470], [240, 570], [760, 370], [1260, 480]], width: 8, speed: 0.09, phase: 2.1, layer: 'back', glint: 7.5 },
  { p: [[120, -240], [260, 300], [180, 700], [360, 1240]], width: 6, speed: 0.06, phase: 0.9, layer: 'back', glint: 12 },
  { p: [[860, -240], [700, 300], [940, 640], [760, 1240]], width: 10, speed: 0.045, phase: 2.8, layer: 'back', glint: 10 },
  { p: [[-240, 900], [380, 800], [700, 990], [1240, 820]], width: 7, speed: 0.08, phase: 3.6, layer: 'front', glint: 8.5 },
  { p: [[-240, 80], [420, 170], [640, -20], [1240, 130]], width: 4, speed: 0.1, phase: 4.2, layer: 'front', glint: 6.5 },
];

function bez(p: [number, number][], t: number): [number, number] {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
}

/** Closed outline of a tapered ribbon around the curve. */
function ribbonPath(p: [number, number][], width: number, twist: number) {
  const N = 48;
  const left: string[] = [], right: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y] = bez(p, t);
    const [x2, y2] = bez(p, Math.min(1, t + 0.002));
    const [x1, y1] = bez(p, Math.max(0, t - 0.002));
    let nx = -(y2 - y1), ny = x2 - x1;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    // taper + a slow "twist" so the ribbon appears to turn in light
    const w = width * Math.pow(Math.sin(Math.PI * t), 0.4) * (0.55 + 0.45 * Math.abs(Math.cos(t * 3.2 + twist)));
    left.push(`${(x + nx * w).toFixed(1)},${(y + ny * w).toFixed(1)}`);
    right.push(`${(x - nx * w).toFixed(1)},${(y - ny * w).toFixed(1)}`);
  }
  return `M${left.join('L')}L${right.reverse().join('L')}Z`;
}

function drift(spec: RibbonSpec, time: number): [number, number][] {
  return spec.p.map(([x, y], i) => [
    x + Math.sin(time * spec.speed * 6 + spec.phase + i * 1.7) * (i === 0 || i === 3 ? 10 : 46),
    y + Math.cos(time * spec.speed * 5 + spec.phase * 1.3 + i) * (i === 0 || i === 3 ? 14 : 58),
  ]) as [number, number][];
}

export function ChromeRibbons({ layer, speedBoost = 1 }: { layer: 'back' | 'front'; speedBoost?: number }) {
  const refs = useRef<(SVGPathElement | null)[]>([]);
  const hi = useRef<(SVGPathElement | null)[]>([]);
  const list = useMemo(() => RIBBONS.filter((r) => r.layer === layer), [layer]);
  const boost = useRef(speedBoost);
  boost.current = speedBoost;

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, t = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt * boost.current;
      list.forEach((r, i) => {
        const pts = drift(r, t);
        const d = ribbonPath(pts, r.width, t * r.speed * 4 + r.phase);
        refs.current[i]?.setAttribute('d', d);
        hi.current[i]?.setAttribute('d', d);
      });
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [list]);

  return (
    <svg className={`ribbons ribbons-${layer}`} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`chrome-${layer}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7f8fa" />
          <stop offset="0.18" stopColor="#b9bfc8" />
          <stop offset="0.34" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#8d949e" />
          <stop offset="0.62" stopColor="#e9ecf0" />
          <stop offset="0.8" stopColor="#a3aab4" />
          <stop offset="1" stopColor="#f3f5f7" />
        </linearGradient>
        {list.map((r, i) => (
          <linearGradient key={i} id={`glint-${layer}-${i}`} x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.46" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.54" stopColor="#dff4ff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
            <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur={`${r.glint}s`} begin={`${-r.phase * 2}s`} repeatCount="indefinite" />
          </linearGradient>
        ))}
        <filter id={`soft-${layer}`} filterUnits="userSpaceOnUse" x="-400" y="-400" width="1800" height="1800">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#3a4658" floodOpacity="0.16" />
        </filter>
      </defs>
      {list.map((_, i) => (
        <g key={i} filter={`url(#soft-${layer})`} opacity={layer === 'front' ? 0.85 : 1}>
          <path ref={(el) => { refs.current[i] = el; }} fill={`url(#chrome-${layer})`} />
          <path ref={(el) => { hi.current[i] = el; }} fill={`url(#glint-${layer}-${i})`} style={{ mixBlendMode: 'screen' }} />
        </g>
      ))}
    </svg>
  );
}
