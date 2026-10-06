/**
 * Front pages. Each information architecture arranges the day with its own hierarchy, density
 * and reading order — a broadsheet leads with a banner and stock tables, a 1960s report with a
 * television bulletin and a channel dial, a terminal with panes and a command line, a 1996 site
 * with a directory and "What's New", a modern app with cards.
 */
import React from 'react';
import type { NewsItem } from '../../core/types';
import { useSim } from '../../state/simulation';
import type { HomeData } from '../../state/useHistorical';
import { useEra } from '../../theme/EraThemeProvider';
import { fmtChange, fmtQuoteValue, headline } from '../../theme/format';
import { Loading, Section } from '../modules/common';
import { FrontPages, HistoricalContextCard, HistoricalSports } from '../modules/Environment';
import { HistoricalNews, LeadStory, splitLead } from '../modules/HistoricalNews';
import { ClosedNotice, CompaniesInNews, EconomicSnapshot, MarketMovers, MarketSnapshot } from '../modules/MarketSnapshot';
import { PriceChart } from '../modules/PriceChart';
import { Est } from '../modules/Provenance';

const CATS: { key: NewsItem['category'][]; label: string; dir: string }[] = [
  { key: ['finance', 'economy', 'markets'], label: 'Finance', dir: 'Business & Economy' },
  { key: ['world'], label: 'World', dir: 'News & Media' },
  { key: ['business'], label: 'Business', dir: 'Companies' },
  { key: ['technology', 'science'], label: 'Technology', dir: 'Computers & Internet' },
  { key: ['politics'], label: 'Politics', dir: 'Government' },
  { key: ['culture'], label: 'Culture', dir: 'Entertainment' },
  { key: ['sports'], label: 'Sports', dir: 'Recreation & Sports' },
];
const byCategory = (items: NewsItem[]) => CATS.map((c) => ({ ...c, items: items.filter((i) => c.key.includes(i.category)) })).filter((c) => c.items.length);

function Ad({ data, i = 0 }: { data: HomeData; i?: number }) {
  const { date } = useSim();
  if (!data.ads.length) return null;
  const ad = data.ads[(i + Number(date.slice(8, 10))) % data.ads.length];
  return <HistoricalContextCard kind="ad" ad={ad} />;
}

/** Markets block that shows an era-voiced placeholder while loading. */
function Markets({ data, groups, title }: { data: HomeData; groups?: Parameters<typeof MarketSnapshot>[0]['groups']; title?: string }) {
  const era = useEra();
  if (data.status.markets === 'loading') return <Section title={title ?? era.labels.markets} id="sec-markets"><Loading /></Section>;
  return <div id="sec-markets"><MarketSnapshot snap={data.markets} groups={groups} title={title} /></div>;
}
function News({ data, items, title, limit, withSummary = true, className }: { data: HomeData; items: NewsItem[]; title: string; limit?: number; withSummary?: boolean; className?: string }) {
  return (
    <Section title={title} id="sec-news">
      {data.status.news === 'loading' ? <Loading /> : <HistoricalNews items={items} limit={limit} withSummary={withSummary} className={className} />}
    </Section>
  );
}
const Sports = ({ data, limit }: { data: HomeData; limit?: number }) => <div id="sec-sports"><HistoricalSports items={data.sports} limit={limit} /></div>;
const Movers = ({ data, limit }: { data: HomeData; limit?: number }) => <div id="sec-movers">{data.status.markets === 'ready' ? <MarketMovers snap={data.markets} limit={limit} /> : null}</div>;

// ================================================================== 1700s–1899
export function ArchiveHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-archive">
      <div className="paper-cols">
        <div className="col col-lead">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}<HistoricalNews items={rest.slice(0, 3)} /></div>
        <div className="col"><Markets data={data} /><EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} /></div>
        <div className="col"><News data={data} items={rest.slice(3, 12)} title={era.labels.headlines} /></div>
        <div className="col">
          <HistoricalContextCard kind="weather" weather={data.weather} />
          <HistoricalContextCard kind="culture" culture={data.culture} />
          <Sports data={data} limit={4} />
          <Ad data={data} />
          <FrontPages pages={data.frontPages} limit={1} />
          <Ad data={data} i={1} />
        </div>
      </div>
    </div>
  );
}

// ================================================================== 1900–1945
export function BroadsheetHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className={`home home-broadsheet bs-${era.sub}`}>
      {lead ? <div className="banner"><h1 className="banner-hl">{headline(lead.title, era)}</h1></div> : <div className="banner"><Loading /></div>}
      <div className="paper-cols">
        <div className="col col-lead">
          <LeadStory item={lead} />
          <HistoricalNews items={rest.slice(0, 4)} />
        </div>
        <div className="col col-market">
          <Markets data={data} groups={['indexes', 'rates', 'commodities', 'international']} title={era.labels.markets} />
          <Movers data={data} />
        </div>
        <div className="col">
          <News data={data} items={rest.slice(4, 12)} title={era.labels.headlines} withSummary={false} />
          <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />
        </div>
        <div className="col col-side">
          <HistoricalContextCard kind="weather" weather={data.weather} />
          <Sports data={data} limit={6} />
          <HistoricalContextCard kind="culture" culture={data.culture} />
          <Ad data={data} />
          <CompaniesInNews news={data.news} snap={data.markets} />
          <Ad data={data} i={1} />
        </div>
      </div>
      <FrontPages pages={data.frontPages} limit={4} />
    </div>
  );
}

// ================================================================== 1946–1959
export function MidcenturyHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-mid">
      <div className="mid-hero">
        <div className="mid-hero-flag">{lead?.availableAt === date ? 'Bulletin' : 'Latest'}</div>
        {data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}
      </div>
      <div className="mid-grid">
        <div className="mid-news"><News data={data} items={rest} limit={9} title={era.labels.headlines} /></div>
        <div className="mid-markets">
          <Markets data={data} groups={['indexes', 'commodities', 'international']} />
          <Movers data={data} />
        </div>
        <div className="mid-side">
          <EconomicSnapshot economy={data.economy} snap={data.markets} />
          <Sports data={data} limit={5} />
          <HistoricalContextCard kind="weather" weather={data.weather} />
          <HistoricalContextCard kind="culture" culture={data.culture} />
          <Ad data={data} />
        </div>
      </div>
      <FrontPages pages={data.frontPages} limit={4} />
    </div>
  );
}

// ================================================================== 1960–1979: newspaper + television
export function BroadcastHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  const live = lead?.availableAt === date;
  return (
    <div className="home home-bc">
      <div className="bc-stage">
        <div className="bc-tv" role="img" aria-label="Television bulletin">
          <div className="bc-screen">
            <span className="bc-chyron">{live ? 'Bulletin' : 'Late News'}</span>
            {data.status.news === 'loading' ? <Loading /> : lead ? (
              <>
                <h1 className="bc-hl">{headline(lead.title, era)}</h1>
                {lead.summary ? <p className="bc-deck">{lead.summary}</p> : null}
                <span className="bc-src">{lead.publication && lead.publication !== 'Wikipedia' ? lead.publication : era.formatShort(lead.availableAt)}</span>
              </>
            ) : null}
          </div>
          <div className="bc-tv-panel" aria-hidden><span className="bc-dial" /><span className="bc-dial small" /><span className="bc-grille" /></div>
        </div>
        <div className="bc-board">
          <Markets data={data} groups={['indexes', 'rates']} title={era.labels.markets} />
        </div>
      </div>
      {data.weather.length ? (
        <div className="bc-wx-strip" aria-label={era.labels.weather}>
          <span className="bc-wx-label">{era.labels.weather}</span>
          {data.weather.map((w) => <span key={w.id} className="bc-wx">{w.city} <b>{w.high}°</b>/{w.low}° <small>{w.sky}</small></span>)}
        </div>
      ) : null}
      <div className="bc-cols">
        <News data={data} items={rest} limit={8} title={era.labels.headlines} />
        <div>
          <Movers data={data} limit={6} />
          <CompaniesInNews news={data.news} snap={data.markets} />
        </div>
        <div>
          <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />
          <HistoricalContextCard kind="culture" culture={data.culture} />
          <Ad data={data} />
        </div>
      </div>
      <SportsCrawl data={data} />
      <FrontPages pages={data.frontPages} limit={4} />
    </div>
  );
}

function SportsCrawl({ data }: { data: HomeData }) {
  const era = useEra();
  const results = data.sports.filter((s) => 'league' in s) as { id: string; league: string; away: string; awayScore: number; home: string; homeScore: number }[];
  if (!results.length) return <div id="sec-sports"><HistoricalSports items={data.sports} /></div>;
  const line = results.map((r) => `${r.league}: ${r.away} ${r.awayScore}, ${r.home} ${r.homeScore}`);
  return (
    <div className="bc-crawl" id="sec-sports" aria-label={era.labels.sports}>
      <span className="bc-crawl-flag">{era.labels.sports}</span>
      <div className="m-ticker-track"><div className="m-ticker-run">{line.map((l, i) => <span key={i}>{l}</span>)}</div><div className="m-ticker-run" aria-hidden>{line.map((l, i) => <span key={i}>{l}</span>)}</div></div>
    </div>
  );
}

// ================================================================== 1980–1994: terminal panes
export function TerminalHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-term">
      <div className="term-pane term-top">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
      <div className="term-pane term-news" id="sec-news"><Section title="NEWS WIRE  <N>">{data.status.news === 'loading' ? <Loading /> : <HistoricalNews items={rest} limit={14} />}</Section></div>
      <div className="term-pane term-mkts"><Markets data={data} groups={['indexes', 'international', 'commodities', 'rates']} title="WORLD MKTS  <W>" /></div>
      <div className="term-pane term-movers"><Movers data={data} /></div>
      <div className="term-pane term-econ"><EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} /></div>
      <div className="term-pane term-co"><CompaniesInNews news={data.news} snap={data.markets} /></div>
      <div className="term-pane term-misc" id="sec-sports">
        <HistoricalSports items={data.sports} limit={8} />
        <HistoricalContextCard kind="culture" culture={data.culture} />
        <HistoricalContextCard kind="weather" weather={data.weather} />
      </div>
      {data.ads.length ? <div className="term-pane term-ad"><Ad data={data} /></div> : null}
    </div>
  );
}

// ================================================================== 1995–1998: early-web directory
export function DirectoryHome({ data }: { data: HomeData }) {
  const { date, go } = useSim();
  const era = useEra();
  const cats = byCategory(data.news);
  const idx = data.markets.indexes;
  return (
    <div className="home home-dir">
      <div className="dir-marquee" aria-label="Market summary">
        {idx.length ? idx.map((q) => <span key={q.id}>{q.name} <b>{fmtQuoteValue(q, era, date)}</b> <span className={(q.change ?? 0) >= 0 ? 'm-up' : 'm-down'}>{fmtChange(q, era, date, 'abs')}</span></span>) : <span>Loading quotes...</span>}
      </div>
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
                    <small> ({items.length})</small>
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
    </div>
  );
}

// ================================================================== 1999–2002: portal / search hybrid
export function PortalHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-portal">
      <div className="portal-left">
        <Markets data={data} groups={['indexes', 'international', 'commodities', 'rates']} />
        <Movers data={data} />
      </div>
      <div className="portal-main">
        <Section title={era.labels.topStories} id="sec-news">
          {data.status.news === 'loading' ? <Loading /> : <><LeadStory item={lead} /><HistoricalNews items={rest.slice(0, 5)} withSummary={false} className="news-links" /></>}
        </Section>
        <div className="portal-cats">
          {byCategory(rest.slice(5)).slice(0, 6).map((c) => (
            <Section key={c.label} title={c.label}><HistoricalNews items={c.items} limit={4} withSummary={false} className="news-links" /></Section>
          ))}
        </div>
        <CompaniesInNews news={data.news} snap={data.markets} />
        <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />
      </div>
      <div className="portal-right">
        <Ad data={data} />
        <HistoricalContextCard kind="weather" weather={data.weather} />
        <Sports data={data} limit={6} />
        <HistoricalContextCard kind="culture" culture={data.culture} />
        <Ad data={data} i={1} />
      </div>
    </div>
  );
}

// ================================================================== 2003–2009
export function Web2Home({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-web2">
      <div className="w2-main">
        <div className="w2-feature">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
        <div className="w2-two">
          <News data={data} items={rest} limit={8} withSummary={false} title={era.labels.headlines} />
          <CompaniesInNews news={data.news} snap={data.markets} />
        </div>
        <div className="w2-two">
          <EconomicSnapshot economy={data.economy} snap={data.markets} />
          <div><Sports data={data} limit={6} /><HistoricalContextCard kind="culture" culture={data.culture} /></div>
        </div>
      </div>
      <div className="w2-side">
        <Markets data={data} groups={['indexes', 'commodities', 'international']} />
        <Movers data={data} />
        <HistoricalContextCard kind="weather" weather={data.weather} />
        <Ad data={data} />
      </div>
    </div>
  );
}

// ================================================================== 2010–2012
export function MobileHome({ data }: { data: HomeData }) {
  const { date, go } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  const tiles = [...data.markets.indexes, ...data.markets.commodities.slice(0, 2), ...data.markets.digital.slice(0, 1)];
  return (
    <div className="home home-mobile">
      <ClosedNotice snap={data.markets} />
      <div className="mob-tiles" role="list" id="sec-markets">
        {data.status.markets === 'loading' ? <Loading /> : tiles.map((q) => (
          <div key={q.id} role="listitem" className={`mob-tile is-${(q.change ?? 0) >= 0 ? 'up' : 'down'}`}>
            <span className="mob-tile-name">{q.name}</span>
            <span className="mob-tile-val">{q.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}<Est p={q.provenance} /></span>
            <span className="mob-tile-chg">{q.changePct !== null ? `${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%` : ''}</span>
          </div>
        ))}
      </div>
      <div className="mob-card mob-lead">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
      <div className="mob-card"><News data={data} items={rest} limit={7} withSummary={false} title={era.labels.headlines} /></div>
      <div className="mob-card"><Movers data={data} /></div>
      <div className="mob-card"><CompaniesInNews news={data.news} snap={data.markets} /></div>
      <div className="mob-card"><EconomicSnapshot economy={data.economy} snap={data.markets} /></div>
      {data.sports.length || data.culture.length ? <div className="mob-card"><Sports data={data} limit={5} /><HistoricalContextCard kind="culture" culture={data.culture} /></div> : null}
      <Ad data={data} />
      <button type="button" className="mob-cta" onClick={() => go({ name: 'portfolio' })}>Open Portfolio ›</button>
    </div>
  );
}

// ================================================================== 2013–2018
export function FlatHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  return (
    <div className="home home-flat">
      <div className="flat-indices" id="sec-markets">
        {data.markets.indexes.slice(0, 3).map((q) => (
          <div key={q.id} className={`flat-index is-${(q.change ?? 0) >= 0 ? 'up' : 'down'}`}>
            <span className="flat-index-name">{q.name}</span>
            <span className="flat-index-val">{q.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}<Est p={q.provenance} /></span>
            <span className="flat-index-chg">{q.change !== null ? `${q.change >= 0 ? '+' : '−'}${Math.abs(q.change).toFixed(2)} (${q.changePct!.toFixed(2)}%)` : ''}</span>
          </div>
        ))}
        {data.status.markets === 'loading' ? <Loading /> : null}
      </div>
      <ClosedNotice snap={data.markets} />
      <div className="flat-grid">
        <div className="card card-lead">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
        <div className="card"><Movers data={data} /></div>
        <div className="card card-wide"><News data={data} items={rest} limit={7} title={era.labels.topStories} /></div>
        <div className="card"><MarketSnapshot snap={data.markets} groups={['commodities', 'rates', 'international', 'digital']} /></div>
        <div className="card"><EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} /></div>
        <div className="card"><CompaniesInNews news={data.news} snap={data.markets} /></div>
        {data.sports.length || data.culture.length ? <div className="card"><Sports data={data} limit={6} /><HistoricalContextCard kind="culture" culture={data.culture} /></div> : null}
        {data.weather.length || data.ads.length ? <div className="card"><HistoricalContextCard kind="weather" weather={data.weather} /><Ad data={data} /></div> : null}
      </div>
    </div>
  );
}

// ================================================================== 2019+
export function FintechHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  const spx = data.markets.indexes.find((q) => q.id === '^GSPC' || q.id === 'SPX');
  return (
    <div className="home home-fin">
      <div className="fin-bento">
        <div className="fin-card fin-hero" id="sec-markets">
          {spx ? (
            <div className="fin-hero-head">
              <span className="fin-hero-name">{spx.name}</span>
              <span className="fin-hero-val">{spx.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              <span className={`fin-hero-chg ${(spx.change ?? 0) >= 0 ? 'm-up' : 'm-down'}`}>{spx.changePct !== null ? `${spx.changePct >= 0 ? '+' : ''}${spx.changePct.toFixed(2)}% today` : ''}</span>
            </div>
          ) : <Loading />}
          <PriceChart symbol="^GSPC" title="1Y" />
        </div>
        <div className="fin-card fin-lead">{data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />}</div>
        <div className="fin-card"><Movers data={data} /></div>
        <div className="fin-card"><MarketSnapshot snap={data.markets} groups={['indexes', 'commodities', 'rates', 'digital']} /></div>
        <div className="fin-card fin-news"><News data={data} items={rest} limit={7} withSummary={false} title={era.labels.headlines} /></div>
        <div className="fin-card"><EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} /></div>
        <div className="fin-card"><CompaniesInNews news={data.news} snap={data.markets} /></div>
        {data.sports.length || data.culture.length ? <div className="fin-card"><Sports data={data} limit={6} /><HistoricalContextCard kind="culture" culture={data.culture} /></div> : null}
      </div>
    </div>
  );
}

export const HOMES = {
  archive: ArchiveHome, broadsheet: BroadsheetHome, midcentury: MidcenturyHome, broadcast: BroadcastHome, terminal: TerminalHome,
  directory: DirectoryHome, portal: PortalHome, web2: Web2Home, mobile: MobileHome, flat: FlatHome, fintech: FintechHome,
} as const;
