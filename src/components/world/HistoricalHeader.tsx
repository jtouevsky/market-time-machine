/**
 * Mastheads and navigation. Each information architecture gets its own navigation metaphor:
 * newspaper section headings, a television channel dial, terminal function keys, HTML links,
 * glossy tabs with dropdowns, flat nav, and a minimal modern bar with ⌘K.
 */
import React, { useState } from 'react';
import { dayNumber, yearOf } from '../../core/dates';
import { useSim, type View } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';
import { HistoricalSearch } from '../modules/HistoricalSearch';

function roman(n: number) {
  const map: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

function NavItem({ to, label, active, className = '' }: { to: View; label: React.ReactNode; active: boolean; className?: string }) {
  const { go } = useSim();
  return (
    <button type="button" className={`h-nav-item ${className}${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => go(to)}>
      {label}
    </button>
  );
}

const scrollTo = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

export function HistoricalHeader({ onPalette }: { onPalette?: () => void }) {
  const era = useEra();
  const { date, view, exit, portfolio, go } = useSim();
  const L = era.labels;
  const isHome = view.name === 'home';
  const exitBtn = <button type="button" className="h-exit" onClick={exit}>{L.exit}</button>;

  switch (era.id) {
    // ---------------------------------------------------------------- newspapers: section headings
    case 'archive':
    case 'broadsheet': {
      const founded = era.sub === 'colonial' ? 1704 : era.sub === 'antebellum' ? 1797 : era.id === 'archive' ? 1851 : 1896;
      const vol = roman(Math.max(1, yearOf(date) - founded + 1));
      const no = Math.max(1, dayNumber(date) - dayNumber(`${founded}-09-18`)).toLocaleString('en-US');
      const sections: [string, () => void, boolean][] = [
        [era.id === 'archive' ? 'Intelligence' : 'News', () => { go({ name: 'home' }); scrollTo('sec-news'); }, isHome],
        [era.id === 'archive' ? 'Money Market' : 'Financial', () => { go({ name: 'home' }); scrollTo('sec-markets'); }, false],
        ['Sporting', () => { go({ name: 'home' }); scrollTo('sec-sports'); }, false],
        [L.portfolio, () => go({ name: 'portfolio' }), view.name === 'portfolio'],
        [L.search, () => go({ name: 'search', q: '' }), view.name === 'search'],
      ];
      return (
        <header className="h-paper">
          <div className="h-ears">
            <div className="h-ear">{era.id === 'archive' ? <>THE<br />EVENING<br />EDITION</> : <>“Late City Edition”<br /><small>Closing Stock Prices</small></>}</div>
            <div className="h-masthead-wrap">
              <div className="h-masthead">{era.publication}</div>
              <div className="h-motto">{era.motto}</div>
            </div>
            <div className="h-ear h-ear-right">{era.id === 'archive' ? <>COMMERCIAL<br />AND<br />FINANCIAL</> : <>{portfolio.lots.length ? 'YOUR ACCOUNT IS OPEN' : 'MEMBERS N. Y. STOCK EXCH.'}<br /><small>Brokerage Department</small></>}</div>
          </div>
          <div className="h-dateline">
            <span>VOL. {vol}…No. {no}</span>
            <span className="h-date">NEW-YORK, {era.formatDate(date)}</span>
            <span>PRICE {era.price}</span>
          </div>
          <nav className="h-nav h-sections" aria-label="Sections">
            {sections.map(([label, fn, active], i) => (
              <React.Fragment key={label}>
                {i ? <span className="h-sec-dot" aria-hidden>·</span> : null}
                <button type="button" className={`h-nav-item${active ? ' is-active' : ''}`} onClick={fn}>{label}</button>
              </React.Fragment>
            ))}
            <span className="h-nav-sep" />{exitBtn}
          </nav>
        </header>
      );
    }
    case 'midcentury':
      return (
        <header className="h-mid">
          <div className="h-mid-top">
            <div className="h-mid-brand"><span className="h-mid-logo">{era.publication}</span><span className="h-mid-ed">{era.motto}</span></div>
            <div className="h-mid-date">{era.formatDate(date)}<small>Price {era.price}</small></div>
          </div>
          <nav className="h-nav" aria-label="Sections">
            <NavItem to={{ name: 'home' }} label="Front Page" active={isHome} />
            <NavItem to={{ name: 'portfolio' }} label={L.portfolio} active={view.name === 'portfolio'} />
            <NavItem to={{ name: 'search', q: '' }} label={L.search} active={view.name === 'search'} />
            <span className="h-nav-sep" />{exitBtn}
          </nav>
        </header>
      );
    // ---------------------------------------------------------------- television: a channel dial
    case 'broadcast': {
      const channels: [number, string, View, boolean][] = [
        [2, 'News', { name: 'home' }, isHome], [4, 'Markets', { name: 'home' }, false], [7, 'Portfolio', { name: 'portfolio' }, view.name === 'portfolio'], [9, 'Research', { name: 'search', q: '' }, view.name === 'search'],
      ];
      return (
        <header className="h-bc">
          <div className="h-bc-top">
            <div className="h-bc-brand"><span className="h-bc-logo">{era.publication}</span><span className="h-bc-motto">{era.motto}</span></div>
            <div className="h-bc-date">{era.formatDate(date)}<small>Price {era.price}</small></div>
          </div>
          <nav className="h-bc-dial" aria-label="Channels">
            {channels.map(([n, label, to, active]) => (
              <button key={n} type="button" className={`h-bc-ch${active ? ' is-active' : ''}`} onClick={() => { go(to); if (label === 'Markets') scrollTo('sec-markets'); }}>
                <span className="h-bc-knob" aria-hidden>{n}</span><span>{label}</span>
              </button>
            ))}
            <span className="h-nav-sep" />
            <button type="button" className="h-bc-ch h-bc-off" onClick={exit}><span className="h-bc-knob" aria-hidden>⏻</span><span>{L.exit}</span></button>
          </nav>
        </header>
      );
    }
    // ---------------------------------------------------------------- terminal: status line + menu numbers
    case 'terminal':
      return (
        <header className="h-term">
          <div className="h-term-status">
            <span>{era.publication} {era.motto}</span>
            <span className="h-term-date">{era.formatDate(date)} 16:30 ET</span>
            <span className="h-term-user">USER MTM01 · CASH ${Math.round(portfolio.cash).toLocaleString()}</span>
          </div>
          <nav className="h-term-menu" aria-label="Menu">
            <NavItem to={{ name: 'home' }} label="1 MAIN" active={isHome} />
            <NavItem to={{ name: 'portfolio' }} label="2 PORT" active={view.name === 'portfolio'} />
            <NavItem to={{ name: 'search', q: '' }} label="3 SECURITY LIST" active={view.name === 'search'} />
            <span className="h-nav-sep" />
            <span className="h-term-hint">TYPE HELP &lt;GO&gt; FOR COMMANDS</span>
          </nav>
        </header>
      );
    // ---------------------------------------------------------------- 1995–98: plain HTML links
    case 'directory':
      return (
        <header className="h-dir">
          <div className="h-dir-top">
            <div className="h-dir-logo" aria-label={era.publication}>
              <span className="h-dir-l1">Market</span><span className="h-dir-l2">Time</span><span className="h-dir-tm">™</span>
            </div>
            <div className="h-dir-tag">{era.motto}</div>
          </div>
          <nav className="h-dir-links" aria-label="Site">
            [ <a href="#home" onClick={(e) => { e.preventDefault(); go({ name: 'home' }); }}>Home</a> |{' '}
            <a href="#whatsnew" onClick={(e) => { e.preventDefault(); go({ name: 'home' }); scrollTo('sec-news'); }}>What's New</a> |{' '}
            <a href="#stocks" onClick={(e) => { e.preventDefault(); go({ name: 'portfolio' }); }}>{L.portfolio}</a> |{' '}
            <a href="#search" onClick={(e) => { e.preventDefault(); go({ name: 'search', q: '' }); }}>Search</a> |{' '}
            <a href="#exit" onClick={(e) => { e.preventDefault(); exit(); }}>{L.exit}</a> ]
          </nav>
          <div className="h-dir-search"><HistoricalSearch /></div>
          <div className="h-dir-date">{era.formatDate(date)}</div>
        </header>
      );
    case 'portal':
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
    // ---------------------------------------------------------------- web 2.0: glossy tabs + dropdown
    case 'web2':
      return <Web2Header onExit={exit} />;
    case 'mobile':
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
    case 'flat':
      return (
        <header className="h-flat">
          <div className="h-flat-brand"><span className="h-flat-mark" aria-hidden />{era.publication}</div>
          <nav className="h-flat-nav" aria-label="Sections">
            <NavItem to={{ name: 'home' }} label={L.home} active={isHome} />
            <NavItem to={{ name: 'portfolio' }} label={L.portfolio} active={view.name === 'portfolio'} />
            <NavItem to={{ name: 'search', q: '' }} label={L.search} active={view.name === 'search'} />
          </nav>
          <div className="h-flat-search"><HistoricalSearch compact /></div>
          <div className="h-flat-meta"><span className="h-flat-date">{era.formatDate(date)}</span>{exitBtn}</div>
        </header>
      );
    default:
      return (
        <header className="h-fin">
          <div className="h-fin-brand"><span className="h-fin-mark" aria-hidden />{era.publication}</div>
          <nav className="h-fin-nav" aria-label="Sections">
            <NavItem to={{ name: 'home' }} label={L.home} active={isHome} />
            <NavItem to={{ name: 'portfolio' }} label={L.portfolio} active={view.name === 'portfolio'} />
          </nav>
          <button type="button" className="h-fin-search" onClick={onPalette}>
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m14 14 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <span>Search</span><kbd>⌘K</kbd>
          </button>
          <div className="h-fin-meta"><span className="h-fin-date">{era.formatDate(date)}</span>{exitBtn}</div>
        </header>
      );
  }
}

function Web2Header({ onExit }: { onExit: () => void }) {
  const era = useEra();
  const { date, view, go } = useSim();
  const [menu, setMenu] = useState(false);
  const L = era.labels;
  return (
    <header className="h-web2">
      <div className="h-web2-bar">
        <div className="h-web2-logo">{era.publication}<span className="h-web2-beta">beta</span></div>
        <div className="h-web2-right"><HistoricalSearch compact /></div>
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
        <span className="h-web2-date">{era.formatDate(date)} · <button type="button" className="h-exit" onClick={onExit}>{L.exit}</button></span>
      </div>
    </header>
  );
}
