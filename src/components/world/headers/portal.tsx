import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { HistoricalSearch } from '../../modules/HistoricalSearch';
import { NavItem } from './common';

export function PortalHeader() {
  const era = useEra();
  const { date, view, exit } = useSim();
  const L = era.labels;
  const isHome = view.name === 'home';
      return (
        <header className="h-portal">
          <div className="h-portal-top">
            <div className="h-portal-logo">{era.publication}<span className="h-portal-tm">!</span><small>{era.motto}</small></div>
            <div className="h-portal-links"><span>Updated {era.formatShort(date)} 4:31pm ET</span> - <button type="button" className="h-exit" onClick={exit}>{L.exit}</button></div>
          </div>
          <div className="h-portal-search"><HistoricalSearch /></div>
          <nav className="h-portal-tabs" aria-label="Sections">
            <NavItem to={{ name: 'home' }} label={L.home} active={isHome} />
            <NavItem to={{ name: 'portfolio' }} label={L.portfolio} active={view.name === 'portfolio'} />
            <NavItem to={{ name: 'search', q: '' }} label="Quotes" active={view.name === 'search'} />
          </nav>
        </header>
      );
}

