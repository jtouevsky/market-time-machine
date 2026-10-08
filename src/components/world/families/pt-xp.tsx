import { useId, useState, type ReactNode } from 'react';
import { useSim } from '../../../state/simulation';
import type { HomeData } from '../../../state/useHistorical';
import { useEra } from '../../../theme/EraThemeProvider';
import { fmtChange, fmtQuoteValue } from '../../../theme/format';
import { useLinkStatus } from '../headers/ew-browser';
import { useSimClock } from './ew-win98';
import { CATS } from './home-helpers';

function Pane({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={`pt-pane${open ? ' is-open' : ''}`}>
      <h2 className="pt-pane-h"><button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><span>{title}</span><span className="pt-chev" aria-hidden="true" /></button></h2>
      <div className="pt-pane-body" id={id} hidden={!open}>{children}</div>
    </section>
  );
}

/** Bottom taskbar: a green Start button with a small menu, a window button and a tray clock. */
function XpTaskbar({ title }: { title: string }) {
  const era = useEra();
  const { date, go, exit } = useSim();
  const [open, setOpen] = useState(false);
  const clock = useSimClock();
  const pick = (run: () => void) => () => { setOpen(false); run(); };
  return (
    <div className="pt-xp-taskbar" role="toolbar" aria-label="Taskbar" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
      <button type="button" className={`pt-xp-start${open ? ' is-open' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}><span className="pt-xp-start-flag" aria-hidden="true" /><i>start</i></button>
      {open ? (
        <div className="pt-xp-startmenu" role="menu" aria-label="Start">
          <div className="pt-xp-startmenu-top"><span className="pt-xp-avatar" aria-hidden="true" />{era.publication}</div>
          <button type="button" role="menuitem" onClick={pick(() => go({ name: 'home' }))}>Home</button>
          <button type="button" role="menuitem" onClick={pick(() => go({ name: 'portfolio' }))}>My Portfolio</button>
          <button type="button" role="menuitem" onClick={pick(() => go({ name: 'search', q: '' }))}>Search</button>
          <div className="pt-xp-startmenu-foot"><button type="button" role="menuitem" onClick={pick(exit)}>Turn Off Site</button></div>
        </div>
      ) : null}
      <span className="pt-xp-taskbtn" aria-hidden="true">{title}</span>
      <span className="pt-xp-tray" role="timer" aria-label={`Simulated time ${clock} on ${era.formatShort(date)}`}><span className="pt-xp-tray-ico" aria-hidden="true" />{clock}</span>
    </div>
  );
}

export function XpWindow({ data, onSources, children }: { data: HomeData; onSources: () => void; children: ReactNode }) {
  const era = useEra();
  const { date, go, exit, view } = useSim();
  const { hover, bind } = useLinkStatus();
  const quotes = data.markets.indexes.slice(0, 5);
  const link = (label: string, run: () => void, on = false) => <li key={label}><button type="button" className={`pt-link ew-go${on ? ' is-on' : ''}`} onClick={run}>{label}</button></li>;
  return (
    <>
    <div className="ew-win pt-xp-win" role="group" aria-label={`${era.publication} window`}>
      <div className="pt-xp-title">
        <span className="pt-xp-ico" aria-hidden="true" />
        <span className="pt-xp-title-text">{era.publication} - {era.motto}</span>
        <span className="pt-xp-ctl" aria-hidden="true"><i className="is-min" /><i className="is-max" /></span>
        <button type="button" className="pt-xp-close" aria-label="Close window and leave site" onClick={exit}>x</button>
      </div>
      <div className="pt-xp-body">
        <aside className="pt-xp-panes" aria-label="Task panes" {...bind}>
          <Pane title="Quick Links">
            <ul>
              {link('Home', () => go({ name: 'home' }), view.name === 'home')}
              {link('My Portfolio', () => go({ name: 'portfolio' }), view.name === 'portfolio')}
              {link('Search', () => go({ name: 'search', q: '' }), view.name === 'search' && !view.q)}
              {CATS.slice(0, 4).map((c) => link(c.label, () => go({ name: 'search', q: c.label.toLowerCase() })))}
            </ul>
          </Pane>
          <Pane title="Markets" defaultOpen={false}>
            {quotes.length ? (
              <ul className="pt-quotes">
                {quotes.map((q) => (
                  <li key={q.id}><span>{q.name}</span><b>{fmtQuoteValue(q, era, date)}</b><span className={(q.change ?? 0) >= 0 ? 'm-up' : 'm-down'}>{fmtChange(q, era, date, 'pct')}</span></li>
                ))}
              </ul>
            ) : <p className="pt-pane-note">{data.status.markets === 'loading' ? 'Loading quotes…' : 'No quotes for this date.'}</p>}
          </Pane>
          <Pane title="See Also" defaultOpen={false}>
            <ul>
              {link('Sources and notes', onSources)}
              {link('Leave this site', exit)}
            </ul>
          </Pane>
        </aside>
        <div className="ew-view pt-xp-view" {...bind}>{children}</div>
      </div>
      <div className="ew-status" role="status" aria-live="off">
        <span className="ew-status-main">{hover || 'Done'}</span>
        <span className="ew-status-zone">{era.formatShort(date)}</span>
        <span className="ew-status-zone">Internet</span>
      </div>
    </div>
    <XpTaskbar title={`${era.publication} - ${era.motto}`} />
    </>
  );
}
