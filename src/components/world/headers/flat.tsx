import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { HistoricalSearch } from '../../modules/HistoricalSearch';
import { Icon } from './icons';
import { NavItem } from './common';

/** 0 = home, 1 = portfolio, 2 = search, -1 = elsewhere (company page) — drives the sliding indicators. */
function useNavIndex() {
  const { view } = useSim();
  return view.name === 'home' ? 0 : view.name === 'portfolio' ? 1 : view.name === 'search' ? 2 : -1;
}

function Exit() {
  const era = useEra();
  const { exit } = useSim();
  return <button type="button" className="h-exit" onClick={exit}>{era.labels.exit}</button>;
}

function Items({ icons = false }: { icons?: boolean }) {
  const era = useEra();
  const { view } = useSim();
  const L = era.labels;
  const ic = (n: 'home' | 'pie' | 'search', t: string) => (icons ? <><Icon name={n} /><span>{t}</span></> : t);
  return (
    <>
      <NavItem to={{ name: 'home' }} label={ic('home', L.home)} active={view.name === 'home'} />
      <NavItem to={{ name: 'portfolio' }} label={ic('pie', L.portfolio)} active={view.name === 'portfolio'} />
      <NavItem to={{ name: 'search', q: '' }} label={ic('search', L.search)} active={view.name === 'search'} />
    </>
  );
}

/** 2013 — Windows-8 style: a huge lowercase title over a pivot of section names. */
function MetroHeader() {
  const era = useEra();
  const { date } = useSim();
  const i = useNavIndex();
  return (
    <header className="h-metro">
      <div className="h-metro-row">
        <p className="h-metro-title"><span className="h-metro-mark" aria-hidden />{era.publication.toLowerCase()}</p>
        <div className="h-metro-search"><HistoricalSearch compact /></div>
        <div className="h-metro-meta"><span className="h-metro-date">{era.formatDate(date)}</span><Exit /></div>
      </div>
      <nav className="h-metro-pivot" aria-label="Sections" style={{ '--i': Math.max(i, 0) } as React.CSSProperties} data-none={i < 0 || undefined}><Items /></nav>
    </header>
  );
}

/** 2014 / 2017 — Material: coloured app bar, tab strip with an ink bar, bottom navigation on phones (2017). */
function MaterialHeader({ v17 }: { v17: boolean }) {
  const era = useEra();
  const { date } = useSim();
  const i = useNavIndex();
  return (
    <header className={`h-mat${v17 ? ' is-17' : ''}`}>
      <div className="h-mat-bar">
        <span className="h-mat-title">{era.publication}</span>
        <div className="h-mat-search"><HistoricalSearch compact /></div>
        <span className="h-mat-date">{era.formatShort(date)}</span>
        <Exit />
      </div>
      <nav className="h-mat-tabs" aria-label="Sections" style={{ '--i': Math.max(i, 0) } as React.CSSProperties} data-none={i < 0 || undefined}><Items /></nav>
      {v17 ? <nav className="h-mat-bottom" aria-label="Primary"><Items icons /></nav> : null}
    </header>
  );
}

/** 2015 — iOS-light: thin brand, grouped segmented control. */
function IosHeader() {
  const era = useEra();
  const { date } = useSim();
  const i = useNavIndex();
  return (
    <header className="h-ios">
      <div className="h-ios-top">
        <div className="h-flat-brand"><span className="h-flat-mark" aria-hidden />{era.publication}</div>
        <div className="h-ios-search"><HistoricalSearch compact /></div>
        <div className="h-flat-meta"><span className="h-flat-date">{era.formatShort(date)}</span><Exit /></div>
      </div>
      <nav className="h-ios-seg" aria-label="Sections" style={{ '--i': Math.max(i, 0) } as React.CSSProperties} data-none={i < 0 || undefined}><Items /></nav>
    </header>
  );
}

/** 2016 — responsive cards portal: left rail with an avatar and icon navigation. */
function RailHeader() {
  const era = useEra();
  const { date, go } = useSim();
  return (
    <header className="h-flat h-rail">
      <div className="h-flat-brand"><span className="h-flat-mark" aria-hidden />{era.publication}</div>
      <button type="button" className="h-rail-me" onClick={() => go({ name: 'portfolio' })}>
        <span className="h-rail-av" aria-hidden><Icon name="user" size={18} /></span>
        <span><b>My account</b><small>{era.labels.portfolio}</small></span>
      </button>
      <nav className="h-flat-nav" aria-label="Sections"><Items icons /></nav>
      <div className="h-flat-search"><HistoricalSearch compact /></div>
      <div className="h-flat-meta"><span className="h-flat-date">{era.formatDate(date)}</span><Exit /></div>
    </header>
  );
}

export function FlatHeader() {
  const era = useEra();
  switch (era.exp.id) {
    case 'metro-2013': return <MetroHeader />;
    case 'material-2014': return <MaterialHeader v17={false} />;
    case 'material-2017': return <MaterialHeader v17 />;
    case 'flat-2015': return <IosHeader />;
    default: return <RailHeader />;
  }
}
