/**
 * Wraps any HistoricalDataProvider so that:
 *   1. No request can be made for a date beyond the simulation clock.
 *   2. Every returned item is re-checked with isInformationAvailable.
 * A real API integration gets this protection for free.
 */
import { assertNoLeak, InformationLeakError } from '../core/availability';
import type { ISODate } from '../core/dates';
import type { HistoricalDataProvider } from './provider';

export function createGuardedProvider(inner: HistoricalDataProvider, clock: () => ISODate): HistoricalDataProvider {
  const check = (date: ISODate, what: string) => {
    const now = clock();
    if (date > now) throw new InformationLeakError(`${what} requested for ${date}, but the simulated present is ${now}`);
  };
  const asDated = <T extends { date: ISODate }>(xs: T[]) => xs.map((x) => ({ ...x, availableAt: x.date }));

  return {
    get horizon() { return inner.horizon; },

    async getNews(date, q) { check(date, 'News'); return assertNoLeak(await inner.getNews(date, q), date, 'getNews'); },

    async getMarketSnapshot(date) {
      check(date, 'Market snapshot');
      const s = await inner.getMarketSnapshot(date);
      const ok = <T extends { asOf: ISODate }>(qs: T[]) => qs.filter((q) => q.asOf <= date);
      return { ...s, indexes: ok(s.indexes), commodities: ok(s.commodities), rates: ok(s.rates), international: ok(s.international), digital: ok(s.digital), movers: ok(s.movers) };
    },

    async getQuote(symbol, date) {
      check(date, 'Quote');
      const q = await inner.getQuote(symbol, date);
      return q && q.asOf <= date ? q : null;
    },

    async getStockHistory(symbol, endDate, startDate) {
      check(endDate, 'Price history');
      const pts = await inner.getStockHistory(symbol, endDate, startDate);
      return assertNoLeak(asDated(pts), endDate, 'getStockHistory').map(({ date, value }) => ({ date, value }));
    },

    async getCompanyProfile(ticker, date) {
      check(date, 'Company profile');
      const p = await inner.getCompanyProfile(ticker, date);
      if (!p) return null;
      return {
        ...p,
        products: assertNoLeak(p.products, date, 'profile.products'),
        commentary: assertNoLeak(p.commentary, date, 'profile.commentary'),
        financials: assertNoLeak(p.financials, date, 'profile.financials'),
        leadership: p.leadership.filter((l) => l.from <= date),
        quote: p.quote && p.quote.asOf <= date ? p.quote : null,
      };
    },

    async listCompanies(date) { check(date, 'Company list'); return inner.listCompanies(date); },
    async getSports(date) { check(date, 'Sports'); return assertNoLeak(await inner.getSports(date), date, 'getSports'); },
    async getCulture(date) { check(date, 'Culture'); return assertNoLeak(await inner.getCulture(date), date, 'getCulture'); },
    async getWeather(date) { check(date, 'Weather'); return assertNoLeak(await inner.getWeather(date), date, 'getWeather'); },
    async getAds(date) { check(date, 'Ads'); return assertNoLeak(await inner.getAds(date), date, 'getAds'); },
    async getEconomicData(date) { check(date, 'Economic data'); return assertNoLeak(await inner.getEconomicData(date), date, 'getEconomicData'); },

    async search(query, date) {
      check(date, 'Search');
      return assertNoLeak((await inner.search(query, date)).map((r) => ({ ...r, availableAt: r.date })), date, 'search');
    },

    async getEventsBetween(from, to) { check(to, 'Events'); return assertNoLeak(await inner.getEventsBetween(from, to), to, 'getEventsBetween'); },

    async getCorporateActions(ticker, after, onOrBefore) {
      check(onOrBefore, 'Corporate actions');
      const a = await inner.getCorporateActions(ticker, after, onOrBefore);
      return {
        splits: a.splits.filter((s) => s.date > after && s.date <= onOrBefore),
        dividends: a.dividends?.filter((d) => d.date > after && d.date <= onOrBefore),
        end: a.end && a.end.date <= onOrBefore ? a.end : undefined,
      };
    },

    async getBenchmark(date) { check(date, 'Benchmark'); return inner.getBenchmark(date); },

    async getFrontPages(date) { check(date, 'Front pages'); return assertNoLeak(await inner.getFrontPages(date), date, 'getFrontPages'); },
  };
}
