import { useState } from 'react';
import { usePage } from '../../../state/page';
import { useSim, type View } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { scrollTo } from './common';

export function BroadcastHeader() {
  const era = useEra();
  const { date, view, exit, go } = useSim();
  const L = era.labels;
  const isHome = view.name === 'home';
  // each knob remembers how far it has been turned; a change of channel flashes a burst of "snow"
  const [turns, setTurns] = useState<Record<number, number>>({});
  const [snow, setSnow] = useState(0);
  const channels: [number, string, View, boolean][] = [
    [2, 'News', { name: 'home' }, isHome], [4, 'Markets', { name: 'home' }, false], [7, 'Portfolio', { name: 'portfolio' }, view.name === 'portfolio'], [9, 'Research', { name: 'search', q: '' }, view.name === 'search'],
  ];
  const tuned = channels.find((c) => c[3]) ?? channels[0];
  const tune = (n: number, label: string, to: View) => {
    setTurns((t) => ({ ...t, [n]: (t[n] ?? 0) + 1 }));
    setSnow((k) => k + 1);
    go(to);
    if (label === 'Markets') scrollTo('sec-markets');
  };
  return (
    <header className="h-bc">
      {snow ? <span key={snow} className="h-bc-snow" aria-hidden /> : null}
      <div className="h-bc-top">
        <div className="h-bc-brand"><span className="h-bc-logo">{era.publication}</span><span className="h-bc-motto">{era.motto}</span></div>
        <div className="h-bc-date"><span className="h-bc-bug" aria-hidden>CH {tuned[0]}</span>{era.formatDate(date)}<small>Price {era.price}</small></div>
      </div>
      <nav className="h-bc-dial" aria-label="Channels">
        {channels.map(([n, label, to, active]) => (
          <button key={n} type="button" className={`h-bc-ch${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => tune(n, label, to)}>
            <span className="h-bc-knob" aria-hidden style={{ ['--spin' as string]: `${(turns[n] ?? 0) * 72}deg` }}>{n}</span><span>{label}</span>
          </button>
        ))}
        <span className="h-nav-sep" />
        <button type="button" className="h-bc-ch h-bc-off" onClick={exit}><span className="h-bc-knob" aria-hidden>⏻</span><span>{L.exit}</span></button>
      </nav>
    </header>
  );
}


/** Teletext masthead: page number, service name, date, a mosaic strip, a double-height page title and a colour-block menu line. */
export function TeletextHeader() {
  const era = useEra();
  const { date, view, exit, go } = useSim();
  const { page } = usePage();
  const pages = era.exp.composition?.pages ?? [];
  const idx = Math.min(page, Math.max(pages.length - 1, 0));
  const p = pages[idx];
  const onHome = view.name === 'home';
  const prestel = era.exp.opts?.style === 'prestel';
  const current = view.name === 'portfolio' ? '200' : view.name === 'search' || view.name === 'company' ? '300' : p?.key ?? '100';
  const title = view.name === 'portfolio' ? 'Portfolio' : view.name === 'search' ? 'Find' : view.name === 'company' ? 'Company' : p?.label ?? 'Index';
  const blocks: [string, string, () => void][] = [['red', 'NEWS', () => go({ name: 'home' })], ['green', 'PORTFOLIO', () => go({ name: 'portfolio' })], ['yellow', 'FIND', () => go({ name: 'search', q: '' })], ['cyan', 'EXIT', exit]];
  return (
    <header className="h-tt">
      <div className="h-tt-row">
        <span className="h-tt-page">{prestel ? `*${current}#` : `P${current}`}</span>
        <span className="h-tt-name">{era.publication}</span>
        <span className="h-tt-date">{era.formatDate(date)}</span>
      </div>
      <div className="h-tt-mosaic" aria-hidden />
      <div className="h-tt-title">
        <span className="h-tt-dh">{title}</span>
        {onHome && pages.length > 1 ? <span className="h-tt-sub" role="img" aria-label={`Subpage ${idx + 1} of ${pages.length}`}>{idx + 1}/{pages.length}</span> : null}
      </div>
      <nav className="h-tt-blocks" aria-label="Sections">
        {blocks.map(([c, label, fn]) => <button key={c} type="button" className={`h-tt-blk h-tt-${c}`} onClick={fn}>{label}</button>)}
      </nav>
    </header>
  );
}
