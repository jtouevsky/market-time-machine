/**
 * Era dashboards (2013 → 2026).
 *
 * One component renders the day's world as a set of designed cards — KPI tiles, lead story, chart,
 * news, movers, markets, economy, companies, sports, weather — and each era's stylesheet decides
 * where those cards sit, how they are surfaced (live tiles, paper, frosted glass, windows …) and
 * how they load. Everything reads the same HomeData and shared modules as every other era, so
 * company pages, search, portfolio and the sources panel stay exactly the same.
 */
import { Fragment, useEffect, useMemo, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { addMonths } from '../../../core/dates';
import type { NewsItem, PricePoint, Quote } from '../../../core/types';
import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { fmtChange, fmtQuoteValue, money, num } from '../../../theme/format';
import { Empty, Section, dir } from '../../modules/common';
import { ClosedNotice, CompaniesInNews, EconomicSnapshot, MarketSnapshot } from '../../modules/MarketSnapshot';
import { cultureToday, HistoricalContextCard, HistoricalSports } from '../../modules/Environment';
import { HistoricalNews, LeadStory, splitLead } from '../../modules/HistoricalNews';
import { PriceChart } from '../../modules/PriceChart';
import { Est } from '../../modules/Provenance';
import { Ad } from './home-helpers';

/* ------------------------------------------------------------------ plan per era */
export type Kind = 'metro' | 'm14' | 'flat15' | 'c16' | 'm17' | 'min18' | 'term19' | 'retail20' | 'glass21' | 'bento22' | 'res23' | 'spa24' | 'os25' | 'liq26';
type CardId = 'title' | 'ask' | 'brief' | 'pf' | 'kpis' | 'hero' | 'chart' | 'news' | 'movers' | 'markets' | 'econ' | 'cos' | 'sports' | 'weather' | 'ad' | 'ctx' | 'keys' | 'status';

interface Plan {
  cards: CardId[]; kpis: number; newsFrom: number; newsTo: number; summary: boolean; movers: number; sparks: boolean;
  /** cards that live in a second (side) column */ side?: CardId[];
  /** window title bars with collapse buttons */ bars?: boolean; chips?: boolean; avatars?: boolean; flip?: boolean; table?: boolean; cite?: boolean; glow?: boolean;
}

const KIND: Record<string, Kind> = {
  'metro-2013': 'metro', 'material-2014': 'm14', 'flat-2015': 'flat15', 'portal-2016': 'c16', 'material-2017': 'm17', 'minimal-2018': 'min18',
  'dataterm-2019': 'term19', 'retail-2020': 'retail20', 'glass-2021': 'glass21', 'bento-2022': 'bento22', 'research-2023': 'res23',
  'spatial-2024': 'spa24', 'finos-2025': 'os25', 'liquid-2026': 'liq26',
};
export const kindOf = (id: string): Kind => KIND[id] ?? 'flat15';

const PLAN: Record<Kind, Plan> = {
  metro: { cards: ['kpis', 'hero', 'news', 'movers', 'markets', 'econ', 'cos', 'sports', 'weather', 'ad'], kpis: 4, newsFrom: 0, newsTo: 6, summary: false, movers: 5, sparks: true, flip: true },
  m14: { cards: ['kpis', 'hero', 'news', 'movers', 'markets', 'econ', 'cos', 'sports', 'weather', 'ad'], kpis: 3, newsFrom: 0, newsTo: 6, summary: false, movers: 6, sparks: true },
  flat15: { cards: ['title', 'kpis', 'hero', 'news', 'movers', 'markets', 'econ', 'cos', 'sports', 'weather', 'ad'], kpis: 3, newsFrom: 0, newsTo: 7, summary: false, movers: 6, sparks: true },
  c16: { cards: ['kpis', 'hero', 'chart', 'news', 'movers', 'markets', 'cos', 'econ', 'sports', 'weather'], kpis: 4, newsFrom: 0, newsTo: 7, summary: false, movers: 6, sparks: true, avatars: true },
  m17: { cards: ['kpis', 'hero', 'chart', 'news', 'movers', 'markets', 'econ', 'cos', 'sports', 'weather'], kpis: 3, newsFrom: 0, newsTo: 7, summary: false, movers: 7, sparks: true, chips: true, avatars: true },
  min18: { cards: ['hero', 'kpis', 'news', 'chart', 'movers', 'econ', 'markets', 'cos', 'sports', 'weather'], side: ['chart', 'movers', 'econ', 'markets', 'cos', 'sports', 'weather'], kpis: 3, newsFrom: 0, newsTo: 8, summary: true, movers: 5, sparks: true },
  term19: { cards: ['keys', 'kpis', 'chart', 'movers', 'hero', 'news', 'markets', 'econ', 'cos', 'sports', 'weather'], kpis: 6, newsFrom: 0, newsTo: 8, summary: false, movers: 8, sparks: true, bars: true, table: true },
  retail20: { cards: ['pf', 'chart', 'kpis', 'hero', 'news', 'markets', 'cos', 'econ', 'movers', 'sports', 'weather'], side: ['movers', 'sports', 'weather'], kpis: 3, newsFrom: 0, newsTo: 6, summary: false, movers: 8, sparks: true, avatars: true },
  glass21: { cards: ['kpis', 'chart', 'movers', 'hero', 'news', 'econ', 'cos', 'sports', 'weather'], kpis: 3, newsFrom: 0, newsTo: 5, summary: false, movers: 6, sparks: true, avatars: true },
  bento22: { cards: ['kpis', 'chart', 'hero', 'news', 'movers', 'econ', 'cos', 'sports', 'weather'], kpis: 4, newsFrom: 0, newsTo: 5, summary: false, movers: 6, sparks: true, avatars: true },
  res23: { cards: ['ask', 'brief', 'news', 'cos', 'ctx', 'kpis', 'chart', 'movers', 'econ', 'sports', 'weather'], side: ['ctx', 'kpis', 'chart', 'movers', 'econ', 'sports', 'weather'], kpis: 3, newsFrom: 0, newsTo: 7, summary: true, movers: 6, sparks: true, cite: true },
  spa24: { cards: ['kpis', 'chart', 'hero', 'movers', 'news', 'econ', 'cos', 'sports', 'weather'], kpis: 3, newsFrom: 0, newsTo: 5, summary: false, movers: 6, sparks: true, avatars: true, glow: true },
  os25: { cards: ['kpis', 'chart', 'movers', 'hero', 'news', 'markets', 'econ', 'cos', 'sports', 'weather', 'status'], kpis: 4, newsFrom: 0, newsTo: 7, summary: false, movers: 8, sparks: true, bars: true },
  liq26: { cards: ['kpis', 'chart', 'movers', 'hero', 'news', 'econ', 'cos', 'sports', 'weather'], kpis: 3, newsFrom: 0, newsTo: 5, summary: false, movers: 6, sparks: true, avatars: true, glow: true },
};

const TITLES: Record<CardId, string> = {
  title: 'Today', ask: 'Ask', brief: 'Brief', pf: 'Portfolio', kpis: 'Markets', hero: 'Top story', chart: 'S&P 500', news: 'Headlines', movers: 'Movers', markets: 'Prices',
  econ: 'Economy', cos: 'In the news', sports: 'Scores', weather: 'Weather', ad: 'Sponsored', ctx: 'Sources', keys: 'Shortcuts', status: 'Status',
};

/* ------------------------------------------------------------------ sparklines */
const SERIES = new Map<string, Promise<PricePoint[]>>();
function useSeries(symbol: string | undefined): PricePoint[] | null | undefined {
  const { provider, date } = useSim();
  const [pts, setPts] = useState<PricePoint[] | null | undefined>(undefined);
  useEffect(() => {
    if (!symbol) { setPts(null); return; }
    let live = true;
    const key = `${symbol}|${date}`;
    let pr = SERIES.get(key);
    if (!pr) {
      pr = provider.getStockHistory(symbol, date, addMonths(date, -3)).catch(() => []);
      SERIES.set(key, pr);
      if (SERIES.size > 160) SERIES.delete(SERIES.keys().next().value as string);
    }
    setPts(undefined);
    pr.then((v) => { if (live) setPts(v); });
    return () => { live = false; };
  }, [provider, date, symbol]);
  return pts;
}

export function Spark({ symbol, area = false }: { symbol: string; area?: boolean }) {
  const pts = useSeries(symbol);
  const geo = useMemo(() => {
    if (!pts || pts.length < 2) return null;
    const vals = pts.map((p) => p.value);
    const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
    const xy = pts.map((p, i) => [(i / (pts.length - 1)) * 100, 28 - ((p.value - min) / span) * 24 - 2] as const);
    const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
    return { line, area: `${line}L100,30L0,30Z`, up: vals[vals.length - 1] >= vals[0], last: xy[xy.length - 1] };
  }, [pts]);
  if (pts === undefined) return <span className="d-spark d-skel" aria-hidden />;
  if (!geo) return <span className="d-spark is-empty" aria-hidden />;
  return (
    <svg className={`d-spark is-${geo.up ? 'up' : 'down'}`} viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden focusable="false">
      {area ? <path d={geo.area} className="d-spark-area" /> : null}
      <path d={geo.line} className="d-spark-line" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ------------------------------------------------------------------ small parts */
const ARROW = { up: '▲', down: '▼', flat: '–' } as const;
export function Chg({ q, mode = 'pct' }: { q: Quote; mode?: 'pct' | 'abs' }) {
  const era = useEra();
  const { date } = useSim();
  const d = dir(q);
  return <span className={`d-chg is-${d}`}><span className="d-arrow" aria-hidden>{ARROW[d]}</span>{fmtChange(q, era, date, mode)}</span>;
}

const hue = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
function Avatar({ q }: { q: Quote }) {
  const t = (q.symbol ?? q.id).replace(/[^A-Za-z]/g, '');
  return <span className="d-av" style={{ '--h': hue(q.id) } as CSSProperties} aria-hidden>{t.slice(0, 2).toUpperCase()}</span>;
}

/** Era-shaped placeholder while a module's provider answers. */
export function Skel({ shape = 'lines', n = 4 }: { shape?: 'lines' | 'tiles' | 'rows' | 'chart' | 'hero'; n?: number }) {
  return (
    <div className={`d-skel-wrap sk-${shape}`} role="status" aria-busy="true">
      <span className="sr-only">Loading</span>
      {shape === 'chart' ? <span className="d-skel sk-plot" aria-hidden /> : null}
      {shape === 'hero' ? <><span className="d-skel sk-h1" aria-hidden /><span className="d-skel sk-h1 w2" aria-hidden /><span className="d-skel w3" aria-hidden /></> : null}
      {shape !== 'chart' && shape !== 'hero' ? Array.from({ length: n }, (_, i) => (
        <span key={i} className="d-skel-row" aria-hidden style={{ '--i': i } as CSSProperties}>
          {shape === 'rows' ? <span className="d-skel sk-dot" /> : null}
          <span className="d-skel sk-bar" style={{ '--w': `${92 - ((i * 17) % 38)}%` } as CSSProperties} />
        </span>
      )) : null}
    </div>
  );
}

function Card({ id, label, bars, className = '', children }: { id: CardId; label?: string; bars?: boolean; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const title = label ?? TITLES[id];
  return (
    <section className={`d-card d-${id}${open ? '' : ' is-collapsed'}${className ? ` ${className}` : ''}`} data-card={id} aria-label={title}>
      {bars ? (
        <div className="d-bar">
          <span className="d-bar-dots" aria-hidden><i /><i /><i /></span>
          <span className="d-bar-title" aria-hidden>{title}</span>
          <button type="button" className="d-bar-btn" aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`} onClick={() => setOpen((o) => !o)}>{open ? '–' : '+'}</button>
        </div>
      ) : null}
      <div className="d-body">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ KPI tiles */
function kpiQuotes(data: HomeData, n: number): Quote[] {
  const m = data.markets;
  const idx = m.indexes.slice(0, Math.max(2, n - (m.digital.length ? 1 : 0)));
  return [...idx, ...m.digital.slice(0, 1), ...m.commodities, ...m.international].slice(0, n);
}

function Kpis({ data, plan, kind }: { data: HomeData; plan: Plan; kind: Kind }) {
  const era = useEra();
  const { date, go } = useSim();
  const quotes = kpiQuotes(data, plan.kpis);
  if (!quotes.length) return data.status.markets === 'loading' ? <Skel shape="tiles" n={plan.kpis} /> : <Empty>No quotations.</Empty>;
  if (plan.table) {
    return (
      <table className="m-table d-wl">
        <caption className="sr-only">Index watchlist</caption>
        <thead><tr><th scope="col">Symbol</th><th scope="col" className="m-num">Last</th><th scope="col" className="m-num">Chg %</th><th scope="col" className="d-wl-trend">3M</th></tr></thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.id} className={`m-quote is-${dir(q)}`}>
              <th scope="row">{q.name}</th>
              <td className="m-num">{fmtQuoteValue(q, era, date)}<Est p={q.provenance} /></td>
              <td className="m-num m-quote-chg"><Chg q={q} /></td>
              <td className="d-wl-trend"><Spark symbol={q.id} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <div className="d-tiles" role="list">
      {quotes.map((q, i) => {
        const open = q.kind === 'stock' ? () => go({ name: 'company', ticker: q.id }) : undefined;
        const front = (
          <>
            <span className="d-tile-name">{q.name}</span>
            <span className="d-tile-val">{fmtQuoteValue(q, era, date)}<Est p={q.provenance} /></span>
            <Chg q={q} />
            {plan.sparks ? <Spark symbol={q.id} area={kind !== 'metro'} /> : null}
          </>
        );
        const cls = `d-tile is-${dir(q)}`;
        const style = { '--i': i } as CSSProperties;
        if (plan.flip) {
          return (
            <div key={q.id} role="listitem" className={`${cls} d-flip`} style={style} tabIndex={0} aria-label={`${q.name} ${fmtQuoteValue(q, era, date)} ${fmtChange(q, era, date, 'pct')}`}>
              <span className="d-flip-in">
                <span className="d-face d-front">{front}</span>
                <span className="d-face d-back" aria-hidden>
                  <span className="d-tile-name">{q.symbol ?? q.name}</span>
                  <span className="d-back-line">Prev close {q.prev !== null ? num(q.prev, q.decimals) : '—'}</span>
                  <span className="d-back-line">As of {era.formatShort(q.asOf)}</span>
                </span>
              </span>
            </div>
          );
        }
        return open ? (
          <button key={q.id} type="button" role="listitem" className={`${cls} d-rp`} style={style} onClick={open}>{front}</button>
        ) : (
          <div key={q.id} role="listitem" className={cls} style={style}>{front}</div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ movers */
function Movers({ data, plan }: { data: HomeData; plan: Plan }) {
  const era = useEra();
  const { date, go } = useSim();
  const list = data.markets.movers.slice(0, plan.movers);
  return (
    <Section title={era.labels.movers} className="m-movers d-movers-sec" id="sec-movers">
      {data.status.markets === 'loading' ? <Skel shape="rows" n={Math.min(5, plan.movers)} /> : list.length ? (
        plan.table ? (
          <table className="m-table d-wl d-wl-movers">
            <thead><tr><th scope="col">Symbol</th><th scope="col" className="m-num">Last</th><th scope="col" className="m-num">Chg %</th><th scope="col" className="d-wl-trend">3M</th></tr></thead>
            <tbody>
              {list.map((q) => (
                <tr key={q.id} className={`m-quote is-${dir(q)}`}>
                  <th scope="row"><button type="button" className="m-link" onClick={() => go({ name: 'company', ticker: q.id })} title={q.name}>{q.symbol ?? q.id}</button></th>
                  <td className="m-num">{fmtQuoteValue(q, era, date)}<Est p={q.provenance} /></td>
                  <td className="m-num m-quote-chg"><Chg q={q} /></td>
                  <td className="d-wl-trend"><Spark symbol={q.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ul className="d-rows">
            {list.map((q) => (
              <li key={q.id}>
                <button type="button" className={`d-row is-${dir(q)} d-rp`} onClick={() => go({ name: 'company', ticker: q.id })}>
                  {plan.avatars ? <Avatar q={q} /> : null}
                  <span className="d-row-name"><b>{q.name}</b><small>{q.symbol ?? q.id}</small></span>
                  {plan.sparks ? <Spark symbol={q.id} /> : null}
                  <span className="d-row-val"><span>{fmtQuoteValue(q, era, date)}<Est p={q.provenance} /></span><Chg q={q} /></span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : <Empty>No listed issues in our files for this session.</Empty>}
    </Section>
  );
}

/* ------------------------------------------------------------------ news */
function NewsBlock({ data, items, plan, kind, onPick }: { data: HomeData; items: NewsItem[]; plan: Plan; kind: Kind; onPick?: (n: NewsItem | null) => void }) {
  const era = useEra();
  const { go, date } = useSim();
  const [cat, setCat] = useState('all');
  const pool = items.slice(plan.newsFrom);
  const cats = useMemo(() => [...new Set(pool.map((n) => n.category))].slice(0, 5), [pool]);
  const shown = (cat === 'all' ? pool : pool.filter((n) => n.category === cat)).slice(0, plan.newsTo - plan.newsFrom);
  const title = kind === 'metro' ? 'news' : era.labels.headlines;
  if (plan.cite) {
    return (
      <Section title={title} className="d-feed" id="sec-news">
        {data.status.news === 'loading' ? <Skel shape="lines" n={5} /> : shown.length ? (
          <ol className="d-feed-list">
            {shown.map((n, i) => (
              <li key={n.id} className={`d-feed-item cat-${n.category}`} onMouseEnter={() => onPick?.(n)} onFocus={() => onPick?.(n)} tabIndex={-1}>
                <span className="d-cite" aria-label={`Source ${i + 4}`}>{i + 4}</span>
                <div>
                  <h3 className="d-feed-title">{n.title}</h3>
                  {n.summary && n.summary !== n.title ? <p className="d-feed-sum">{n.summary}</p> : null}
                  <div className="d-feed-meta">
                    <span>{n.availableAt === date ? 'Today' : era.formatShort(n.availableAt)}</span><span className="m-story-cat">{n.category}</span>
                    {(n.tickers ?? []).slice(0, 3).map((t) => <button key={t} type="button" className="m-chip" onClick={() => go({ name: 'company', ticker: t })}>{t}</button>)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : <Empty>No dispatches received.</Empty>}
      </Section>
    );
  }
  return (
    <Section title={title} className="d-news-sec" id="sec-news">
      {plan.chips && cats.length > 1 ? (
        <div className="d-chips" role="group" aria-label="Filter headlines">
          {['all', ...cats].map((c) => <button key={c} type="button" className={`d-chip d-rp${c === cat ? ' is-on' : ''}`} aria-pressed={c === cat} onClick={() => setCat(c)}>{c === 'all' ? 'All' : c}</button>)}
        </div>
      ) : null}
      {data.status.news === 'loading' ? <Skel shape={plan.avatars ? 'rows' : 'lines'} n={5} /> : <HistoricalNews items={shown} limit={shown.length} withSummary={plan.summary} />}
    </Section>
  );
}

/* ------------------------------------------------------------------ extras */
function PortfolioHero() {
  const { portfolio, date, valueAt, go } = useSim();
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => { let live = true; valueAt(date).then((v) => { if (live) setTotal(v.total); }); return () => { live = false; }; }, [date, portfolio, valueAt]);
  const t = total ?? portfolio.cash;
  const pl = t - portfolio.startingCash;
  const plPct = portfolio.startingCash ? (pl / portfolio.startingCash) * 100 : 0;
  const empty = portfolio.lots.length === 0;
  const s = pl > 0 ? 'up' : pl < 0 ? 'down' : 'flat';
  return (
    <div className="d-pf">
      <span className="d-pf-label">Your portfolio</span>
      <span className="d-pf-big">{total === null ? <span className="d-skel sk-num" aria-hidden /> : money(t)}{total === null ? <span className="sr-only">Loading</span> : null}</span>
      <span className={`d-pf-pl is-${s}`}><span className="d-arrow" aria-hidden>{ARROW[s]}</span>{money(Math.abs(pl))} ({plPct >= 0 ? '+' : '−'}{Math.abs(plPct).toFixed(2)}%) <small>all time</small></span>
      <div className="d-pf-cta">
        <button type="button" className="d-cta d-rp" onClick={() => go(empty ? { name: 'search', q: '' } : { name: 'portfolio' })}>{empty ? 'Start investing' : 'View portfolio'}</button>
        <button type="button" className="d-cta-ghost d-rp" onClick={() => go({ name: 'portfolio' })}>Portfolio</button>
      </div>
    </div>
  );
}

function AskPanel({ data, lead }: { data: HomeData; lead?: NewsItem }) {
  const { go, date } = useSim();
  const era = useEra();
  const [q, setQ] = useState('');
  const top = data.markets.movers[0];
  const prompts = [
    'What moved the market today?', 'Biggest companies in the news', 'Interest rates', 'Inflation and jobs',
    ...(top ? [`Why is ${top.name} moving?`] : []), ...(lead?.tickers?.[0] ? [`What is happening at ${lead.tickers[0]}?`] : []),
  ].slice(0, 6);
  const run = (s: string) => { const v = s.trim().replace(/[?]/g, ''); if (v) go({ name: 'search', q: v }); };
  return (
    <form className="d-ask" role="search" onSubmit={(e) => { e.preventDefault(); run(q); }}>
      <label htmlFor="d-ask-input" className="d-ask-label">Ask about {era.formatDate(date)}</label>
      <div className="d-ask-row">
        <span className="d-ask-spark" aria-hidden>✦</span>
        <input id="d-ask-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about companies, events or numbers as of this day…" autoComplete="off" />
        <button type="submit" className="d-cta d-rp">Ask</button>
      </div>
      <div className="d-ask-chips" role="group" aria-label="Suggested questions">
        {prompts.map((p) => <button key={p} type="button" className="d-chip d-rp" onClick={() => run(p)}>{p}</button>)}
      </div>
    </form>
  );
}

function Brief({ data, lead, sel, onSel }: { data: HomeData; lead?: NewsItem; sel: number; onSel: (n: number) => void }) {
  const era = useEra();
  const { date, go } = useSim();
  const spx = data.markets.indexes.find((q) => q.id === '^GSPC' || q.id === 'SPX') ?? data.markets.indexes[0];
  const top = data.markets.movers[0];
  if (data.status.markets === 'loading' && data.status.news === 'loading') return <Skel shape="lines" n={4} />;
  const cite = (n: number) => <button type="button" className={`d-cite d-cite-btn${sel === n ? ' is-on' : ''}`} onClick={() => onSel(n)} aria-label={`Show source ${n}`}>{n}</button>;
  return (
    <div className="d-brief">
      <p className="d-brief-kicker">Summary · {era.formatDate(date)}</p>
      <p className="d-brief-text">
        {spx ? <>{spx.name} {spx.change === null ? 'was quoted at' : spx.change >= 0 ? 'rose' : 'fell'}{spx.changePct !== null ? ` ${Math.abs(spx.changePct).toFixed(2)}%` : ''} to {fmtQuoteValue(spx, era, date)}.{cite(1)} </> : null}
        {top ? <>{top.name} was among the biggest movers at {fmtChange(top, era, date, 'pct')}.{cite(2)} </> : null}
        {lead ? <>The leading story: “{lead.title}”{cite(3)}</> : null}
        {!spx && !top && !lead ? 'Nothing was reported for this day in the sources we hold.' : null}
      </p>
      {top ? <button type="button" className="d-link-btn" onClick={() => go({ name: 'company', ticker: top.id })}>Open {top.symbol ?? top.id}</button> : null}
    </div>
  );
}

function SourcesPanel({ data, lead, sel, picked }: { data: HomeData; lead?: NewsItem; sel: number; picked: NewsItem | null }) {
  const { date, go } = useSim();
  const era = useEra();
  const top = data.markets.movers[0];
  const rows: { n: number; title: string; meta: string; act?: () => void }[] = [
    { n: 1, title: 'Index and market quotes', meta: `Session ${era.formatShort(data.markets.sessionDate ?? date)}` },
    ...(top ? [{ n: 2, title: `${top.name} (${top.symbol ?? top.id})`, meta: 'Company page', act: () => go({ name: 'company', ticker: top.id }) }] : []),
    ...(lead ? [{ n: 3, title: lead.title, meta: `${lead.publication && lead.publication !== 'Wikipedia' ? lead.publication : lead.source} · ${era.formatShort(lead.availableAt)}` }] : []),
  ];
  return (
    <div className="d-src">
      <ol className="d-src-list">
        {rows.map((r) => (
          <li key={r.n} className={sel === r.n ? 'is-on' : ''}>
            <span className="d-cite">{r.n}</span>
            <span><b>{r.act ? <button type="button" className="m-link" onClick={r.act}>{r.title}</button> : r.title}</b><small>{r.meta}</small></span>
          </li>
        ))}
      </ol>
      <div className="d-ctx" aria-live="polite">
        <span className="d-ctx-label">In context</span>
        {picked ? (
          <>
            <b>{picked.title}</b>
            <small>{picked.publication && picked.publication !== 'Wikipedia' ? picked.publication : picked.source} · {picked.category} · {era.formatShort(picked.availableAt)}</small>
            {picked.tickers?.length ? <span className="d-ctx-tickers">{picked.tickers.slice(0, 4).map((t) => <button key={t} type="button" className="m-chip" onClick={() => go({ name: 'company', ticker: t })}>{t}</button>)}</span> : null}
          </>
        ) : <small>Hover or focus a headline to see where it comes from.</small>}
      </div>
    </div>
  );
}

function Status({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const closed = data.markets.closedReason;
  const n = data.markets.indexes.length + data.markets.movers.length + data.markets.commodities.length + data.markets.digital.length;
  return (
    <div className="d-status" role="status">
      <span className={`d-led ${closed ? 'is-closed' : 'is-open'}`} aria-hidden />
      <span>{closed ? `Markets closed · ${closed}` : 'Markets open'}</span>
      <span>Session {era.formatShort(data.markets.sessionDate ?? date)}</span>
      <span>{n} quotes</span>
      <span>{data.news.length} stories</span>
      <span className="d-status-hint"><kbd>⌘K</kbd> command palette</span>
    </div>
  );
}

function Keys() {
  return (
    <ul className="d-keys" aria-label="Keyboard shortcuts">
      {[['⌘K', 'Command palette'], ['/', 'Search'], ['G H', 'Home'], ['G P', 'Portfolio'], ['G S', 'Search page']].map(([k, l]) => (
        <li key={k}><kbd>{k}</kbd><span>{l}</span></li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ the dashboard */
export function Dashboard({ data }: { data: HomeData }) {
  const era = useEra();
  const { date } = useSim();
  const kind = kindOf(era.exp.id);
  const plan = PLAN[kind];
  const { lead, rest } = useMemo(() => splitLead(data.news, date), [data.news, date]);
  const [sel, setSel] = useState(0);
  const [picked, setPicked] = useState<NewsItem | null>(null);
  const spx = data.markets.indexes.find((q) => q.id === '^GSPC' || q.id === 'SPX') ?? data.markets.indexes[0];
  const bars = plan.bars;

  const tilt = (e: RPointerEvent<HTMLDivElement>) => {
    if (!plan.glow && kind !== 'spa24') return;
    if (e.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = (e.target as HTMLElement).closest<HTMLElement>('.d-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    card.style.setProperty('--ry', `${((x - 0.5) * 7).toFixed(2)}deg`);
    card.style.setProperty('--rx', `${((0.5 - y) * 5).toFixed(2)}deg`);
  };
  const untilt = (e: RPointerEvent<HTMLDivElement>) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.d-card');
    if (!card) return;
    card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
  };

  const card = (id: CardId): ReactNode => {
    switch (id) {
      case 'title':
        return <Card id="title"><h2 className="d-large-title">Today</h2><p className="d-large-sub">{era.formatDate(date)}</p></Card>;
      case 'ask':
        return <Card id="ask"><AskPanel data={data} lead={lead} /></Card>;
      case 'brief':
        return <Card id="brief"><Brief data={data} lead={lead} sel={sel} onSel={setSel} /></Card>;
      case 'pf':
        return <Card id="pf"><PortfolioHero /></Card>;
      case 'kpis':
        return <Card id="kpis" bars={bars} label={kind === 'term19' ? 'Indices' : undefined}><Kpis data={data} plan={plan} kind={kind} /></Card>;
      case 'hero':
        return <Card id="hero" bars={bars} label="Top story">{data.status.news === 'loading' ? <Skel shape="hero" /> : <LeadStory item={lead} />}</Card>;
      case 'chart':
        return (
          <Card id="chart" bars={bars} label={spx ? spx.name : 'Index'}>
            {spx ? (
              <div className="d-chart-head">
                <span className="d-chart-name">{spx.name}</span>
                <span className="d-chart-val">{fmtQuoteValue(spx, era, date)}</span>
                <Chg q={spx} />
              </div>
            ) : data.status.markets === 'loading' ? <Skel shape="lines" n={1} /> : null}
            <div className="cx-chart"><PriceChart symbol="^GSPC" title="1Y" /></div>
          </Card>
        );
      case 'news':
        return (
          <Card id="news" bars={bars}>
            <NewsBlock data={data} items={rest} plan={plan} kind={kind} onPick={plan.cite ? setPicked : undefined} />
          </Card>
        );
      case 'movers':
        return data.status.markets === 'ready' && !data.markets.movers.length ? (
          <Card id="movers" bars={bars}><MarketSnapshot snap={data.markets} groups={['commodities', 'digital', 'rates']} title={era.labels.markets} /></Card>
        ) : <Card id="movers" bars={bars}><Movers data={data} plan={plan} /></Card>;
      case 'markets':
        return (
          <Card id="markets" bars={bars}>
            {data.status.markets === 'loading' ? <Skel shape="lines" n={5} /> : <MarketSnapshot snap={data.markets} groups={['commodities', 'rates', 'international', 'digital']} />}
          </Card>
        );
      case 'econ':
        return <Card id="econ" bars={bars}><EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} /></Card>;
      case 'cos':
        return <Card id="cos" bars={bars}><CompaniesInNews news={data.news} snap={data.markets} /></Card>;
      case 'sports':
        return data.sports.length || cultureToday(data.culture, date).length ? (
          <Card id="sports" bars={bars}><div id="sec-sports"><HistoricalSports items={data.sports} limit={5} /></div><HistoricalContextCard kind="culture" culture={data.culture} /></Card>
        ) : null;
      case 'weather':
        return data.weather.length ? <Card id="weather" bars={bars}><HistoricalContextCard kind="weather" weather={data.weather} /></Card> : null;
      case 'ad':
        return data.ads.length ? <Card id="ad"><Ad data={data} /></Card> : null;
      case 'ctx':
        return <Card id="ctx"><SourcesPanel data={data} lead={lead} sel={sel} picked={picked} /></Card>;
      case 'keys':
        return <Card id="keys"><Keys /></Card>;
      case 'status':
        return <Card id="status"><Status data={data} /></Card>;
    }
  };

  // research: pressing "/" focuses the ask box
  useEffect(() => {
    if (kind !== 'res23') return;
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)) { e.preventDefault(); document.getElementById('d-ask-input')?.focus(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [kind]);

  return (
    <div className={`home dash dash-${kind}`} data-kind={kind} onPointerMove={tilt} onPointerOut={untilt}>
      <ClosedNotice snap={data.markets} />
      <div className="d-grid">
        {plan.side ? (
          <>
            <div className="d-main">{plan.cards.filter((id) => !plan.side!.includes(id)).map((id) => <Fragment key={id}>{card(id)}</Fragment>)}</div>
            <div className="d-side">{plan.cards.filter((id) => plan.side!.includes(id)).map((id) => <Fragment key={id}>{card(id)}</Fragment>)}</div>
          </>
        ) : plan.cards.map((id) => <Fragment key={id}>{card(id)}</Fragment>)}
      </div>
    </div>
  );
}
