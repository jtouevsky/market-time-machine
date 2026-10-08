/**
 * Reusable page compositions. A composition is pure data: a CSS grid and which modules go where.
 * The Composer renders any of them, so a new "year" is a new arrangement, not new components.
 */
import type { Composition, ComposedPage, Slot } from './types';

const lead: Slot = { m: 'lead' };
const banner: Slot = { m: 'banner' };
const news = (from = 0, to = 8, o: { title?: string; summary?: boolean; links?: boolean } = {}): Slot => ({ m: 'news', from, to, ...o });
const mk = (...groups: ('indexes' | 'commodities' | 'rates' | 'international' | 'digital')[]): Slot => ({ m: 'markets', groups: groups.length ? groups : undefined });
const movers = (limit = 6): Slot => ({ m: 'movers', limit });
const econ: Slot = { m: 'economy' };
const cos: Slot = { m: 'companies' };
const sports = (limit = 6): Slot => ({ m: 'sports', limit });
const culture: Slot = { m: 'culture' };
const weather: Slot = { m: 'weather' };
const ad = (i = 0): Slot => ({ m: 'ad', i });
const fp = (limit = 4): Slot => ({ m: 'frontpages', limit });
const chart = (symbol = '^GSPC', title = '1Y'): Slot => ({ m: 'chart', symbol, title });
const tiles = (count = 6): Slot => ({ m: 'tiles', count });

const g = (cols: string, areas: string[] | undefined, regions: Record<string, Slot[]>, className: string, collapseAt = 760): Composition => ({ cols, areas, regions, className, collapseAt });
const pg = (label: string, key: string, comp: Omit<Composition, 'pages'>): ComposedPage => ({ label, key, comp });

// ============================================================== pre-1800 — paged gazettes
export const NEWSBOOK: Composition = {
  cols: '1fr', className: 'cx-newsbook', regions: {}, pages: [
    pg('First Leaf', '1', { cols: 'minmax(0, 66ch)', areas: ['main'], regions: { main: [lead, news(0, 6, { title: 'Intelligence' })] }, className: 'cx-page' }),
    pg('Prices Current', '2', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [mk('indexes', 'commodities')], b: [mk('rates', 'international'), movers(6)] }, className: 'cx-page' }),
    pg('Advertisements', '3', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [ad(0), weather], b: [ad(1), culture, sports(5)] }, className: 'cx-page' }),
  ],
};

export const COLONIAL: Composition = {
  cols: '1fr', className: 'cx-colonial', regions: {}, pages: [
    pg('Foreign Advices', '1', { cols: '1.4fr 1fr 1fr 1fr', areas: ['lead news1 news2 side'], regions: { lead: [lead, news(0, 3)], news1: [news(3, 8, { title: 'From Abroad' })], news2: [news(8, 14, { title: 'Domestick Occurrences' })], side: [weather, culture] }, className: 'cx-page' }),
    pg('Marine List & Prices', '2', { cols: '1.3fr 1fr 1fr', areas: ['a b c'], regions: { a: [mk('indexes', 'commodities', 'rates')], b: [mk('international'), movers(8)], c: [econ, cos] }, className: 'cx-page' }),
    pg('Advertisements', '3', { cols: 'repeat(4, 1fr)', areas: ['a b c d'], regions: { a: [ad(0)], b: [ad(1), sports(4)], c: [ad(2)], d: [culture, weather] }, className: 'cx-page' }),
  ],
};

export const ENLIGHTENMENT: Composition = {
  cols: '1fr', className: 'cx-enlight', regions: {}, pages: [
    pg('The Intelligencer', '1', { cols: '1.3fr 1fr 1fr', areas: ['a b c'], regions: { a: [lead, news(0, 4)], b: [news(4, 10, { title: 'Political Register' }), { m: 'note', text: 'NOTICE. — Persons desirous of correcting any Error in the Prices herein are requested to apply at the Printer’s.', className: 'cx-notice' }], c: [news(10, 15, { title: 'Miscellaneous' }), weather] }, className: 'cx-page' }),
    pg('Exchange & Commerce', '2', { cols: '1.2fr 1fr 1fr', areas: ['a b c'], regions: { a: [mk('indexes', 'rates', 'commodities')], b: [mk('international'), movers(8)], c: [econ, cos] }, className: 'cx-page' }),
    pg('Entertainments & Notices', '3', { cols: '1fr 1fr 1fr', areas: ['a b c'], regions: { a: [ad(0), culture], b: [sports(6), weather], c: [ad(1), fp(2)] }, className: 'cx-page' }),
  ],
};

// ============================================================== 1800–1899 — archive family
export const MERCANTILE: Composition = g('1.5fr 1fr', ['prices side', 'prices side'], {
  prices: [mk('indexes', 'rates', 'commodities', 'international'), movers(10)],
  side: [news(0, 7, { title: 'Marine Intelligence & News' }), ad(0)],
}, 'cx-mercantile');

export const PENNY: Composition = g('repeat(5, minmax(0, 1fr))', ['banner banner banner banner banner', 'lead lead news news ads', 'mkts sports news news ads'], {
  banner: [banner], lead: [lead, news(0, 3)], news: [news(3, 12, { title: 'City Items' })], ads: [ad(0), weather, ad(1)], mkts: [mk('indexes', 'rates')], sports: [sports(5), culture],
}, 'cx-penny', 900);

export const VICTORIAN: Composition = g('1.4fr 1fr 1fr', ['lead news mkts', 'lead news2 mkts', 'foot foot foot'], {
  lead: [lead, news(0, 3, { summary: true })], news: [news(3, 9, { title: 'Latest by Telegraph' })], news2: [culture, sports(4)], mkts: [mk('indexes', 'commodities', 'rates'), movers(5), weather], foot: [fp(4)],
}, 'cx-victorian');

export const INDUSTRIAL: Composition = g('1.5fr 1fr 1fr', ['mkts econ news', 'mkts cos news', 'tape tape tape'], {
  mkts: [mk('indexes', 'rates', 'international', 'commodities'), movers(8)], econ: [econ], cos: [cos, weather], news: [lead, news(0, 6, { title: 'Commercial Intelligence' })], tape: [ad(0), culture],
}, 'cx-industrial');

export const TURN_OF_CENTURY: Composition = g('repeat(4, minmax(0, 1fr))', ['banner banner banner banner', 'lead lead news mkts', 'ads ads news mkts', 'sports cos econ mkts'], {
  banner: [banner], lead: [lead, news(0, 3)], news: [news(3, 12, { title: 'Latest Telegrams' })], mkts: [mk('indexes', 'rates', 'commodities'), movers(8)], ads: [ad(0), ad(1)], sports: [sports(6)], cos: [cos], econ: [econ, weather],
}, 'cx-turn');

// ============================================================== 1900–1949 — print
export const EDWARDIAN: Composition = g('1.4fr 1fr 1fr 1fr 1fr 1fr', ['banner banner banner banner banner banner', 'lead lead a b c d', 'lead lead e f g h'], {
  banner: [banner], lead: [lead, news(0, 3)], a: [news(3, 7, { summary: false, title: 'By Cable' })], b: [mk('indexes', 'rates')], c: [movers(8)], d: [weather, sports(4)], e: [news(7, 11, { summary: false, title: 'Home News' })], f: [mk('commodities', 'international')], g: [cos, culture], h: [ad(0), econ],
}, 'cx-edwardian', 1000);

export const EARLY_MODERN: Composition = g('1.5fr 1fr 1fr 1fr', ['banner banner banner banner', 'lead mkts news side', 'lead mkts news side'], {
  banner: [banner], lead: [lead, news(0, 4)], mkts: [mk('indexes', 'rates', 'commodities'), movers(8)], news: [news(4, 11, { summary: false, title: 'Dispatches' })], side: [ad(0), weather, sports(5), ad(1), culture],
}, 'cx-earlymod');

export const WARTIME: Composition = g('1.6fr 1fr', ['dispatch side'], {
  dispatch: [banner, news(0, 14, { title: 'Latest Dispatches', summary: true })], side: [mk('indexes', 'rates', 'commodities'), movers(6), weather],
}, 'cx-wartime');

export const POSTWAR_FIN: Composition = g('2fr 1fr', ['tables side', 'tables side'], {
  tables: [mk('indexes', 'rates', 'commodities', 'international'), movers(10), econ], side: [lead, news(0, 6, { summary: false, title: 'Business News' }), ad(0)],
}, 'cx-postwar-fin');

export const DECO: Composition = g('1.5fr 1fr 1fr', ['banner banner banner', 'lead mkts news', 'lead mkts news', 'foot foot foot'], {
  banner: [banner], lead: [lead, news(0, 3)], mkts: [mk('indexes', 'rates', 'commodities'), movers(8), cos], news: [news(3, 10, { summary: false, title: 'Latest Bulletins' }), ad(0), ad(1)], foot: [sports(6), culture, weather],
}, 'cx-deco');

export const DEPRESSION: Composition = g('1fr 1fr 1fr', ['banner banner banner', 'mkts lead news', 'mkts ads news'], {
  banner: [banner], mkts: [mk('indexes', 'rates', 'commodities'), movers(10)], lead: [lead, news(0, 3)], news: [news(3, 10, { summary: false, title: 'Other News' })], ads: [econ, ad(0), weather],
}, 'cx-depression');

export const RADIO: Composition = {
  cols: '1fr', className: 'cx-radio', regions: {}, pages: [
    pg('News Hour', '1', { cols: '1.2fr 1fr', areas: ['a b'], regions: { a: [lead, news(0, 4)], b: [news(4, 10, { summary: false, title: 'Bulletins' }), weather] }, className: 'cx-page' }),
    pg('Market Reports', '2', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [mk('indexes', 'rates', 'commodities')], b: [movers(8), econ, cos] }, className: 'cx-page' }),
    pg('Sports & Society', '3', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [sports(8), weather], b: [culture, ad(0)] }, className: 'cx-page' }),
    pg('The Newsstand', '4', { cols: '1fr', areas: ['a'], regions: { a: [fp(4), ad(1)] }, className: 'cx-page' }),
  ],
};

export const WIRE: Composition = g('1fr', ['strips'], {
  strips: [lead, news(0, 16, { summary: true }), mk('indexes', 'rates'), movers(6)],
}, 'cx-wire');

export const POSTWAR_MOD: Composition = g('1.1fr 1.5fr 1fr', ['photo news mkts', 'photo news mkts', 'foot foot foot'], {
  photo: [fp(2), lead], news: [news(0, 8, { title: 'The Day’s News' }), sports(5)], mkts: [mk('indexes', 'commodities', 'rates'), movers(6), econ, weather], foot: [culture, ad(0)],
}, 'cx-postwar-mod');

export const SWISS: Composition = g('repeat(12, minmax(0, 1fr))', ['lead lead lead lead lead lead lead lead . . . .', 'mkts mkts mkts mkts news news news news side side side side'], {
  lead: [lead], mkts: [mk('indexes', 'commodities', 'rates'), movers(8)], news: [news(1, 8, { title: 'News' }), sports(4)], side: [econ, cos, weather, culture],
}, 'cx-swiss');

export const COLOR_TV: Composition = g('1.4fr 1fr', ['stage board', 'cols cols'], {
  stage: [lead], board: [mk('indexes', 'rates'), movers(5)], cols: [news(1, 8, { title: 'More News' }), econ, cos, sports(5), weather],
}, 'cx-colortv');

// ============================================================== teletext / videotex — numbered pages
export const TELETEXT: Composition = {
  cols: '1fr', className: 'cx-teletext', regions: {}, pages: [
    pg('Index', '100', { cols: '1fr', areas: ['a'], regions: { a: [{ m: 'note', text: 'INDEX', className: 'tt-index' }] }, className: 'cx-page' }),
    pg('Top news', '101', { cols: '1fr', areas: ['a'], regions: { a: [lead, news(0, 8, { summary: false })] }, className: 'cx-page' }),
    pg('More news', '102', { cols: '1fr', areas: ['a'], regions: { a: [news(8, 20, { summary: false })] }, className: 'cx-page' }),
    pg('Markets', '120', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [mk('indexes', 'rates')], b: [mk('commodities', 'international'), movers(6)] }, className: 'cx-page' }),
    pg('Economy', '130', { cols: '1fr', areas: ['a'], regions: { a: [econ, cos] }, className: 'cx-page' }),
    pg('Sport', '150', { cols: '1fr', areas: ['a'], regions: { a: [sports(14)] }, className: 'cx-page' }),
    pg('Weather & TV', '160', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [weather], b: [culture] }, className: 'cx-page' }),
  ],
};

// ============================================================== terminal screens (F-keys / numbers)
export const AMBER_SCREENS: Composition = {
  cols: '1fr', className: 'cx-screens', regions: {}, pages: [
    pg('NEWS', 'F1', { cols: '1.2fr 1fr', areas: ['a b'], regions: { a: [lead, news(0, 12, { summary: false })], b: [movers(8), cos] }, className: 'cx-page' }),
    pg('QUOTES', 'F2', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [mk('indexes', 'rates')], b: [mk('commodities', 'international')] }, className: 'cx-page' }),
    pg('CHART', 'F3', { cols: '1fr', areas: ['a'], regions: { a: [chart('^GSPC', 'S&P 500'), movers(6)] }, className: 'cx-page' }),
    pg('ECON', 'F4', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [econ], b: [weather, sports(8)] }, className: 'cx-page' }),
  ],
};

export const GREEN_SCREENS: Composition = {
  cols: '1fr', className: 'cx-screens', regions: {}, pages: [
    pg('MAIN', '1', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [lead, news(0, 8, { summary: false })], b: [mk('indexes', 'rates')] }, className: 'cx-page' }),
    pg('MARKETS', '2', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [mk('indexes', 'international')], b: [mk('commodities', 'rates'), movers(8)] }, className: 'cx-page' }),
    pg('WIRE', '3', { cols: '1fr', areas: ['a'], regions: { a: [news(0, 20, { summary: false })] }, className: 'cx-page' }),
    pg('ECON', '4', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [econ], b: [cos, weather, sports(6)] }, className: 'cx-page' }),
  ],
};

export const DOS_MENU: Composition = {
  cols: '1fr', className: 'cx-dos', regions: {}, pages: [
    pg('MAIN MENU', '0', { cols: '1fr', areas: ['a'], regions: { a: [{ m: 'note', text: 'MENU', className: 'dos-menu' }] }, className: 'cx-page' }),
    pg('HEADLINE NEWS', '1', { cols: '1fr', areas: ['a'], regions: { a: [lead, news(0, 10, { summary: false })] }, className: 'cx-page' }),
    pg('MARKET REPORT', '2', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [mk('indexes', 'rates')], b: [mk('commodities', 'international'), movers(6)] }, className: 'cx-page' }),
    pg('ECONOMIC INDICATORS', '3', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [econ], b: [cos] }, className: 'cx-page' }),
    pg('SPORTS & WEATHER', '4', { cols: '1fr 1fr', areas: ['a b'], regions: { a: [sports(10)], b: [weather, culture] }, className: 'cx-page' }),
  ],
};

// ============================================================== desktop windows (initial set)
export const DESKTOP_WINDOWS: Composition = g('1fr', ['a'], { a: [] }, 'cx-desktop');

// ============================================================== web — early to modern
export const HYPERTEXT: Composition = g('1fr', ['a'], { a: [lead, news(0, 12, { links: true, summary: false }), mk('indexes', 'rates'), movers(6), econ] }, 'cx-hypertext');

export const PERSONAL: Composition = g('200px 1fr 200px', ['left main right'], {
  left: [mk('indexes'), weather, sports(4)], main: [lead, news(0, 10, { links: true, summary: false }), cos], right: [movers(6), culture, ad(0)],
}, 'cx-personal', 900);

export const WIN98: Composition = g('170px 1fr 190px', ['links main right', 'links main right'], {
  links: [{ m: 'cats', count: 8 }], main: [lead, news(0, 8, { links: true, summary: false }), mk('indexes', 'rates', 'international')], right: [movers(8), econ, weather, ad(0)],
}, 'cx-win98', 900);

export const ENTERPRISE: Composition = g('1fr 3fr', ['nav a', 'nav b'], {
  nav: [{ m: 'cats', count: 8 }, weather], a: [mk('indexes', 'international', 'rates'), movers(8)], b: [lead, news(0, 8, { summary: false }), econ, cos],
}, 'cx-enterprise', 900);

export const XP_PORTAL: Composition = g('1fr 2fr 1fr', ['left main right'], {
  left: [mk('indexes', 'international'), movers(6)], main: [lead, news(0, 8, { summary: false }), cos], right: [weather, sports(5), culture, ad(0)],
}, 'cx-xp', 900);

export const CLEAN_CSS: Composition = g('230px 1fr', ['side main', 'side main'], {
  side: [mk('indexes', 'commodities'), movers(6), weather], main: [lead, news(0, 8, { summary: false }), econ, cos, sports(4)],
}, 'cx-clean', 820);

export const ROUNDED_2004: Composition = g('1fr 1fr 1fr', ['lead lead mkts', 'news cos mkts', 'econ sports ad'], {
  lead: [lead], mkts: [mk('indexes', 'commodities'), movers(6)], news: [news(1, 7, { summary: false, title: 'More Headlines' })], cos: [cos], econ: [econ], sports: [sports(5), culture], ad: [ad(0), weather],
}, 'cx-rounded');

export const AJAX_2005: Composition = g('1fr 1fr 1fr', ['a b c', 'a b c'], {
  a: [mk('indexes', 'commodities'), econ], b: [lead, news(0, 6, { summary: false }), cos], c: [movers(6), weather, sports(4), culture],
}, 'cx-ajax');

export const SOCIAL_2006: Composition = g('2fr 1fr', ['feed side'], {
  feed: [lead, news(0, 12, { summary: true }), cos], side: [mk('indexes'), movers(5), culture, weather, ad(0)],
}, 'cx-social');

export const AQUA_2007: Composition = g('240px 1fr 220px', ['left main right'], {
  left: [mk('indexes', 'commodities', 'international')], main: [lead, news(0, 8, { summary: false }), econ], right: [movers(6), cos, weather, ad(0)],
}, 'cx-aqua', 980);

export const METRO_2013: Composition = g('repeat(6, minmax(0, 1fr))', ['hero hero hero hero t1 t2', 'hero hero hero hero t3 t4', 'n1 n1 n2 n2 n3 n3', 'econ econ cos cos sp sp'], {
  hero: [lead], t1: [tiles(1)], t2: [tiles(1)], t3: [tiles(1)], t4: [tiles(1)], n1: [news(1, 4, { title: 'News' })], n2: [news(4, 7, { title: 'More' })], n3: [movers(5)], econ: [econ], cos: [cos], sp: [sports(5)],
}, 'cx-metro', 900);

export const MATERIAL_2014: Composition = g('repeat(3, minmax(0, 1fr))', ['hero hero side', 'a b side', 'c c d'], {
  hero: [lead], side: [movers(6), mk('indexes', 'commodities')], a: [news(1, 6, { summary: false })], b: [econ], c: [cos], d: [weather, sports(4)],
}, 'cx-material', 900);

export const FLAT_2015: Composition = g('repeat(3, minmax(0, 1fr))', ['idx idx idx', 'lead news side', 'lead news side'], {
  idx: [tiles(3)], lead: [lead], news: [news(1, 8, { summary: false })], side: [movers(6), econ, cos],
}, 'cx-flat');

export const PORTAL_2016: Composition = g('repeat(12, minmax(0, 1fr))', ['hdr hdr hdr hdr hdr hdr hdr hdr hdr hdr hdr hdr', 'lead lead lead lead lead lead news news news side side side', 'mkts mkts mkts mkts cos cos cos cos econ econ econ econ'], {
  hdr: [tiles(4)], lead: [lead, chart('^GSPC', '1Y')], news: [news(1, 8, { summary: false })], side: [movers(7), weather], mkts: [mk('indexes', 'commodities', 'rates')], cos: [cos, sports(4)], econ: [econ],
}, 'cx-portal16', 980);

export const MATERIAL_2017: Composition = g('repeat(4, minmax(0, 1fr))', ['hero hero hero rail', 'a a b rail', 'c d d rail'], {
  hero: [lead, chart('^GSPC', '1Y')], rail: [movers(7), mk('indexes', 'rates', 'commodities')], a: [news(1, 6, { summary: false })], b: [econ], c: [cos], d: [sports(4), culture, weather],
}, 'cx-material17', 980);

export const MINIMAL_2018: Composition = g('minmax(0, 720px) 320px', ['main side'], {
  main: [lead, news(1, 9, { summary: true })], side: [mk('indexes'), movers(5), econ],
}, 'cx-minimal', 900);

export const DATATERM_2019: Composition = g('repeat(12, minmax(0, 1fr))', ['c c c c c c c c m m m m', 'n n n n n n o o m m m m', 'e e e e p p p p q q q q'], {
  c: [chart('^GSPC', '1Y')], m: [mk('indexes', 'commodities', 'rates', 'digital'), movers(8)], n: [lead, news(1, 7, { summary: false })], o: [cos], e: [econ], p: [sports(5)], q: [weather, culture],
}, 'cx-dataterm', 1000);

export const RETAIL_2020: Composition = g('minmax(0, 1fr) 320px', ['chart watch', 'news watch'], {
  chart: [chart('^GSPC', '1M')], watch: [movers(10), mk('digital', 'indexes')], news: [lead, news(1, 8, { summary: false }), cos],
}, 'cx-retail', 900);

export const GLASS_2021: Composition = g('repeat(3, minmax(0, 1fr))', ['hero hero side', 'a b side', 'c d e'], {
  hero: [chart('^GSPC', '1Y'), lead], side: [movers(6), mk('digital', 'indexes')], a: [news(1, 6, { summary: false })], b: [econ], c: [cos], d: [sports(4)], e: [weather, culture],
}, 'cx-glass', 980);

export const BENTO_2022: Composition = g('repeat(4, minmax(0, 1fr))', ['hero hero m1 m2', 'hero hero m3 m4', 'n n e c', 's s e c'], {
  hero: [chart('^GSPC', '1Y')], m1: [tiles(1)], m2: [tiles(1)], m3: [tiles(1)], m4: [tiles(1)], n: [lead, news(1, 6, { summary: false })], e: [econ], c: [cos], s: [movers(6), sports(4)],
}, 'cx-bento', 980);

export const SPATIAL_2024: Composition = g('repeat(3, minmax(0, 1fr))', ['hero hero side', 'a b side', 'c c d'], {
  hero: [chart('^GSPC', '1Y'), lead], side: [movers(6), mk('indexes', 'digital')], a: [news(1, 6, { summary: false })], b: [econ], c: [cos, sports(4)], d: [weather, culture],
}, 'cx-spatial', 980);

export const LIQUID_2026: Composition = g('repeat(3, minmax(0, 1fr))', ['hero hero side', 'a b side', 'c c d'], {
  hero: [lead, chart('^GSPC', '1Y')], side: [movers(6), mk('indexes', 'digital', 'commodities')], a: [news(1, 6, { summary: false })], b: [econ], c: [cos, sports(4)], d: [weather, culture],
}, 'cx-liquid', 980);

export const FINOS_2025: Composition = g('repeat(2, minmax(0, 1fr))', ['a b', 'c d'], {
  a: [lead, chart('^GSPC', '1Y')], b: [movers(8), mk('indexes', 'digital')], c: [news(1, 7, { summary: false }), econ], d: [cos, sports(4), weather],
}, 'cx-finos', 980);

export const RESEARCH_2023: Composition = g('minmax(0, 1fr) 320px', ['main side', 'main side'], {
  main: [{ m: 'note', text: 'ask', className: 'rs-ask' }, lead, news(1, 8, { summary: true }), cos], side: [chart('^GSPC', '1Y'), movers(6), mk('indexes', 'digital'), econ],
}, 'cx-research', 980);
