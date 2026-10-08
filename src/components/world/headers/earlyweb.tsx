import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { HistoricalSearch } from '../../modules/HistoricalSearch';
import { scrollTo } from './common';

export function DirectoryHeader() {
  const era = useEra();
  const { date, exit, go, view } = useSim();
  const L = era.labels;
      return (
        <header className="h-dir">
          <nav className="h-dir-tabs" aria-label="Sections">
            {[{ l: 'Home', on: view.name === 'home', run: () => go({ name: 'home' }) }, { l: 'Stocks', on: view.name === 'portfolio', run: () => go({ name: 'portfolio' }) }, { l: 'News', on: false, run: () => { go({ name: 'home' }); scrollTo('sec-news'); } }, { l: 'Search', on: view.name === 'search', run: () => go({ name: 'search', q: '' }) }].map((t) => (
              <button key={t.l} type="button" className={`h-dir-tab ew-go${t.on ? ' is-on' : ''}`} aria-current={t.on ? 'page' : undefined} onClick={t.run}>{t.l}</button>
            ))}
          </nav>
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
          <div className="h-dir-opts">Search options: {['stocks', 'funds', 'weather', 'sports'].map((t, i) => <span key={t}>{i ? ' \u00b7 ' : ' '}<a href={`#${t}`} onClick={(e) => { e.preventDefault(); go({ name: 'search', q: t }); }}>{t}</a></span>)}</div>
          <div className="h-dir-date">{era.formatDate(date)}</div>
        </header>
      );
}

