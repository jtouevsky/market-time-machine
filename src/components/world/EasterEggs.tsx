/**
 * Mounts the era's easter eggs (src/theme/easterEggs.ts). Lazy: only fetched with the world shell.
 * Accessible: announced through a polite live region, dismissible with Escape or the close button,
 * silent, and static under prefers-reduced-motion.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEra } from '../../theme/EraThemeProvider';
import { eggsFor, type Egg } from '../../theme/easterEggs';
import './EasterEggs.css';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const isField = (t: EventTarget | null): t is HTMLInputElement | HTMLTextAreaElement =>
  t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable);

export default function EasterEggs() {
  const era = useEra();
  const eggs = useMemo(() => eggsFor(era.exp), [era.exp]);
  const [shown, setShown] = useState<Egg | null>(null);
  const [announce, setAnnounce] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const eggsRef = useRef(eggs);
  eggsRef.current = eggs;

  const fire = useCallback((egg: Egg) => {
    setShown(egg);
    setAnnounce(`${egg.title}. ${egg.lines.join(' ').replace(/\s+/g, ' ')}`);
  }, []);
  const dismiss = useCallback(() => { setShown(null); setAnnounce(''); }, []);

  useEffect(() => {
    let seq = 0;      // konami progress
    let typed = '';   // recent alphanumerics typed outside text fields
    let clicks: number[] = [];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShown((s) => (s ? null : s)); setAnnounce(''); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const field = isField(e.target);
      if (field && e.key === 'Enter') {
        const v = norm((e.target as HTMLInputElement).value);
        const hit = eggsRef.current.find((g) => g.trigger.kind === 'word' && g.trigger.word === v);
        if (hit) fire(hit);
        return;
      }
      if (field) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      seq = k === KONAMI[seq] ? seq + 1 : k === KONAMI[0] ? 1 : 0;
      if (seq === KONAMI.length) {
        seq = 0;
        const hit = eggsRef.current.find((g) => g.trigger.kind === 'konami');
        if (hit) fire(hit);
      }
      if (/^[a-z0-9]$/.test(k)) {
        typed = (typed + k).slice(-24);
        const hit = eggsRef.current.find((g) => g.trigger.kind === 'word' && typed.endsWith(g.trigger.word));
        if (hit) { typed = ''; fire(hit); }
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.('h1, [class*="masthead"], [class*="nameplate"], [class*="brand"], [class*="logo"]')) return;
      const now = Date.now();
      clicks = [...clicks.filter((c) => now - c < 4000), now];
      const hit = eggsRef.current.find((g) => g.trigger.kind === 'clicks' && clicks.length >= g.trigger.n);
      if (hit) { clicks = []; fire(hit); }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onClick); };
  }, [fire]);

  useEffect(() => { if (shown) closeRef.current?.focus({ preventScroll: true }); }, [shown]);

  return (
    <>
      <div className="egg-live" role="status" aria-live="polite" aria-atomic="true">{announce}</div>
      {shown ? (
        <aside className="egg-card" role="group" aria-label={shown.title}>
          <h2 className="egg-title">{shown.title}</h2>
          {shown.art ? <pre className="egg-art" aria-hidden="true">{shown.art}</pre> : null}
          {shown.lines.map((l, i) => <p key={i} className="egg-line">{l}</p>)}
          <button ref={closeRef} className="egg-close" onClick={dismiss}>Close (Esc)</button>
        </aside>
      ) : null}
    </>
  );
}
