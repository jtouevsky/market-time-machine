/**
 * ERA THEMES
 * ----------
 * Every visual and verbal decision that changes with time lives here as data. Components
 * read the active theme; nothing else branches on the year.
 */
import { MONTHS, WEEKDAYS, parts, type ISODate } from '../core/dates';
import type { Archetype, ChartStyle, ModuleStyle, TickerStyle, VisualExperience, VisualFamily } from './registry/types';

/** The page archetype ("layout kind"). Defined in the registry; re-exported here for existing imports. */
export type LayoutKind = Archetype;
export type { ModuleStyle, TickerStyle, ChartStyle };

export interface EraLabels {
  topStories: string; markets: string; indexes: string; commodities: string; rates: string; international: string; digital: string;
  headlines: string; movers: string; companiesInNews: string; economy: string; sports: string; culture: string; weather: string;
  advert: string; search: string; searchPlaceholder: string; searchButton: string; home: string; portfolio: string; advance: string;
  advanceOptions: [string, string, string, string, string]; exit: string; buy: string; sell: string; cash: string; holdings: string;
  totalValue: string; products: string; leadership: string; competitors: string; financials: string; commentary: string;
  chart: string; noResults: string; closed: string; reveal: string; between: string; marketCap: string; companies: string;
}

export interface EraTheme {
  /** Page archetype / information architecture. */
  id: LayoutKind;
  /** Which lazily-loaded code family renders this experience. */
  family: VisualFamily;
  /** The full resolved visual experience this theme was derived from. */
  exp: VisualExperience;
  /** Sub-era within the layout (e.g. 'jazz' within 'broadsheet'). */
  sub: string;
  /** CSS variant class applied as .v-<variant> */
  variant: string;
  name: string;
  from: ISODate;
  to: ISODate;
  module: ModuleStyle;
  ticker: TickerStyle;
  chart: ChartStyle;
  publication: string;
  motto: string;
  headlineCase: 'upper' | 'title';
  /** Stock prices in fractions until decimalization (April 2001). */
  fractions: boolean;
  /** Newspaper cover price, if any. */
  price?: string;
  formatDate: (d: ISODate) => string;
  formatShort: (d: ISODate) => string;
  labels: EraLabels;
}

export const longDate = (d: ISODate) => { const p = parts(d); return `${WEEKDAYS[p.weekday]}, ${MONTHS[p.m - 1]} ${p.d}, ${p.y}`; };
export const shortMonth = (d: ISODate) => { const p = parts(d); return `${MONTHS[p.m - 1].slice(0, 3)} ${p.d}, ${p.y}`; };
export const mdy = (d: ISODate, two = true) => { const p = parts(d); return `${p.m}/${p.d}/${two ? String(p.y).slice(2) : p.y}`; };

export const PRINT_LABELS: EraLabels = {
  topStories: 'Latest News', markets: 'The Stock Market', indexes: 'Averages', commodities: 'Commodities', rates: 'Money',
  international: 'Foreign Markets', digital: '', headlines: 'News of the Day', movers: 'Most Active Issues', companiesInNews: 'Corporations in the News',
  economy: 'Business Conditions', sports: 'Sports', culture: 'Amusements', weather: 'The Weather', advert: 'Advertisement',
  search: 'Information Bureau', searchPlaceholder: 'Name a company or subject…', searchButton: 'Inquire', home: 'Front Page',
  portfolio: 'Your Brokerage Account', advance: 'Later Editions',
  advanceOptions: ['To-morrow’s Paper', 'Next Week', 'Next Month', 'Next Year', 'A Later Date…'],
  exit: 'Return to the present', buy: 'Buy', sell: 'Sell', cash: 'Cash on deposit', holdings: 'Securities held', totalValue: 'Total value of account',
  products: 'Principal Products', leadership: 'Officers', competitors: 'Chief Competitors', financials: 'Annual Reports', commentary: 'In the Financial Press',
  chart: 'Course of the Stock', noResults: 'The Bureau has no information on that subject.', closed: 'EXCHANGE CLOSED', reveal: 'What Came to Pass',
  between: 'Events in the interval', marketCap: 'Market value of shares', companies: 'Listed Corporations',
};

export type BaseTheme = Omit<EraTheme, 'family' | 'exp'>;
export const ERAS: BaseTheme[] = [
  {
    id: 'archive', sub: 'archive', variant: 'archive', name: 'The Gilded Archive', from: '1800-01-01', to: '1899-12-31', module: 'print', ticker: 'none', chart: 'engraved',
    publication: 'The Mercantile Times', motto: 'Commerce, Finance, and the Intelligence of the Day', headlineCase: 'upper', fractions: true, price: 'FOUR CENTS',
    formatDate: (d) => longDate(d).toUpperCase() + '.', formatShort: (d) => shortMonth(d),
    labels: { ...PRINT_LABELS, topStories: 'Latest Intelligence', markets: 'The Money Market', indexes: 'Leading Securities', rates: 'Money and Exchange',
      international: 'London', headlines: 'Telegraphic Summary', movers: 'Active Stocks', economy: 'Finance and Commerce', sports: 'Base Ball and the Turf',
      culture: 'Amusements', search: 'Inquiry', portfolio: 'Your Account with the House', advance: 'Later Editions', searchButton: 'Make Inquiry',
      advanceOptions: ['To-morrow', 'Next Week', 'Next Month', 'Next Year', 'A Later Date…'], chart: 'Course of Prices' },
  },
  {
    id: 'broadsheet', sub: 'broadsheet', variant: 'broadsheet', name: 'The Broadsheet Years', from: '1900-01-01', to: '1945-12-31', module: 'print', ticker: 'tape', chart: 'print',
    publication: 'The Market Times', motto: '“All the Markets That Move the Nation”', headlineCase: 'upper', fractions: true, price: 'TWO CENTS',
    formatDate: (d) => longDate(d).toUpperCase(), formatShort: (d) => shortMonth(d),
    labels: { ...PRINT_LABELS },
  },
  {
    id: 'midcentury', sub: 'midcentury', variant: 'midcentury', name: 'Mid-Century Wire', from: '1946-01-01', to: '1979-12-31', module: 'print', ticker: 'bulletin', chart: 'print',
    publication: 'Market Times', motto: 'Financial Edition', headlineCase: 'title', fractions: true, price: '15¢',
    formatDate: (d) => longDate(d).toUpperCase(), formatShort: (d) => shortMonth(d),
    labels: { ...PRINT_LABELS, topStories: 'Top of the News', markets: 'The Markets', indexes: 'Market Averages', rates: 'Interest Rates', movers: 'Market Movers',
      economy: 'Business Barometer', culture: 'Entertainment', search: 'Research Desk', searchButton: 'Look Up', portfolio: 'Your Portfolio',
      advance: 'Advance the Calendar', advanceOptions: ['Tomorrow', 'One Week', 'One Month', 'One Year', 'Pick a Date…'], companiesInNews: 'Companies in the News',
      reveal: 'Since Then', between: 'Meanwhile' },
  },
  {
    id: 'broadcast', sub: 'sixties', variant: 'sixties', name: 'Broadcast Age', from: '1960-01-01', to: '1979-12-31', module: 'print', ticker: 'crawl', chart: 'print',
    publication: 'Market Times', motto: 'and the Evening Report', headlineCase: 'title', fractions: true, price: '10¢',
    formatDate: (d) => longDate(d).toUpperCase(), formatShort: (d) => shortMonth(d),
    labels: { ...PRINT_LABELS, topStories: 'Tonight’s Top Story', markets: 'Market Report', indexes: 'The Averages', rates: 'Money Rates', movers: 'Most Active',
      headlines: 'Around the World', economy: 'Business Barometer', culture: 'Showtime', weather: 'Weather Map', sports: 'Sports Desk',
      search: 'Research', searchButton: 'Look It Up', searchPlaceholder: 'Company or subject…', home: 'News', portfolio: 'Your Portfolio',
      advance: 'Tune Ahead', advanceOptions: ['Tomorrow', 'Next Week', 'Next Month', 'Next Year', 'Pick a Date…'], exit: 'Sign off',
      companiesInNews: 'Companies in the News', reveal: 'Since Then', between: 'Meanwhile', companies: 'Big Board Listings' },
  },
  {
    id: 'terminal', sub: 'terminal', variant: 'terminal', name: 'The Terminal', from: '1980-01-01', to: '1994-12-31', module: 'terminal', ticker: 'terminal', chart: 'phosphor',
    publication: 'MTM FINANCIAL INFORMATION SYSTEM', motto: 'REL 4.2', headlineCase: 'upper', fractions: true,
    formatDate: (d) => { const p = parts(d); return `${WEEKDAYS[p.weekday].slice(0, 3).toUpperCase()} ${String(p.d).padStart(2, '0')} ${MONTHS[p.m - 1].slice(0, 3).toUpperCase()} ${p.y}`; },
    formatShort: (d) => { const p = parts(d); return `${String(p.m).padStart(2, '0')}/${String(p.d).padStart(2, '0')}/${String(p.y).slice(2)}`; },
    labels: { topStories: 'TOP NEWS', markets: 'MKTS', indexes: 'EQUITY INDICES', commodities: 'COMMODITIES', rates: 'RATES', international: 'WORLD EQUITY',
      digital: '', headlines: 'NEWS HEADLINES', movers: 'MOVERS', companiesInNews: 'COMPANY NEWS', economy: 'ECON INDICATORS', sports: 'SPORTS WIRE',
      culture: 'ENTMT', weather: 'WX', advert: 'SPONSOR MSG', search: 'SRCH', searchPlaceholder: 'ENTER TICKER OR KEYWORD', searchButton: '<GO>',
      home: 'MAIN', portfolio: 'PORT', advance: 'TIME', advanceOptions: ['+1D', '+1W', '+1M', '+1Y', 'DATE'], exit: 'LOGOFF', buy: 'BUY', sell: 'SELL',
      cash: 'CASH BAL', holdings: 'POSITIONS', totalValue: 'ACCT VALUE', products: 'PRODUCTS', leadership: 'MGMT', competitors: 'COMPETITION',
      financials: 'FINANCIALS', commentary: 'NEWS', chart: 'GRAPH', noResults: 'NO MATCHING RECORDS', closed: 'MKT CLOSED', reveal: 'PERIOD REVIEW',
      between: 'EVENTS IN PERIOD', marketCap: 'MKT CAP', companies: 'SECURITY LIST' },
  },
  {
    id: 'directory', sub: 'earlyweb', variant: 'earlyweb', name: 'The Early Web', from: '1995-01-01', to: '1998-12-31', module: 'web', ticker: 'none', chart: 'pixel',
    publication: 'MarketTime', motto: 'The Internet Guide to Money', headlineCase: 'title', fractions: true,
    formatDate: (d) => { const p = parts(d); return `${WEEKDAYS[p.weekday]}, ${MONTHS[p.m - 1]} ${p.d}, ${p.y}`; }, formatShort: (d) => mdy(d),
    labels: { topStories: 'Headlines', markets: 'Market Watch', indexes: 'Stock Market', commodities: 'Commodities', rates: 'Interest Rates',
      international: 'World Markets', digital: '', headlines: "What's New", movers: 'Hot Stocks', companiesInNews: 'Companies in the News',
      economy: 'Economy', sports: 'Sports Scores', culture: 'Entertainment', weather: 'Weather', advert: 'Sponsor', search: 'Search',
      searchPlaceholder: '', searchButton: 'Search', home: 'Home', portfolio: 'My Stocks', advance: 'Jump ahead',
      advanceOptions: ['Next day', 'Next week', 'Next month', 'Next year', 'Other date'], exit: 'Leave this site', buy: 'Buy', sell: 'Sell',
      cash: 'Cash', holdings: 'Your stocks', totalValue: 'Total value', products: 'Products', leadership: 'Officers', competitors: 'Competitors',
      financials: 'Financials', commentary: 'News', chart: 'Price chart', noResults: 'No documents match your query.', closed: 'Markets closed',
      reveal: 'Portfolio Report', between: 'Headlines you missed', marketCap: 'Market value', companies: 'Company Directory' },
  },
  {
    id: 'portal', sub: 'portal', variant: 'portal', name: 'The Portal', from: '1995-01-01', to: '2002-12-31', module: 'web', ticker: 'marquee', chart: 'pixel',
    publication: 'MarketTime', motto: 'Your Window on Wall Street', headlineCase: 'title', fractions: true,
    formatDate: (d) => mdy(d), formatShort: (d) => mdy(d),
    labels: { topStories: 'Top Stories', markets: 'Market Summary', indexes: 'U.S. Markets', commodities: 'Commodities', rates: 'Rates & Bonds',
      international: 'World Markets', digital: '', headlines: 'Headlines', movers: 'Biggest Movers', companiesInNews: 'Companies in the News',
      economy: 'Economy', sports: 'Sports Scores', culture: 'Entertainment', weather: 'Weather', advert: 'Advertisement', search: 'Search',
      searchPlaceholder: '', searchButton: 'Search', home: 'Home', portfolio: 'My Portfolio', advance: 'Fast Forward',
      advanceOptions: ['+1 Day', '+1 Week', '+1 Month', '+1 Year', 'Go to date...'], exit: 'Exit simulation', buy: 'Buy', sell: 'Sell', cash: 'Cash',
      holdings: 'Holdings', totalValue: 'Total Value', products: 'Products', leadership: 'Key Executives', competitors: 'Competitors',
      financials: 'Financials', commentary: 'Recent News', chart: 'Chart', noResults: 'Sorry, no matches were found.', closed: 'Markets Closed',
      reveal: 'Portfolio Update', between: 'What happened in the meantime', marketCap: 'Market Cap', companies: 'Stock Directory' },
  },
  {
    id: 'web2', sub: 'web2', variant: 'web2', name: 'Web 2.0', from: '2003-01-01', to: '2009-12-31', module: 'web', ticker: 'glossy', chart: 'gloss',
    publication: 'MarketTime', motto: 'beta', headlineCase: 'title', fractions: false,
    formatDate: (d) => longDate(d), formatShort: (d) => shortMonth(d),
    labels: { topStories: 'Top Stories', markets: 'Markets', indexes: 'U.S. Indices', commodities: 'Commodities', rates: 'Rates', international: 'World',
      digital: '', headlines: 'Latest Headlines', movers: 'Market Movers', companiesInNews: 'Companies in the News', economy: 'Economy',
      sports: 'Sports', culture: 'Entertainment', weather: 'Weather', advert: 'Sponsored', search: 'Search', searchPlaceholder: 'Search quotes & news',
      searchButton: 'Search', home: 'Home', portfolio: 'My Portfolio', advance: 'Time Travel', advanceOptions: ['+1 day', '+1 week', '+1 month', '+1 year', 'Pick a date'],
      exit: 'Exit', buy: 'Buy', sell: 'Sell', cash: 'Cash', holdings: 'Holdings', totalValue: 'Portfolio Value', products: 'Products',
      leadership: 'Management', competitors: 'Competitors', financials: 'Financials', commentary: 'Latest News', chart: 'Interactive Chart',
      noResults: 'No results found. Try different keywords.', closed: 'Markets closed', reveal: 'Your Results', between: 'Meanwhile…', marketCap: 'Market Cap',
      companies: 'Browse Stocks' },
  },
  {
    id: 'mobile', sub: 'mobile', variant: 'mobile', name: 'The App Era', from: '2010-01-01', to: '2015-12-31', module: 'web', ticker: 'none', chart: 'skeuo',
    publication: 'Market Time', motto: 'Markets in your pocket', headlineCase: 'title', fractions: false,
    formatDate: (d) => { const p = parts(d); return `${WEEKDAYS[p.weekday].slice(0, 3)}, ${MONTHS[p.m - 1].slice(0, 3)} ${p.d}, ${p.y}`; }, formatShort: (d) => shortMonth(d),
    labels: { topStories: 'Top Stories', markets: 'Markets', indexes: 'Indices', commodities: 'Commodities', rates: 'Rates', international: 'Global',
      digital: 'Digital currency', headlines: 'Headlines', movers: 'Movers', companiesInNews: 'Trending Companies', economy: 'Economy', sports: 'Scores',
      culture: 'Entertainment', weather: 'Weather', advert: 'Sponsored', search: 'Search', searchPlaceholder: 'Search', searchButton: 'Search', home: 'Today',
      portfolio: 'Portfolio', advance: 'Fast Forward', advanceOptions: ['1 Day', '1 Week', '1 Month', '1 Year', 'Date…'], exit: 'Exit',
      buy: 'Buy', sell: 'Sell', cash: 'Cash', holdings: 'Positions', totalValue: 'Total', products: 'Products', leadership: 'Leadership',
      competitors: 'Competitors', financials: 'Financials', commentary: 'News', chart: 'Chart', noResults: 'No Results', closed: 'Market Closed',
      reveal: 'Your Results', between: 'What you missed', marketCap: 'Market Cap', companies: 'Stocks' },
  },
  {
    id: 'flat', sub: 'flat', variant: 'flat', name: 'Flat Modern', from: '2016-01-01', to: '2020-12-31', module: 'web', ticker: 'none', chart: 'flat',
    publication: 'Market Time', motto: '', headlineCase: 'title', fractions: false,
    formatDate: (d) => { const p = parts(d); return `${MONTHS[p.m - 1]} ${p.d}, ${p.y}`; }, formatShort: (d) => shortMonth(d),
    labels: { topStories: 'Top stories', markets: 'Markets', indexes: 'Indices', commodities: 'Commodities', rates: 'Rates', international: 'Global',
      digital: 'Crypto', headlines: 'Headlines', movers: 'Top movers', companiesInNews: 'In the news', economy: 'Economy', sports: 'Sports',
      culture: 'Entertainment', weather: 'Weather', advert: 'Sponsored', search: 'Search', searchPlaceholder: 'Search stocks, news, and more',
      searchButton: 'Search', home: 'Home', portfolio: 'Portfolio', advance: 'Fast-forward', advanceOptions: ['1D', '1W', '1M', '1Y', 'Custom'],
      exit: 'Exit simulation', buy: 'Buy', sell: 'Sell', cash: 'Buying power', holdings: 'Holdings', totalValue: 'Portfolio value',
      products: 'Products', leadership: 'Leadership', competitors: 'Competitors', financials: 'Financials', commentary: 'News', chart: 'Price',
      noResults: 'No results', closed: 'Market closed', reveal: 'Your results', between: 'What happened', marketCap: 'Market cap', companies: 'Stocks' },
  },
  {
    id: 'fintech', sub: 'fintech', variant: 'fintech', name: 'Present Day', from: '2021-01-01', to: '2999-12-31', module: 'web', ticker: 'none', chart: 'smooth',
    publication: 'Market Time', motto: '', headlineCase: 'title', fractions: false,
    formatDate: (d) => shortMonth(d), formatShort: (d) => shortMonth(d),
    labels: { topStories: 'Top stories', markets: 'Markets', indexes: 'Indices', commodities: 'Commodities', rates: 'Rates', international: 'Global',
      digital: 'Crypto', headlines: 'News', movers: 'Movers', companiesInNews: 'Trending', economy: 'Macro', sports: 'Sports', culture: 'Culture',
      weather: 'Weather', advert: 'Sponsored', search: 'Search', searchPlaceholder: 'Search anything', searchButton: 'Search', home: 'Home',
      portfolio: 'Portfolio', advance: 'Fast-forward', advanceOptions: ['1D', '1W', '1M', '1Y', 'Custom'], exit: 'Exit', buy: 'Buy', sell: 'Sell',
      cash: 'Cash', holdings: 'Holdings', totalValue: 'Total balance', products: 'Products', leadership: 'Leadership', competitors: 'Competitors',
      financials: 'Financials', commentary: 'News', chart: 'Price', noResults: 'No results', closed: 'Market closed', reveal: 'Results',
      between: 'What happened', marketCap: 'Market cap', companies: 'Stocks' },
  },
];

