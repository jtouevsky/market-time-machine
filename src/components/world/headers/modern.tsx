import { useEffect, type CSSProperties } from 'react';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { HistoricalSearch } from '../../modules/HistoricalSearch';
import { Icon } from './icons';
import { NavItem } from './common';

type P = { onPalette?: () => void };

function useNavIndex() {
  const { view } = useSim();
  return view.name === 'home' ? 0 : view.name === 'portfolio' ? 1 : -1;
}

function Exit() {
  const era = useEra();
  const { exit } = useSim();
  return <button type="button" className="h-exit" onClick={exit}>{era.labels.exit}</button>;
}

function Nav({ icons = false, label = 'Sections' }: { icons?: boolean; label?: string }) {
  const era = useEra();
  const { view } = useSim();
  const L = era.labels;
  const i = useNavIndex();
  return (
    <nav className="h-m-nav" aria-label={label} style={{ '--i': Math.max(i, 0) } as CSSProperties} data-none={i < 0 || undefined}>
      <NavItem to={{ name: 'home' }} label={icons ? <><Icon name="home" size={16} /><span>{L.home}</span></> : L.home} active={view.name === 'home'} />
      <NavItem to={{ name: 'portfolio' }} label={icons ? <><Icon name="pie" size={16} /><span>{L.portfolio}</span></> : L.portfolio} active={view.name === 'portfolio'} />
    </nav>
  );
}

function PaletteBtn({ onPalette, text = 'Search', kbd = '⌘K' }: P & { text?: string; kbd?: string }) {
  return (
    <button type="button" className="h-fin-search" onClick={onPalette}>
      <Icon name="search" size={14} /><span>{text}</span>{kbd ? <kbd>{kbd}</kbd> : null}
    </button>
  );
}

/** Dense-terminal shortcuts: "/" opens the palette, "g h" / "g p" / "g s" jump around. */
function useShortcuts(onPalette?: () => void) {
  const { go } = useSim();
  useEffect(() => {
    let armed = false; let t: ReturnType<typeof setTimeout> | undefined;
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable) return;
      if (e.key === '/') { e.preventDefault(); onPalette?.(); return; }
      if (armed) {
        armed = false;
        if (e.key === 'h') go({ name: 'home' }); else if (e.key === 'p') go({ name: 'portfolio' }); else if (e.key === 's') go({ name: 'search', q: '' });
        return;
      }
      if (e.key === 'g') { armed = true; clearTimeout(t); t = setTimeout(() => { armed = false; }, 900); }
    };
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); clearTimeout(t); };
  }, [go, onPalette]);
}

/** 2018 — hairline masthead: wordmark left, quiet links, a single underlined search. */
function MinimalHeader() {
  const era = useEra();
  const { date } = useSim();
  return (
    <header className="h-min">
      <div className="h-min-brand">{era.publication}</div>
      <Nav />
      <div className="h-min-search"><HistoricalSearch compact /></div>
      <div className="h-min-meta"><span>{era.formatDate(date)}</span><Exit /></div>
    </header>
  );
}

/** 2019 — pro terminal: status strip, command bar and shortcut handling. */
function TermHeader({ onPalette }: P) {
  const era = useEra();
  const { date } = useSim();
  useShortcuts(onPalette);
  return (
    <header className="h-term">
      <div className="h-term-strip">
        <span className="h-term-live"><i aria-hidden />SIM</span>
        <span>{era.formatDate(date)}</span>
      </div>
      <div className="h-term-bar">
        <div className="h-term-brand">{era.publication}</div>
        <Nav />
        <button type="button" className="h-term-cmd" onClick={onPalette}><span aria-hidden>›</span> Jump to company, news or action<kbd>⌘K</kbd></button>
        <Exit />
      </div>
    </header>
  );
}

/** 2020 — retail app bar: wordmark, pill nav, search pill. */
function RetailHeader() {
  const era = useEra();
  const { date } = useSim();
  return (
    <header className="h-retail">
      <div className="h-retail-brand"><span className="h-fin-mark" aria-hidden />{era.publication}</div>
      <Nav />
      <div className="h-retail-search"><HistoricalSearch compact /></div>
      <div className="h-retail-meta"><span>{era.formatShort(date)}</span><Exit /></div>
    </header>
  );
}

/** 2021 — a floating frosted bar. */
function GlassHeader({ onPalette }: P) {
  const era = useEra();
  const { date } = useSim();
  return (
    <header className="h-glass">
      <div className="h-glass-bar">
        <div className="h-glass-brand"><span className="h-fin-mark" aria-hidden />{era.publication}</div>
        <Nav />
        <PaletteBtn onPalette={onPalette} />
        <span className="h-fin-date">{era.formatShort(date)}</span>
        <Exit />
      </div>
    </header>
  );
}

/** 2022 — bento top bar. */
function BentoHeader({ onPalette }: P) {
  const era = useEra();
  const { date } = useSim();
  return (
    <header className="h-bento">
      <div className="h-fin-brand"><span className="h-fin-mark" aria-hidden />{era.publication}</div>
      <Nav />
      <PaletteBtn onPalette={onPalette} />
      <div className="h-fin-meta"><span className="h-fin-date">{era.formatDate(date)}</span><Exit /></div>
    </header>
  );
}

/** 2023 — research notebook: calm masthead, ask-first. */
function ResearchHeader({ onPalette }: P) {
  const era = useEra();
  const { date, go } = useSim();
  return (
    <header className="h-res">
      <div className="h-res-brand"><span className="h-res-glyph" aria-hidden><Icon name="spark" size={16} /></span>{era.publication}</div>
      <Nav />
      <button type="button" className="h-res-ask" onClick={() => { go({ name: 'home' }); setTimeout(() => document.getElementById('d-ask-input')?.focus(), 80); }}><Icon name="spark" size={14} />Ask</button>
      <PaletteBtn onPalette={onPalette} text="Commands" />
      <div className="h-fin-meta"><span className="h-fin-date">{era.formatShort(date)}</span><Exit /></div>
    </header>
  );
}

/** 2024 — spatial: floating plane over the ambient light. */
function SpatialHeader({ onPalette }: P) {
  const era = useEra();
  const { date } = useSim();
  return (
    <header className="h-spa">
      <div className="h-spa-plane">
        <div className="h-fin-brand"><span className="h-fin-mark" aria-hidden />{era.publication}</div>
        <Nav />
        <PaletteBtn onPalette={onPalette} />
        <div className="h-fin-meta"><span className="h-fin-date">{era.formatShort(date)}</span><Exit /></div>
      </div>
    </header>
  );
}

/** 2025 — "OS" menu bar. */
function OsHeader({ onPalette }: P) {
  const era = useEra();
  const { date } = useSim();
  return (
    <header className="h-os">
      <span className="h-os-logo" aria-hidden />
      <b className="h-os-name">{era.publication}</b>
      <Nav label="Menu" />
      <span className="h-os-gap" />
      <PaletteBtn onPalette={onPalette} text="Search" />
      <span className="h-os-clock">{era.formatShort(date)}</span>
      <Exit />
    </header>
  );
}

/** 2026 — liquid glass: a floating pill whose highlight morphs between destinations. */
function LiquidHeader({ onPalette }: P) {
  const era = useEra();
  const { date } = useSim();
  return (
    <header className="h-liq">
      <div className="h-liq-brand"><span className="h-fin-mark" aria-hidden />{era.publication}</div>
      <Nav icons />
      <div className="h-liq-right">
        <PaletteBtn onPalette={onPalette} kbd="" text="Search" />
        <span className="h-fin-date">{era.formatShort(date)}</span>
        <Exit />
      </div>
    </header>
  );
}

export function FinHeader({ onPalette }: P) {
  const era = useEra();
  switch (era.exp.id) {
    case 'minimal-2018': return <MinimalHeader />;
    case 'dataterm-2019': return <TermHeader onPalette={onPalette} />;
    case 'retail-2020': return <RetailHeader />;
    case 'glass-2021': return <GlassHeader onPalette={onPalette} />;
    case 'bento-2022': return <BentoHeader onPalette={onPalette} />;
    case 'research-2023': return <ResearchHeader onPalette={onPalette} />;
    case 'spatial-2024': return <SpatialHeader onPalette={onPalette} />;
    case 'finos-2025': return <OsHeader onPalette={onPalette} />;
    case 'liquid-2026': return <LiquidHeader onPalette={onPalette} />;
    default: return <BentoHeader onPalette={onPalette} />;
  }
}
