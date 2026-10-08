import { createContext, useContext, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useSim, type View } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { Loading, Section } from '../../modules/common';
import { HistoricalNews, LeadStory, splitLead } from '../../modules/HistoricalNews';
import { CompaniesInNews, EconomicSnapshot } from '../../modules/MarketSnapshot';
import { CompanyDirectory } from '../shared';
import { CATS, Markets, Movers } from './home-helpers';

export type EntTab = 'news' | 'markets' | 'companies';
const TABS: { id: EntTab; label: string }[] = [{ id: 'news', label: 'News' }, { id: 'markets', label: 'Markets' }, { id: 'companies', label: 'Companies' }];
const Ctx = createContext<{ tab: EntTab; setTab: (t: EntTab) => void }>({ tab: 'news', setTab: () => undefined });
export const EntTabProvider = ({ children }: { children: ReactNode }) => {
  const [tab, setTab] = useState<EntTab>('news');
  return <Ctx.Provider value={{ tab, setTab }}>{children}</Ctx.Provider>;
};

export function Breadcrumbs() {
  const { view, go } = useSim();
  const { tab, setTab } = useContext(Ctx);
  const home = () => go({ name: 'home' });
  const section = (t: EntTab) => () => { setTab(t); go({ name: 'home' }); };
  const label = TABS.find((t) => t.id === tab)!.label;
  const trail: { label: string; run?: () => void }[] = [{ label: 'Home', run: home }];
  const v: View = view;
  if (v.name === 'home') trail.push({ label });
  else if (v.name === 'portfolio') trail.push({ label: 'Portfolio' });
  else if (v.name === 'search') { trail.push({ label: 'Search', run: v.q ? () => go({ name: 'search', q: '' }) : undefined }); if (v.q) trail.push({ label: v.q }); }
  else { trail.push({ label: 'Companies', run: section('companies') }, { label: v.ticker }); }
  if (v.name === 'home') trail[0] = { label: 'Home', run: tab === 'news' ? undefined : section('news') };
  return (
    <nav className="pt-crumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map((t, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={i} aria-current={last ? 'page' : undefined}>
              {t.run && !last ? <button type="button" className="pt-crumb-link" onClick={t.run}>{t.label}</button> : <span className="pt-crumb-here">{t.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Dense utility toolbar above the breadcrumbs, as in intranet portals. */
export function EntToolbar() {
  const { go } = useSim();
  const { tab } = useContext(Ctx);
  return (
    <div className="pt-toolbar" role="toolbar" aria-label="Page tools">
      <button type="button" className="pt-tool" onClick={() => go({ name: 'home' })}><span className="pt-tool-ico is-home" aria-hidden="true" />Home</button>
      <button type="button" className="pt-tool" onClick={() => window.print()}><span className="pt-tool-ico is-print" aria-hidden="true" />Print</button>
      <button type="button" className="pt-tool" onClick={() => go({ name: 'search', q: '' })}><span className="pt-tool-ico is-find" aria-hidden="true" />Find</button>
      <span className="pt-tool-sep" aria-hidden="true" />
      <span className="pt-tool-view">View: {TABS.find((t) => t.id === tab)?.label}</span>
    </div>
  );
}

export function EntNav() {
  const { go, view } = useSim();
  const { tab, setTab } = useContext(Ctx);
  const sec = (t: EntTab) => () => { setTab(t); go({ name: 'home' }); };
  return (
    <nav className="pt-tree" aria-label="Site navigation">
      <h2>Research</h2>
      <ul>{TABS.map((t) => <li key={t.id}><button type="button" className={`pt-tree-link ew-go${view.name === 'home' && tab === t.id ? ' is-on' : ''}`} onClick={sec(t.id)}>{t.label}</button></li>)}</ul>
      <h2>Browse</h2>
      <ul>{CATS.slice(0, 6).map((c) => <li key={c.label}><button type="button" className="pt-tree-link ew-go" onClick={() => go({ name: 'search', q: c.label.toLowerCase() })}>{c.label}</button></li>)}</ul>
      <h2>Accounts</h2>
      <ul><li><button type="button" className={`pt-tree-link ew-go${view.name === 'portfolio' ? ' is-on' : ''}`} onClick={() => go({ name: 'portfolio' })}>Portfolio</button></li></ul>
    </nav>
  );
}

export function EnterpriseHome({ data }: { data: HomeData }) {
  const { date } = useSim();
  const era = useEra();
  const { tab, setTab } = useContext(Ctx);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const { lead, rest } = splitLead(data.news, date);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i + TABS.length - 1) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : -1;
    if (n < 0) return;
    e.preventDefault();
    setTab(TABS[n].id);
    refs.current[n]?.focus();
  };
  return (
    <div className="home pt-ent-home">
      <div className="pt-tablist" role="tablist" aria-label="Panels">
        {TABS.map((t, i) => (
          <button key={t.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${base}-t-${t.id}`} aria-selected={tab === t.id} aria-controls={`${base}-p-${t.id}`} tabIndex={tab === t.id ? 0 : -1}
            className={`pt-tab${tab === t.id ? ' is-on' : ''}`} onClick={() => setTab(t.id)} onKeyDown={(e) => onKey(e, i)}>{t.label}</button>
        ))}
      </div>
      <div className="pt-tabpanel" role="tabpanel" id={`${base}-p-${tab}`} aria-labelledby={`${base}-t-${tab}`} tabIndex={0}>
        {tab === 'news' ? (
          <Section title={era.labels.topStories} id="sec-news">
            {data.status.news === 'loading' ? <Loading /> : <><LeadStory item={lead} /><HistoricalNews items={rest.slice(0, 10)} withSummary={false} /></>}
          </Section>
        ) : null}
        {tab === 'markets' ? (
          <>
            <Markets data={data} groups={['indexes', 'international', 'rates']} />
            <Movers data={data} limit={8} />
            <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />
          </>
        ) : null}
        {tab === 'companies' ? (
          <>
            <CompaniesInNews news={data.news} snap={data.markets} />
            <CompanyDirectory />
          </>
        ) : null}
      </div>
    </div>
  );
}
