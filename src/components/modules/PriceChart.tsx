import { useId, useMemo, useState } from 'react';
import { addDays, addYears, addMonths, type ISODate } from '../../core/dates';
import type { PricePoint } from '../../core/types';
import { useHistorical } from '../../state/useHistorical';
import { useEra } from '../../theme/EraThemeProvider';
import { num } from '../../theme/format';

const RANGES = [
  { id: '1M', from: (d: ISODate) => addMonths(d, -1) },
  { id: '6M', from: (d: ISODate) => addMonths(d, -6) },
  { id: '1Y', from: (d: ISODate) => addYears(d, -1) },
  { id: '5Y', from: (d: ISODate) => addYears(d, -5) },
  { id: 'MAX', from: (_d: ISODate) => '1800-01-01' },
];

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || Math.abs(max) || 1;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(v);
  return out;
}

/** A chart that ends exactly on the simulated present. */
export function PriceChart({ symbol, title }: { symbol: string; title?: string }) {
  const era = useEra();
  const [range, setRange] = useState('1Y');
  const uid = useId().replace(/:/g, '');
  const data = useHistorical((p, d) => p.getStockHistory(symbol, d, RANGES.find((r) => r.id === range)!.from(d)), [symbol, range]);
  const W = 640, H = 260, PL = 8, PR = 58, PT = 16, PB = 28;

  const geo = useMemo(() => {
    const pts: PricePoint[] = data ?? [];
    if (pts.length < 2) return null;
    const vals = pts.map((p) => p.value);
    let min = Math.min(...vals), max = Math.max(...vals);
    const pad = (max - min) * 0.08 || max * 0.05;
    min = Math.max(0, min - pad); max += pad;
    const x = (i: number) => PL + (i / (pts.length - 1)) * (W - PL - PR);
    const y = (v: number) => PT + (1 - (v - min) / (max - min)) * (H - PT - PB);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
    const area = `${line}L${x(pts.length - 1).toFixed(1)},${H - PB}L${PL},${H - PB}Z`;
    const ticks = niceTicks(min, max);
    const labelIdx = [0, Math.floor((pts.length - 1) / 2), pts.length - 1];
    return { pts, x, y, line, area, ticks, labelIdx, min, max };
  }, [data]);

  const change = geo ? (geo.pts[geo.pts.length - 1].value / geo.pts[0].value - 1) * 100 : 0;
  const last = geo?.pts[geo.pts.length - 1];
  const dec = last && last.value < 10 ? 2 : last && last.value > 5000 ? 0 : 2;
  const nowLabel = era.module === 'terminal' ? 'NOW' : era.module === 'print' ? 'TO-DAY' : 'Today';

  return (
    <figure className={`m-chart chart-${era.chart} ${change >= 0 ? 'is-up' : 'is-down'}`}>
      <figcaption className="m-chart-head">
        <span className="m-chart-title">{title ?? era.labels.chart}</span>
        <span className="m-chart-ranges" role="group" aria-label="Range">
          {RANGES.map((r) => (
            <button key={r.id} type="button" className={`m-range${r.id === range ? ' is-active' : ''}`} aria-pressed={r.id === range} onClick={() => setRange(r.id)}>
              {era.module === 'print' ? { '1M': 'Month', '6M': '6 Mos.', '1Y': 'Year', '5Y': '5 Yrs.', MAX: 'All' }[r.id] : r.id}
            </button>
          ))}
        </span>
      </figcaption>
      <div className="m-chart-frame">
        {geo ? (
          <svg viewBox={`0 0 ${W} ${H}`} className="m-chart-svg" role="img" aria-label={`Price history ending ${last?.date}`}>
            <defs>
              <linearGradient id={`g-${uid}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" className="m-chart-stop-a" />
                <stop offset="1" className="m-chart-stop-b" />
              </linearGradient>
              <pattern id={`h-${uid}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="5" className="m-chart-hatch" />
              </pattern>
              <filter id={`f-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="2.2" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {geo.ticks.map((t) => (
              <g key={t} className="m-chart-grid">
                <line x1={PL} x2={W - PR} y1={geo.y(t)} y2={geo.y(t)} />
                <text x={W - PR + 6} y={geo.y(t) + 4}>{num(t, t < 10 ? 2 : 0)}</text>
              </g>
            ))}
            <path d={geo.area} className="m-chart-area" fill={era.chart === 'engraved' || era.chart === 'print' ? `url(#h-${uid})` : `url(#g-${uid})`} />
            <path d={geo.line} className="m-chart-line" filter={era.chart === 'phosphor' ? `url(#f-${uid})` : undefined} />
            <line className="m-chart-now" x1={geo.x(geo.pts.length - 1)} x2={geo.x(geo.pts.length - 1)} y1={PT - 6} y2={H - PB} />
            <circle className="m-chart-dot" cx={geo.x(geo.pts.length - 1)} cy={geo.y(last!.value)} r="3.5" />
            {geo.labelIdx.map((i, k) => (
              <text key={k} className="m-chart-xlabel" x={geo.x(i)} y={H - 8} textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'}>
                {k === 2 ? `${nowLabel} · ${era.formatShort(geo.pts[i].date)}` : era.formatShort(geo.pts[i].date)}
              </text>
            ))}
          </svg>
        ) : <div className="m-chart-empty">{data ? 'Insufficient price history.' : '…'}</div>}
      </div>
      {geo ? (
        <p className="m-chart-foot">
          <span>{era.module === 'terminal' ? 'HI' : 'High'} {num(Math.max(...geo.pts.map((p) => p.value)), dec)}</span>
          <span>{era.module === 'terminal' ? 'LO' : 'Low'} {num(Math.min(...geo.pts.map((p) => p.value)), dec)}</span>
          <span className={change >= 0 ? 'm-up' : 'm-down'}>{change >= 0 ? '+' : ''}{change.toFixed(1)}% {era.module === 'terminal' ? 'CHG' : 'over period'}</span>
          <span className="m-chart-asof">{era.module === 'terminal' ? 'THRU' : 'Through'} {era.formatShort(addDays(last!.date, 0))}</span>
        </p>
      ) : null}
    </figure>
  );
}
