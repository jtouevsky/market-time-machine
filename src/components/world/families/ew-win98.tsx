import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { Menus, useLinkStatus, type MenuDef } from '../headers/ew-browser';

/** A simulated clock: it starts at 9:30 on the simulated date and ticks forward while the page is open. */
export function useSimClock() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const total = 9 * 3600 + 30 * 60 + secs;
  const h24 = Math.floor(total / 3600) % 24, m = Math.floor(total / 60) % 60;
  return `${h24 % 12 || 12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

export function Taskbar({ title }: { title: string }) {
  const era = useEra();
  const { date, go, exit } = useSim();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const clock = useSimClock();
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  const pick = (run: () => void) => () => { setOpen(false); run(); };
  return (
    <div className="ew98-taskbar" role="toolbar" aria-label="Taskbar" ref={ref} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
      <button type="button" className={`ew98-start${open ? ' is-open' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}><span className="ew98-flag" aria-hidden="true" />Start</button>
      {open ? (
        <ul className="ew98-startmenu" role="menu" aria-label="Start">
          <li role="none"><button type="button" role="menuitem" data-ico="home" onClick={pick(() => go({ name: 'home' }))}>Home</button></li>
          <li role="none"><button type="button" role="menuitem" data-ico="folio" onClick={pick(() => go({ name: 'portfolio' }))}>My Portfolio</button></li>
          <li role="none"><button type="button" role="menuitem" data-ico="find" onClick={pick(() => go({ name: 'search', q: '' }))}>Find...</button></li>
          <li role="none" className="ew98-sep"><button type="button" role="menuitem" data-ico="off" onClick={pick(exit)}>Shut Down...</button></li>
        </ul>
      ) : null}
      <span className="ew98-grip" aria-hidden="true" />
      <button type="button" className="ew98-ql ew98-ql-home" aria-label="Home" title="Home" onClick={() => go({ name: 'home' })} />
      <button type="button" className="ew98-ql ew98-ql-find" aria-label="Find" title="Find" onClick={() => go({ name: 'search', q: '' })} />
      <span className="ew98-grip" aria-hidden="true" />
      <span className="ew98-taskbtn" aria-hidden="true"><i className="ew98-ico" />{title}</span>
      <span className="ew98-tray" role="timer" aria-label={`Simulated time ${clock} on ${era.formatShort(date)}`}><span className="ew98-tray-ico" aria-hidden="true" />{clock} <small>{era.formatShort(date)}</small></span>
    </div>
  );
}

export function Win98Window({ children }: { children: ReactNode }) {
  const era = useEra();
  const { go, exit, view } = useSim();
  const { hover, bind } = useLinkStatus();
  const viewRef = useRef<HTMLDivElement>(null);
  useEffect(() => { viewRef.current?.scrollTo({ top: 0 }); }, [view]);
  const menus: MenuDef[] = [
    { label: 'File', items: [{ label: 'Close', run: exit }] },
    { label: 'Go', items: [{ label: 'Home', run: () => go({ name: 'home' }) }, { label: 'My Portfolio', run: () => go({ name: 'portfolio' }) }, { label: 'Search', run: () => go({ name: 'search', q: '' }) }] },
  ];
  const title = `${era.publication} - ${era.motto}`;
  return (
    <>
      <div className="ew-win ew98-window" role="group" aria-label={title}>
        <div className="ew-title">
          <span className="ew98-ico" aria-hidden="true" />
          <span className="ew-title-text">{title}</span>
          <span className="ew-title-ctl" aria-hidden="true"><i /><i /></span>
          <button type="button" className="ew98-close" aria-label="Close window and leave site" onClick={exit}>x</button>
        </div>
        <Menus menus={menus} />
        <div className="ew-view" ref={viewRef} {...bind}>{children}</div>
        <div className="ew-status" role="status" aria-live="off">
          <span className="ew-status-main">{hover || 'Done'}</span>
          <span className="ew-status-zone">Internet zone</span>
        </div>
      </div>
      <Taskbar title={title} />
    </>
  );
}
