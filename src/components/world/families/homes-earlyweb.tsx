import React from 'react';
import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { fmtChange, fmtQuoteValue, headline } from '../../../theme/format';
import { Loading } from '../../modules/common';
import { HistoricalContextCard } from '../../modules/Environment';
import { EconomicSnapshot } from '../../modules/MarketSnapshot';
import { Ad, byCategory, CATS, Markets, Movers, Sports } from './home-helpers';

// ================================================================== 1995–1998: early-web directory
const TOPICS: Record<string, string[]> = {
  'Business & Economy': ['Markets', 'Economy', 'Funds'],
  'News & Media': ['World', 'Weather', 'Archives'],
  'Companies': ['Listings', 'Earnings', 'Directory'],
  'Computers & Internet': ['Software', 'Hardware', 'Web'],
  'Government': ['Policy', 'Elections', 'Law'],
  'Entertainment': ['Music', 'Film', 'Television'],
  'Recreation & Sports': ['Scores', 'Leagues', 'Travel'],
};
const isFresh = (d: string, a: string) => { const t = Date.parse(a), n = Date.parse(d); return Number.isFinite(t) && Number.isFinite(n) && n - t <= 7 * 864e5 && n >= t; };

/** The directory's footer strip: plain text links like a 1997 web index. */
export function DirFooter() {
  const { go, exit } = useSim();
  const l = (label: string, run: () => void) => <a href="#footer" onClick={(e) => { e.preventDefault(); run(); }}>{label}</a>;
  return (
    <div className="dir-footer">
      <p>{l('Home', () => go({ name: 'home' }))} - {l('Stock Quotes', () => go({ name: 'portfolio' }))} - {l('Search', () => go({ name: 'search', q: '' }))} - {l('Finance Index', () => go({ name: 'search', q: 'finance' }))} - {l('Leave Site', exit)}</p>
      <p className="dir-footer-small">Suggest a link &middot; Help &middot; About MarketTime &middot; Advertising information</p>
    </div>
  );
}

export function DirectoryHome({ data }: { data: HomeData }) {
  const { date, go } = useSim();
  const era = useEra();
  const cats = byCategory(data.news);
  const idx = data.markets.indexes;
  return (
    <div className="home home-dir">
      <table className="dir-quotes" aria-label="Today's quotes">
        <caption>Today's Quotes <small>{era.formatShort(date)}</small></caption>
        <thead><tr><th scope="col">Index</th><th scope="col">Last</th><th scope="col">Change</th></tr></thead>
        <tbody>
          {idx.length ? idx.map((q) => (
            <tr key={q.id}><th scope="row">{q.name}</th><td className="dir-q-num">{fmtQuoteValue(q, era, date)}</td><td className={`dir-q-num ${(q.change ?? 0) >= 0 ? 'm-up' : 'm-down'}`}>{fmtChange(q, era, date, 'abs')}</td></tr>
          )) : <tr><td colSpan={3}>Loading quotes...</td></tr>}
        </tbody>
      </table>
      <table className="dir-cats" role="presentation">
        <tbody>
          {Array.from({ length: Math.ceil(CATS.length / 2) }).map((_, r) => (
            <tr key={r}>
              {CATS.slice(r * 2, r * 2 + 2).map((c) => {
                const items = data.news.filter((n) => c.key.includes(n.category));
                return (
                  <td key={c.dir}>
                    <span className="dir-ball" aria-hidden />
                    <a href={`#${c.dir}`} className="dir-cat" onClick={(e) => { e.preventDefault(); go({ name: 'search', q: c.label.toLowerCase() }); }}>{c.dir}</a>
                    <small> ({items.length})</small>{items.some((n) => isFresh(date, n.availableAt)) ? <span className="dir-new small">new</span> : null}
                    <div className="dir-topics">{(TOPICS[c.dir] ?? []).map((t, i) => <React.Fragment key={t}>{i ? ' \u00b7 ' : ''}<a href={`#${t}`} onClick={(e) => { e.preventDefault(); go({ name: 'search', q: t.toLowerCase() }); }}>{t}</a></React.Fragment>)}</div>
                    <div className="dir-sub">{items.slice(0, 2).map((n) => <span key={n.id}>{headline(n.title, era).slice(0, 44)}…</span>)}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="dir-hr" />
      <div className="dir-two">
        <div>
          <h2 className="dir-h" id="sec-news">What's New <span className="dir-new">NEW!</span></h2>
          {data.status.news === 'loading' ? <Loading /> : (
            <ul className="dir-list">
              {data.news.slice(0, 12).map((n) => (
                <li key={n.id}>
                  <a href={n.sourceUrl ?? '#'} onClick={(e) => { if (!n.sourceUrl) e.preventDefault(); }} target="_blank" rel="noreferrer">{headline(n.title, era)}</a>
                  {n.availableAt === date ? <span className="dir-new small">NEW</span> : <small> - {era.formatShort(n.availableAt)}</small>}
                </li>
              ))}
            </ul>
          )}
          <h2 className="dir-h">More Headlines</h2>
          {cats.slice(0, 3).map((c) => (
            <p key={c.label} className="dir-more"><b>{c.label}:</b> {c.items.slice(0, 3).map((n, i) => <React.Fragment key={n.id}>{i ? ' - ' : ''}<a href="#more" onClick={(e) => { e.preventDefault(); go({ name: 'search', q: c.label.toLowerCase() }); }}>{headline(n.title, era).slice(0, 60)}</a></React.Fragment>)}</p>
          ))}
        </div>
        <div className="dir-side">
          <Markets data={data} groups={['indexes', 'rates', 'international']} />
          <Movers data={data} limit={5} />
          <HistoricalContextCard kind="weather" weather={data.weather} />
          <Sports data={data} limit={6} />
          <HistoricalContextCard kind="culture" culture={data.culture} />
          <Ad data={data} />
        </div>
      </div>
      <hr className="dir-hr" />
      <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />
      <DirFooter />
    </div>
  );
}

/** Footer address block for the hypertext-era documents (Mosaic and Netscape). */
export function DocAddress() {
  const { date } = useSim();
  const era = useEra();
  return (
    <address className="doc-address">
      <b>{era.publication}</b> &mdash; maintained by the MarketTime editors<br />
      Document last modified {era.formatDate(date)}<br />
      Location: <code>http://www.markettime.example/</code> &middot; Comments: <a href="#mail" onClick={(e) => e.preventDefault()}>webmaster@markettime.example</a>
    </address>
  );
}

