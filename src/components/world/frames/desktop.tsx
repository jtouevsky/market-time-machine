/**
 * Desktop family (1989–1992): a menu bar, desktop icons and real-feeling windows over the same data modules.
 *
 *  mono-1989  1-bit windows: close box, striped title bar, zoom box, size grip, dithered desk, About / Control Panel.
 *  win3-1991  grey beveled windows: control-menu box, minimise / maximise arrows, Program Manager group window,
 *             minimised-icon row, active / inactive title colours.
 *
 * Windows drag by title bar (pointer or arrow keys), resize by the grip (pointer or Ctrl+arrows), raise on focus,
 * zoom with a double-click on the title bar or Enter. Icons open on double-click (single tap on touch) or Enter.
 * Pull-down menus follow the arrow keys. Under 1040px wide the windows stack in normal flow.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../../styles/families/desktop.css';
import '../../../styles/families/desktop-era.css';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { AdvanceTime } from '../../modules/AdvanceTime';
import { HistoricalSearch } from '../../modules/HistoricalSearch';
import { HistoricalNews, LeadStory, splitLead } from '../../modules/HistoricalNews';
import { HistoricalSports } from '../../modules/Environment';
import { CompaniesInNews, EconomicSnapshot, MarketMovers, MarketSnapshot } from '../../modules/MarketSnapshot';
import { SourcesLink } from '../../modules/Sources';
import { MainView, type FrameProps } from '../shared';

type WinId = 'pm' | 'news' | 'markets' | 'movers' | 'economy' | 'companies' | 'sports' | 'find';
interface Geo { x: number; y: number; w: number; h?: number }
interface Win extends Geo { id: WinId; title: string; open: boolean; min: boolean; zoom: boolean; z: number; prev?: Geo }
type Glyph = WinId | 'portfolio' | 'sources' | 'control' | 'about' | 'doc';

const TITLES: Record<WinId, string> = { pm: 'Program Manager', news: 'Headlines', markets: 'Markets', movers: 'Movers', economy: 'Economy', companies: 'In the News', sports: 'Sports', find: 'Find' };

function startLayout(win3: boolean): Win[] {
  const mk = (id: WinId, g: Geo, open: boolean, z: number): Win => ({ id, title: TITLES[id], ...g, open, min: false, zoom: false, z });
  if (win3) {
    return [
      mk('pm', { x: 20, y: 14, w: 420 }, true, 3),
      mk('news', { x: 462, y: 14, w: 520 }, true, 1),
      mk('markets', { x: 20, y: 300, w: 420 }, true, 2),
      mk('movers', { x: 520, y: 330, w: 420 }, false, 4),
      mk('economy', { x: 140, y: 280, w: 460 }, false, 5),
      mk('companies', { x: 200, y: 120, w: 420 }, false, 6),
      mk('sports', { x: 260, y: 150, w: 440 }, false, 7),
      mk('find', { x: 220, y: 90, w: 420 }, false, 8),
    ];
  }
  return [
    mk('news', { x: 24, y: 14, w: 520 }, true, 2),
    mk('markets', { x: 570, y: 26, w: 400 }, true, 1),
    mk('movers', { x: 570, y: 420, w: 400 }, false, 3),
    mk('economy', { x: 120, y: 360, w: 460 }, false, 4),
    mk('companies', { x: 200, y: 120, w: 420 }, false, 5),
    mk('sports', { x: 260, y: 150, w: 440 }, false, 6),
    mk('find', { x: 200, y: 90, w: 420 }, false, 7),
  ];
}

const MIN_W = 240;
const MIN_H = 120;

// ----------------------------------------------------------------- window manager
function useWindows(win3: boolean, deskRef: React.RefObject<HTMLElement>) {
  const [wins, setWins] = useState<Win[]>(() => startLayout(win3));
  const top = useRef(20);
  const patch = useCallback((id: WinId, fn: (w: Win) => Partial<Win>) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...fn(w) } : w))), []);
  const size = () => ({ w: deskRef.current?.clientWidth ?? 1000, h: deskRef.current?.clientHeight ?? 640 });
  const raise = useCallback((id: WinId) => setWins((ws) => (ws.find((w) => w.id === id)?.z === top.current ? ws : ws.map((w) => (w.id === id ? { ...w, z: ++top.current } : w)))), []);
  const open = useCallback((id: WinId) => patch(id, () => ({ open: true, min: false, z: ++top.current })), [patch]);
  const close = useCallback((id: WinId) => patch(id, () => ({ open: false, min: false, zoom: false })), [patch]);
  const minimize = useCallback((id: WinId) => patch(id, () => ({ min: true })), [patch]);
  const restore = useCallback((id: WinId) => patch(id, () => ({ min: false, z: ++top.current })), [patch]);
  const toggleZoom = useCallback((id: WinId) => patch(id, (w) => ({ zoom: !w.zoom, min: false, prev: w.zoom ? w.prev : { x: w.x, y: w.y, w: w.w, h: w.h }, z: ++top.current })), [patch]);
  const move = useCallback((id: WinId, x: number, y: number) => {
    const { w: dw, h: dh } = size();
    patch(id, (w) => ({ x: Math.min(Math.max(x, 80 - w.w), dw - 80), y: Math.min(Math.max(0, y), Math.max(0, dh - 26)) }));
  }, [patch]); // eslint-disable-line react-hooks/exhaustive-deps
  const resize = useCallback((id: WinId, w: number, h: number) => {
    const { w: dw, h: dh } = size();
    patch(id, (win) => ({ w: Math.min(Math.max(w, MIN_W), Math.max(MIN_W, dw - win.x)), h: Math.min(Math.max(h, MIN_H), Math.max(MIN_H, dh - win.y)) }));
  }, [patch]); // eslint-disable-line react-hooks/exhaustive-deps
  const arrange = useCallback((mode: 'tile' | 'cascade' | 'reset') => {
    const { w: dw, h: dh } = size();
    if (mode === 'reset') { setWins(startLayout(win3)); return; }
    setWins((ws) => {
      const live = ws.filter((w) => w.open && !w.min).sort((a, b) => a.z - b.z);
      const ids = new Map<WinId, Geo>();
      if (mode === 'cascade') live.forEach((w, i) => ids.set(w.id, { x: 20 + i * 30, y: 12 + i * 28, w: Math.min(480, dw - 40 - i * 30) }));
      else {
        const cols = live.length <= 1 ? 1 : live.length <= 4 ? 2 : 3;
        const rows = Math.ceil(live.length / cols);
        const cw = Math.floor((dw - 12) / cols); const ch = Math.floor((dh - 8) / rows);
        live.forEach((w, i) => ids.set(w.id, { x: 6 + (i % cols) * cw, y: 4 + Math.floor(i / cols) * ch, w: cw - 8, h: ch - 8 }));
      }
      return ws.map((w) => (ids.has(w.id) ? { ...w, ...ids.get(w.id)!, zoom: false } : w));
    });
  }, [win3]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = wins.filter((w) => w.open && !w.min);
  const active = live.length ? live.reduce((a, b) => (b.z > a.z ? b : a)).id : null;
  return { wins, active, raise, open, close, minimize, restore, toggleZoom, move, resize, arrange };
}

// ----------------------------------------------------------------- pictograms (tiny inline SVG)
function Pict({ g }: { g: Glyph }) {
  const common = { className: `dk-pict dk-pict-${g}`, viewBox: '0 0 32 32', width: 32, height: 32, 'aria-hidden': true, focusable: false } as const;
  switch (g) {
    case 'news': return <svg {...common}><rect className="p-a" x="5" y="4" width="22" height="24" /><path className="p-l" d="M9 9h14M9 13h14M9 17h8M9 21h14M9 25h10" /><rect className="p-b" x="19" y="15" width="5" height="4" /></svg>;
    case 'markets': return <svg {...common}><path className="p-l" d="M4 4v24h24" /><rect className="p-b" x="8" y="17" width="4" height="9" /><rect className="p-a" x="14" y="11" width="4" height="15" /><rect className="p-b" x="20" y="6" width="4" height="20" /></svg>;
    case 'movers': return <svg {...common}><path className="p-a" d="M9 4l7 9H11v8H7v-8H2z" transform="translate(2 1)" /><path className="p-b" d="M23 28l-7-9h5v-8h4v8h5z" transform="translate(-2 -1)" /></svg>;
    case 'economy': return <svg {...common}><path className="p-a" d="M4 24a12 12 0 0 1 24 0z" /><path className="p-l" d="M16 24l6-9M7 24h2M23 24h2M16 12v2" /><rect className="p-b" x="4" y="26" width="24" height="2" /></svg>;
    case 'companies': return <svg {...common}><rect className="p-a" x="6" y="5" width="14" height="23" /><rect className="p-b" x="20" y="13" width="7" height="15" /><path className="p-l" d="M9 9h2M13 9h2M9 14h2M13 14h2M9 19h2M13 19h2M22 17h2M22 22h2" /></svg>;
    case 'sports': return <svg {...common}><circle className="p-a" cx="16" cy="16" r="12" /><path className="p-l" d="M4 16h24M16 4c-6 6-6 18 0 24M16 4c6 6 6 18 0 24" /></svg>;
    case 'find': return <svg {...common}><circle className="p-a" cx="13" cy="13" r="8" /><path className="p-l p-thick" d="M19 19l9 9" /></svg>;
    case 'portfolio': return <svg {...common}><rect className="p-a" x="3" y="10" width="26" height="17" /><path className="p-l" d="M11 10V6h10v4M3 17h26" /><rect className="p-b" x="14" y="15" width="4" height="4" /></svg>;
    case 'sources': return <svg {...common}><path className="p-a" d="M5 5h10v22H5zM17 5h10v22H17z" /><path className="p-l" d="M8 10h4M8 14h4M20 10h4M20 14h4" /></svg>;
    case 'control': return <svg {...common}><rect className="p-a" x="3" y="5" width="26" height="22" /><path className="p-l" d="M8 10v13M16 10v13M24 10v13" /><rect className="p-b" x="5" y="12" width="6" height="3" /><rect className="p-b" x="13" y="19" width="6" height="3" /><rect className="p-b" x="21" y="14" width="6" height="3" /></svg>;
    case 'about': return <svg {...common}><circle className="p-a" cx="16" cy="16" r="12" /><path className="p-l p-thick" d="M16 14v8" /><circle className="p-b" cx="16" cy="10" r="1.6" /></svg>;
    case 'pm': return <svg {...common}><rect className="p-a" x="3" y="5" width="26" height="22" /><rect className="p-b" x="6" y="9" width="8" height="7" /><rect className="p-b" x="17" y="9" width="9" height="7" /><rect className="p-b" x="6" y="19" width="20" height="5" /></svg>;
    default: return <svg {...common}><rect className="p-a" x="6" y="4" width="20" height="24" /><path className="p-l" d="M10 10h12M10 15h12M10 20h8" /></svg>;
  }
}

// ----------------------------------------------------------------- small hooks / helpers
const PREF_KEY = 'mtm-desk-v1';
interface Prefs { pattern: string; clock: boolean }
const loadPrefs = (skin: string): Prefs => {
  try { const p = JSON.parse(localStorage.getItem(`${PREF_KEY}-${skin}`) ?? 'null'); if (p && typeof p.pattern === 'string') return { pattern: p.pattern, clock: p.clock !== false }; } catch { /* default */ }
  return { pattern: skin === 'win3' ? 'teal' : 'weave', clock: true };
};
const savePrefs = (skin: string, p: Prefs) => { try { localStorage.setItem(`${PREF_KEY}-${skin}`, JSON.stringify(p)); } catch { /* not remembered */ } };

const PATTERNS: Record<string, { label: string; css: string }> = {
  weave: { label: 'Weave', css: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 0 0 / 4px 4px' },
  gray: { label: 'Gray', css: 'repeating-linear-gradient(45deg, #000 0 1px, #fff 1px 3px)' },
  stripes: { label: 'Stripes', css: 'repeating-linear-gradient(90deg, #000 0 2px, #fff 2px 6px)' },
  dots: { label: 'Dots', css: 'radial-gradient(#000 1.2px, #fff 1.6px) 0 0 / 6px 6px' },
  solid: { label: 'Solid', css: '#fff' },
  teal: { label: 'Teal', css: '#008080' },
  slate: { label: 'Slate', css: '#2f4f6f' },
  midnight: { label: 'Midnight', css: '#000058' },
  plum: { label: 'Plum', css: '#6a2060' },
  linen: { label: 'Linen', css: 'repeating-linear-gradient(0deg, #008080 0 2px, #0a7a7a 2px 4px)' },
};
const MONO_PATTERNS = ['weave', 'gray', 'stripes', 'dots', 'solid'];
const WIN_PATTERNS = ['teal', 'slate', 'midnight', 'plum', 'linen'];

type MI = { label: string; fn?: () => void; sep?: boolean; check?: boolean; hint?: string };
interface MenuDef { name: string; label?: string; items: MI[] }

// ----------------------------------------------------------------- title bar & window shell
interface ChromeProps {
  win3: boolean; title: string; active: boolean; zoomed: boolean;
  onClose: () => void; onZoom: () => void; onMinimize?: () => void; onCtl?: (anchor: HTMLElement) => void;
  titleProps?: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> };
}
function TitleBar({ win3, title, active, zoomed, onClose, onZoom, onMinimize, onCtl, titleProps }: ChromeProps) {
  return (
    <header className="dk-title" {...titleProps}>
      {win3
        ? <button type="button" className="dk-ctl" aria-label={`${title} control menu`} aria-haspopup="menu" onClick={(e) => (onCtl ? onCtl(e.currentTarget) : onClose())} onDoubleClick={onClose}><span aria-hidden /></button>
        : <button type="button" className="dk-close" aria-label={`Close ${title}`} onClick={onClose} />}
      <span className="dk-title-text" data-active={active ? 'true' : undefined}>{title}</span>
      {win3 ? (
        <>
          {onMinimize ? <button type="button" className="dk-min" aria-label={`Minimise ${title}`} onClick={onMinimize}><span aria-hidden>▼</span></button> : null}
          <button type="button" className="dk-max" aria-label={zoomed ? `Restore ${title}` : `Maximise ${title}`} onClick={onZoom}><span aria-hidden>{zoomed ? '↕' : '▲'}</span></button>
        </>
      ) : <button type="button" className="dk-zoom" aria-label={zoomed ? `Restore ${title}` : `Zoom ${title}`} onClick={onZoom}><span aria-hidden /></button>}
    </header>
  );
}

interface WindowProps {
  win: Win; win3: boolean; active: boolean; hidden: boolean;
  api: ReturnType<typeof useWindows>; onCtl: (id: WinId, anchor: HTMLElement) => void; children: React.ReactNode; className?: string;
}
function Window({ win, win3, active, hidden, api, onCtl, children, className = '' }: WindowProps) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const grip = useRef<{ sx: number; sy: number; w: number; h: number } | null>(null);
  const root = useRef<HTMLElement>(null);
  const style: React.CSSProperties = { left: win.x, top: win.y, width: win.w, zIndex: win.z, ...(win.h ? { height: win.h } : null) };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const s = e.shiftKey ? 40 : 10;
    if (e.ctrlKey) {
      const h = win.h ?? root.current?.offsetHeight ?? 300;
      if (e.key === 'ArrowLeft') api.resize(win.id, win.w - s, h); else if (e.key === 'ArrowRight') api.resize(win.id, win.w + s, h);
      else if (e.key === 'ArrowUp') api.resize(win.id, win.w, h - s); else if (e.key === 'ArrowDown') api.resize(win.id, win.w, h + s); else return;
    } else if (e.key === 'ArrowLeft') api.move(win.id, win.x - s, win.y); else if (e.key === 'ArrowRight') api.move(win.id, win.x + s, win.y);
    else if (e.key === 'ArrowUp') api.move(win.id, win.x, win.y - s); else if (e.key === 'ArrowDown') api.move(win.id, win.x, win.y + s);
    else if (e.key === 'Enter') api.toggleZoom(win.id);
    else if (e.key === 'Escape') api.close(win.id);
    else if (win3 && e.key === ' ' && e.altKey) { const b = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('.dk-ctl'); if (b) onCtl(win.id, b); }
    else return;
    e.preventDefault();
  };
  return (
    <section ref={root} className={`dk-win dk-win-${win.id} ${active ? 'is-active' : 'is-inactive'}${win.zoom ? ' is-zoom' : ''}${win.h ? ' has-h' : ''} ${className}`} style={style} hidden={hidden}
      aria-label={win.title} onPointerDownCapture={() => api.raise(win.id)} onFocusCapture={() => api.raise(win.id)}>
      <TitleBar win3={win3} title={win.title} active={active} zoomed={win.zoom} onClose={() => api.close(win.id)} onZoom={() => api.toggleZoom(win.id)}
        onMinimize={win3 ? () => api.minimize(win.id) : undefined} onCtl={(a) => onCtl(win.id, a)}
        titleProps={{
          tabIndex: 0, 'aria-label': `${win.title} title bar: arrow keys move, Ctrl plus arrows resize, Enter zooms, Escape closes`,
          onKeyDown: onKey,
          onDoubleClick: (e) => { if (!(e.target as HTMLElement).closest('button')) api.toggleZoom(win.id); },
          onPointerDown: (e) => {
            if ((e.target as HTMLElement).closest('button') || win.zoom) return;
            drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          },
          onPointerMove: (e) => { if (drag.current) api.move(win.id, e.clientX - drag.current.dx, e.clientY - drag.current.dy); },
          onPointerUp: () => { drag.current = null; },
          onPointerCancel: () => { drag.current = null; },
        }} />
      <div className="dk-body" tabIndex={-1}>{children}</div>
      {!win.zoom ? (
        <span className="dk-grip" aria-hidden role="presentation"
          onPointerDown={(e) => { grip.current = { sx: e.clientX, sy: e.clientY, w: win.w, h: win.h ?? root.current?.offsetHeight ?? 300 }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); e.stopPropagation(); }}
          onPointerMove={(e) => { const g = grip.current; if (g) api.resize(win.id, g.w + e.clientX - g.sx, g.h + e.clientY - g.sy); }}
          onPointerUp={() => { grip.current = null; }} onPointerCancel={() => { grip.current = null; }} />
      ) : null}
    </section>
  );
}

// ----------------------------------------------------------------- icons
interface IconDef { key: string; label: string; glyph: Glyph; run: () => void }
function IconGrid({ icons, className, label }: { icons: IconDef[]; className: string; label: string }) {
  const [sel, setSel] = useState<string | null>(null);
  const ul = useRef<HTMLUListElement>(null);
  const nav = (e: React.KeyboardEvent, i: IconDef) => {
    const btns = Array.from(ul.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const idx = btns.indexOf(e.currentTarget as HTMLButtonElement);
    const cols = Math.max(1, getComputedStyle(ul.current!).gridTemplateColumns.split(' ').length);
    const to = e.key === 'ArrowRight' ? idx + 1 : e.key === 'ArrowLeft' ? idx - 1 : e.key === 'ArrowDown' ? idx + cols : e.key === 'ArrowUp' ? idx - cols : -1;
    if (e.key === 'Enter') { e.preventDefault(); i.run(); }
    else if (to >= 0 && btns[to]) { e.preventDefault(); btns[to].focus(); setSel(i.key === btns[to].dataset.k ? i.key : btns[to].dataset.k ?? null); }
  };
  return (
    <ul className={className} aria-label={label} ref={ul}>
      {icons.map((i) => (
        <li key={i.key}>
          <button type="button" data-k={i.key} className={`dk-ico${sel === i.key ? ' is-sel' : ''}`} title="Double-click to open" aria-label={`${i.label} (press Enter to open)`}
            onFocus={() => setSel(i.key)} onClick={(e) => { setSel(i.key); if ((e.nativeEvent as PointerEvent).pointerType === 'touch') i.run(); }}
            onDoubleClick={() => i.run()} onKeyDown={(e) => nav(e, i)}>
            <Pict g={i.glyph} /><span className="dk-ico-label">{i.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ----------------------------------------------------------------- dialogs
function Dialog({ win3, title, onClose, children, actions }: { win3: boolean; title: string; onClose: () => void; children: React.ReactNode; actions: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => prev?.focus?.();
  }, []);
  const id = useMemo(() => `dkd-${Math.random().toString(36).slice(2, 7)}`, []);
  return (
    <div className="dk-modal" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dk-dialog" role="dialog" aria-modal="true" aria-labelledby={id} ref={root}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
          else if (e.key === 'Tab') {
            const f = Array.from(root.current!.querySelectorAll<HTMLElement>('button, input, select, [tabindex="0"]')).filter((x) => !(x as HTMLButtonElement).disabled);
            if (!f.length) return;
            const first = f[0]; const last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }}>
        <header className="dk-title">
          {win3 ? <span className="dk-ctl dk-ctl-static" aria-hidden><span /></span> : <span className="dk-close dk-close-static" aria-hidden />}
          <span className="dk-title-text" id={id}>{title}</span>
        </header>
        <div className="dk-dialog-body">{children}</div>
        <div className="dk-dialog-actions">{actions}</div>
      </div>
    </div>
  );
}

function AboutDialog({ win3, onClose }: { win3: boolean; onClose: () => void }) {
  return (
    <Dialog win3={win3} title={win3 ? 'About Program Manager' : 'About MarketDesk'} onClose={onClose} actions={<button type="button" className="dk-btn is-default" data-autofocus onClick={onClose}>OK</button>}>
      <div className="dk-about">
        <Pict g={win3 ? 'pm' : 'about'} />
        <div>
          <h2>{win3 ? 'MarketMan Program Manager' : 'MarketDesk'}</h2>
          <p>{win3 ? 'Version 3.1-ish (not really)' : 'Version 1.0 (make-believe)'}</p>
          <p>A pretend desktop for reading a real day in the past. The windows are fake; the headlines and prices behind them are as historical as we could make them.</p>
          <p>{win3 ? 'Free system resources: 100% (imaginary).' : 'Memory available: as much as your browser feels like lending.'}</p>
          <p className="dk-fine">Nothing here can be saved to a floppy disk. Your portfolio, however, is remembered for you.</p>
        </div>
      </div>
    </Dialog>
  );
}

function ControlPanel({ win3, prefs, onApply, onClose }: { win3: boolean; prefs: Prefs; onApply: (p: Prefs) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(prefs);
  const set = win3 ? WIN_PATTERNS : MONO_PATTERNS;
  return (
    <Dialog win3={win3} title="Control Panel" onClose={onClose} actions={
      <>
        <button type="button" className="dk-btn is-default" data-autofocus onClick={() => { onApply(draft); onClose(); }}>OK</button>
        <button type="button" className="dk-btn" onClick={() => onApply(draft)}>Apply</button>
        <button type="button" className="dk-btn" onClick={onClose}>Cancel</button>
      </>
    }>
      <fieldset className="dk-cp">
        <legend>{win3 ? 'Desktop colour' : 'Desktop pattern'}</legend>
        <div className="dk-cp-swatches" role="radiogroup" aria-label={win3 ? 'Desktop colour' : 'Desktop pattern'}>
          {set.map((k) => (
            <label key={k} className={`dk-cp-sw${draft.pattern === k ? ' is-on' : ''}`}>
              <input type="radio" name="dk-pattern" checked={draft.pattern === k} onChange={() => setDraft({ ...draft, pattern: k })} />
              <span className="dk-cp-chip" style={{ background: PATTERNS[k].css }} aria-hidden />{PATTERNS[k].label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="dk-cp-check"><input type="checkbox" checked={draft.clock} onChange={(e) => setDraft({ ...draft, clock: e.target.checked })} /> Show the date in the menu bar</label>
      <p className="dk-fine">Changes are remembered in this browser only.</p>
    </Dialog>
  );
}

function Splash({ win3 }: { win3: boolean }) {
  return win3 ? (
    <div className="dk-splash dk-splash-win3" role="status"><div><b>MarketMan</b><span>for pretend computers</span><i className="dk-splash-bar" aria-hidden /><small>Starting Program Manager…</small></div></div>
  ) : (
    <div className="dk-splash dk-splash-mono" role="status"><div><Pict g="markets" /><b>Welcome to MarketDesk</b><small>Setting out the windows…</small></div></div>
  );
}

// ----------------------------------------------------------------- the frame
export default function DesktopFrame({ data, onSources, onPalette }: FrameProps) {
  const era = useEra();
  const { date, view, go, exit } = useSim();
  const win3 = era.exp.opts?.skin === 'win3';
  const skin = win3 ? 'win3' : 'mono';
  const deskRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const api = useWindows(win3, deskRef);
  const { wins, active, open, close, restore } = api;
  const [menu, setMenu] = useState<number | null>(null);
  const [item, setItem] = useState(0);
  const [ctl, setCtl] = useState<{ id: WinId; x: number; y: number } | null>(null);
  const [dialog, setDialog] = useState<'about' | 'control' | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(skin));
  const [docZoom, setDocZoom] = useState(false);
  const [splash, setSplash] = useState(() => { try { return sessionStorage.getItem(`mtm-splash-${skin}`) !== '1'; } catch { return true; } });
  const { lead, rest } = splitLead(data.news, date);
  const home = view.name === 'home';

  useEffect(() => {
    if (!splash) return;
    try { sessionStorage.setItem(`mtm-splash-${skin}`, '1'); } catch { /* shown again next time */ }
    const t = window.setTimeout(() => setSplash(false), 2100);
    return () => window.clearTimeout(t);
  }, [splash, skin]);

  const applyPrefs = (p: Prefs) => { setPrefs(p); savePrefs(skin, p); };
  const show = useCallback((id: WinId) => { if (view.name !== 'home') go({ name: 'home' }); open(id); }, [view.name, go, open]);

  const body = (id: WinId) => {
    switch (id) {
      case 'news': return <><LeadStory item={lead} /><HistoricalNews items={rest.slice(0, 8)} limit={8} withSummary={false} className="news-links" /></>;
      case 'markets': return <MarketSnapshot snap={data.markets} groups={['indexes', 'commodities', 'rates']} />;
      case 'movers': return <MarketMovers snap={data.markets} limit={8} />;
      case 'economy': return <EconomicSnapshot economy={data.economy} snap={{ ...data.markets, rates: [] }} />;
      case 'companies': return <CompaniesInNews news={data.news} snap={data.markets} />;
      case 'sports': return <HistoricalSports items={data.sports} limit={8} />;
      case 'find': return <HistoricalSearch autoFocus />;
      case 'pm': return <div className="pm-group"><div className="pm-group-title">MarketMan</div><IconGrid icons={programs} className="dk-icons pm-icons" label="MarketMan programs" /></div>;
      default: return null;
    }
  };

  const programs: IconDef[] = [
    { key: 'news', label: 'Headlines', glyph: 'news', run: () => show('news') },
    { key: 'markets', label: 'Markets', glyph: 'markets', run: () => show('markets') },
    { key: 'movers', label: 'Movers', glyph: 'movers', run: () => show('movers') },
    { key: 'economy', label: 'Economy', glyph: 'economy', run: () => show('economy') },
    { key: 'companies', label: 'In the News', glyph: 'companies', run: () => show('companies') },
    { key: 'sports', label: 'Sports', glyph: 'sports', run: () => show('sports') },
    { key: 'find', label: 'Find', glyph: 'find', run: () => show('find') },
    { key: 'portfolio', label: 'Portfolio', glyph: 'portfolio', run: () => go({ name: 'portfolio' }) },
    { key: 'sources', label: 'Sources', glyph: 'sources', run: onSources },
    { key: 'control', label: 'Control Panel', glyph: 'control', run: () => setDialog('control') },
  ];

  const activeWin = wins.find((w) => w.id === active);
  const names = (check: boolean) => wins.filter((w) => w.id !== 'pm').map((w, i): MI => ({ label: `${win3 ? `${i + 1} ` : ''}${w.title}`, check: check && w.open && !w.min, fn: () => show(w.id) }));
  const menus: MenuDef[] = win3
    ? [
      { name: 'File', items: [{ label: 'Open Portfolio', fn: () => go({ name: 'portfolio' }) }, { label: 'Find…', fn: () => show('find') }, { label: 'Sources', fn: onSources }, { sep: true, label: '' }, { label: 'Close Window', hint: 'Esc', fn: () => active && close(active) }, { label: 'Exit Windows…', fn: exit }] },
      { name: 'Options', items: [{ label: 'Control Panel…', fn: () => setDialog('control') }, { label: 'Go To…', fn: onPalette }, { label: 'Restore Layout', fn: () => api.arrange('reset') }] },
      { name: 'Window', items: [{ label: 'Cascade', hint: 'Shift+F5', fn: () => api.arrange('cascade') }, { label: 'Tile', hint: 'Shift+F4', fn: () => api.arrange('tile') }, { sep: true, label: '' }, ...names(true)] },
      { name: 'Help', items: [{ label: 'Keyboard Tips', fn: () => setDialog('about') }, { sep: true, label: '' }, { label: 'About Program Manager…', fn: () => setDialog('about') }] },
    ]
    : [
      { name: 'MarketDesk', label: '◆', items: [{ label: 'About MarketDesk…', fn: () => setDialog('about') }, { label: 'Control Panel…', fn: () => setDialog('control') }, { sep: true, label: '' }, { label: 'Sources', fn: onSources }] },
      { name: 'File', items: [{ label: 'Open Portfolio', fn: () => go({ name: 'portfolio' }) }, { label: 'Find…', fn: () => show('find') }, { sep: true, label: '' }, { label: 'Close Window', hint: 'Esc', fn: () => active && close(active) }, { label: 'Quit', fn: exit }] },
      { name: 'View', items: names(true) },
      { name: 'Special', items: [{ label: 'Go To…', fn: onPalette }, { label: 'Clean Up Desktop', fn: () => api.arrange('tile') }, { label: 'Stack Windows', fn: () => api.arrange('cascade') }, { label: 'Restore Windows', fn: () => api.arrange('reset') }] },
    ];

  // ------------------------------------------------ menu keyboard model
  const live = (m: number) => menus[m].items.map((x, i) => (x.sep ? -1 : i)).filter((i) => i >= 0);
  const closeMenu = (refocus = false) => { const m = menu; setMenu(null); if (refocus && m !== null) navRef.current?.querySelector<HTMLElement>(`[data-top="${m}"]`)?.focus(); };
  useEffect(() => {
    if (menu === null) return;
    navRef.current?.querySelector<HTMLElement>(`[data-mi="${menu}-${item}"]`)?.focus();
  }, [menu, item]);
  const onMenuKey = (e: React.KeyboardEvent, m: number, inItem: boolean) => {
    const ids = live(m);
    const cur = ids.indexOf(item);
    const n = menus.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const to = (m + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
      e.preventDefault();
      if (menu !== null) { setMenu(to); setItem(live(to)[0]); } else navRef.current?.querySelector<HTMLElement>(`[data-top="${to}"]`)?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (menu !== m) { setMenu(m); setItem(e.key === 'ArrowDown' ? ids[0] : ids[ids.length - 1]); }
      else setItem(ids[(cur + (e.key === 'ArrowDown' ? 1 : ids.length - 1)) % ids.length]);
    } else if (e.key === 'Home' && inItem) { e.preventDefault(); setItem(ids[0]); }
    else if (e.key === 'End' && inItem) { e.preventDefault(); setItem(ids[ids.length - 1]); }
    else if (e.key === 'Escape' && menu !== null) { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
    else if (e.key === 'Tab') setMenu(null);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (dialog) return;
      const t = e.target as HTMLElement | null;
      const typing = !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if (e.key === 'F10' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setMenu(0); setItem(live(0)[0]); return; }
      if (e.altKey && !e.ctrlKey && !e.metaKey && !typing && e.key.length === 1) {
        const m = menus.findIndex((x) => x.name[0].toLowerCase() === e.key.toLowerCase() && (win3 || x.label === undefined));
        if (m >= 0) { e.preventDefault(); setMenu(m); setItem(live(m)[0]); }
      }
      if (e.shiftKey && e.key === 'F5') { e.preventDefault(); api.arrange('cascade'); }
      if (e.shiftKey && e.key === 'F4') { e.preventDefault(); api.arrange('tile'); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const runItem = (mi: MI) => { setMenu(null); mi.fn?.(); };
  const openCtl = (id: WinId, anchor: HTMLElement) => {
    const r = anchor.getBoundingClientRect(); const d = deskRef.current?.getBoundingClientRect();
    setCtl(ctl?.id === id ? null : { id, x: r.left - (d?.left ?? 0), y: r.bottom - (d?.top ?? 0) });
  };
  const ctlWin = ctl ? wins.find((w) => w.id === ctl.id) : null;
  const deskStyle = { ['--desk-bg' as string]: PATTERNS[prefs.pattern]?.css ?? PATTERNS[skin === 'win3' ? 'teal' : 'weave'].css };
  const minimized = wins.filter((w) => w.open && w.min);
  const docTitle = view.name === 'company' ? view.ticker : view.name === 'portfolio' ? 'Portfolio' : 'Find';

  return (
    <div className={`w-frame dk-desktop${win3 ? ' dk-win3' : ' dk-mono'}`} style={deskStyle} onPointerDown={(e) => { const t = e.target as HTMLElement; if (!t.closest('.dk-menu')) setMenu(null); if (!t.closest('.dk-ctl, .dk-ctlmenu')) setCtl(null); }}>
      <nav className="dk-menubar" aria-label="Menu bar" ref={navRef}>
        {!win3 ? null : <span className="dk-apple" aria-hidden="true">▣</span>}
        {menus.map((m, mi) => (
          <div key={m.name} className={`dk-menu${menu === mi ? ' is-open' : ''}`}>
            <button type="button" data-top={mi} aria-haspopup="menu" aria-expanded={menu === mi} aria-label={m.label ? m.name : undefined}
              onClick={() => { if (menu === mi) setMenu(null); else { setMenu(mi); setItem(live(mi)[0]); } }}
              onMouseEnter={() => { if (menu !== null && menu !== mi) { setMenu(mi); setItem(live(mi)[0]); } }}
              onKeyDown={(e) => onMenuKey(e, mi, false)}>
              {m.label ?? (win3 ? <><u>{m.name[0]}</u>{m.name.slice(1)}</> : m.name)}
            </button>
            {menu === mi ? (
              <ul role="menu" aria-label={m.name}>
                {m.items.map((x, ii) => x.sep
                  ? <li key={ii} role="separator" className="dk-sep" />
                  : (
                    <li key={ii} role="none">
                      <button role="menuitem" type="button" data-mi={`${mi}-${ii}`} tabIndex={-1} className={item === ii ? 'is-hot' : ''} onMouseEnter={() => setItem(ii)} onClick={() => runItem(x)} onKeyDown={(e) => onMenuKey(e, mi, true)}>
                        <span className="dk-check" aria-hidden>{x.check ? '✓' : ''}</span><span className="dk-mi-label">{x.label}</span>{x.hint ? <span className="dk-mi-hint">{x.hint}</span> : null}
                      </button>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        ))}
        {prefs.clock ? <span className="dk-clock">{era.formatDate(date)}</span> : null}
      </nav>

      <main className={`dk-desk w-main${home ? '' : ' is-doc'}`} key={`${date}-${view.name}`} ref={deskRef} style={{ background: 'var(--desk-bg)' }}>
        {home ? (
          <>
            {wins.filter((w) => w.open).map((w) => (
              <Window key={w.id} win={w} win3={win3} active={active === w.id} hidden={w.min} api={api} onCtl={openCtl} className={w.id === 'pm' ? 'dk-pm' : ''}>{body(w.id)}</Window>
            ))}
            {!win3 ? <IconGrid icons={programs} className="dk-icons dk-icons-desk" label="Desktop" /> : null}
            {win3 && minimized.length ? (
              <ul className="dk-tray" aria-label="Minimised windows">
                {minimized.map((w) => (
                  <li key={w.id}><button type="button" onClick={() => restore(w.id)} onDoubleClick={() => restore(w.id)} title="Restore"><Pict g={w.id} /><span>{w.title}</span></button></li>
                ))}
              </ul>
            ) : null}
            {ctl && ctlWin ? (
              <ul className="dk-ctlmenu" role="menu" aria-label={`${ctlWin.title} control menu`} style={{ left: ctl.x, top: ctl.y, zIndex: 9000 }}
                onKeyDown={(e) => { if (e.key === 'Escape') setCtl(null); }}>
                <li role="none"><button role="menuitem" type="button" disabled={!ctlWin.zoom && !ctlWin.min} onClick={() => { if (ctlWin.zoom) api.toggleZoom(ctlWin.id); else restore(ctlWin.id); setCtl(null); }}>Restore</button></li>
                <li role="none"><button role="menuitem" type="button" onClick={() => { api.minimize(ctlWin.id); setCtl(null); }}>Minimize</button></li>
                <li role="none"><button role="menuitem" type="button" disabled={ctlWin.zoom} onClick={() => { api.toggleZoom(ctlWin.id); setCtl(null); }}>Maximize</button></li>
                <li role="separator" className="dk-sep" />
                <li role="none"><button role="menuitem" type="button" onClick={() => { close(ctlWin.id); setCtl(null); }}>Close<span className="dk-mi-hint">Esc</span></button></li>
              </ul>
            ) : null}
          </>
        ) : (
          <section className={`dk-win dk-doc is-active${docZoom ? ' is-docwide' : ''}`} aria-label="Document">
            <TitleBar win3={win3} title={docTitle} active zoomed={docZoom} onClose={() => go({ name: 'home' })} onZoom={() => setDocZoom((z) => !z)} onMinimize={() => go({ name: 'home' })} />
            <div className="dk-body"><MainView data={data} Home={() => null} /></div>
          </section>
        )}
      </main>
      <footer className="dk-foot"><SourcesLink onOpen={onSources} />{win3 ? <span className="dk-status"> · {wins.filter((w) => w.open && w.id !== 'pm').length} windows open</span> : null}</footer>
      <div className="w-advance-dock"><AdvanceTime /></div>
      {dialog === 'about' ? <AboutDialog win3={win3} onClose={() => setDialog(null)} /> : null}
      {dialog === 'control' ? <ControlPanel win3={win3} prefs={prefs} onApply={applyPrefs} onClose={() => setDialog(null)} /> : null}
      {splash ? <Splash win3={win3} /> : null}
      {activeWin ? <span className="dk-sr" aria-live="polite">{activeWin.title} window active</span> : null}
    </div>
  );
}
