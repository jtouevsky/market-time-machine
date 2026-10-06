/**
 * HistoricalContextAggregator
 * ---------------------------
 * Assembles "the world on a given day" from independent modules. Each module:
 *   - calls ONE provider method (through the guarded provider — the single information gate),
 *   - has its own timeout and failure handling, so a dead API blanks one box, not the page,
 *   - is cached per date (repeat visits are instant) and de-duplicated while in flight.
 */
import type { ISODate } from '../core/dates';
import type { AdItem, CultureItem, EconomicReading, FrontPage, MarketSnapshot, NewsItem, SportsResult, WeatherItem } from '../core/types';
import type { HistoricalDataProvider } from './provider';

export interface WorldModules {
  markets: MarketSnapshot;
  news: NewsItem[];
  economy: EconomicReading[];
  sports: (SportsResult | NewsItem)[];
  culture: CultureItem[];
  weather: WeatherItem[];
  ads: AdItem[];
  frontPages: FrontPage[];
}
export type ModuleName = keyof WorldModules;
export type ModuleStatus = 'loading' | 'ready' | 'error';

export const emptySnapshot = (date: ISODate): MarketSnapshot => ({
  date, closedReason: null, sessionDate: null, indexes: [], commodities: [], rates: [], international: [], digital: [], movers: [],
});

export const EMPTY: (date: ISODate) => WorldModules = (date) => ({
  markets: emptySnapshot(date), news: [], economy: [], sports: [], culture: [], weather: [], ads: [], frontPages: [],
});

const TIMEOUTS: Record<ModuleName, number> = { markets: 8000, news: 8000, economy: 8000, sports: 6000, culture: 6000, weather: 10000, ads: 2000, frontPages: 10000 };

export class HistoricalContextAggregator {
  private cache = new Map<string, Promise<unknown>>();
  private order: string[] = [];
  constructor(private provider: HistoricalDataProvider, private maxDates = 12) {}

  private call<K extends ModuleName>(name: K, date: ISODate): Promise<WorldModules[K]> {
    const p = this.provider;
    switch (name) {
      case 'markets': return p.getMarketSnapshot(date) as Promise<WorldModules[K]>;
      case 'news': return p.getNews(date) as Promise<WorldModules[K]>;
      case 'economy': return p.getEconomicData(date) as Promise<WorldModules[K]>;
      case 'sports': return p.getSports(date) as Promise<WorldModules[K]>;
      case 'culture': return p.getCulture(date) as Promise<WorldModules[K]>;
      case 'weather': return p.getWeather(date) as Promise<WorldModules[K]>;
      case 'ads': return p.getAds(date) as Promise<WorldModules[K]>;
      default: return p.getFrontPages(date) as Promise<WorldModules[K]>;
    }
  }

  module<K extends ModuleName>(name: K, date: ISODate): Promise<WorldModules[K]> {
    const key = `${name}:${date}`;
    const hit = this.cache.get(key);
    if (hit) return hit as Promise<WorldModules[K]>;
    const p = new Promise<WorldModules[K]>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`${name} timed out`)), TIMEOUTS[name]);
      this.call(name, date).then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
    p.catch(() => this.cache.delete(key)); // failures are retried on the next visit
    this.cache.set(key, p);
    if (!this.order.includes(date)) {
      this.order.push(date);
      while (this.order.length > this.maxDates) {
        const old = this.order.shift()!;
        for (const k of [...this.cache.keys()]) if (k.endsWith(`:${old}`)) this.cache.delete(k);
      }
    }
    return p;
  }

  /** Convenience: the full picture, sliced the way front pages want it. */
  async snapshot(date: ISODate) {
    const names = Object.keys(TIMEOUTS) as ModuleName[];
    const settled = await Promise.allSettled(names.map((n) => this.module(n, date)));
    const w = EMPTY(date) as unknown as Record<string, unknown>;
    settled.forEach((r, i) => { if (r.status === 'fulfilled') w[names[i]] = r.value; });
    const m = w as unknown as WorldModules;
    const byCat = (cats: string[]) => m.news.filter((n) => cats.includes(n.category));
    return {
      markets: m.markets, topStories: m.news.slice(0, 8), worldNews: byCat(['world', 'politics']), businessNews: byCat(['business', 'finance', 'economy']),
      technologyNews: byCat(['technology', 'science']), economicData: m.economy, sports: m.sports, culture: m.culture, weather: m.weather,
      notableEvents: m.news.filter((n) => n.major), frontPages: m.frontPages, ads: m.ads,
    };
  }
}
