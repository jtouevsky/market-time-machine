/**
 * Deterministic historical price engine for MOCK data.
 *
 * Each instrument is described by a sparse set of real-ish nominal anchor closes. Between
 * anchors we generate a seeded Brownian bridge on the trading calendar, so every day has a
 * plausible close and every anchor is hit exactly (crash days, peaks and troughs land on the
 * right dates). Stock splits are handled by interpolating in split-adjusted space and then
 * converting back to the nominal price a reader would have seen in the paper that day.
 *
 * Replace with a real data source by implementing HistoricalDataProvider — nothing in the
 * UI depends on this file.
 */
import { addDays, isTradingDay, type ISODate } from '../core/dates';
import type { InstrumentKind, PricePoint } from '../core/types';

export interface SeriesDef {
  id: string;
  name: string;
  /** Era-dependent display names: [fromDate, name] */
  names?: [ISODate, string][];
  kind: InstrumentKind;
  anchors: [ISODate, number][];
  /** [effectiveDate, ratio]: 2 = two-for-one, 0.05 = one-for-twenty reverse split */
  splits?: [ISODate, number][];
  vol?: number;
  mode?: 'log' | 'linear' | 'step';
  /** No random noise for segments ending on/before this date (pegs, fixed prices). */
  fixedUntil?: ISODate;
  decimals?: number;
  unit?: string;
  /** Trades every calendar day (crypto). */
  everyDay?: boolean;
  /** Quote ceases on this date: delisting, bankruptcy, acquisition. */
  end?: { date: ISODate; price: number; note: string };
}

export interface BuiltSeries {
  def: SeriesDef;
  days: ISODate[];
  values: number[];
}

/** Parse "1929-10-29=230.07, 1950=235.41" (bare years resolve to the last trading day). */
export function pts(src: string): [ISODate, number][] {
  return src
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [k, v] = s.split('=');
      const key = k.trim();
      const date = /^\d{4}$/.test(key) ? `${key}-12-31` : key;
      return [date, Number(v)] as [ISODate, number];
    });
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rng: () => number) {
  const u = Math.max(rng(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

function snapBack(d: ISODate, everyDay: boolean): ISODate {
  if (everyDay) return d;
  let x = d;
  for (let i = 0; i < 12 && !isTradingDay(x); i++) x = addDays(x, -1);
  return x;
}

function calendar(from: ISODate, to: ISODate, everyDay: boolean): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) if (everyDay || isTradingDay(d)) out.push(d);
  return out;
}

function splitFactorAfter(def: SeriesDef, d: ISODate) {
  let f = 1;
  for (const [sd, r] of def.splits ?? []) if (sd > d) f *= r;
  return f;
}

const cache = new Map<string, BuiltSeries>();

export function build(def: SeriesDef): BuiltSeries {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const every = !!def.everyDay;
  const anchors = def.anchors
    .map(([d, v]) => [snapBack(d, every), v] as [ISODate, number])
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const days = calendar(anchors[0][0], anchors[anchors.length - 1][0], every);
  const index = new Map(days.map((d, i) => [d, i]));
  const mode = def.mode ?? 'log';
  const vol = def.vol ?? (mode === 'linear' ? 0.02 : 0.012);
  const adj = new Array<number>(days.length);
  const rng = mulberry32(hashString(def.id));

  for (let s = 0; s < anchors.length - 1; s++) {
    const [da, va] = anchors[s];
    const [db, vb] = anchors[s + 1];
    const i0 = index.get(da)!;
    const i1 = index.get(db)!;
    if (i1 === undefined || i0 === undefined || i1 <= i0) continue;
    const n = i1 - i0;
    const aAdj = va / splitFactorAfter(def, da);
    const bAdj = vb / splitFactorAfter(def, db);
    const quiet = def.fixedUntil && db <= def.fixedUntil;
    if (mode === 'step') {
      for (let k = 0; k < n; k++) adj[i0 + k] = aAdj;
      adj[i1] = bAdj;
      continue;
    }
    // Mean-reverting (Ornstein–Uhlenbeck) noise: realistic day-to-day moves, but the path
    // cannot wander far from the line between anchors (and so never invents a fake record high).
    const theta = 0.04;
    const W = [0];
    for (let k = 1; k <= n; k++) W.push(W[k - 1] * (1 - theta) + (quiet ? 0 : gaussian(rng) * vol));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const bridge = W[k] - t * W[n];
      if (mode === 'log') {
        adj[i0 + k] = Math.exp(Math.log(aAdj) * (1 - t) + Math.log(bAdj) * t + bridge);
      } else {
        adj[i0 + k] = Math.max(0, aAdj * (1 - t) + bAdj * t + bridge);
      }
    }
  }
  if (anchors.length === 1) adj[0] = anchors[0][1];
  const values = days.map((d, i) => adj[i] * splitFactorAfter(def, d));
  const built = { def, days, values };
  cache.set(def.id, built);
  return built;
}

/** Index of the last observation on or before `date`, or -1. */
function lastIndex(b: BuiltSeries, date: ISODate): number {
  let lo = 0, hi = b.days.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (b.days[mid] <= date) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}


export function nameAt(def: SeriesDef, date: ISODate) {
  let name = def.name;
  for (const [from, n] of def.names ?? []) if (from <= date) name = n;
  return name;
}

export interface Observation {
  date: ISODate;
  value: number;
  prev: number | null;
  stale: boolean; // date is beyond the series' coverage
  ended?: { date: ISODate; price: number; note: string };
}

/**
 * The most recent close visible on `date`. Returns null before the instrument existed.
 * Never looks past `date`.
 */
export function observe(def: SeriesDef, date: ISODate): Observation | null {
  const b = build(def);
  if (def.end && date >= def.end.date) {
    return { date: def.end.date, value: def.end.price, prev: null, stale: false, ended: def.end };
  }
  const i = lastIndex(b, date);
  if (i < 0) return null;
  let prev = i > 0 ? b.values[i - 1] : null;
  // Express yesterday's close on today's share basis when a split took effect today.
  if (prev !== null) for (const [sd, r] of def.splits ?? []) if (sd > b.days[i - 1] && sd <= b.days[i]) prev /= r;
  return {
    date: b.days[i],
    value: b.values[i],
    prev,
    stale: i === b.days.length - 1 && date > b.days[i],
  };
}

/** Daily closes in (start, end]; end is a hard ceiling — no point after it is ever returned. */
export function history(def: SeriesDef, end: ISODate, start?: ISODate): PricePoint[] {
  const b = build(def);
  const hi = lastIndex(b, end);
  if (hi < 0) return [];
  const lo = start ? Math.max(0, lastIndex(b, start)) : 0;
  const out: PricePoint[] = [];
  for (let i = lo; i <= hi; i++) out.push({ date: b.days[i], value: b.values[i] });
  if (def.end && def.end.date <= end && out.length && out[out.length - 1].date < def.end.date) {
    out.push({ date: def.end.date, value: def.end.price });
  }
  return out;
}

export function splitsBetween(def: SeriesDef, after: ISODate, onOrBefore: ISODate) {
  return (def.splits ?? []).filter(([d]) => d > after && d <= onOrBefore);
}
