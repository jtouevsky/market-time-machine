/**
 * Pieces every family frame is built from: the main-view switch (company / portfolio / search /
 * home), a default footer and the standard frame. Families supply their own Header, Home and
 * extras; business logic and data modules are shared.
 */
import React from 'react';
import { useSim } from '../../state/simulation';
import { useHistorical, type HomeData } from '../../state/useHistorical';
import { useEra } from '../../theme/EraThemeProvider';
import { AdvanceTime } from '../modules/AdvanceTime';
import { CompanyPage } from '../modules/CompanyPage';
import { Section } from '../modules/common';
import { HistoricalTicker } from '../modules/Environment';
import { HistoricalSearch, SearchResults } from '../modules/HistoricalSearch';
import { Portfolio } from '../modules/Portfolio';
import { SourcesLink } from '../modules/Sources';
import { Composer } from './compose/Composer';
import { PageControls } from './compose/PageControls';

export interface FrameProps { data: HomeData; onSources: () => void; onPalette: () => void }
export type HomeComponent = React.ComponentType<{ data: HomeData }>;
export type HeaderComponent = React.ComponentType<{ onPalette?: () => void }>;

export function CompanyDirectory() {
  const era = useEra();
  const { go } = useSim();
  const companies = useHistorical((p, d) => p.listCompanies(d));
  return (
    <Section title={era.labels.companies} className="m-directory">
      <ul className="m-directory-list">
        {companies?.map((c) => <li key={c.ticker}><button type="button" className="m-link" onClick={() => go({ name: 'company', ticker: c.ticker })}>{c.name}</button> <span className="m-directory-sym">{c.symbol ?? c.ticker}</span></li>)}
      </ul>
    </Section>
  );
}

/** Archetypes whose header already contains the search box (so the search view must not repeat it). */
const HEADER_HAS_SEARCH = new Set(['portal', 'directory', 'terminal', 'dos', 'workstation', 'personal', 'win98', 'xp', 'enterprise', 'hypertext', 'teletext']);

export function MainView({ data, Home }: { data: HomeData; Home: HomeComponent }) {
  const { view } = useSim();
  const era = useEra();
  if (view.name === 'company') return <CompanyPage ticker={view.ticker} />;
  if (view.name === 'portfolio') return <Portfolio />;
  if (view.name === 'search') {
    const showBox = !HEADER_HAS_SEARCH.has(era.id);
    return (
      <div className="v-search-wrap">
        {showBox ? <HistoricalSearch autoFocus={!view.q} /> : null}
        {view.q ? <SearchResults q={view.q} /> : <><p className="m-results-note">{era.module === 'terminal' ? 'ENTER FIND <WORDS> OR A TICKER AT THE COMMAND LINE' : 'Search companies, news, people and events — as of this date.'}</p><CompanyDirectory /></>}
      </div>
    );
  }
  return <Home data={data} />;
}

/** Wraps a composition in the Composer so any archetype can use data-driven homes. */
export const ComposedHome: HomeComponent = ({ data }) => {
  const era = useEra();
  return <Composer data={data} comp={era.exp.composition!} />;
};

export function DefaultFooter({ onSources }: { onSources: () => void }) {
  const era = useEra();
  const { date } = useSim();
  const y = date.slice(0, 4);
  const src = <SourcesLink onOpen={onSources} />;
  switch (era.module) {
    case 'print':
      return <footer className="w-foot">Printed and published by {era.publication}. Quotations furnished for information only. {src}</footer>;
    case 'terminal':
      return <footer className="w-foot">COPR {y} MTM INFO SYSTEMS · DATA DELAYED · {src}</footer>;
    default:
      if (era.id === 'directory') return <footer className="w-foot">Copyright © {y} {era.publication}. All rights reserved. | {src} | <span>Best viewed with Netscape Navigator at 800×600</span></footer>;
      if (era.id === 'portal') return <footer className="w-foot">Copyright © {y} {era.publication} Inc. All Rights Reserved. <u>Privacy Policy</u> - <u>Terms of Service</u> - {src}<br />Quotes delayed 20 minutes for Nasdaq, 20 minutes for NYSE.</footer>;
      return <footer className="w-foot">© {y} {era.publication} · {src}</footer>;
  }
}

interface StandardFrameProps extends FrameProps {
  Header: HeaderComponent;
  Home: HomeComponent;
  Footer?: React.ComponentType<{ onSources: () => void }>;
  Dock?: React.ReactNode;
  ticker?: boolean;
  before?: React.ReactNode;
  className?: string;
}

export function StandardFrame({ data, onSources, onPalette, Header, Home, Footer = DefaultFooter, Dock, ticker = true, before, className = '' }: StandardFrameProps) {
  const { date, view } = useSim();
  return (
    <>
      {before}
      <div className={`w-frame ${className}`}>
        <Header onPalette={onPalette} />
        {ticker ? <HistoricalTicker snap={data.markets} /> : null}
        <main className="w-main" key={`${date}-${view.name}`}>
          <MainView data={data} Home={Home} />
        </main>
        <PageControls />
        <Footer onSources={onSources} />
      </div>
      <div className="w-advance-dock">{Dock ?? <AdvanceTime />}</div>
    </>
  );
}
