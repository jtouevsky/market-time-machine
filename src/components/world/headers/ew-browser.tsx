/**
 * Early-web chrome: a browser window (Mosaic / Netscape styles) with a working in-app history stack over the
 * app's `view` state, plus the pieces other window-styled eras reuse (menus, link-status tracking, throbber).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import { useSim, type View } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';

export const SITE = 'http://www.markettime.example/';

export function viewPath(v: View): string {
  switch (v.name) {
    case 'home': return '';
    case 'portfolio': return 'stocks/portfolio.html';
    case 'search': return v.q ? `search.html?q=${encodeURIComponent(v.q)}` : 'search.html';
    case 'company': return `quotes/${encodeURIComponent(v.ticker.toLowerCase())}.html`;
  }
}

export function viewTitle(v: View, publication: string): string {
  switch (v.name) {
    case 'home': return publication;
    case 'portfolio': return `${publication} - My Stocks`;
    case 'search': return v.q ? `${publication} - Search: ${v.q}` : `${publication} - Search`;
    case 'company': return `${publication} - ${v.ticker}`;
  }
}

const sameView = (a: View, b: View) => JSON.stringify(a) === JSON.stringify(b);

/** The address a link or button points at, as the status bar would show it. */
function targetOf(el: Element | null): string {
  const t = el?.closest('a, button.m-link, button.h-nav-item, button.ew-go, button.m-chip');
  if (!t) return '';
  if (t instanceof HTMLAnchorElement) {
    const h = t.getAttribute('href') ?? '';
    if (/^https?:/i.test(h)) return h;
    return SITE + (h.replace(/^#/, '') || 'index') + '.html';
  }
  const slug = (t.getAttribute('data-target') ?? t.textContent ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return slug ? `${SITE}${slug}.html` : '';
}

/** Tracks the link under the pointer / keyboard focus. Spread `bind` on any container. */
export function useLinkStatus() {
  const [hover, setHover] = useState('');
  const set = useCallback((e: SyntheticEvent) => setHover(targetOf(e.target as Element)), []);
  const clear = useCallback(() => setHover(''), []);
  return { hover, bind: { onMouseOver: set, onFocus: set, onMouseOut: clear, onBlur: clear } };
}

// ------------------------------------------------------------------ menus
export interface MenuDef { label: string; items: { label: string; run: () => void; disabled?: boolean }[] }

export function Menus({ menus, className = '' }: { menus: MenuDef[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open === null) return;
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  return (
    <div className={`ew-menubar ${className}`} role="menubar" aria-label="Menu" ref={ref} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(null); }}>
      {menus.map((m, i) => (
        <div key={m.label} className="ew-menu" role="none">
          <button type="button" role="menuitem" aria-haspopup="menu" aria-expanded={open === i} className={`ew-menu-btn${open === i ? ' is-open' : ''}`} onClick={() => setOpen(open === i ? null : i)}>{m.label}</button>
          {open === i ? (
            <ul className="ew-menu-list" role="menu" aria-label={m.label}>
              {m.items.map((it) => (
                <li key={it.label} role="none"><button type="button" role="menuitem" className="ew-menu-item" disabled={it.disabled} onClick={() => { setOpen(null); it.run(); }}>{it.label}</button></li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ icons (tiny, stroke-based)
const Ico = ({ d }: { d: string }) => <svg className="ew-ico" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter" /></svg>;
const ICON = {
  back: 'M13 8H3M7 4L3 8l4 4',
  forward: 'M3 8h10M9 4l4 4-4 4',
  home: 'M2 8l6-5 6 5M4 7v7h3v-4h2v4h3V7',
  reload: 'M13 8a5 5 0 1 1-1.6-3.7M13 2v3.5h-3.5',
  search: 'M7 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM10.5 10.5L14 14',
  stocks: 'M2 13V3M2 13h12M4 10l3-3 2 2 4-5',
};

export function Throbber({ busy, kind }: { busy: boolean; kind: 'mosaic' | 'netscape' }) {
  return (
    <div className={`ew-throb is-${kind}${busy ? ' is-busy' : ''}`} role="img" aria-label={busy ? 'Loading page' : 'Idle'}>
      <span className="ew-throb-a" /><span className="ew-throb-b" /><span className="ew-throb-c" />
      {kind === 'netscape' ? <span className="ew-throb-mt">MT</span> : null}
    </div>
  );
}

// ------------------------------------------------------------------ the browser
export function BrowserFrame({ variant, children }: { variant: 'mosaic' | 'netscape'; children: ReactNode }) {
  const era = useEra();
  const { view, go, exit } = useSim();
  const [hist, setHist] = useState<{ stack: View[]; idx: number }>(() => ({ stack: [view], idx: 0 }));
  const [busy, setBusy] = useState(true);
  const [blank, setBlank] = useState(false);
  const [rk, setRk] = useState(0);
  const [note, setNote] = useState('');
  const { hover, bind } = useLinkStatus();
  const viewRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const busyTimer = useRef(0);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const startBusy = (ms: number) => { clearTimeout(busyTimer.current); setBusy(true); busyTimer.current = window.setTimeout(() => setBusy(false), ms); };
  useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(busyTimer.current); }, []);

  const key = JSON.stringify(view);
  useEffect(() => {
    setHist((h) => (sameView(h.stack[h.idx], view) ? h : { stack: [...h.stack.slice(0, h.idx + 1), view], idx: h.idx + 1 }));
    startBusy(600);
    viewRef.current?.scrollTo({ top: 0 });
  }, [key]);

  const canBack = hist.idx > 0, canFwd = hist.idx < hist.stack.length - 1;
  const back = () => { if (canBack) { setHist({ ...hist, idx: hist.idx - 1 }); go(hist.stack[hist.idx - 1]); } };
  const forward = () => { if (canFwd) { setHist({ ...hist, idx: hist.idx + 1 }); go(hist.stack[hist.idx + 1]); } };
  const reload = () => {
    setBlank(true); startBusy(1100);
    later(() => { setRk((k) => k + 1); setBlank(false); }, 260);
  };
  const flash = (m: string) => { setNote(m); later(() => setNote(''), 3500); };

  const url = SITE + viewPath(view);
  const title = viewTitle(view, era.publication);
  const kind = variant;
  const menus: MenuDef[] = [
    { label: 'File', items: [{ label: 'Reload Document', run: reload }, { label: 'Leave Site', run: exit }] },
    { label: 'Navigate', items: [{ label: 'Back', run: back, disabled: !canBack }, { label: 'Forward', run: forward, disabled: !canFwd }, { label: 'Home Document', run: () => go({ name: 'home' }) }] },
    { label: 'Go', items: [{ label: 'My Stocks', run: () => go({ name: 'portfolio' }) }, { label: 'Search', run: () => go({ name: 'search', q: '' }) }] },
    { label: 'Help', items: [{ label: 'About This Browser', run: () => flash('Market Time Navigator - a make-believe browser for the simulated web. Nothing here is a real network address.') }] },
  ];
  const status = hover || note || (busy ? era.exp.loading : 'Document: Done.');

  const btn = (label: string, icon: keyof typeof ICON, run: () => void, disabled = false) => (
    <button type="button" className="ew-tb" onClick={run} disabled={disabled}><Ico d={ICON[icon]} /><span>{label}</span></button>
  );

  return (
    <div className={`ew-win ew-browser is-${kind}`} role="group" aria-label={kind === 'mosaic' ? 'Document viewer window' : 'Browser window'}>
      <div className="ew-title">
        <span className="ew-sysbox" aria-hidden="true" />
        <span className="ew-title-text">{kind === 'mosaic' ? `Market Time Mosaic-style Viewer - [${title}]` : `${title} - Market Time Navigator`}</span>
        <span className="ew-title-ctl" aria-hidden="true"><i /><i /></span>
      </div>
      <Menus menus={menus} />
      <div className="ew-toolbar">
        <div className="ew-tools" role="toolbar" aria-label="Navigation">
          {btn('Back', 'back', back, !canBack)}
          {btn('Forward', 'forward', forward, !canFwd)}
          {btn('Home', 'home', () => go({ name: 'home' }))}
          {btn('Reload', 'reload', reload)}
          {btn('Stocks', 'stocks', () => go({ name: 'portfolio' }))}
          {btn('Search', 'search', () => go({ name: 'search', q: '' }))}
        </div>
        <Throbber busy={busy} kind={kind} />
      </div>
      <div className="ew-loc">
        {kind === 'mosaic' ? (
          <>
            <label className="ew-loc-row"><span>Document Title:</span><input readOnly value={title} aria-label="Document title" /></label>
            <label className="ew-loc-row"><span>Document URL:</span><input readOnly value={url} aria-label="Document URL" /></label>
          </>
        ) : (
          <label className="ew-loc-row"><span>Location:</span><input readOnly value={url} aria-label="Location" /></label>
        )}
      </div>
      {kind === 'netscape' ? (
        <div className="ew-dirbar" role="toolbar" aria-label="Directory buttons">
          <button type="button" className="ew-go" onClick={() => go({ name: 'home' })}>What's New!</button>
          <button type="button" className="ew-go" onClick={() => go({ name: 'portfolio' })}>What's Cool!</button>
          <button type="button" className="ew-go" onClick={() => go({ name: 'search', q: '' })}>Net Search</button>
          <button type="button" className="ew-go" onClick={() => go({ name: 'search', q: 'finance' })}>Finance Guide</button>
        </div>
      ) : null}
      <div className="ew-view" ref={viewRef} {...bind}>
        {blank ? <p className="ew-blank">Contacting host…</p> : <div key={rk} className="ew-viewport">{children}</div>}
      </div>
      <div className="ew-status" role="status" aria-live="off">
        <span className="ew-status-main">{status}</span>
        <span className={`ew-status-zone ew-status-load${busy ? ' is-busy' : ''}`}>{busy ? 'Loading…' : 'Done'}</span>
      </div>
    </div>
  );
}
