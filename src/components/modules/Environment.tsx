import { dayNumber } from '../../core/dates';
import type { AdItem, CultureItem, FrontPage, MarketSnapshot, NewsItem, SportsResult, WeatherItem } from '../../core/types';
import { useSim } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';
import { fmtChange, fmtQuoteValue, headline } from '../../theme/format';
import { Section, dir } from './common';
import { Est, Prov } from './Provenance';

const isResult = (x: NewsItem | SportsResult): x is SportsResult => (x as SportsResult).league !== undefined;

/** Yesterday's scores, styled as the era would have printed/displayed them. */
export function HistoricalSports({ items, limit = 8 }: { items: (NewsItem | SportsResult)[]; limit?: number }) {
  const era = useEra();
  if (!items.length) return null;
  const results = items.filter(isResult).slice(0, limit);
  const notes = items.filter((x) => !isResult(x)).slice(0, 3) as NewsItem[];
  const T = era.module === 'terminal';
  const title = T ? 'SPORTS WIRE' : era.labels.sports;
  const byLeague = new Map<string, SportsResult[]>();
  for (const r of results) byLeague.set(r.league, [...(byLeague.get(r.league) ?? []), r]);
  const leagueName = (l: string) => (era.module === 'print' ? ({ MLB: 'Base Ball', NFL: 'Football', NBA: 'Basketball', NHL: 'Hockey', Soccer: 'Football (Intl.)' } as Record<string, string>)[l] ?? l : l);
  return (
    <Section title={title} className={`m-sports sports-${era.module}`}>
      {[...byLeague.entries()].map(([lg, games]) => (
        <div key={lg} className="m-score-group">
          <h4 className="m-group-title">{T ? lg : leagueName(lg)}{games[0] ? <span className="m-score-date"> · {era.formatShort(games[0].eventDate)}</span> : null}</h4>
          <table className="m-table m-scores">
            <tbody>
              {games.map((g) => {
                const awayWon = g.awayScore > g.homeScore;
                return (
                  <tr key={g.id}>
                    <td className={awayWon ? 'm-win' : ''}>{T ? g.away.toUpperCase() : g.away}</td>
                    <td className="m-num">{g.awayScore}</td>
                    <td className={!awayWon && g.homeScore !== g.awayScore ? 'm-win' : ''}>{T ? `@ ${g.home.toUpperCase()}` : era.module === 'print' ? `at ${g.home}` : `@ ${g.home}`}</td>
                    <td className="m-num">{g.homeScore}{g.note ? <small className="m-score-note"> {g.note}</small> : null}<Prov p={g.provenance} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      {notes.length ? (
        <ul className="m-sport-list">
          {notes.map((s) => <li key={s.id}><span className="m-sport-line">{headline(s.title, era)}<Prov p={s.provenance} /></span><span className="m-sport-when">{era.formatShort(s.availableAt)}</span></li>)}
        </ul>
      ) : null}
    </Section>
  );
}

/** Culture appears now and then — like a magazine sidebar, not a trivia dashboard. */
export function cultureToday(items: CultureItem[], date: string) {
  if (!items.length) return [];
  const fresh = items.filter((c) => dayNumber(date) - dayNumber(c.availableAt) <= 3);
  if (fresh.length) return items;
  return dayNumber(date) % 3 === 0 ? items : [];
}

export function HistoricalContextCard({ kind, weather, culture, ad }: { kind: 'weather' | 'culture' | 'ad'; weather?: WeatherItem[]; culture?: CultureItem[]; ad?: AdItem }) {
  const era = useEra();
  const { date } = useSim();
  if (kind === 'weather') {
    if (!weather?.length) return null;
    return (
      <Section title={era.labels.weather} className="m-weather">
        <ul className="m-weather-list">
          {weather.map((w) => (
            <li key={w.id}>
              <span className="m-weather-city">{w.city}</span>
              <span className="m-weather-sky">{w.sky}</span>
              <span className="m-weather-temp">{w.high ?? '—'}°{w.low !== undefined && w.low !== null ? <small>/{w.low}°</small> : null}<Prov p={w.provenance} /></span>
            </li>
          ))}
        </ul>
        <p className="m-footnote">{era.module === 'terminal' ? 'OBSERVED HI/LO, NOAA' : era.module === 'print' ? 'Observed highs and lows.' : 'Observed high / low'}</p>
      </Section>
    );
  }
  if (kind === 'culture') {
    const list = cultureToday(culture ?? [], date);
    if (!list.length) return null;
    return (
      <Section title={era.labels.culture} className="m-culture">
        <ul className="m-culture-list">
          {list.slice(0, 4).map((c) => (
            <li key={c.id}><span className="m-culture-kind">{c.kind}</span><span className="m-culture-line">{c.line}<Prov p={c.provenance} /></span></li>
          ))}
        </ul>
      </Section>
    );
  }
  if (!ad) return null;
  return (
    <aside className="m-ad" aria-label={era.labels.advert}>
      <span className="m-ad-label">{era.labels.advert}</span>
      <div className="m-ad-brand">{ad.brand}</div>
      <div className="m-ad-headline">{ad.headline}</div>
      <p className="m-ad-body">{ad.body}</p>
      {ad.cta ? <span className="m-ad-cta">{ad.cta}</span> : null}
    </aside>
  );
}

/** Real scanned front pages from the Library of Congress (1770–1963). */
export function FrontPages({ pages, limit = 3 }: { pages: FrontPage[]; limit?: number }) {
  const era = useEra();
  if (!pages.length) return null;
  return (
    <Section title={era.module === 'print' ? 'On the Newsstands To-day' : 'Today’s Front Pages'} className="m-frontpages">
      <div className="m-fp-row">
        {pages.slice(0, limit).map((p) => (
          <a key={p.id} className="m-fp" href={p.pageUrl} target="_blank" rel="noreferrer" title={`${p.publicationTitle} — open the full page at the Library of Congress`}>
            <img src={p.imageUrl} alt={`Front page of ${p.publicationTitle}`} loading="lazy" />
            <span className="m-fp-name">{p.publicationTitle}<Prov p={p.provenance} /></span>
            {p.place ? <span className="m-fp-place">{p.place}</span> : null}
          </a>
        ))}
      </div>
    </Section>
  );
}

export function HistoricalTicker({ snap }: { snap: MarketSnapshot }) {
  const era = useEra();
  const { date, go } = useSim();
  if (era.ticker === 'none') return null;
  const quotes = [...snap.indexes, ...snap.movers, ...snap.commodities.slice(0, 2), ...snap.international.slice(0, 2)];
  if (!quotes.length) return null;
  const item = (q: (typeof quotes)[number], k: number) => (
    <button type="button" key={`${q.id}-${k}`} className={`m-tick is-${dir(q)}`} onClick={() => q.kind === 'stock' && go({ name: 'company', ticker: q.id })}>
      <span className="m-tick-sym">{q.kind === 'stock' ? q.symbol ?? q.id : q.name}</span>
      <span className="m-tick-val">{fmtQuoteValue(q, era, date)}<Est p={q.provenance} /></span>
      <span className="m-tick-chg">{fmtChange(q, era, date, q.kind === 'stock' ? 'abs' : 'pct')}</span>
    </button>
  );
  return (
    <div className={`m-ticker ticker-${era.ticker}`} role="marquee" aria-label="Market ticker">
      {era.ticker === 'bulletin' || era.ticker === 'crawl' ? <span className="m-ticker-flag">{era.ticker === 'crawl' ? 'Stocks' : 'Bulletin'}</span> : null}
      <div className="m-ticker-track">
        <div className="m-ticker-run">{quotes.map(item)}</div>
        <div className="m-ticker-run" aria-hidden>{quotes.map((q, k) => item(q, k + 100))}</div>
      </div>
    </div>
  );
}
