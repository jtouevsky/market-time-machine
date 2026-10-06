import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { diffDays, type ISODate } from '../core/dates';
import type { NewsItem } from '../core/types';
import { createGuardedProvider } from '../data/guardedProvider';
import { createRealProvider } from '../data/realProvider';
import type { HistoricalDataProvider } from '../data/provider';
import { HistoricalContextAggregator } from '../data/aggregator';
import { eraFor } from '../theme/eras';

export type View =
  | { name: 'home' }
  | { name: 'search'; q: string }
  | { name: 'company'; ticker: string }
  | { name: 'portfolio' };

export interface Lot {
  id: string;
  ticker: string;
  company: string;
  purchaseDate: ISODate;
  purchasePrice: number; // per share, on the current share basis
  shares: number;
  costBasis: number;     // dollars actually paid
}

export interface Portfolio {
  startingCash: number;
  cash: number;
  lots: Lot[];
  startedAt: ISODate | null;
  activity: { date: ISODate; text: string }[];
}

export interface LotResult { lot: Lot; price: number; value: number; returnPct: number; benchReturnPct: number | null; settled?: string }

export interface Reveal {
  from: ISODate;
  to: ISODate;
  events: NewsItem[];
  before: number;
  after: number;
  lots: LotResult[];
  benchmarkName: string | null;
  benchmarkReturnPct: number | null;
  notes: string[];
}

export interface TravelState { from: ISODate | null; to: ISODate; direction: 'back' | 'forward' }

interface Sim {
  provider: HistoricalDataProvider;
  world: HistoricalContextAggregator;
  phase: 'portal' | 'traveling' | 'world';
  date: ISODate;
  travel: TravelState | null;
  view: View;
  portfolio: Portfolio;
  reveal: Reveal | null;
  digest: NewsItem[] | null;
  pending: boolean;
  travelTo: (date: ISODate) => void;
  finishTravel: () => void;
  exit: () => void;
  go: (v: View) => void;
  advanceTo: (date: ISODate) => Promise<void>;
  buy: (ticker: string, shares: number) => Promise<string | null>;
  sell: (lotId: string, shares: number) => Promise<string | null>;
  closeReveal: () => void;
  closeDigest: () => void;
  valueAt: (date: ISODate) => Promise<{ total: number; lots: LotResult[] }>;
  resumeDate: ISODate | null;
}

const SimContext = createContext<Sim | null>(null);
const STORE_KEY = 'market-time-machine/session-v1';
const STARTING_CASH = 10_000;

const freshPortfolio = (): Portfolio => ({ startingCash: STARTING_CASH, cash: STARTING_CASH, lots: [], startedAt: null, activity: [] });

function loadSaved(): { date: ISODate; portfolio: Portfolio } | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function save(state: { date: ISODate; portfolio: Portfolio } | null) {
  try {
    if (state) localStorage.setItem(STORE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORE_KEY);
  } catch { /* storage unavailable: the session simply isn't remembered */ }
}

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const clock = useRef<ISODate>('1800-01-01');
  const provider = useMemo(() => createGuardedProvider(createRealProvider(), () => clock.current), []);
  const world = useMemo(() => new HistoricalContextAggregator(provider), [provider]);
  const saved = useMemo(loadSaved, []);

  const [phase, setPhase] = useState<Sim['phase']>('portal');
  const [date, setDate] = useState<ISODate>('1800-01-01');
  const [travel, setTravel] = useState<TravelState | null>(null);
  const [view, setView] = useState<View>({ name: 'home' });
  const [portfolio, setPortfolio] = useState<Portfolio>(freshPortfolio);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [digest, setDigest] = useState<NewsItem[] | null>(null);
  const [pending, setPending] = useState(false);
  const [resumeDate, setResumeDate] = useState<ISODate | null>(saved?.date ?? null);
  const pendingTarget = useRef<{ date: ISODate; portfolio: Portfolio } | null>(null);

  useEffect(() => { if (phase === 'world') save({ date, portfolio }); }, [phase, date, portfolio]);

  const travelTo = useCallback((target: ISODate) => {
    const s = loadSaved();
    const resumed = s && s.date === target && resumeDate === target;
    pendingTarget.current = { date: target, portfolio: resumed ? s!.portfolio : freshPortfolio() };
    setTravel({ from: null, to: target, direction: 'back' });
    setPhase('traveling');
  }, [resumeDate]);

  const finishTravel = useCallback(() => {
    const t = pendingTarget.current;
    if (t) {
      clock.current = t.date;
      setDate(t.date);
      setPortfolio(t.portfolio);
      setView({ name: 'home' });
      pendingTarget.current = null;
    }
    setTravel(null);
    setPhase('world');
    window.scrollTo(0, 0);
  }, []);

  const exit = useCallback(() => {
    setResumeDate(date);
    setReveal(null);
    setDigest(null);
    setPhase('portal');
  }, [date]);

  const go = useCallback((v: View) => { setView(v); window.scrollTo(0, 0); }, []);

  const valueAt = useCallback(async (d: ISODate, p: Portfolio = portfolio) => {
    const bench = await provider.getBenchmark(d);
    const lots: LotResult[] = [];
    let total = p.cash;
    for (const lot of p.lots) {
      const q = await provider.getQuote(lot.ticker, d);
      const price = q?.value ?? lot.purchasePrice;
      const value = price * lot.shares;
      total += value;
      let benchReturnPct: number | null = null;
      if (bench) {
        const b0 = await provider.getQuote(bench.symbol, lot.purchaseDate);
        const b1 = await provider.getQuote(bench.symbol, d);
        if (b0 && b1) benchReturnPct = (b1.value / b0.value - 1) * 100;
      }
      lots.push({ lot, price, value, returnPct: (value / lot.costBasis - 1) * 100, benchReturnPct });
    }
    return { total, lots };
  }, [provider, portfolio]);

  const buy = useCallback(async (ticker: string, shares: number) => {
    if (!Number.isFinite(shares) || shares <= 0 || Math.floor(shares) !== shares) return 'Enter a whole number of shares.';
    const q = await provider.getQuote(ticker, date);
    if (!q || q.note) return 'No quotation is available for that security today.';
    const cost = q.value * shares;
    if (cost > portfolio.cash + 1e-6) return `Insufficient cash: the order costs ${cost.toFixed(2)}.`;
    const lot: Lot = { id: `${ticker}-${date}-${Date.now()}`, ticker, company: q.name, purchaseDate: date, purchasePrice: q.value, shares, costBasis: cost };
    setPortfolio((p) => ({
      ...p, cash: p.cash - cost, lots: [...p.lots, lot], startedAt: p.startedAt ?? date,
      activity: [{ date, text: `Bought ${shares} ${ticker} at ${q.value.toFixed(2)}` }, ...p.activity],
    }));
    return null;
  }, [provider, date, portfolio.cash]);

  const sell = useCallback(async (lotId: string, shares: number) => {
    const lot = portfolio.lots.find((l) => l.id === lotId);
    if (!lot) return 'Position not found.';
    if (shares <= 0 || shares > lot.shares) return 'Invalid number of shares.';
    const q = await provider.getQuote(lot.ticker, date);
    if (!q || q.note) return 'This security cannot be traded today.';
    const proceeds = q.value * shares;
    setPortfolio((p) => ({
      ...p, cash: p.cash + proceeds,
      lots: p.lots.flatMap((l) => (l.id !== lotId ? [l] : l.shares - shares > 0 ? [{ ...l, shares: l.shares - shares, costBasis: l.costBasis * (1 - shares / l.shares) }] : [])),
      activity: [{ date, text: `Sold ${shares} ${lot.ticker} at ${q.value.toFixed(2)}` }, ...p.activity],
    }));
    return null;
  }, [provider, date, portfolio.lots]);

  const advanceTo = useCallback(async (target: ISODate) => {
    if (target <= date) return;
    const capped = target > provider.horizon ? provider.horizon : target;
    setPending(true);
    const from = date;
    const before = (await valueAt(from)).total;
    clock.current = capped; // the clock moves first; only then may the future be asked about

    const notes: string[] = [];
    let p: Portfolio = { ...portfolio, lots: portfolio.lots.map((l) => ({ ...l })), activity: [...portfolio.activity] };
    const settled: LotResult[] = [];
    for (const lot of [...p.lots]) {
      const acts = await provider.getCorporateActions(lot.ticker, from, capped);
      // apply splits and cash dividends in the order they happened
      const events = [
        ...acts.splits.map((x) => ({ date: x.date, split: x.ratio, div: 0 })),
        ...(acts.dividends ?? []).map((x) => ({ date: x.date, split: 0, div: x.perShare })),
      ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.split ? -1 : 1));
      let divTotal = 0;
      for (const ev of events) {
        if (ev.split) {
          lot.shares *= ev.split;
          lot.purchasePrice /= ev.split;
          const r = ev.split;
          const label = r >= 1 ? `${Number.isInteger(r) ? r : r.toFixed(3)}-for-1 split` : `1-for-${Math.round(1 / r)} reverse split`;
          notes.push(`${lot.ticker}: ${label} on ${ev.date}`);
          p.activity.unshift({ date: ev.date, text: `${lot.ticker} ${label}` });
        } else {
          const cash = ev.div * lot.shares;
          p.cash += cash;
          divTotal += cash;
        }
      }
      if (divTotal > 0.005) {
        notes.push(`${lot.ticker}: $${divTotal.toFixed(2)} in cash dividends credited`);
        p.activity.unshift({ date: capped, text: `${lot.ticker} dividends credited: $${divTotal.toFixed(2)}` });
      }
      if (acts.end) {
        const value = acts.end.price * lot.shares;
        p.cash += value;
        p.lots = p.lots.filter((l) => l.id !== lot.id);
        settled.push({ lot, price: acts.end.price, value, returnPct: (value / lot.costBasis - 1) * 100, benchReturnPct: null, settled: acts.end.note });
        notes.push(`${lot.ticker}: ${acts.end.note}`);
        p.activity.unshift({ date: acts.end.date, text: `${lot.ticker} position settled at ${acts.end.price.toFixed(2)}` });
      }
    }
    const after = await valueAt(capped, p);
    const events = await provider.getEventsBetween(from, capped);
    const bench = await provider.getBenchmark(capped);
    let benchmarkReturnPct: number | null = null;
    if (bench) {
      const b0 = await provider.getQuote(bench.symbol, from);
      const b1 = await provider.getQuote(bench.symbol, capped);
      if (b0 && b1) benchmarkReturnPct = (b1.value / b0.value - 1) * 100;
    }

    const days = diffDays(from, capped);
    const hasHoldings = portfolio.lots.length > 0;
    setPortfolio(p);
    setDate(capped);
    setView((v) => (v.name === 'search' ? { name: 'home' } : v));
    if (days >= 28 || (hasHoldings && days >= 7)) {
      setReveal({ from, to: capped, events, before, after: after.total, lots: [...after.lots, ...settled], benchmarkName: bench?.name ?? null, benchmarkReturnPct, notes });
    } else {
      const fresh = (await provider.getNews(capped, { windowDays: days + 1 })).filter((n) => n.availableAt > from);
      setDigest(fresh.length ? fresh.slice(0, 5) : null);
    }
    if (eraFor(from).sub !== eraFor(capped).sub) {
      setTravel({ from, to: capped, direction: 'forward' });
      setPhase('traveling');
    }
    setPending(false);
  }, [date, portfolio, provider, valueAt]);

  const value: Sim = {
    provider, world, phase, date, travel, view, portfolio, reveal, digest, pending, resumeDate,
    travelTo, finishTravel, exit, go, advanceTo, buy, sell, valueAt: (d) => valueAt(d),
    closeReveal: () => setReveal(null), closeDigest: () => setDigest(null),
  };
  return <SimContext.Provider value={value}>{children}</SimContext.Provider>;
}

export function useSim() {
  const s = useContext(SimContext);
  if (!s) throw new Error('useSim outside SimulationProvider');
  return s;
}
