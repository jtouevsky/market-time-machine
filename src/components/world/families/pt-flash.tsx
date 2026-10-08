import { useCallback, useEffect, useRef, useState } from 'react';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';

const KEY = (d: string) => `mtm-flash-intro:${d}`;
const seen = (d: string) => { try { return sessionStorage.getItem(KEY(d)) === '1'; } catch { return false; } };
const mark = (d: string) => { try { sessionStorage.setItem(KEY(d), '1'); } catch { /* storage unavailable: the intro may show again */ } };
const prefersReduced = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DURATION = 2500;

/** Full-screen skippable intro, shown once per simulated date in a browser session. */
export function FlashIntro() {
  const era = useEra();
  const { date } = useSim();
  const [done, setDone] = useState(() => prefersReduced() || seen(date));
  const [pct, setPct] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);
  const skip = useCallback(() => { mark(date); setDone(true); }, [date]);

  useEffect(() => {
    if (done) return;
    btn.current?.focus();
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(100, Math.floor(((t - t0) / DURATION) * 100));
      setPct(p);
      if (p >= 100) { skip(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const key = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); skip(); } };
    window.addEventListener('keydown', key);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', key); };
  }, [done, skip]);

  if (done) return null;
  return (
    <div className="pt-intro" role="dialog" aria-modal="true" aria-label="Site intro" onKeyDown={(e) => { if (e.key === 'Tab') { e.preventDefault(); btn.current?.focus(); } }}>
      <div className="pt-intro-stage">
        <div className="pt-intro-orb" aria-hidden="true"><i /><i /><i /></div>
        <div className="pt-intro-logo" aria-hidden="true">{era.publication}</div>
        <p className="pt-intro-tag">{era.motto}</p>
        <div className="pt-intro-bar" role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div>
        <p className="pt-intro-pct">Loading... {pct}%</p>
        <button ref={btn} type="button" className="pt-intro-skip" onClick={skip}>Skip Intro</button>
        <p className="pt-intro-hint">Press Enter or Esc to skip</p>
      </div>
    </div>
  );
}
