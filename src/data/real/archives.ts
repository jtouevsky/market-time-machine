/**
 * News, sports, culture, weather and newspaper front pages from real sources.
 *
 *  news      Wikipedia chronologies & Current-events portal (build time, /public/data/news)
 *  sports    Retrosheet, FiveThirtyEight, nflverse, NHL API, intl. results (build time)
 *  culture   Billboard Hot 100 No. 1s, box-office No. 1s via Wikipedia (build time)
 *  weather   NOAA GHCN-Daily station observations (runtime, cached)
 *  pages     Library of Congress — Chronicling America front pages ≤1963 (runtime, cached)
 */
import { addDays, MONTHS, type ISODate } from '../../core/dates';
import type { Category, CultureItem, FrontPage, NewsItem, SportsResult, WeatherItem } from '../../core/types';
import { fetchJson, loadData } from './loader';

type NewsRow = [ISODate, Category, string, string, string, 'current' | 'month' | 'year', string];
type SportRow = [ISODate, string, string, number, string, number, string];
type CultureRow = [ISODate, 'music' | 'film', string, string, string];

const newsYear = (y: number) => loadData<{ items: NewsRow[] }>(`news/${y}.json.gz`);
const sportsYear = (y: number) => loadData<{ items: SportRow[] }>(`sports/${y}.json.gz`);
const cultureYear = (y: number) => loadData<{ items: CultureRow[] }>(`culture/${y}.json.gz`);

// ------------------------------------------------------------------ news
const ABBR = /\b(U\.S|Mr|Mrs|Dr|St|Gen|Lt|Col|Sgt|Gov|Sen|Rep|Jr|Sr|Inc|Co|Corp|Ltd|No|vs|Rev|Mt|Ft|U\.N|U\.K|D\.C|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.$/;
export function headlineOf(text: string) {
  const t = text.replace(/^[^:]{3,60}: (?=[A-Z])/, (m) => (m.length < 40 ? '' : m));
  let cut = -1;
  for (let i = 0; i < t.length - 1; i++) {
    if (t[i] === '.' && t[i + 1] === ' ' && !ABBR.test(t.slice(Math.max(0, i - 6), i + 1)) && !/\b[A-Z]\.$/.test(t.slice(i - 2, i + 1))) { cut = i; break; }
  }
  let h = cut > 20 ? t.slice(0, cut) : t.replace(/\.$/, '');
  if (h.length > 125) h = h.slice(0, 118).replace(/[\s,;:]+\S*$/, '') + '…';
  return h;
}

/** Citation strings look like "Chicago Daily Tribune, October 30, 1929" — a later print date delays availability. */
function citedDate(src: string, event: ISODate): ISODate | null {
  const m = src.match(/(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})/);
  if (!m) return null;
  const iso = `${m[3]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
  return iso > event && iso <= addDays(event, 10) ? iso : null;
}

function toNews(r: NewsRow, i: number): NewsItem {
  const [date, cat, raw, src, url, kind, page] = r;
  const text = raw.replace(/::+/g, ':').replace(/\s{2,}/g, ' ');
  const avail = citedDate(src, date) ?? date;
  const title = headlineOf(text);
  const mainYearPage = kind === 'year' && /^\d{4}$/.test(page);
  return {
    id: `wp-${date}-${i}`, title, summary: title.length < text.length - 10 ? text : undefined, category: cat,
    importance: mainYearPage ? 3 : kind === 'current' && cat === 'finance' ? 2 : 2, major: mainYearPage || undefined,
    eventDate: date, publishedAt: avail, availableAt: avail,
    source: src === 'Wikipedia' ? `Wikipedia — ${page}` : src, publication: src, sourceUrl: url,
    provenance: 'ARCHIVAL',
  };
}

export async function realNews(date: ISODate, { minItems = 12, maxDays = 365 } = {}): Promise<NewsItem[]> {
  const y = Number(date.slice(0, 4));
  const [a, b] = await Promise.all([newsYear(y), newsYear(y - 1)]);
  const rows = [...(b?.items ?? []).map((r, i) => toNews(r, i + 1e6)), ...(a?.items ?? []).map(toNews)].filter((n) => n.availableAt <= date);
  rows.sort((p, q) => (p.availableAt < q.availableAt ? 1 : p.availableAt > q.availableAt ? -1 : q.importance - p.importance));
  // variety: at most two items per running topic ("Syrian civil war: …") per day
  const seen = new Map<string, number>();
  const varied = rows.filter((n) => {
    const topic = (n.summary ?? n.title).match(/^([^:]{3,60}):\s/)?.[1];
    if (!topic) return true;
    const k = `${n.availableAt}|${topic.toLowerCase()}`;
    const c = (seen.get(k) ?? 0) + 1;
    seen.set(k, c);
    return c <= 2;
  });
  rows.length = 0; rows.push(...varied);
  // controlled window strictly BEFORE (or on) the date: widen only until we have enough
  for (const days of [7, 21, 60, 120, maxDays]) {
    const from = addDays(date, -days);
    const w = rows.filter((n) => n.availableAt >= from);
    if (w.length >= minItems || days === maxDays) return w.slice(0, 80);
  }
  return rows.slice(0, 80);
}

export async function realEventsBetween(from: ISODate, to: ISODate): Promise<NewsItem[]> {
  const y0 = Number(from.slice(0, 4)), y1 = Number(to.slice(0, 4));
  const out: NewsItem[] = [];
  for (let y = y0; y <= y1; y++) {
    const f = await newsYear(y);
    for (const [i, r] of (f?.items ?? []).entries()) {
      const n = toNews(r, i);
      if (n.major && n.availableAt > from && n.availableAt <= to) out.push(n);
    }
  }
  // keep long reveals readable: at most ~6 per year, spread through the year
  const byYear = new Map<string, NewsItem[]>();
  for (const n of out) { const k = n.availableAt.slice(0, 4); byYear.set(k, [...(byYear.get(k) ?? []), n]); }
  const cap = y1 - y0 > 3 ? 5 : 14;
  return [...byYear.values()].flatMap((list) => (list.length <= cap ? list : list.filter((_, i) => i % Math.ceil(list.length / cap) === 0)));
}

export async function searchRealNews(terms: string[], date: ISODate, years = 2): Promise<NewsItem[]> {
  const y = Number(date.slice(0, 4));
  const out: NewsItem[] = [];
  for (let k = 0; k < years; k++) {
    const f = await newsYear(y - k);
    for (const [i, r] of (f?.items ?? []).entries()) {
      const low = r[2].toLowerCase();
      if (terms.every((t) => low.includes(t))) { const n = toNews(r, i); if (n.availableAt <= date) out.push(n); }
    }
  }
  return out.sort((a, b) => (a.availableAt < b.availableAt ? 1 : -1)).slice(0, 25);
}

// ------------------------------------------------------------------ sports
export async function realSports(date: ISODate): Promise<SportsResult[]> {
  const y = Number(date.slice(0, 4));
  const [a, b] = await Promise.all([sportsYear(y), sportsYear(y - 1)]);
  const rows = [...(b?.items ?? []), ...(a?.items ?? [])].filter((r) => addDays(r[0], 1) <= date && r[0] >= addDays(date, -10));
  if (!rows.length) return [];
  // the most recent day with results, per league (yesterday's scores, as in the morning paper)
  const latestByLeague = new Map<string, ISODate>();
  for (const r of rows) if (!latestByLeague.has(r[1]) || r[0] > latestByLeague.get(r[1])!) latestByLeague.set(r[1], r[0]);
  const order = ['NFL', 'MLB', 'NBA', 'NHL', 'Soccer'];
  const out: SportsResult[] = [];
  for (const lg of order) {
    const d = latestByLeague.get(lg);
    if (!d || d < addDays(date, -4)) continue;
    const games = rows.filter((r) => r[1] === lg && r[0] === d);
    games.sort((p, q) => (q[6] ? 1 : 0) - (p[6] ? 1 : 0));
    for (const [i, g] of games.slice(0, lg === 'Soccer' ? 3 : 5).entries()) {
      const avail = addDays(g[0], 1);
      out.push({
        id: `sp-${lg}-${g[0]}-${i}`, title: `${g[2]} ${g[3]}, ${g[4]} ${g[5]}`, category: 'sports', league: lg,
        away: g[2], awayScore: g[3], home: g[4], homeScore: g[5], note: g[6] || undefined,
        eventDate: g[0], publishedAt: avail, availableAt: avail,
        source: SPORT_SOURCES[lg].name, publication: SPORT_SOURCES[lg].name, sourceUrl: SPORT_SOURCES[lg].url, provenance: 'REAL',
      });
    }
  }
  return out;
}
export const SPORT_SOURCES: Record<string, { name: string; url: string }> = {
  MLB: { name: 'Retrosheet game logs', url: 'https://www.retrosheet.org/gamelogs/index.html' },
  NBA: { name: 'FiveThirtyEight NBA Elo data', url: 'https://github.com/fivethirtyeight/data/tree/master/nba-elo' },
  NFL: { name: 'FiveThirtyEight / nflverse game data', url: 'https://github.com/nflverse/nfldata' },
  NHL: { name: 'NHL stats API', url: 'https://api.nhle.com/stats/rest/en/game' },
  Soccer: { name: 'International football results (martj42)', url: 'https://github.com/martj42/international_results' },
};

// ------------------------------------------------------------------ culture
export async function realCulture(date: ISODate): Promise<CultureItem[]> {
  const y = Number(date.slice(0, 4));
  const [a, b] = await Promise.all([cultureYear(y), cultureYear(y - 1)]);
  const rows = [...(b?.items ?? []), ...(a?.items ?? [])].filter((r) => r[0] <= date && r[0] >= addDays(date, -21));
  const out: CultureItem[] = [];
  for (const kind of ['music', 'film'] as const) {
    const r = rows.filter((x) => x[1] === kind).at(-1);
    if (!r) continue;
    out.push({
      id: `cu-${kind}-${r[0]}`, title: r[2], kind, category: 'culture',
      line: kind === 'music' ? `No. 1 single: ${r[2]} — ${r[3]}` : `No. 1 at the box office: ${r[2]}${r[3] ? ` (${r[3]})` : ''}`,
      eventDate: r[0], publishedAt: r[0], availableAt: r[0],
      source: kind === 'music' ? 'Billboard Hot 100 (via Wikipedia)' : 'Weekend box office (via Wikipedia)', publication: kind === 'music' ? 'Billboard' : 'Box office reports',
      sourceUrl: r[4], provenance: 'ARCHIVAL',
    });
  }
  return out;
}

// ------------------------------------------------------------------ weather (NOAA GHCN-Daily, observed)
const STATIONS: { id: string; city: string; from: ISODate }[] = [
  { id: 'USW00094728', city: 'New York', from: '1869-01-01' },
  { id: 'USW00014819', city: 'Chicago', from: '1928-01-01' },
  { id: 'USW00013743', city: 'Washington', from: '1941-07-01' },
  { id: 'USW00023272', city: 'San Francisco', from: '1921-01-01' },
];
interface NoaaRow { DATE: string; STATION: string; TMAX?: string; TMIN?: string; PRCP?: string; SNOW?: string }

/** VITE_LIVE_SOURCES=false turns off the two runtime network calls (NOAA, LOC): fully offline. */
const LIVE = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_LIVE_SOURCES !== 'false';

export async function realWeather(date: ISODate): Promise<WeatherItem[]> {
  if (!LIVE) return [];
  const stations = STATIONS.filter((s) => s.from <= date);
  if (!stations.length) return [];
  const url = `https://www.ncei.noaa.gov/access/services/data/v1?dataset=daily-summaries&stations=${stations.map((s) => s.id).join(',')}&startDate=${date}&endDate=${date}&dataTypes=TMAX,TMIN,PRCP,SNOW&units=standard&format=json`;
  const rows = await fetchJson<NoaaRow[]>(url, { timeout: 8000, ttlDays: 365 });
  const num = (v?: string) => (v === undefined || v === '' ? null : Number(v));
  return rows.filter((r) => r.DATE === date).map((r) => {
    const s = STATIONS.find((x) => x.id === r.STATION)!;
    const p = num(r.PRCP), sn = num(r.SNOW);
    const sky = sn && sn > 0 ? `Snow, ${sn.toFixed(1)} in.` : p && p >= 0.01 ? `Rain, ${p.toFixed(2)} in.` : p === 0 ? 'No precipitation' : '—';
    return {
      id: `wx-${r.STATION}-${date}`, title: `${s.city}: ${sky}`, city: s.city, high: num(r.TMAX), low: num(r.TMIN), sky, precip: p, snow: sn,
      category: 'weather' as Category, eventDate: date, publishedAt: date, availableAt: date,
      source: 'NOAA GHCN-Daily station observations', publication: `NOAA station ${r.STATION}`,
      sourceUrl: `https://www.ncei.noaa.gov/cdo-web/datasets/GHCND/stations/GHCND:${r.STATION}/detail`, provenance: 'REAL' as const,
    };
  }).filter((w) => w.high !== null);
}

// ------------------------------------------------------------------ Library of Congress front pages
interface LocResult { title: string; date: string; image_url?: string[]; url: string; partof_title?: string[]; location_state?: string[] }
export async function realFrontPages(date: ISODate, limit = 4): Promise<FrontPage[]> {
  if (!LIVE || date < '1770-01-01' || date > '1963-12-31') return [];
  const url = `https://www.loc.gov/collections/chronicling-america/?dl=page&dates=${date}/${date}&fo=json&c=60&at=results`;
  const j = await fetchJson<{ results?: LocResult[] }>(url, { timeout: 9000, ttlDays: 365 });
  const pages = (j.results ?? []).filter((r) => /^Image 1 of /.test(r.title) && r.date === date && r.image_url?.length);
  // prefer big-city dailies
  const rank = (t: string) => (/(new york|washington|chicago|boston|philadelphia|san francisco|los angeles|st\. louis|detroit|baltimore)/i.test(t) ? 0 : 1);
  pages.sort((a, b) => rank(a.title) - rank(b.title));
  const seen = new Set<string>();
  const out: FrontPage[] = [];
  for (const r of pages) {
    const name = r.title.replace(/^Image 1 of /, '').replace(/,\s+[A-Z][a-z]+ \d{1,2}, \d{4}.*$/, '');
    const pub = name.replace(/\s*\(.*$/, '');
    if (seen.has(pub)) continue;
    seen.add(pub);
    const imgs = r.image_url!.filter((u) => u.includes('/full/')).map((u) => u.split('#')[0]);
    out.push({
      id: `loc-${r.url}`, title: `${pub} — front page`, category: 'world', publicationTitle: pub, place: (name.match(/\(([^)]*)\)/)?.[1] ?? ''),
      imageUrl: imgs[1] ?? imgs[0], imageLargeUrl: imgs.at(-1), pageUrl: r.url,
      eventDate: date, publishedAt: date, availableAt: date,
      source: 'Library of Congress, Chronicling America', publication: pub, sourceUrl: r.url, provenance: 'ARCHIVAL',
    });
    if (out.length >= limit) break;
  }
  return out;
}
