import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { HistoricalSearch } from '../../modules/HistoricalSearch';
import { SourcesLink } from '../../modules/Sources';
import { NavItem, scrollTo } from './common';

import { useState } from 'react';

export function Web2Header() {
  const era = useEra();
  const { date, view, go, exit: onExit } = useSim();
  const [menu, setMenu] = useState(false);
  const L = era.labels;
  return (
    <header className="h-web2">
      <div className="h-web2-bar">
        <div className="h-web2-brand">
          <div className="h-web2-logo">{era.publication}<span className="h-web2-beta">beta</span></div>
          <span className="h-web2-motto">{era.motto}</span>
        </div>
        <div className="h-web2-right">
          <span className="h-web2-me" aria-hidden><i>Me</i></span>
          <HistoricalSearch compact />
        </div>
      </div>
      <div className="h-web2-tabs">
        <nav aria-label="Sections">
          <NavItem to={{ name: 'home' }} label={L.home} active={view.name === 'home'} />
          <div className={`h-web2-drop${menu ? ' is-open' : ''}`} onMouseLeave={() => setMenu(false)}>
            <button type="button" className="h-nav-item" aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu((m) => !m)}>{L.markets} ▾</button>
            {menu ? (
              <ul className="h-web2-menu" role="menu">
                <li role="none"><button role="menuitem" type="button" onClick={() => { setMenu(false); go({ name: 'home' }); scrollTo('sec-markets'); }}>Market overview</button></li>
                <li role="none"><button role="menuitem" type="button" onClick={() => { setMenu(false); go({ name: 'home' }); scrollTo('sec-movers'); }}>{L.movers}</button></li>
                <li role="none"><button role="menuitem" type="button" onClick={() => { setMenu(false); go({ name: 'search', q: '' }); }}>Stocks A–Z</button></li>
              </ul>
            ) : null}
          </div>
          <NavItem to={{ name: 'portfolio' }} label={L.portfolio} active={view.name === 'portfolio'} />
          <NavItem to={{ name: 'search', q: '' }} label={L.search} active={view.name === 'search'} />
        </nav>
        <span className="h-web2-date"><span className="h-web2-status" aria-hidden /> {era.formatDate(date)} · <button type="button" className="h-exit" onClick={onExit}>{L.exit}</button></span>
      </div>
    </header>
  );
}

/** Fat footer for the late Web 2.0 years (2006–2008); earlier years keep the plain one-line footer. */
export function Web2Footer({ onSources }: { onSources: () => void }) {
  const era = useEra();
  const { date, go, exit } = useSim();
  const y = date.slice(0, 4);
  const fat = ['social-2006', 'aqua-2007', 'web2-2008', 'dash-2009'].includes(era.exp.id);
  return (
    <footer className="w-foot w2-foot">
      {fat ? (
        <div className="w2-foot-cols">
          <div><h3>Markets</h3>
            <button type="button" onClick={() => { go({ name: 'home' }); scrollTo('sec-markets'); }}>Market overview</button>
            <button type="button" onClick={() => { go({ name: 'home' }); scrollTo('sec-movers'); }}>{era.labels.movers}</button>
          </div>
          <div><h3>Your account</h3>
            <button type="button" onClick={() => go({ name: 'portfolio' })}>{era.labels.portfolio}</button>
            <button type="button" onClick={exit}>{era.labels.exit}</button>
          </div>
          <div><h3>Explore</h3>
            <button type="button" onClick={() => go({ name: 'search', q: '' })}>Stocks A–Z</button>
            <button type="button" onClick={() => go({ name: 'search', q: '' })}>{era.labels.search}</button>
          </div>
          <div><h3>About</h3>
            <SourcesLink onOpen={onSources} />
            <span className="w2-foot-note">{era.motto}</span>
          </div>
        </div>
      ) : null}
      <div className="w2-foot-line">© {y} {era.publication}{fat ? null : <> · <SourcesLink onOpen={onSources} /></>}</div>
    </footer>
  );
}
