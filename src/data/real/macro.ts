/**
 * REAL economic data from FRED / ALFRED (St. Louis Fed).
 *
 * Revisable statistics (unemployment, payrolls, CPI, industrial production, output) are read from
 * ALFRED *vintages*: monthly snapshots of each series exactly as it was published on that date.
 * A reader on 1990-11-15 therefore sees the unemployment rate as first printed, not today's revision.
 * Before vintage coverage begins we fall back to today's series with an estimated release lag and
 * label the reading DERIVED.
 */
import { addDays, daysInMonth, MONTHS, type ISODate } from '../../core/dates';
import type { EconomicReading, Quote } from '../../core/types';
import { loadData } from './loader';

type Rows = [ISODate, number][];
interface SeriesSpec { id: string; label: string; freq: 'd' | 'm' | 'q'; unit: string; kind: string; rows: Rows }
interface VSpec { id: string; label: string; unit: string; snapDay: number; freq: 'm' | 'q'; lag: number; snapshots: [ISODate, Rows][] }
interface LSpec { id: string; label: string; unit: string; freq: 'm' | 'q'; lag: number; latestFrom: string; rows: Rows }

const seriesFile = () => loadData<{ series: Record<string, SeriesSpec> }>('macro/series.json.gz');
const vintageFile = () => loadData<{ vintages: Record<string, VSpec> }>('macro/vintages.json.gz');
const latestFile = () => loadData<{ series: Record<string, LSpec> }>('macro/latest.json.gz');

const periodEnd = (obs: ISODate, freq: 'm' | 'q' | 'd') => {
  if (freq === 'd') return obs;
  const [y, m] = obs.split('-').map(Number);
  const em = freq === 'q' ? m + 2 : m;
  return `${y}-${String(em).padStart(2, '0')}-${String(daysInMonth(y, em)).padStart(2, '0')}`;
};
const periodLabel = (obs: ISODate, freq: 'm' | 'q') => {
  const [y, m] = obs.split('-').map(Number);
  return freq === 'q' ? `Q${Math.ceil(m / 3)} ${y}` : `${MONTHS[m - 1].slice(0, 3)} ${y}`;
};

function lastBefore<T extends [ISODate, unknown]>(rows: T[], pred: (r: T) => boolean): number {
  let lo = 0, hi = rows.length - 1, ans = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (pred(rows[mid])) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  return ans;
}

interface Derivation { label: string; unit: string; compute: (obs: Rows) => { value: number; prior?: number } | null }
const yoy = (obs: Rows, i: number) => (i >= 12 ? (obs[i][1] / obs[i - 12][1] - 1) * 100 : null);
const DERIVE: Record<string, Derivation> = {
  UNRATE: { label: 'Unemployment rate', unit: '%', compute: (o) => (o.length ? { value: o.at(-1)![1], prior: o.at(-2)?.[1] } : null) },
  PAYEMS: { label: 'Payrolls, monthly change', unit: 'k', compute: (o) => (o.length > 2 ? { value: o.at(-1)![1] - o.at(-2)![1], prior: o.at(-2)![1] - o.at(-3)![1] } : null) },
  CPIAUCSL: { label: 'Consumer prices, year over year', unit: '%', compute: (o) => { const i = o.length - 1; const v = yoy(o, i); return v === null ? null : { value: v, prior: yoy(o, i - 1) ?? undefined }; } },
  INDPRO: { label: 'Industrial production, year over year', unit: '%', compute: (o) => { const i = o.length - 1; const v = yoy(o, i); return v === null ? null : { value: v, prior: yoy(o, i - 1) ?? undefined }; } },
  OUTPUT: { label: 'Real output, annualized growth', unit: '%', compute: (o) => (o.length > 2 ? { value: (Math.pow(o.at(-1)![1] / o.at(-2)![1], 4) - 1) * 100, prior: (Math.pow(o.at(-2)![1] / o.at(-3)![1], 4) - 1) * 100 } : null) },
};

/** Before these dates the statistic simply was not published. */
const FIRST_PUBLISHED: Record<string, ISODate> = { UNRATE: '1948-02-06', PAYEMS: '1940-01-01', CPIAUCSL: '1921-02-01', INDPRO: '1927-01-01', OUTPUT: '1947-06-01' };

export async function realEconomicData(date: ISODate): Promise<EconomicReading[]> {
  const [vf, lf] = await Promise.all([vintageFile(), latestFile()]);
  if (!vf && !lf) return [];
  const out: EconomicReading[] = [];
  const groups: [string, string[]][] = [['UNRATE', ['UNRATE']], ['PAYEMS', ['PAYEMS']], ['CPIAUCSL', ['CPIAUCSL']], ['INDPRO', ['INDPRO']], ['OUTPUT', ['GNPC96', 'GDPC1']]];
  for (const [key, ids] of groups) {
    if (date < FIRST_PUBLISHED[key]) continue;
    const d = DERIVE[key];
    // 1) vintage
    let made = false;
    for (const id of ids.slice().reverse()) {
      const v = vf?.vintages[id];
      if (!v || !v.snapshots.length) continue;
      const i = lastBefore(v.snapshots, ([sd]) => sd <= date);
      if (i < 0 || addDays(v.snapshots[i][0], 70) < date) continue;
      const [snap, obs] = v.snapshots[i];
      const c = d.compute(obs);
      if (!c) continue;
      const last = obs.at(-1)![0];
      out.push({
        id: `${key}-${snap}`, seriesId: key, label: d.label, title: `${d.label} (${periodLabel(last, v.freq)})`, category: 'economy',
        period: periodLabel(last, v.freq), value: c.value, prior: c.prior, unit: d.unit,
        eventDate: periodEnd(last, v.freq), publishedAt: snap, availableAt: snap,
        source: 'ALFRED real-time vintage, St. Louis Fed', publication: `ALFRED: ${id} as of ${snap}`,
        sourceUrl: `https://alfred.stlouisfed.org/series?seid=${id}`, provenance: 'REAL',
      });
      made = true;
      break;
    }
    if (made) continue;
    // 2) later-revised values with an estimated release date
    const l = lf?.series[key === 'OUTPUT' ? 'GNPC96' : key] ?? (key === 'OUTPUT' ? lf?.series.GDPC1 : undefined);
    if (!l || !l.rows.length) continue;
    const i = lastBefore(l.rows, ([od]) => addDays(periodEnd(od, l.freq), l.lag) <= date);
    if (i < 2) continue;
    const obs = l.rows.slice(Math.max(0, i - 13), i + 1);
    const c = d.compute(obs);
    if (!c) continue;
    const last = obs.at(-1)![0];
    const rel = addDays(periodEnd(last, l.freq), l.lag);
    out.push({
      id: `${key}-est-${last}`, seriesId: key, label: d.label, title: `${d.label} (${periodLabel(last, l.freq)})`, category: 'economy',
      period: periodLabel(last, l.freq), value: c.value, prior: c.prior, unit: d.unit,
      eventDate: periodEnd(last, l.freq), publishedAt: rel, availableAt: rel,
      source: 'FRED (later revised values; release date estimated)', publication: `FRED: ${l.latestFrom}`,
      sourceUrl: `https://fred.stlouisfed.org/series/${l.latestFrom}`, provenance: 'DERIVED',
    });
  }
  return out;
}

// ------------------------------------------------------------------ market-observed series
const MONTHLY_NAMES: Record<string, string> = {
  TB3MS: 'Treasury bills, 3-month', GS10: 'Treasury bonds, 10-year', M13001USM156NNBR: 'Call money, New York',
  M13002US35620M156NNBR: 'Commercial paper, New York', M1109BUSM293NNBR: 'Dow Jones Industrials', WTISPLC: 'Crude oil, posted',
};

/** Value of a FRED series as a reader would have seen it on `date`. Monthly averages appear after the month ends. */
export async function realSeriesQuote(id: string, date: ISODate): Promise<Quote | null> {
  const f = await seriesFile();
  const s = f?.series[id];
  if (!s || !s.rows.length) return null;
  const visible = (r: [ISODate, number]) => (s.freq === 'd' ? r[0] <= date : periodEnd(r[0], 'm') < date);
  const i = lastBefore(s.rows, visible);
  if (i < 0) return null;
  const [obs, value] = s.rows[i];
  // stale: daily series older than 10 days, monthly older than 70 days → no quote
  if (s.freq === 'd' && addDays(obs, 10) < date) return null;
  if (s.freq === 'm' && addDays(periodEnd(obs, 'm'), 62) < date) return null;
  const prev = i > 0 ? s.rows[i - 1][1] : null;
  const change = prev !== null ? value - prev : null;
  const [y, m] = obs.split('-').map(Number);
  const name = s.freq === 'm' ? `${MONTHLY_NAMES[id] ?? s.label} (${MONTHS[m - 1].slice(0, 3)}. avg.)` : s.label;
  const asOf = s.freq === 'm' ? periodEnd(obs, 'm') : obs;
  void y;
  return {
    id, name, asOf, value, prev, change, changePct: change !== null && prev ? (change / prev) * 100 : null,
    unit: s.unit || undefined, decimals: s.kind === 'fx' ? 4 : 2, kind: s.kind as Quote['kind'],
    provenance: 'REAL', publication: `FRED: ${id}`, sourceUrl: `https://fred.stlouisfed.org/series/${id}`,
  };
}

/** NBER business-cycle announcements — recessions are only known when the committee says so. */
export const NBER_ANNOUNCEMENTS: { availableAt: ISODate; text: string }[] = [
  { availableAt: '1980-06-03', text: 'NBER: the expansion peaked in January 1980; the economy is in recession.' },
  { availableAt: '1981-07-08', text: 'NBER: the 1980 recession ended in July 1980.' },
  { availableAt: '1982-01-06', text: 'NBER: a new recession began in July 1981.' },
  { availableAt: '1983-07-08', text: 'NBER: the recession ended in November 1982.' },
  { availableAt: '1991-04-25', text: 'NBER: the expansion peaked in July 1990; the economy is in recession.' },
  { availableAt: '1992-12-22', text: 'NBER: the recession ended in March 1991.' },
  { availableAt: '2001-11-26', text: 'NBER: the expansion peaked in March 2001; the economy is in recession.' },
  { availableAt: '2003-07-17', text: 'NBER: the recession ended in November 2001.' },
  { availableAt: '2008-12-01', text: 'NBER: the expansion peaked in December 2007; the economy is in recession.' },
  { availableAt: '2010-09-20', text: 'NBER: the recession ended in June 2009.' },
  { availableAt: '2020-06-08', text: 'NBER: the expansion peaked in February 2020; the economy is in recession.' },
  { availableAt: '2021-07-19', text: 'NBER: the recession ended in April 2020.' },
];
