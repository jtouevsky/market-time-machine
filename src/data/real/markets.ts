/**
 * REAL market data (Yahoo Finance daily bars, captured at build time into /public/data/markets).
 *
 * Prices in the files are split-adjusted to today's share basis. Everything we hand to the UI is
 * converted back to the basis that existed on the simulated date:
 *   price_as_printed(d) = adjusted(d) × Π(split ratios effective after d)
 * so a 1987 IBM quote reads 103¼, not today's split-adjusted figure — and no future split leaks.
 */
import { addDays, type ISODate } from '../../core/dates';
import type { InstrumentKind, PricePoint, Quote } from '../../core/types';
import { loadData } from './loader';

interface SecRow {
  id: string; file: string; kind: InstrumentKind | 'stock'; sector: string | null; unit: string | null; intl: boolean;
  names: [ISODate, string][]; tickers: [ISODate, string][]; exchange: [ISODate, string][];
  first: ISODate; last: ISODate; splits: [ISODate, number][]; source: string;
}
interface SecFile { generatedAt: string; years: number[]; securities: SecRow[] }
interface YearFile { year: number; days: ISODate[]; prev: Record<string, number>; c: Record<string, (number | null)[]> }
interface PriceFile { id: string; splits: [ISODate, number][]; divs: [ISODate, number][]; d: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] }

export const at = <T>(hist: [ISODate, T][] | undefined, date: ISODate): T | undefined => {
  let out: T | undefined;
  for (const [d, v] of hist ?? []) if (d <= date) out = v; else break;
  return out;
};

export function splitFactorAfter(splits: [ISODate, number][], date: ISODate, until?: ISODate) {
  let f = 1;
  for (const [d, r] of splits) if (d > date && (!until || d <= until)) f *= r;
  return f;
}

let meta: Promise<Map<string, SecRow> | null> | null = null;
export function securities(): Promise<Map<string, SecRow> | null> {
  meta ??= loadData<SecFile>('markets/securities.json').then((f) => (f ? new Map(f.securities.map((s) => [s.id, s])) : null));
  return meta;
}
export async function dataHorizon(): Promise<ISODate | null> {
  const m = await securities();
  if (!m) return null;
  const spx = m.get('^GSPC');
  return spx ? spx.last : null;
}

export const nameAt = (s: SecRow, date: ISODate) => at(s.names, date) ?? s.names[0][1];
export const tickerAt = (s: SecRow, date: ISODate) => at(s.tickers, date) ?? s.tickers[0][1];

/** Listed and quoted on this date, identity already established. */
export function isListed(s: SecRow, date: ISODate) {
  return s.first <= date && s.names[0][0] <= date && date <= addDays(s.last, 7);
}

const yearFile = (y: number) => loadData<YearFile>(`markets/daily/${y}.json.gz`);

async function closeOnOrBefore(id: string, date: ISODate): Promise<{ asOf: ISODate; adj: number; prevAdj: number | null } | null> {
  const y = Number(date.slice(0, 4));
  for (let yy = y; yy >= y - 1; yy--) {
    const f = await yearFile(yy);
    if (!f || !f.c[id]) continue;
    const arr = f.c[id];
    let i = f.days.length - 1;
    while (i >= 0 && (f.days[i] > date || arr[i] == null)) i--;
    if (i < 0) continue;
    let j = i - 1;
    while (j >= 0 && arr[j] == null) j--;
    const prev = j >= 0 ? arr[j] : f.prev[id] ?? null;
    return { asOf: f.days[i], adj: arr[i]!, prevAdj: prev ?? null };
  }
  return null;
}

export async function realQuote(id: string, date: ISODate): Promise<Quote | null> {
  const m = await securities();
  const s = m?.get(id);
  if (!s || !isListed(s, date)) return null;
  const o = await closeOnOrBefore(id, date);
  if (!o) return null;
  const f = splitFactorAfter(s.splits, o.asOf);
  const value = o.adj * f;
  const prev = o.prevAdj !== null ? o.prevAdj * f : null;
  const change = prev !== null ? value - prev : null;
  const kind: InstrumentKind = s.kind === 'stock' ? 'stock' : (s.kind as InstrumentKind);
  return {
    id, symbol: tickerAt(s, date), name: nameAt(s, date), asOf: o.asOf, value, prev, change,
    changePct: change !== null && prev ? (change / prev) * 100 : null, unit: s.unit ?? undefined,
    decimals: kind === 'index' ? 2 : 2, kind,
    provenance: 'REAL', publication: s.source, sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(id)}/history`,
  };
}

/** Every stock's change on the session date, for "market movers". */
export async function realMovers(date: ISODate, limit = 8): Promise<Quote[]> {
  const m = await securities();
  if (!m) return [];
  const y = Number(date.slice(0, 4));
  const f = await yearFile(y);
  if (!f) return [];
  let i = f.days.length - 1;
  while (i >= 0 && f.days[i] > date) i--;
  if (i < 0) return [];
  const out: Quote[] = [];
  for (const s of m.values()) {
    if (s.kind !== 'stock' || !isListed(s, date)) continue;
    const arr = f.c[s.id];
    if (!arr || arr[i] == null) continue;
    const prev = i > 0 ? arr[i - 1] : f.prev[s.id];
    if (prev == null) continue;
    const fac = splitFactorAfter(s.splits, f.days[i]);
    const value = arr[i]! * fac, p = prev * fac;
    out.push({
      id: s.id, symbol: tickerAt(s, date), name: nameAt(s, date), asOf: f.days[i], value, prev: p, change: value - p,
      changePct: (value / p - 1) * 100, decimals: 2, kind: 'stock', provenance: 'REAL', publication: s.source,
    });
  }
  return out.sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!)).slice(0, limit);
}

const priceFile = (s: SecRow) => loadData<PriceFile>(`markets/prices/${s.file}.json.gz`);

/** Daily closes up to `end`, on the share basis in force at `end` (past splits applied, future ones unknown). */
export async function realHistory(id: string, end: ISODate, start?: ISODate): Promise<PricePoint[] | null> {
  const m = await securities();
  const s = m?.get(id);
  if (!s) return null;
  const p = await priceFile(s);
  if (!p) return null;
  const f = splitFactorAfter(s.splits, end);
  const base = Date.UTC(1900, 0, 1) / 864e5;
  const out: PricePoint[] = [];
  let day = 0;
  for (let i = 0; i < p.d.length; i++) {
    day += p.d[i];
    const iso = new Date((base + day) * 864e5).toISOString().slice(0, 10);
    if (iso > end) break;
    if (start && iso < start) continue;
    out.push({ date: iso, value: p.c[i] * f });
  }
  return out;
}

export async function realDividends(id: string, after: ISODate, onOrBefore: ISODate) {
  const m = await securities();
  const s = m?.get(id);
  if (!s) return [];
  const p = await priceFile(s);
  return (p?.divs ?? [])
    .filter(([d]) => d > after && d <= onOrBefore)
    .map(([d, amt]) => ({ date: d, perShare: amt * splitFactorAfter(s.splits, d) }));
}

export async function realSplits(id: string, after: ISODate, onOrBefore: ISODate) {
  const m = await securities();
  const s = m?.get(id);
  return (s?.splits ?? []).filter(([d]) => d > after && d <= onOrBefore).map(([date, ratio]) => ({ date, ratio }));
}
