/**
 * Mock implementation of HistoricalDataProvider backed by the files in ./mock.
 * Every method takes the simulated date and filters through isInformationAvailable;
 * the guarded wrapper re-checks everything on the way out.
 */
import { filterAvailable, isInformationAvailable, newlyAvailable } from '../core/availability';
import { addDays, isTradingDay, marketClosureReason, type ISODate } from '../core/dates';
import type {
  CompanyProfile, MarketSnapshot, Quote, SearchResult,
} from '../core/types';
import type { HistoricalDataProvider } from './provider';
import { history, nameAt, observe, splitsBetween, type SeriesDef } from './priceEngine';
import { COMMODITIES, DIGITAL, INDEXES, INTERNATIONAL, RATES, DJIA, SPX } from './mock/instruments';
import { STOCKS, STOCK_BY_ID } from './mock/stocks';
import { COMPANY_BY_TICKER, COMPANIES } from './mock/companies';
import { NEWS } from './mock/news';
import { ADS, CULTURE, WEATHER } from './mock/environment';
import { ECONOMIC_READINGS } from './mock/economics';

export const DATA_HORIZON: ISODate = '2025-12-31';

const ALL_SERIES: Record<string, SeriesDef> = Object.fromEntries(
  [...INDEXES, ...COMMODITIES, ...RATES, ...INTERNATIONAL, ...DIGITAL, ...STOCKS].map((s) => [s.id, s]),
);

function lastSession(date: ISODate): ISODate {
  let d = date;
  for (let i = 0; i < 400 && !isTradingDay(d); i++) d = addDays(d, -1);
  return d;
}

function toQuote(def: SeriesDef, date: ISODate, includeStale = false): Quote | null {
  const o = observe(def, date);
  if (!o || (o.stale && !includeStale)) return null;
  const change = o.prev !== null ? o.value - o.prev : null;
  return {
    id: def.id, name: nameAt(def, date), asOf: o.date, value: o.value, prev: o.prev,
    change, changePct: change !== null && o.prev ? (change / o.prev) * 100 : null,
    unit: def.unit, decimals: def.decimals ?? 2, kind: def.kind,
    note: o.ended ? o.ended.note : o.stale ? 'No later quotation on file' : undefined,
    provenance: 'MOCK', publication: 'Synthetic series anchored to published closes',
  };
}

function quotesFor(defs: SeriesDef[], date: ISODate) {
  return defs.map((d) => toQuote(d, date)).filter((q): q is Quote => !!q && !q.note);
}

function latestByDate<T>(entries: [ISODate, T][], date: ISODate): T | undefined {
  let out: T | undefined;
  for (const [d, v] of entries) if (d <= date) out = v;
  return out;
}

const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'for', 'to', 'is', 'inc', 'corp', 'co']);
function terms(q: string) {
  return q.toLowerCase().replace(/[^a-z0-9&.\s-]/g, ' ').split(/\s+/).filter((t) => t && !STOP.has(t));
}

function score(text: string, ts: string[]) {
  const lower = text.toLowerCase();
  return ts.reduce((s, t) => s + (lower.includes(t) ? 1 : 0), 0);
}

export function createMockProvider(): HistoricalDataProvider {
  const p: HistoricalDataProvider = {
    horizon: DATA_HORIZON,

    async getNews(date, q = {}) {
      const limit = q.limit ?? 24;
      const windowStart = addDays(date, -(q.windowDays ?? 45));
      const available = filterAvailable(NEWS, date).filter((n) => n.category !== 'sports');
      const recent = available.filter((n) => n.availableAt >= windowStart);
      const pool = recent.length >= 6 ? recent : available.slice().sort((a, b) => (a.availableAt < b.availableAt ? 1 : -1)).slice(0, limit);
      return pool
        .slice()
        .sort((a, b) => {
          const ad = a.availableAt === date ? 1 : 0;
          const bd = b.availableAt === date ? 1 : 0;
          if (ad !== bd) return bd - ad;
          if (a.availableAt !== b.availableAt) return a.availableAt < b.availableAt ? 1 : -1;
          return b.importance - a.importance;
        })
        .slice(0, limit);
    },

    async getMarketSnapshot(date): Promise<MarketSnapshot> {
      const closedReason = marketClosureReason(date);
      const sessionDate = lastSession(date);
      const stocks = STOCKS.map((s) => toQuote(s, date)).filter((q): q is Quote => !!q && !q.note);
      const movers = stocks
        .filter((q) => q.asOf === sessionDate && q.changePct !== null)
        .sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!))
        .slice(0, 6);
      return {
        date, closedReason, sessionDate,
        indexes: quotesFor(INDEXES, date),
        commodities: quotesFor(COMMODITIES, date),
        rates: quotesFor(RATES, date),
        international: quotesFor(INTERNATIONAL, date),
        digital: quotesFor(DIGITAL, date),
        movers,
      };
    },

    async getQuote(symbol, date) {
      const def = ALL_SERIES[symbol];
      return def ? toQuote(def, date, true) : null;
    },

    async getStockHistory(symbol, endDate, startDate) {
      const def = ALL_SERIES[symbol];
      return def ? history(def, endDate, startDate) : [];
    },

    async listCompanies(date) {
      return STOCKS.filter((s) => { const q = toQuote(s, date); return q && !q.note; })
        .map((s) => ({ ticker: s.id, name: nameAt(s, date), sector: COMPANY_BY_TICKER[s.id]?.sector ?? '' }));
    },

    async getCompanyProfile(ticker, date): Promise<CompanyProfile | null> {
      const rec = COMPANY_BY_TICKER[ticker];
      const def = STOCK_BY_ID[ticker];
      if (!rec || !def) return null;
      const description = latestByDate(rec.descriptions, date);
      if (!description) return null; // the company is not yet known to the public
      const quote = toQuote(def, date, true);
      const shares = latestByDate(rec.shares, date);
      const ended = def.end && def.end.date <= date;
      const firstQuote = def.anchors[0][0];
      return {
        ticker, name: nameAt(def, date), exchange: latestByDate(rec.exchange, date) ?? '', sector: rec.sector,
        headquarters: rec.headquarters, description,
        leadership: rec.leaders.filter((l) => l.from <= date && (!l.to || l.to > date)),
        products: rec.products.filter((pr) => isInformationAvailable(pr, date)).sort((a, b) => (a.availableAt < b.availableAt ? 1 : -1)),
        competitors: latestByDate(rec.competitors, date) ?? [],
        commentary: filterAvailable(NEWS, date).filter((n) => n.tickers?.includes(ticker)).sort((a, b) => (a.availableAt < b.availableAt ? 1 : -1)).slice(0, 8),
        financials: filterAvailable(rec.financials, date).sort((a, b) => b.fiscalYear - a.fiscalYear),
        marketCap: quote && shares && !ended ? quote.value * shares * 1e6 : null,
        quote,
        listedSince: firstQuote,
        status: ended ? 'delisted' : date < firstQuote ? 'not-yet-listed' : 'listed',
        statusNote: ended ? def.end!.note : quote?.note,
      };
    },

    async getSports(date) {
      const from = addDays(date, -120);
      return filterAvailable(NEWS, date)
        .filter((n) => n.category === 'sports' && n.availableAt >= from)
        .sort((a, b) => (a.availableAt < b.availableAt ? 1 : -1))
        .slice(0, 5);
    },

    async getCulture(date) {
      const from = addDays(date, -240);
      return filterAvailable(CULTURE, date)
        .filter((c) => c.availableAt >= from)
        .sort((a, b) => (a.availableAt < b.availableAt ? 1 : -1))
        .slice(0, 6);
    },

    async getWeather(date) {
      return filterAvailable(WEATHER, date).filter((w) => w.eventDate === date);
    },

    async getAds(date) {
      const solemn = NEWS.some((n) => n.solemn && n.availableAt <= date && n.availableAt >= addDays(date, -2));
      if (solemn) return [];
      return filterAvailable(ADS, date).filter((a) => a.eraFrom <= date && a.eraTo >= date);
    },

    async getEconomicData(date) {
      const latest = new Map<string, (typeof ECONOMIC_READINGS)[number]>();
      for (const r of filterAvailable(ECONOMIC_READINGS, date)) {
        const cur = latest.get(r.seriesId);
        if (!cur || r.availableAt >= cur.availableAt) latest.set(r.seriesId, r);
      }
      return [...latest.values()];
    },

    async search(query, date) {
      const ts = terms(query);
      if (!ts.length) return [];
      const results: SearchResult[] = [];
      for (const rec of COMPANIES) {
        const prof = await p.getCompanyProfile(rec.ticker, date);
        if (!prof) continue;
        const s = (ts.includes(rec.ticker.toLowerCase()) ? 6 : 0) + score(prof.name, ts) * 4 + score(prof.description, ts);
        if (s > 0) results.push({ id: `co-${rec.ticker}`, kind: 'company', title: `${prof.name} (${rec.ticker})`, snippet: prof.description, date, source: prof.exchange, ticker: rec.ticker, score: s + 10 });
      }
      for (const n of filterAvailable(NEWS, date)) {
        const s = score(n.title, ts) * 3 + score(n.summary ?? '', ts) + (n.tickers?.some((t) => ts.includes(t.toLowerCase())) ? 3 : 0);
        if (s > 0) results.push({ id: n.id, kind: n.category === 'sports' ? 'sports' : 'news', title: n.title, snippet: n.summary ?? '', date: n.availableAt, source: n.source, ticker: n.tickers?.[0], score: s + n.importance * 0.5 });
      }
      for (const c of filterAvailable(CULTURE, date)) {
        const s = score(c.line, ts) * 2;
        if (s > 0) results.push({ id: c.id, kind: 'culture', title: c.line, snippet: `${c.kind[0].toUpperCase()}${c.kind.slice(1)}`, date: c.availableAt, source: c.source, score: s });
      }
      for (const r of await p.getEconomicData(date)) {
        const s = score(r.label, ts) * 2;
        if (s > 0) results.push({ id: r.id, kind: 'economic', title: r.title, snippet: `Published ${r.publishedAt} by ${r.source}`, date: r.availableAt, source: r.source, score: s });
      }
      return results.sort((a, b) => b.score - a.score || (a.date < b.date ? 1 : -1)).slice(0, 30);
    },

    async getEventsBetween(from, to) {
      return newlyAvailable(NEWS, from, to)
        .filter((n) => n.major || n.importance === 3)
        .sort((a, b) => (a.availableAt < b.availableAt ? -1 : 1));
    },

    async getCorporateActions(ticker, after, onOrBefore) {
      const def = STOCK_BY_ID[ticker];
      if (!def) return { splits: [] };
      return {
        splits: splitsBetween(def, after, onOrBefore).map(([date, ratio]) => ({ date, ratio })),
        end: def.end && def.end.date > after && def.end.date <= onOrBefore ? def.end : undefined,
      };
    },

    async getFrontPages() { return []; },

    async getBenchmark(date) {
      if (observe(SPX, date)) return { symbol: 'SPX', name: nameAt(SPX, date) };
      if (observe(DJIA, date)) return { symbol: 'DJIA', name: nameAt(DJIA, date) };
      return null;
    },
  };
  return p;
}
