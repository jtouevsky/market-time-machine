import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, addMonths, addYears } from '../../core/dates';
import type { CompanyListing, SearchResult } from '../../core/types';
import { useSim } from '../../state/simulation';

interface Action { id: string; label: string; hint: string; run: () => void }

/**
 * Modern-era search: a ⌘K command palette. Same historical search backend as every era —
 * it simply cannot see past the simulated date.
 */
export function CommandPalette({ open, onClose, onSources }: { open: boolean; onClose: () => void; onSources: () => void }) {
  const { provider, date, go, advanceTo, exit } = useSim();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [companies, setCompanies] = useState<CompanyListing[]>([]);
  const [hits, setHits] = useState<SearchResult[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 20); provider.listCompanies(date).then(setCompanies); } }, [open, provider, date]);
  useEffect(() => {
    if (!open || q.trim().length < 3) { setHits([]); return; }
    const t = setTimeout(() => provider.search(q, date).then((r) => setHits(r.filter((x) => x.kind !== 'company').slice(0, 6))), 220);
    return () => clearTimeout(t);
  }, [q, open, provider, date]);

  const actions = useMemo<Action[]>(() => {
    const nav: Action[] = [
      { id: 'home', label: 'Home', hint: 'Go', run: () => go({ name: 'home' }) },
      { id: 'pf', label: 'Portfolio', hint: 'Go', run: () => go({ name: 'portfolio' }) },
      { id: 'src', label: 'Sources for this page', hint: 'Open', run: onSources },
      { id: 'd1', label: 'Fast-forward 1 day', hint: 'Time', run: () => advanceTo(addDays(date, 1)) },
      { id: 'w1', label: 'Fast-forward 1 week', hint: 'Time', run: () => advanceTo(addDays(date, 7)) },
      { id: 'm1', label: 'Fast-forward 1 month', hint: 'Time', run: () => advanceTo(addMonths(date, 1)) },
      { id: 'y1', label: 'Fast-forward 1 year', hint: 'Time', run: () => advanceTo(addYears(date, 1)) },
      { id: 'exit', label: 'Exit simulation', hint: 'Portal', run: exit },
    ];
    const s = q.trim().toLowerCase();
    const cos: Action[] = companies
      .filter((c) => s && (c.name.toLowerCase().includes(s) || (c.symbol ?? c.ticker).toLowerCase().startsWith(s)))
      .slice(0, 6)
      .map((c) => ({ id: `co-${c.ticker}`, label: `${c.name}`, hint: c.symbol ?? c.ticker, run: () => go({ name: 'company', ticker: c.ticker }) }));
    const news: Action[] = hits.map((h) => ({ id: h.id, label: h.title, hint: h.date, run: () => go({ name: 'search', q }) }));
    const navF = s ? nav.filter((a) => a.label.toLowerCase().includes(s)) : nav;
    const all = [...cos, ...navF, ...news];
    if (s && !all.length) all.push({ id: 'search', label: `Search “${q}”`, hint: 'Enter', run: () => go({ name: 'search', q }) });
    return all;
  }, [q, companies, hits, go, advanceTo, date, exit, onSources]);

  if (!open) return null;
  const choose = (a?: Action) => { if (a) { a.run(); onClose(); } };
  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Search and commands" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="m14 14 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input ref={input} value={q} placeholder="Search companies, news, or type a command" aria-label="Search"
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((x) => Math.min(actions.length - 1, x + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((x) => Math.max(0, x - 1)); }
              else if (e.key === 'Enter') { e.preventDefault(); if (actions[sel]) choose(actions[sel]); else if (q) { go({ name: 'search', q }); onClose(); } }
            }} />
          <kbd>esc</kbd>
        </div>
        <ul className="cmdk-list" role="listbox">
          {actions.map((a, i) => (
            <li key={a.id} role="option" aria-selected={i === sel} className={i === sel ? 'is-sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => choose(a)}>
              <span className="cmdk-label">{a.label}</span><span className="cmdk-hint">{a.hint}</span>
            </li>
          ))}
        </ul>
        <div className="cmdk-foot">Results only include what was known on {date}.</div>
      </div>
    </div>
  );
}
