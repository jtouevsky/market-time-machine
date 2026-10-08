import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MONTHS, WEEKDAYS, parts, todayISO, yearOf } from '../../core/dates';
import { useSim } from '../../state/simulation';
import { registryNow } from '../../theme/registryLoader';
import './portal.css';

const MILESTONES = [2026, 2020, 2015, 2010, 2005, 2000, 1995, 1987, 1980, 1969, 1957, 1945, 1929, 1914, 1900, 1886, 1869, 1850, 1825, 1800];

/** 2026 → 2020 → 2015 → 2010 → 2009 → 2008: big jumps first, single years as we arrive. */
export function yearSequence(from: number, to: number): number[] {
  const lo = Math.min(from, to), hi = Math.max(from, to);
  const near = from > to ? [to + 2, to + 1] : [to - 2, to - 1];
  const inner = [...new Set([...MILESTONES, ...near])].filter((y) => y > lo && y < hi);
  const seq = from > to ? inner.sort((a, b) => b - a) : inner.sort((a, b) => a - b);
  return [from, ...seq, to].filter((y, i, a) => i === 0 || y !== a[i - 1]);
}

/**
 * ~1.7s: the future compresses, years rewind with chromatic fringing, film grain and tint
 * creep in as the destination gets older, then the era's own paper/screen colour floods in.
 * Click or press any key to skip.
 */
export function TimeTravelTransition() {
  const { travel, finishTravel } = useSim();
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const fromYear = travel?.from ? yearOf(travel.from) : yearOf(todayISO());
  const toYear = travel ? yearOf(travel.to) : fromYear;
  const years = useMemo(() => yearSequence(fromYear, toYear), [fromYear, toYear]);
  const forward = travel?.direction === 'forward';
  const total = reduced ? 300 : forward ? 800 : 1150;
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<'spin' | 'land' | 'flood'>('spin');
  const done = useRef(false);
  const finish = useCallback(() => { if (!done.current) { done.current = true; finishTravel(); } }, [finishTravel]);

  useEffect(() => {
    if (!travel) return;
    done.current = false;
    const timers: number[] = [];
    let t = 0;
    const n = years.length;
    for (let k = 1; k < n; k++) {
      const x = k / (n - 1);
      const weight = 0.35 + 1.7 * Math.pow(Math.abs(x - 0.45) * 2, 2.2);
      t += (total / n) * weight * 0.6;
      const idx = k;
      timers.push(window.setTimeout(() => setI(idx), Math.min(t, total)));
    }
    timers.push(window.setTimeout(() => setStage('land'), total + 20));
    timers.push(window.setTimeout(() => setStage('flood'), total + (reduced ? 80 : 330)));
    timers.push(window.setTimeout(finish, total + (reduced ? 160 : 560)));
    const skip = () => finish();
    window.addEventListener('keydown', skip);
    return () => { timers.forEach(clearTimeout); window.removeEventListener('keydown', skip); };
  }, [travel, years, total, reduced, finish]);

  if (!travel) return null;
  const p = parts(travel.to);
  const full = `${WEEKDAYS[p.weekday]}, ${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
  const era = registryNow().eraFor(travel.to);
  const age = Math.max(0, Math.min(1, (2026 - toYear) / 110));
  const prog = years.length > 1 ? i / (years.length - 1) : 1;

  return (
    <div
      className={`tt stage-${stage}${forward ? ' tt-forward' : ''}`} data-target-era={era.id}
      style={{ ['--age' as string]: age, ['--prog' as string]: prog }}
      role="status" aria-label={`Traveling to ${full}`} onClick={finish}
    >
      <div className="tt-lines" aria-hidden>
        {Array.from({ length: 11 }).map((_, k) => (
          <span key={k} style={{ ['--k' as string]: k, ['--w' as string]: (k * 7) % 4, ['--spd' as string]: `${0.55 - prog * 0.32}s` }} />
        ))}
      </div>
      <div className="tt-tint" aria-hidden />
      <div className="tt-scan" aria-hidden />
      <div className="tt-grain" aria-hidden />
      <div className="tt-year" key={years[i]}>{years[i]}</div>
      <div className="tt-date">{full}</div>
      <div className="tt-skip" aria-hidden>Click to skip</div>
      <div className="tt-flood" aria-hidden />
    </div>
  );
}
