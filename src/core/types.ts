import type { ISODate } from './dates';

export type Category =
  | 'finance' | 'markets' | 'world' | 'politics' | 'business' | 'technology'
  | 'science' | 'culture' | 'sports' | 'economy' | 'weather';

/**
 * Every piece of content in the simulation carries this metadata.
 *
 *  - eventDate:   when the thing happened
 *  - publishedAt: when it was first reported / released
 *  - availableAt: the first simulated day on which a reader could know it.
 *                 This is the ONLY field the information boundary checks.
 */
/**
 * Where a piece of information came from:
 *  REAL      – measured data from an authoritative source (prices, official statistics, scores, weather obs.)
 *  ARCHIVAL  – text/images from archives (Wikipedia chronologies, Library of Congress newspapers, charts)
 *  DERIVED   – computed or editorially summarised from real facts (curated summaries, estimated release dates)
 *  MOCK      – synthetic placeholder; always marked in the UI (†)
 */
export type Provenance = 'REAL' | 'ARCHIVAL' | 'DERIVED' | 'MOCK';

export interface Sourced {
  provenance?: Provenance;
  /** Publication or dataset name, e.g. "Chicago Daily Tribune" or "FRED: UNRATE". */
  publication?: string;
  sourceUrl?: string;
  /** When this app's data build retrieved it (for transparency). */
  retrievedAt?: string;
}

export interface HistoricalItem extends Sourced {
  id: string;
  title: string;
  category: Category;
  eventDate: ISODate;
  publishedAt: ISODate;
  availableAt: ISODate;
  source: string;
  historicalEra?: string;
}

export interface NewsItem extends HistoricalItem {
  summary?: string;
  /** 3 = front-page banner, 2 = significant, 1 = minor */
  importance: 1 | 2 | 3;
  /** Shown on "What happened?" timelines */
  major?: boolean;
  tickers?: string[];
  dateline?: string;
  /** A sombre day: environmental ads are suppressed. */
  solemn?: boolean;
  /** Set by the provider when this item must lead the page (e.g. the market on a crash day). */
  lead?: boolean;
}

export interface CultureItem extends HistoricalItem {
  kind: 'film' | 'music' | 'book' | 'tv' | 'theatre' | 'game' | 'art' | 'radio';
  line: string;
}

export interface WeatherItem extends HistoricalItem {
  city: string;
  high: number | null; // °F
  low?: number | null;
  sky: string;
  precip?: number | null; // inches
  snow?: number | null;   // inches
}

export interface FrontPage extends HistoricalItem {
  publicationTitle: string;
  place: string;
  imageUrl: string;
  imageLargeUrl?: string;
  pageUrl: string;
}

export interface SportsResult extends HistoricalItem {
  league: string;
  away: string;
  awayScore: number;
  home: string;
  homeScore: number;
  note?: string;
}

export interface AdItem {
  id: string;
  eraFrom: ISODate;
  eraTo: ISODate;
  /** The product category must exist by this date (fictional brand). */
  availableAt: ISODate;
  brand: string;
  headline: string;
  body: string;
  cta?: string;
}

export interface Quote extends Sourced {
  id: string;
  /** Ticker as printed on the simulated date (may differ from id). */
  symbol?: string;
  name: string;
  /** The date of the quotation actually used (last trading day <= requested). */
  asOf: ISODate;
  value: number;
  prev: number | null;
  change: number | null;
  changePct: number | null;
  unit?: string;
  decimals: number;
  kind: InstrumentKind;
  note?: string;
}

export type InstrumentKind = 'index' | 'stock' | 'commodity' | 'rate' | 'fx' | 'crypto' | 'volatility';

export interface PricePoint { date: ISODate; value: number; }

export interface MarketSnapshot {
  date: ISODate;
  closedReason: string | null;
  sessionDate: ISODate | null;
  indexes: Quote[];
  commodities: Quote[];
  rates: Quote[];
  international: Quote[];
  digital: Quote[];
  movers: Quote[];
}

export interface EconomicReading extends HistoricalItem {
  seriesId: string;
  label: string;
  period: string; // human label of the reference period ("Aug 2008", "Q2 2008")
  value: number;
  unit: string;
  prior?: number;
}

export interface Leader { name: string; title: string; from: ISODate; to?: ISODate }
export interface Product { name: string; availableAt: ISODate; note?: string }
export interface AnnualFinancials {
  fiscalYear: number;
  availableAt: ISODate; // annual report / 10-K date
  revenue: number;      // $ millions
  netIncome: number;    // $ millions
  employees?: number;
}

export interface CompanyProfile {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  headquarters: string;
  description: string;
  leadership: Leader[];
  products: Product[];
  competitors: string[];
  commentary: NewsItem[];
  financials: AnnualFinancials[];
  marketCap: number | null; // $
  quote: Quote | null;
  listedSince: ISODate;
  status: 'listed' | 'not-yet-listed' | 'delisted';
  statusNote?: string;
}

export interface CompanyListing {
  ticker: string;      // internal id used for routing
  symbol?: string;     // ticker as printed on that date
  name: string;
  sector: string;
}

/** Point-in-time identity of a security. */
export interface SecurityMeta {
  id: string;
  kind: InstrumentKind;
  names: [ISODate, string][];
  tickers: [ISODate, string][];
  exchange: [ISODate, string][];
  sector: string | null;
  ipoDate: ISODate;        // first trading day on file
  delistingDate: ISODate | null;
  splits: [ISODate, number][];
  source: string;
}

export interface SearchResult extends Sourced {
  id: string;
  kind: 'company' | 'news' | 'event' | 'sports' | 'culture' | 'economic';
  title: string;
  snippet: string;
  date: ISODate;
  source: string;
  ticker?: string;
  score: number;
}
