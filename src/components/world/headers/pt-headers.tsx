import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { HistoricalSearch } from '../../modules/HistoricalSearch';
import { NavItem } from './common';

export function XpHeader() {
  const era = useEra();
  const { date } = useSim();
  return (
    <header className="pt-xp-head">
      <div className="pt-xp-brand"><span className="pt-xp-logo">{era.publication}</span><span className="pt-xp-motto">{era.motto}</span></div>
      <div className="pt-xp-date">{era.formatDate(date)}</div>
      <div className="pt-xp-search"><HistoricalSearch /></div>
    </header>
  );
}

export function EnterpriseHeader() {
  const era = useEra();
  const { date, view, exit } = useSim();
  const L = era.labels;
  return (
    <header className="pt-ent-head">
      <div className="pt-ent-top">
        <div className="pt-ent-brand"><span className="pt-ent-logo"><span className="pt-ent-mark" aria-hidden="true" />{era.publication}</span><span className="pt-ent-motto">{era.motto}</span></div>
        <div className="pt-ent-meta"><span>{era.formatDate(date)}</span><button type="button" className="h-exit pt-ent-exit" onClick={exit}>{L.exit}</button></div>
      </div>
      <nav className="pt-ent-tabs" aria-label="Sections">
        <NavItem to={{ name: 'home' }} label={L.home} active={view.name === 'home'} />
        <NavItem to={{ name: 'portfolio' }} label={L.portfolio} active={view.name === 'portfolio'} />
        <NavItem to={{ name: 'search', q: '' }} label="Quotes" active={view.name === 'search'} />
      </nav>
      <div className="pt-ent-search"><HistoricalSearch /></div>
    </header>
  );
}

export function FlashHeader() {
  const era = useEra();
  const { date, view, exit } = useSim();
  const L = era.labels;
  return (
    <header className="pt-fl-head">
      <div className="pt-fl-brand"><span className="pt-fl-orb" aria-hidden="true" /><span className="pt-fl-logo">{era.publication}</span><span className="pt-fl-motto">{era.motto}</span></div>
      <nav className="pt-fl-nav" aria-label="Main">
        <NavItem to={{ name: 'home' }} label={L.home} active={view.name === 'home'} className="pt-fl-btn" />
        <NavItem to={{ name: 'portfolio' }} label={L.portfolio} active={view.name === 'portfolio'} className="pt-fl-btn" />
        <NavItem to={{ name: 'search', q: '' }} label="Quotes" active={view.name === 'search'} className="pt-fl-btn" />
        <button type="button" className="h-nav-item pt-fl-btn" onClick={exit}>{L.exit}</button>
      </nav>
      <div className="pt-fl-date">{era.formatDate(date)}</div>
      <div className="pt-fl-meter" aria-hidden="true"><span /></div>
    </header>
  );
}
