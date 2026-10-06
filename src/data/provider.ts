/**
 * The data-provider abstraction. The UI only ever talks to a HistoricalDataProvider, and the
 * app only ever hands it a *guarded* provider (see guardedProvider.ts), so swapping the mock
 * for real APIs cannot weaken the information boundary.
 */
import type { ISODate } from '../core/dates';
import type {
  AdItem, CompanyListing, CompanyProfile, CultureItem, EconomicReading, FrontPage, MarketSnapshot, NewsItem,
  PricePoint, Quote, SearchResult, SportsResult, WeatherItem,
} from '../core/types';

/**
 * Sub-provider roles. HistoricalDataProvider is their union, but each can be
 * replaced independently (e.g. a paid market-data vendor) without touching the UI.
 */
export interface MarketDataProvider {
  getMarketSnapshot(date: ISODate): Promise<MarketSnapshot>;
  getQuote(symbol: string, date: ISODate): Promise<Quote | null>;
  getStockHistory(symbol: string, endDate: ISODate, startDate?: ISODate): Promise<PricePoint[]>;
  /** Splits, dividends and delistings effective after `after` and on/before `onOrBefore`. */
  getCorporateActions(ticker: string, after: ISODate, onOrBefore: ISODate): Promise<CorporateActions>;
}
export interface NewsProvider {
  getNews(date: ISODate, q?: NewsQuery): Promise<NewsItem[]>;
  /** Major events that became knowable after `from`, up to and including `to`. */
  getEventsBetween(from: ISODate, to: ISODate): Promise<NewsItem[]>;
}
export interface EconomicDataProvider { getEconomicData(date: ISODate): Promise<EconomicReading[]> }
export interface SportsProvider { getSports(date: ISODate): Promise<(SportsResult | NewsItem)[]> }
export interface WeatherProvider { getWeather(date: ISODate): Promise<WeatherItem[]> }
export interface CultureProvider { getCulture(date: ISODate): Promise<CultureItem[]> }
export interface CompanyProvider { getCompanyProfile(ticker: string, date: ISODate): Promise<CompanyProfile | null>; listCompanies(date: ISODate): Promise<CompanyListing[]> }
/** Scanned newspaper front pages published on the date (archival). */
export interface ArchiveProvider { getFrontPages(date: ISODate): Promise<FrontPage[]> }

export interface CorporateActions {
  splits: { date: ISODate; ratio: number }[];
  /** Cash dividends per share, on the share basis in force on the ex-date. */
  dividends?: { date: ISODate; perShare: number }[];
  end?: { date: ISODate; price: number; note: string };
}

export interface NewsQuery { limit?: number; windowDays?: number }

/**
 * Everything the UI can ask for. It is the union of the sub-provider roles above, plus the few
 * cross-cutting calls (search, ads, benchmark) that draw on several of them.
 */
export interface HistoricalDataProvider
  extends MarketDataProvider, NewsProvider, EconomicDataProvider, SportsProvider, WeatherProvider,
    CultureProvider, CompanyProvider, ArchiveProvider {
  /** The latest date for which the provider has data — the machine cannot travel past it. */
  readonly horizon: ISODate;
  getAds(date: ISODate): Promise<AdItem[]>;
  search(query: string, date: ISODate): Promise<SearchResult[]>;
  /** Benchmark used to judge a portfolio on a given date (S&P 500, or the Dow before 1957). */
  getBenchmark(date: ISODate): Promise<{ symbol: string; name: string } | null>;
}
