/**
 * Era-specific page navigation for multi-page compositions. It lives in the frame (not the page) so it
 * stays available while a portfolio or search view is open:
 *   pagenum  → teletext: type a 3-digit page number, four coloured keys, page 200 = portfolio, 300+ = find
 *   menu     → DOS: keys 0–4 pick a menu item, P portfolio, F find, Esc returns to the main menu
 *   dial     → radio: a tuning dial that selects the station (page)
 *   fkeys    → terminal: F1–F4 select screens
 *   pages    → newspapers: ←/→ turn the leaf
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import '../../../styles/families/pagecontrols.css';
import { usePage } from '../../../state/page';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';

const typing = (t: EventTarget | null) => { const e = t as HTMLElement | null; return !!e && (/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) || e.isContentEditable); };

function useKeys(fn: (e: KeyboardEvent) => void) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.ctrlKey || e.metaKey || e.altKey) return; ref.current(e); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
}

export function PageControls() {
  const era = useEra();
  const comp = era.exp.composition;
  if (!comp?.pages?.length) return null;
  switch (era.exp.nav.model) {
    case 'pagenum': return <Teletext />;
    case 'menu': return <DosKeys />;
    case 'dial': return <RadioDial />;
    case 'fkeys': return <FKeys />;
    case 'pages': return <LeafKeys />;
    default: return null;
  }
}

function usePages() {
  const era = useEra();
  const { page, setPage } = usePage();
  const { go, view } = useSim();
  const pages = era.exp.composition!.pages!;
  const show = useCallback((i: number) => { setPage(i); if (view.name !== 'home') go({ name: 'home' }); }, [setPage, go, view.name]);
  return { pages, page: Math.min(page, pages.length - 1), show, go };
}

// ---------------------------------------------------------------- teletext
/** The page is "fetched": the screen shows the wanted number while the digits count up, then the page paints in. */
function useFetchEffect() {
  const roll = useRef<number>();
  const clear = useCallback(() => {
    window.clearInterval(roll.current);
    const w = document.querySelector<HTMLElement>('.world');
    if (w) { delete w.dataset.tt; w.style.removeProperty('--tt-msg'); w.style.removeProperty('--tt-roll'); }
  }, []);
  useEffect(() => clear, [clear]);
  return useCallback((raw: string, done: () => void) => {
    clear();
    const w = document.querySelector<HTMLElement>('.world');
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    done();
    if (!w || reduce) return;
    const n = Number(raw);
    const steps = 9;
    let k = 0;
    w.dataset.tt = 'fetching';
    const paint = () => {
      const cur = Math.max(100, n - (steps - k));
      w.style.setProperty('--tt-roll', `"${cur}"`);
      w.style.setProperty('--tt-msg', `"P${raw}  ...  SEARCHING ${cur}"`);
    };
    paint();
    roll.current = window.setInterval(() => { k += 1; if (k >= steps) clear(); else paint(); }, 70);
  }, [clear]);
}

function Teletext() {
  const { pages, page, show, go } = usePages();
  const era = useEra();
  const prestel = era.exp.opts?.style === 'prestel';
  const [buf, setBuf] = useState('');
  const [msg, setMsg] = useState('');
  const timer = useRef<number>();
  const fetchPage = useFetchEffect();
  const open = useCallback((raw: string) => {
    const n = Number(raw);
    const idx = pages.findIndex((p) => p.key === raw);
    if (idx >= 0) { setMsg(`P${raw} ${pages[idx].label.toUpperCase()}`); fetchPage(raw, () => show(idx)); }
    else if (n === 200) { setMsg('P200 PORTFOLIO'); fetchPage(raw, () => go({ name: 'portfolio' })); }
    else if (n >= 300 && n <= 399) { setMsg(`P${raw} FIND`); fetchPage(raw, () => go({ name: 'search', q: '' })); }
    else setMsg(`P${raw} NOT AVAILABLE`);
  }, [pages, show, go, fetchPage]);
  useKeys((e) => {
    if (typing(e.target) || !/^[0-9]$/.test(e.key)) return;
    window.clearTimeout(timer.current);
    const next = (buf.length >= 3 ? '' : buf) + e.key;
    if (next.length === 3) { setBuf(''); open(next); } else { setBuf(next); setMsg(`P${next}${'_'.repeat(3 - next.length)} ... WAITING`); timer.current = window.setTimeout(() => { setBuf(''); setMsg(''); }, 2500); }
  });
  const [field, setField] = useState('');
  const keys: [string, string, string][] = [['red', 'NEWS', '101'], ['green', 'MARKETS', '120'], ['yellow', 'SPORT', '150'], ['cyan', 'INDEX', '100']];
  return (
    <div className={`pc-bar pc-tt${prestel ? ' pc-prestel' : ''}`} role="group" aria-label="Page selection">
      <form className="pc-tt-form" onSubmit={(e) => { e.preventDefault(); if (/^\d{3}$/.test(field)) { open(field); setField(''); } else setMsg('ENTER A 3-DIGIT PAGE NUMBER'); }}>
        <label>{prestel ? '*' : 'P'}<input inputMode="numeric" pattern="[0-9]*" maxLength={3} value={field} placeholder="100" aria-label="Page number" onChange={(e) => setField(e.target.value.replace(/\D/g, ''))} />{prestel ? '#' : null}</label>
        <button type="submit" className="pc-key">GO</button>
      </form>
      <span className="pc-keys">{keys.map(([c, label, n]) => <button key={c} type="button" className={`pc-fast pc-${c}`} onClick={() => open(n)}>{label}<small>{n}</small></button>)}</span>
      <span className="pc-status" aria-live="polite">{msg || `P${pages[page].key} ${pages[page].label.toUpperCase()}`}</span>
      <span className="pc-hint">{prestel ? 'KEY * PAGE NUMBER # · 200 PORTFOLIO · 300 FIND' : '200 PORTFOLIO · 300 FIND'}</span>
    </div>
  );
}

// ---------------------------------------------------------------- DOS menu
function DosKeys() {
  const { pages, page, show, go } = usePages();
  useKeys((e) => {
    if (typing(e.target)) return;
    if (/^[0-4]$/.test(e.key) && Number(e.key) < pages.length) show(Number(e.key));
    else if (e.key === 'Escape') show(0);
    else if (e.key.toLowerCase() === 'p') go({ name: 'portfolio' });
    else if (e.key.toLowerCase() === 'f') go({ name: 'search', q: '' });
  });
  return (
    <div className="pc-bar pc-dos" role="group" aria-label="Menu keys">
      {pages.map((p, i) => <button key={p.key} type="button" className={`pc-key${i === page ? ' is-on' : ''}`} onClick={() => show(i)}><kbd>{i}</kbd> {p.label}</button>)}
      <button type="button" className="pc-key" onClick={() => go({ name: 'portfolio' })}><kbd>P</kbd> PORTFOLIO</button>
      <button type="button" className="pc-key" onClick={() => go({ name: 'search', q: '' })}><kbd>F</kbd> FIND</button>
      <span className="pc-hint">ESC = MAIN MENU</span>
    </div>
  );
}

// ---------------------------------------------------------------- terminal F keys
function FKeys() {
  // the terminal's own function-key bar (TerminalConsole) shows and handles F1–F4; here only the number keys
  const { pages, show } = usePages();
  useKeys((e) => { if (!typing(e.target) && /^[1-9]$/.test(e.key) && Number(e.key) <= pages.length) show(Number(e.key) - 1); });
  return null;
}

// ---------------------------------------------------------------- radio dial
function RadioDial() {
  const { pages, page, show } = usePages();
  const era = useEra();
  const base = 540; // kilocycles on the AM band: a decorative scale, not a claim about any station
  const freq = (i: number) => base + Math.round(((i + 1) / (pages.length + 1)) * 1060 / 10) * 10;
  useKeys((e) => { if (!typing(e.target) && /^[1-9]$/.test(e.key) && Number(e.key) <= pages.length) show(Number(e.key) - 1); });
  return (
    <div className="pc-bar pc-radio" role="group" aria-label="Tuning dial" style={{ ['--pos' as string]: String(pages.length > 1 ? page / (pages.length - 1) : 0) }}>
      <span className={`pc-lamp`} aria-hidden>ON THE AIR</span>
      <div className="pc-scale">
        <input type="range" min={0} max={pages.length - 1} step={1} value={page} aria-label="Tuning dial" aria-valuetext={`${pages[page].label}, ${freq(page)} kilocycles`} onChange={(e) => show(Number(e.target.value))} />
        <ol aria-hidden>{pages.map((p, i) => <li key={p.key} className={i === page ? 'is-on' : ''}>{freq(i)}</li>)}</ol>
      </div>
      <span className="pc-call">{era.publication.replace(/^The /, '').toUpperCase()} — <b>{pages[page].label}</b></span>
      <span className="pc-stations">{pages.map((p, i) => <button key={p.key} type="button" className={`pc-key${i === page ? ' is-on' : ''}`} onClick={() => show(i)}>{i + 1}</button>)}</span>
    </div>
  );
}

// ---------------------------------------------------------------- newspaper leaves
function LeafKeys() {
  const { pages, page, show } = usePages();
  const { view } = useSim();
  useKeys((e) => {
    if (typing(e.target) || view.name !== 'home') return;
    if (e.key === 'ArrowRight' && page < pages.length - 1) show(page + 1);
    else if (e.key === 'ArrowLeft' && page > 0) show(page - 1);
  });
  return <span className="pc-sr" aria-hidden />;
}

