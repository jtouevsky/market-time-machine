/**
 * Composer — renders any Composition (pure data) with the shared modules.
 * A new era is a new arrangement of the same data and business logic, not a new component tree.
 */
import React from 'react';
import type { Composition, Slot } from '../../../theme/registry/types';
import { useSim } from '../../../state/simulation';
import { usePage } from '../../../state/page';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { fmtChange, fmtQuoteValue, headline } from '../../../theme/format';
import { Loading, Section } from '../../modules/common';
import { FrontPages, HistoricalContextCard, HistoricalSports } from '../../modules/Environment';
import { HistoricalNews, LeadStory, splitLead } from '../../modules/HistoricalNews';
import { CompaniesInNews, EconomicSnapshot, MarketMovers, MarketSnapshot } from '../../modules/MarketSnapshot';
import { PriceChart } from '../../modules/PriceChart';
import { Est } from '../../modules/Provenance';
import { AskBar } from './AskBar';
import { DOS_CATS } from './categories';

interface Ctx {
  data: HomeData;
  lead?: ReturnType<typeof splitLead>['lead'];
  rest: ReturnType<typeof splitLead>['rest'];
  tile: { n: number };
}

function SlotView({ slot, ctx }: { slot: Slot; ctx: Ctx }) {
  const era = useEra();
  const { date, go } = useSim();
  const { data, lead, rest } = ctx;
  const comp = era.exp.composition;
  switch (slot.m) {
    case 'lead':
      return data.status.news === 'loading' ? <Loading /> : <LeadStory item={lead} />;
    case 'banner':
      return lead ? <div className="banner"><h1 className="banner-hl">{headline(lead.title, era)}</h1></div> : <div className="banner"><Loading /></div>;
    case 'news': {
      const items = rest.slice(slot.from ?? 0, slot.to ?? 8);
      return (
        <Section title={slot.title ?? era.labels.headlines} className="cx-news">
          {data.status.news === 'loading' ? <Loading /> : <HistoricalNews items={items} limit={items.length} withSummary={slot.summary ?? true} className={slot.links ? 'news-links' : ''} />}
        </Section>
      );
    }
    case 'markets':
      return data.status.markets === 'loading' ? <Section title={slot.title ?? era.labels.markets}><Loading /></Section> : <MarketSnapshot snap={data.markets} groups={slot.groups} title={slot.title} />;
    case 'movers':
      return data.status.markets === 'ready' ? <MarketMovers snap={data.markets} limit={slot.limit} /> : null;
    case 'economy':
      return <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />;
    case 'companies':
      return <CompaniesInNews news={data.news} snap={data.markets} />;
    case 'sports':
      return <HistoricalSports items={data.sports} limit={slot.limit} />;
    case 'culture':
      return <HistoricalContextCard kind="culture" culture={data.culture} />;
    case 'weather':
      return <HistoricalContextCard kind="weather" weather={data.weather} />;
    case 'ad': {
      if (!data.ads.length) return null;
      const ad = data.ads[((slot.i ?? 0) + Number(date.slice(8, 10))) % data.ads.length];
      return <HistoricalContextCard kind="ad" ad={ad} />;
    }
    case 'frontpages':
      return <FrontPages pages={data.frontPages} limit={slot.limit} />;
    case 'chart':
      return <div className="cx-chart"><PriceChart symbol={slot.symbol ?? '^GSPC'} title={slot.title} /></div>;
    case 'tiles': {
      const quotes = [...data.markets.indexes, ...data.markets.commodities, ...data.markets.digital];
      const first = ctx.tile.n;
      ctx.tile.n += slot.count ?? 1;
      const picked = quotes.slice(first, first + (slot.count ?? 1));
      if (!picked.length) return data.status.markets === 'loading' ? <Loading /> : null;
      return (
        <div className="cx-tiles" role="list">
          {picked.map((q) => (
            <div key={q.id} role="listitem" className={`cx-tile is-${(q.change ?? 0) >= 0 ? 'up' : 'down'}`}>
              <span className="cx-tile-name">{q.name}</span>
              <span className="cx-tile-val">{fmtQuoteValue(q, era, date)}<Est p={q.provenance} /></span>
              <span className="cx-tile-chg">{fmtChange(q, era, date, 'pct')}</span>
            </div>
          ))}
        </div>
      );
    }
    case 'cats': {
      const cats = DOS_CATS.map((c) => ({ ...c, n: data.news.filter((i) => c.key.includes(i.category)).length })).slice(0, slot.count ?? 8);
      return (
        <nav className="cx-cats" aria-label="Categories">
          <h2 className="m-section-title">{era.exp.archetype === 'enterprise' ? 'Browse' : 'Quick Links'}</h2>
          <ul>{cats.map((c) => (
            <li key={c.dir}><a href={`#${c.dir}`} onClick={(e) => { e.preventDefault(); go({ name: 'search', q: c.label.toLowerCase() }); }}>{c.dir}</a> <small>({c.n})</small></li>
          ))}</ul>
        </nav>
      );
    }
    case 'ticker':
      return null;
    case 'note': {
      if (slot.className?.includes('rs-ask')) return <AskBar />;
      if (slot.className?.includes('tt-index') || slot.className?.includes('dos-menu')) return <PageIndex comp={comp} kind={slot.className.includes('tt-index') ? 'teletext' : 'dos'} />;
      return <aside className={slot.className ?? 'cx-note'}>{slot.text}</aside>;
    }
  }
}

/** A numbered index of the composition's pages (teletext page 100, DOS main menu). */
function PageIndex({ comp, kind }: { comp?: Composition; kind: 'teletext' | 'dos' }) {
  const { setPage } = usePage();
  const era = useEra();
  const { date } = useSim();
  const pages = comp?.pages ?? [];
  return (
    <div className={`cx-index cx-index-${kind}`}>
      <h2 className="cx-index-title">{kind === 'teletext' ? `${era.publication}  100` : `${era.publication} — MAIN MENU`}</h2>
      <p className="cx-index-date">{era.formatDate(date)}</p>
      <ol>
        {pages.slice(1).map((p, i) => (
          <li key={p.key}>
            <button type="button" className="m-link" onClick={() => setPage(i + 1)}>
              <span className="cx-index-key">{kind === 'teletext' ? p.key : i + 1}</span> {p.label}
            </button>
          </li>
        ))}
        {kind === 'teletext' ? <><li><span className="cx-index-key">200</span> Portfolio</li><li><span className="cx-index-key">300</span> Find a company or story</li></> : null}
      </ol>
      <p className="cx-index-hint">{kind === 'teletext' ? 'Type a page number below, or use the coloured keys.' : 'Press 1–4 to choose an option, 0 or Esc returns here. P = portfolio, F = find.'}</p>
    </div>
  );
}

function Grid({ comp, ctx }: { comp: Omit<Composition, 'pages'>; ctx: Ctx }) {
  const style: React.CSSProperties = { gridTemplateColumns: comp.cols };
  if (comp.areas) style.gridTemplateAreas = comp.areas.map((r) => `"${r}"`).join(' ');
  return (
    <div className={`cx ${comp.className ?? ''}`} style={style} data-collapse={comp.collapseAt ?? 760}>
      {Object.entries(comp.regions).map(([name, slots]) => (
        <div key={name} className={`cx-region cx-r-${name}`} style={comp.areas ? { gridArea: name } : undefined}>
          {slots.map((s, i) => <SlotView key={i} slot={s} ctx={ctx} />)}
        </div>
      ))}
    </div>
  );
}

export function Composer({ data, comp }: { data: HomeData; comp: Composition }) {
  const { date } = useSim();
  const { page, setPage } = usePage();
  const era = useEra();
  const { lead, rest } = splitLead(data.news, date);
  const ctx: Ctx = { data, lead, rest, tile: { n: 0 } };
  if (comp.pages?.length) {
    const idx = Math.min(page, comp.pages.length - 1);
    const p = comp.pages[idx];
    const turns = era.exp.nav.model === 'pages';
    return (
      <div className={`home cx-home ${comp.className ?? ''}`} data-page={p.key}>
        <div key={p.key} className="cx-flip"><Grid comp={p.comp} ctx={ctx} /></div>
        {turns ? (
          <div className="cx-turn" role="navigation" aria-label="Turn the page">
            <button type="button" className="m-link" disabled={idx === 0} onClick={() => setPage(idx - 1)}>← Previous {String(era.exp.opts?.pageNoun ?? 'Page').toLowerCase()}</button>
            <span>{String(era.exp.opts?.pageNoun ?? 'Page')} {idx + 1} of {comp.pages.length} — {p.label}</span>
            <button type="button" className="m-link" disabled={idx === comp.pages.length - 1} onClick={() => setPage(idx + 1)}>{idx === comp.pages.length - 1 ? 'End of paper' : 'Turn over →'}</button>
          </div>
        ) : null}
      </div>
    );
  }
  return <div className={`home cx-home ${comp.className ?? ''}`}><Grid comp={comp} ctx={ctx} /></div>;
}
