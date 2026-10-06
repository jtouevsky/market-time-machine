import { useEffect, useState } from 'react';
import type { Provenance } from '../../core/types';

/**
 * Developer labels: [REAL] [ARCHIVAL] [DERIVED] [MOCK].
 * Hidden unless debug mode is on (?debug=1, Shift+D, or VITE_DEBUG_LABELS=true).
 */
const KEY = 'mtm-debug-labels';
export function debugEnabled(): boolean {
  try {
    if ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_DEBUG_LABELS === 'true') return true;
    if (new URLSearchParams(location.search).get('debug') === '1') return true;
    return localStorage.getItem(KEY) === '1';
  } catch { return false; }
}

export function useDebugLabels() {
  const [on, setOn] = useState(debugEnabled);
  useEffect(() => {
    document.documentElement.classList.toggle('mtm-debug', on);
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.shiftKey && (e.key === 'D' || e.key === 'd') && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)) {
        setOn((v) => { const nv = !v; try { localStorage.setItem(KEY, nv ? '1' : '0'); } catch { /* ignore */ } return nv; });
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [on]);
  return on;
}

export function Prov({ p }: { p?: Provenance }) {
  if (!p) return null;
  return <span className={`prov prov-${p.toLowerCase()}`} aria-hidden>[{p}]</span>;
}

/** The honest dagger: anything estimated is marked, in every era. */
export function Est({ p }: { p?: Provenance }) {
  if (p !== 'MOCK') return null;
  return <sup className="m-est" title="Estimated — no daily record on file">†</sup>;
}
