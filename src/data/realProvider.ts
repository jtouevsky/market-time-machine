/**
 * The composite provider used by the app: REAL sources first, the curated/mock set only where no
 * real data exists (and then explicitly labelled). Every method still returns plain items with
 * availableAt metadata; the guarded wrapper re-checks all of it.
 */
import { addDays, isTradingDay, marketClosureReason, type ISODate } from '../core/dates';
import type { CompanyListing, CompanyProfile, MarketSnapshot, NewsItem, Quote, SearchResult } from '../core/types';
import { createMockProvider, DATA_HORIZON } from './mockProvider';
import type { HistoricalDataProvider } from './provider';
import { observe, nameAt as mockNameAt, type SeriesDef } from './priceEngine';
import { COMMODITIES, DIGITAL, DJIA, INTERNATIONAL, RATES } from './mock/instruments';
import { STOCK_BY_ID } from './mock/stocks';
import { COMPANY_BY_TICKER } from './mock/companies';
import { NEWS } from './mock/news';
import { at, dataHorizon, isListed, nameAt, realDividends, realHistory, realMovers, realQuote, realSplits, securities, tickerAt } from './real/markets';
import { NBER_ANNOUNCEMENTS, realEconomicData, realSeriesQuote } from './real/macro';
import { realCulture, realEventsBetween, realFrontPages, realNews, realSports, realWeather, searchRealNews } from './real/archives';
import { withTimeout } from './real/loader';

/** Old curated ids → real universe ids. */
const ALIAS: Record<string, string> = { GOOG: 'GOOGL' };
const PROFILE_FOR: Record<string, string> = { GOOGL: 'GOOG' };

function lastSession(date: ISODate) {
  let d = date;
  for (let i = 0; i < 400 && !isTradingDay(d); i++) d = addDays(d, -1);
  return d;
}

function mockQuote(def: SeriesDef, date: ISODate, provenance: Quote['provenance'] = 'MOCK'): Quote | null {
  const o = observe(def, date);
  if (!o || o.stale || o.ended) return null;
  const change = o.prev !== null ? o.value - o.prev : null;
  return {
    id: def.id, name: mockNameAt(def, date), asOf: o.date, value: o.value, prev: o.prev, change,
    changePct: change !== null && o.prev ? (change / o.prev) * 100 : null, unit: def.unit, decimals: def.decimals ?? 2, kind: def.kind,
    provenance, publication: provenance === 'MOCK' ? 'Estimate (no daily record on file)' : 'Published historical value',
  };
}

/** A curated Dow close exists for this exact session (crash days, peaks…): show it as a published figure. */
function anchoredDow(date: ISODate): Quote | null {
  const s = lastSession(date);
  const idx = DJIA.anchors.findIndex(([d]) => d === s);
  if (idx < 0) return null;
  const q = mockQuote(DJIA, s, 'DERIVED');
  if (!q) return null;
  const prevAnchor = DJIA.anchors[idx - 1];
  if (prevAnchor && lastSession(addDays(s, -1)) === prevAnchor[0]) {
    q.prev = prevAnchor[1]; q.change = q.value - q.prev; q.changePct = (q.change / q.prev) * 100;
  } else { q.prev = null; q.change = null; q.changePct = null; }
  q.publication = 'Published Dow close (curated)';
  return q;
}

const pick = (defs: SeriesDef[], id: string) => defs.find((d) => d.id === id)!;

export function createRealProvider(): HistoricalDataProvider {
  const mock = createMockProvider();
  let horizon: ISODate = DATA_HORIZON;
  dataHorizon().then((h) => { if (h) horizon = h; }).catch(() => {});

  const quote = async (id: string, date: ISODate): Promise<Quote | null> => {
    const real = (await realQuote(ALIAS[id] ?? id, date)) ?? (await realSeriesQuote(id, date));
    if (real) return real;
    const m = await mock.getQuote(id, date);
    return m ? { ...m, provenance: 'MOCK' } : null;
  };

  const p: HistoricalDataProvider = {
    get horizon() { return horizon; },

    async getNews(date, q = {}) {
      const limit = q.limit ?? 40;
      const [real, curated] = await Promise.all([
        withTimeout(realNews(date), 6000, [] as NewsItem[]),
        mock.getNews(date, { limit: 30, windowDays: q.windowDays ?? 30 }),
      ]);
      const nber: NewsItem[] = NBER_ANNOUNCEMENTS.filter((a) => a.availableAt <= date && a.availableAt >= addDays(date, -45)).map((a) => ({
        id: `nber-${a.availableAt}`, title: a.text, category: 'economy', importance: 2, eventDate: a.availableAt, publishedAt: a.availableAt, availableAt: a.availableAt,
        source: 'NBER Business Cycle Dating Committee', publication: 'NBER', sourceUrl: 'https://www.nber.org/research/business-cycle-dating', provenance: 'ARCHIVAL',
      }));
      const oldest = real.length ? real[real.length - 1].availableAt : addDays(date, -30);
      const cur = curated.filter((c) => c.availableAt >= oldest);
      const all = [...cur, ...nber, ...real];
      // exact-day first, then newest first; curated summaries win ties (they read like headlines)
      all.sort((a, b) => (a.availableAt === b.availableAt ? b.importance - a.importance : a.availableAt < b.availableAt ? 1 : -1));
      // On a violent market day the market IS the story: lead with that day's finance item.
      const spx = await withTimeout(realQuote('^GSPC', date), 3000, null);
      if (spx && spx.asOf === date && Math.abs(spx.changePct ?? 0) >= 3) {
        const i = all.findIndex((n) => n.availableAt === date && (n.category === 'finance' || n.category === 'economy'));
        if (i >= 0) { const [it] = all.splice(i, 1); all.unshift({ ...it, lead: true }); }
      }
      return all.slice(0, limit);
    },

    async getMarketSnapshot(date): Promise<MarketSnapshot> {
      const closedReason = marketClosureReason(date);
      const sessionDate = lastSession(date);
      const many = async (ids: string[]) => (await Promise.all(ids.map((id) => realQuote(id, date).then((r) => r ?? realSeriesQuote(id, date))))).filter((x): x is Quote => !!x);

      // indexes
      const indexes: Quote[] = [];
      const spx = await realQuote('^GSPC', date);
      const dji = await realQuote('^DJI', date);
      if (dji) indexes.push(dji);
      else {
        const anchored = anchoredDow(date);
        const monthly = date < '1969-01-01' ? await realSeriesQuote('M1109BUSM293NNBR', date) : null;
        if (anchored) indexes.push(anchored);
        else if (!spx && monthly) indexes.push(monthly);
        else if (!spx) { const m = mockQuote(DJIA, date); if (m) indexes.push(m); }
      }
      if (spx) indexes.push(spx);
      indexes.push(...(await many(['^IXIC', '^RUT', '^VIX'])));

      // commodities
      const commodities: Quote[] = await many(['GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F']);
      if (!commodities.some((c) => c.id === 'CL=F')) {
        const oil = (await realSeriesQuote('DCOILWTICO', date)) ?? (await realSeriesQuote('WTISPLC', date));
        if (oil) commodities.push(oil);
      }
      if (!commodities.some((c) => c.id === 'GC=F') && date < '1968-03-15') {
        const g = mockQuote(pick(COMMODITIES, 'GOLD'), date, 'ARCHIVAL');
        if (g && date >= '1879-01-02') commodities.unshift({ ...g, change: null, changePct: null, publication: 'Statutory U.S. gold price' });
        const prem = mockQuote(pick(COMMODITIES, 'GOLDPREM'), date);
        if (prem) commodities.unshift(prem);
      }
      if (date < '1960-01-01') for (const id of ['WHEAT', 'COTTON']) { const m = mockQuote(pick(COMMODITIES, id), date); if (m) commodities.push(m); }

      // rates
      const rates: Quote[] = await many(['DFF', 'DTB3', 'DGS10']);
      if (!rates.some((r) => r.id === 'DTB3')) { const t = await realSeriesQuote('TB3MS', date); if (t) rates.push(t); }
      if (!rates.some((r) => r.id === 'DGS10')) { const t = await realSeriesQuote('GS10', date); if (t) rates.push(t); }
      for (const id of ['M13001USM156NNBR', 'M13002US35620M156NNBR']) { const t = await realSeriesQuote(id, date); if (t) rates.push(t); }
      if (date >= '1914-11-16' && date < '1960-12-31' && !rates.some((r) => r.id === 'DFF')) {
        const d = mockQuote(pick(RATES, 'DISC'), date, 'DERIVED');
        if (d) rates.push({ ...d, publication: 'Federal Reserve Bank of New York discount rate (published schedule)' });
      }

      // international
      const international: Quote[] = await many(['^FTSE', '^N225', '^GDAXI', '^HSI', '^FCHI', 'DEXUSUK', 'DEXJPUS', 'DEXUSEU']);
      if (!international.some((x) => x.id === 'DEXUSUK')) {
        const st = mockQuote(pick(INTERNATIONAL, 'GBPUSD'), date, date < '1972-06-23' ? 'DERIVED' : 'MOCK');
        if (st) international.push({ ...st, publication: 'Official sterling parity / estimate' });
      }
      if (date < '1940-01-01') { const c = mockQuote(pick(INTERNATIONAL, 'CONSOLS'), date); if (c) international.push(c); }

      // digital
      const digital: Quote[] = await many(['BTC-USD', 'ETH-USD']);
      if (!digital.length && date >= '2010-07-18') { const b = mockQuote(pick(DIGITAL, 'BTC'), date); if (b) digital.push(b); }

      // movers
      let movers = await realMovers(date);
      if (!movers.length) movers = (await mock.getMarketSnapshot(date)).movers.map((m) => ({ ...m, provenance: 'MOCK' as const }));

      return { date, closedReason, sessionDate, indexes, commodities, rates, international, digital, movers };
    },

    getQuote: (symbol, date) => quote(symbol, date),

    async getStockHistory(symbol, endDate, startDate) {
      const real = await realHistory(ALIAS[symbol] ?? symbol, endDate, startDate);
      if (real && real.length) return real;
      return mock.getStockHistory(symbol, endDate, startDate);
    },

    async listCompanies(date) {
      const m = await securities();
      const out: CompanyListing[] = [];
      for (const s of m?.values() ?? []) {
        if (s.kind !== 'stock' || !isListed(s, date)) continue;
        out.push({ ticker: s.id, symbol: tickerAt(s, date), name: nameAt(s, date), sector: s.sector ?? '' });
      }
      for (const c of await mock.listCompanies(date)) {
        const real = m?.get(ALIAS[c.ticker] ?? c.ticker);
        if (real && isListed(real, date)) continue;
        if (real && real.first <= date) continue;
        if (!out.some((o) => o.ticker === c.ticker)) out.push({ ...c, symbol: c.ticker });
      }
      return out.sort((a, b) => a.name.localeCompare(b.name));
    },

    async getCompanyProfile(ticker, date): Promise<CompanyProfile | null> {
      const id = ALIAS[ticker] ?? ticker;
      const m = await securities();
      const s = m?.get(id);
      const curated = await mock.getCompanyProfile(PROFILE_FOR[id] ?? id, date);
      if (s && isListed(s, date)) {
        const q = await realQuote(id, date);
        const rec = COMPANY_BY_TICKER[PROFILE_FOR[id] ?? id];
        const shares = rec ? at(rec.shares, date) : undefined;
        const name = nameAt(s, date);
        const words = name.split(/[\s,.]+/).filter((w) => w.length > 2 && !/^(Inc|Corp|Corporation|Company|Group|The|and|Holdings)$/i.test(w));
        const mentions = words.length ? await searchRealNews([words[0].toLowerCase()], date) : [];
        const base: CompanyProfile = curated ?? {
          ticker: id, name, exchange: at(s.exchange, date) ?? '', sector: s.sector ?? '', headquarters: '',
          description: `${name} — ${s.sector ?? 'listed company'}. Shares trade on the ${at(s.exchange, date) ?? 'exchange'} under the symbol ${tickerAt(s, date)}; quotations on file from ${s.first}.`,
          leadership: [], products: [], competitors: [], commentary: [], financials: [], marketCap: null, quote: null, listedSince: s.first, status: 'listed',
        };
        return {
          ...base, ticker: id, name, exchange: at(s.exchange, date) ?? base.exchange, quote: q, listedSince: s.first, status: 'listed',
          marketCap: q && shares ? q.value * shares * 1e6 : null,
          commentary: [...base.commentary, ...mentions].sort((a, b) => (a.availableAt < b.availableAt ? 1 : -1)).slice(0, 10),
          statusNote: undefined,
        };
      }
      if (s && s.first > date && !curated) return null; // does not exist yet — nothing about it is known
      if (curated) return { ...curated, quote: curated.quote ? { ...curated.quote, provenance: 'MOCK' } : null };
      return null;
    },

    async getSports(date) {
      const real = await withTimeout(realSports(date), 5000, []);
      if (real.length) return real;
      return mock.getSports(date);
    },

    async getCulture(date) {
      const [real, curated] = await Promise.all([withTimeout(realCulture(date), 5000, []), mock.getCulture(date)]);
      return [...real, ...curated].slice(0, 6);
    },

    async getWeather(date) {
      // Observed only. If NOAA is unreachable we show nothing rather than invent a forecast.
      return withTimeout(realWeather(date), 9000, []).catch(() => []);
    },

    getAds: (date) => mock.getAds(date),

    async getEconomicData(date) {
      return withTimeout(realEconomicData(date), 6000, []);
    },

    async search(query, date) {
      const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
      if (!terms.length) return [];
      const out: SearchResult[] = [];
      for (const c of await p.listCompanies(date)) {
        const sym = (c.symbol ?? c.ticker).toLowerCase();
        const hay = `${c.name} ${sym}`.toLowerCase();
        const s = (terms.includes(sym) ? 8 : 0) + terms.filter((t) => hay.includes(t)).length * 4;
        if (s > 0) out.push({ id: `co-${c.ticker}`, kind: 'company', title: `${c.name} (${c.symbol ?? c.ticker})`, snippet: c.sector, date, source: 'Security listing', ticker: c.ticker, score: s + 10, provenance: 'REAL' });
      }
      for (const n of await searchRealNews(terms, date)) out.push({ id: n.id, kind: n.category === 'sports' ? 'sports' : 'news', title: n.title, snippet: n.summary ?? '', date: n.availableAt, source: n.source, score: 3, provenance: n.provenance, sourceUrl: n.sourceUrl });
      for (const r of await mock.search(query, date)) if (r.kind !== 'company') out.push({ ...r, provenance: 'DERIVED' });
      return out.sort((a, b) => b.score - a.score || (a.date < b.date ? 1 : -1)).slice(0, 40);
    },

    async getEventsBetween(from, to) {
      const [real, curated] = await Promise.all([realEventsBetween(from, to), mock.getEventsBetween(from, to)]);
      const seen = new Set(curated.map((c) => c.availableAt));
      const merged = [...curated, ...real.filter((r) => !(seen.has(r.availableAt) && r.category === 'finance'))];
      return merged.sort((a, b) => (a.availableAt < b.availableAt ? -1 : 1));
    },

    async getCorporateActions(ticker, after, onOrBefore) {
      const id = ALIAS[ticker] ?? ticker;
      const m = await securities();
      if (m?.has(id) && m.get(id)!.first <= after) {
        return { splits: await realSplits(id, after, onOrBefore), dividends: await realDividends(id, after, onOrBefore) };
      }
      return mock.getCorporateActions(ticker, after, onOrBefore);
    },

    async getBenchmark(date) {
      const spx = await realQuote('^GSPC', date);
      if (spx) return { symbol: '^GSPC', name: spx.name };
      return mock.getBenchmark(date);
    },

    async getFrontPages(date) {
      return withTimeout(realFrontPages(date), 9000, []).catch(() => []);
    },
  };
  void STOCK_BY_ID; void NEWS;
  return p;
}
