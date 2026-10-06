import { useEffect, useMemo, useRef, useState } from 'react';
import { isParseError, parseDateInput } from '../../core/dateParser';
import { MONTHS, WEEKDAYS, parts, type ISODate } from '../../core/dates';
import { useSim } from '../../state/simulation';
import { ChromeRibbons } from './ChromeRibbons';
import './portal.css';

const SUGGESTIONS = ['October 29, 1929', 'July 20, 1969', 'October 19, 1987', 'June 17, 1997', 'September 15, 2008', 'March 11, 2020'];

function pretty(d: ISODate) {
  const p = parts(d);
  return `${WEEKDAYS[p.weekday]}, ${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
}

/** The future: a single liquid-glass capsule floating among slow chrome ribbons. */
export function DatePortal() {
  const { travelTo, provider, resumeDate } = useSim();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 700); return () => clearTimeout(t); }, []);

  // light follows the cursor; the capsule tilts a hair toward it
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = window.innerWidth, h = window.innerHeight;
        root.style.setProperty('--px', `${e.clientX}px`);
        root.style.setProperty('--py', `${e.clientY}px`);
        const c = capsuleRef.current?.getBoundingClientRect();
        if (c) {
          const nx = (e.clientX - (c.left + c.width / 2)) / w;
          const ny = (e.clientY - (c.top + c.height / 2)) / h;
          root.style.setProperty('--tilt-x', `${(-ny * 4).toFixed(2)}deg`);
          root.style.setProperty('--tilt-y', `${(nx * 5).toFixed(2)}deg`);
          root.style.setProperty('--mx', `${(((e.clientX - c.left) / c.width) * 100).toFixed(1)}%`);
          root.style.setProperty('--angle', `${(Math.atan2(ny, nx) * 180) / Math.PI + 90}deg`);
        }
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);

  const preview = useMemo(() => {
    if (!value.trim()) return null;
    const r = parseDateInput(value, provider.horizon);
    return isParseError(r) ? null : r;
  }, [value, provider.horizon]);

  const go = (date: ISODate) => {
    setLeaving(true);
    setTimeout(() => travelTo(date), 380);
  };
  const submit = (raw = value) => {
    const r = parseDateInput(raw, provider.horizon);
    if (isParseError(r)) { setError(r.error); return; }
    setError(null);
    go(r.date);
  };

  return (
    <main ref={rootRef} className={`portal${leaving ? ' leaving' : ''}${focused ? ' is-focused' : ''}`}>
      <div className="portal-light" aria-hidden />
      <ChromeRibbons layer="back" speedBoost={leaving ? 9 : focused ? 1.6 : 1} />
      <div className="portal-mark" aria-label="Market Time Machine">
        <span className="portal-mark-dot" aria-hidden />Market Time Machine
      </div>

      <section className="portal-center">
        <form className="capsule-wrap" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <label htmlFor="portal-date" className="sr-only">Enter any date in history</label>
          <div ref={capsuleRef} className={`capsule${error ? ' is-error' : ''}${value ? ' has-value' : ''}`}>
            <span className="capsule-iris" aria-hidden />
            <span className="capsule-sheen" aria-hidden />
            <input
              id="portal-date" ref={inputRef} value={value} autoComplete="off" spellCheck={false}
              placeholder="Enter any date in history…"
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            />
            <button type="submit" className="capsule-go" aria-label="Travel to this date" disabled={!value.trim()}>
              <span className="capsule-go-glass" aria-hidden />
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                <path d="M4.5 12h14M13.5 6.5 19 12l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </form>
        <div className="portal-sub" aria-live="polite">
          {error ? <span className="portal-error">{error}</span>
            : preview ? <span className="portal-preview">{pretty(preview.date)}{preview.precision !== 'day' ? <em> · {preview.interpretation.split(' — ')[0]}</em> : null}</span>
            : <span className="portal-tag">See the world as they saw it.</span>}
        </div>
        <div className={`portal-suggest${focused && !value ? ' show' : ''}`}>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" tabIndex={focused ? 0 : -1} onMouseDown={(e) => { e.preventDefault(); setValue(s); submit(s); }}>{s.split(', ')[1]}</button>
          ))}
        </div>
      </section>

      <ChromeRibbons layer="front" speedBoost={leaving ? 9 : 1} />

      {resumeDate ? (
        <button className="portal-resume" onClick={() => go(resumeDate)}>Resume · {pretty(resumeDate)}</button>
      ) : null}
    </main>
  );
}
