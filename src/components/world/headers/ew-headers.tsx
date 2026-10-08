import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { HistoricalSearch } from '../../modules/HistoricalSearch';
import { CATS } from '../families/home-helpers';
import { scrollTo } from './common';

/** Plain hypertext document header (Mosaic and Netscape eras): a title, a line of links, a search form. */
export function DocHeader() {
  const era = useEra();
  const { date, exit, go, view } = useSim();
  const L = era.labels;
  const link = (id: string, label: string, run: () => void) => <a href={`#${id}`} onClick={(e) => { e.preventDefault(); run(); }}>{label}</a>;
  return (
    <header className="ew-doc">
      <h1 className="ew-doc-title">{era.publication}</h1>
      <p className="ew-doc-tag">{era.motto} &mdash; {era.formatDate(date)}</p>
      <nav className="ew-doc-links" aria-label="Site">
        {link('home', 'Home', () => go({ name: 'home' }))} | {link('whatsnew', "What's New", () => { go({ name: 'home' }); scrollTo('sec-news'); })} | {link('stocks', L.portfolio, () => go({ name: 'portfolio' }))} | {link('search', 'Search', () => go({ name: 'search', q: '' }))} | {link('exit', L.exit, exit)}
      </nav>
      <div className="ew-cool" role="group" aria-label="Quick buttons">
        <button type="button" className="ew-cool-btn is-new" onClick={() => { go({ name: 'home' }); scrollTo('sec-news'); }}>What's New!</button>
        <button type="button" className="ew-cool-btn is-cool" onClick={() => go({ name: 'portfolio' })}>What's Cool!</button>
        <button type="button" className="ew-cool-btn is-net" onClick={() => go({ name: 'search', q: '' })}>Net Search</button>
      </div>
      <div className="h-dir-search"><HistoricalSearch /></div>
      <hr className="ew-doc-rule" />
      {view.name === 'home' ? (
        <dl className="ew-doc-index">
          <dt>{link('i-news', "What's New", () => { scrollTo('sec-news'); })}</dt><dd>the day's headlines, newest first</dd>
          <dt>{link('i-stocks', L.portfolio, () => go({ name: 'portfolio' }))}</dt><dd>buy and sell with a practice account</dd>
          <dt>{link('i-search', 'Search', () => go({ name: 'search', q: '' }))}</dt><dd>look up a company, a topic or a ticker</dd>
        </dl>
      ) : null}
    </header>
  );
}

/** Personal-homepage header: hand-made title, tiny nav and the search form. */
export function PersonalHeader() {
  const era = useEra();
  const { date, exit, go } = useSim();
  const L = era.labels;
  const link = (id: string, label: string, run: () => void) => <a href={`#${id}`} onClick={(e) => { e.preventDefault(); run(); }}>{label}</a>;
  return (
    <header className="ew-pers">
      <h1 className="ew-pers-title"><span>~</span> {era.publication} <span>~</span></h1>
      <p className="ew-pers-tag">{era.motto} <small>(last updated {era.formatShort(date)})</small></p>
      <nav className="ew-pers-links" aria-label="Site">
        {link('home', 'Home', () => go({ name: 'home' }))} * {link('whatsnew', "What's New", () => { go({ name: 'home' }); scrollTo('sec-news'); })} * {link('stocks', 'My Stock Picks', () => go({ name: 'portfolio' }))} * {link('search', 'Search', () => go({ name: 'search', q: '' }))} * {link('exit', L.exit, exit)}
      </nav>
      <div className="h-dir-search"><HistoricalSearch /></div>
    </header>
  );
}

/** Windows-98-era site header: title strip and a dense grid of beveled links. */
export function Win98Header() {
  const era = useEra();
  const { date, view, go } = useSim();
  const items: { label: string; to: Parameters<typeof go>[0]; on: boolean }[] = [
    { label: 'Home', to: { name: 'home' }, on: view.name === 'home' },
    { label: 'My Portfolio', to: { name: 'portfolio' }, on: view.name === 'portfolio' },
    { label: 'Search', to: { name: 'search', q: '' }, on: view.name === 'search' && !view.q },
    ...CATS.map((c) => ({ label: c.label, to: { name: 'search', q: c.label.toLowerCase() } as const, on: view.name === 'search' && view.q === c.label.toLowerCase() })),
  ];
  return (
    <header className="ew98-head">
      <div className="ew98-brand"><span className="ew98-logo">{era.publication}</span><span className="ew98-motto">{era.motto}</span><span className="ew98-date">{era.formatDate(date)}</span></div>
      <nav className="ew98-grid" aria-label="Site links">
        {items.map((it) => <button key={it.label} type="button" className={`ew98-link ew-go${it.on ? ' is-on' : ''}`} aria-current={it.on ? 'page' : undefined} onClick={() => go(it.to)}>{it.label}</button>)}
      </nav>
      <div className="ew98-search"><HistoricalSearch /></div>
    </header>
  );
}
