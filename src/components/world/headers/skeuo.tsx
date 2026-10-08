import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { NavItem } from './common';

export function MobileHeader() {
  const era = useEra();
  const { date, view, exit, go } = useSim();
  const L = era.labels;
  const isHome = view.name === 'home';
      return (
        <header className="h-mobile">
          <div className="h-mobile-bar">
            <button type="button" className="h-mobile-back" onClick={exit}>{L.exit}</button>
            <div className="h-mobile-title">{era.publication}<small>{era.formatDate(date)}</small></div>
            <button type="button" className="h-mobile-search" aria-label="Search" onClick={() => go({ name: 'search', q: '' })}>
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
            </button>
          </div>
          <nav className="h-mobile-seg" aria-label="Sections">
            <NavItem to={{ name: 'home' }} label={L.home} active={isHome} />
            <NavItem to={{ name: 'portfolio' }} label={L.portfolio} active={view.name === 'portfolio'} />
            <NavItem to={{ name: 'search', q: '' }} label={L.search} active={view.name === 'search'} />
          </nav>
        </header>
      );
}

