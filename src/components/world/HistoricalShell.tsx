import { useEffect, useMemo, useState } from 'react';
import { useSim } from '../../state/simulation';
import { useHistorical, useHomeData, type HomeData } from '../../state/useHistorical';
import { useEra } from '../../theme/EraThemeProvider';
import { AdvanceTime } from '../modules/AdvanceTime';
import { CompanyPage } from '../modules/CompanyPage';
import { Section } from '../modules/common';
import { HistoricalTicker } from '../modules/Environment';
import { HistoricalSearch, SearchResults } from '../modules/HistoricalSearch';
import { Portfolio } from '../modules/Portfolio';
import { useDebugLabels } from '../modules/Provenance';
import { DigestToast, RevealModal } from '../modules/Reveal';
import { collectSources, SourcesLink, SourcesPanel } from '../modules/Sources';
import { CommandPalette } from './CommandPalette';
import { HistoricalHeader } from './HistoricalHeader';
import { HOMES } from './HomeLayouts';
import { TerminalConsole } from './TerminalConsole';
import '../../styles/world.css';
import '../../styles/eras.css';
import '../../styles/eras2.css';

function Footer({ onSources }: { onSources: () => void }) {
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

function CompanyDirectory() {
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

function MainView({ data }: { data: HomeData }) {
  const { view } = useSim();
  const era = useEra();
  if (view.name === 'company') return <CompanyPage ticker={view.ticker} />;
  if (view.name === 'portfolio') return <Portfolio />;
  if (view.name === 'search') {
    const showBox = era.id !== 'portal' && era.id !== 'directory' && era.id !== 'terminal';
    return (
      <div className="v-search-wrap">
        {showBox ? <HistoricalSearch autoFocus={!view.q} /> : null}
        {view.q ? <SearchResults q={view.q} /> : <><p className="m-results-note">{era.module === 'terminal' ? 'ENTER FIND <WORDS> OR A TICKER AT THE COMMAND LINE' : 'Search companies, news, people and events — as of this date.'}</p><CompanyDirectory /></>}
      </div>
    );
  }
  const Home = HOMES[era.id];
  return <Home data={data} />;
}

export function HistoricalShell() {
  const era = useEra();
  const data = useHomeData();
  const { date, view } = useSim();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  useDebugLabels();
  const rows = useMemo(() => collectSources(data), [data]);
  const modern = era.id === 'flat' || era.id === 'fintech';

  useEffect(() => {
    if (!modern) return;
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [modern]);

  return (
    <div className={`world w-${era.id} v-${era.variant}`} data-era={era.id} data-sub={era.sub} key={era.sub}>
      {era.id === 'terminal' ? <div className="crt-overlay" aria-hidden /> : null}
      <div className="w-frame">
        <HistoricalHeader onPalette={() => setPalette(true)} />
        <HistoricalTicker snap={data.markets} />
        <main className="w-main" key={`${date}-${view.name}`}>
          <MainView data={data} />
        </main>
        <Footer onSources={() => setSourcesOpen(true)} />
      </div>
      <div className="w-advance-dock">
        {era.id === 'terminal' ? <TerminalConsole onSources={() => setSourcesOpen(true)} /> : <AdvanceTime />}
      </div>
      {sourcesOpen ? <SourcesPanel rows={rows} onClose={() => setSourcesOpen(false)} /> : null}
      <CommandPalette open={palette} onClose={() => setPalette(false)} onSources={() => setSourcesOpen(true)} />
      <RevealModal />
      <DigestToast />
    </div>
  );
}
