/**
 * DEV-ONLY Experience Gallery. Opened with `?gallery` or Ctrl+Shift+G; lazy-imported from App.tsx behind
 * `import.meta.env.DEV`, so it is never part of a production build.
 * Previews are same-origin iframes at `/?previewDate=YYYY-MM-DD`; that mode boots from a synthetic session and
 * never reads or writes the real saved one (see PREVIEW_DATE in state/simulation.tsx).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { todayISO, type ISODate } from '../core/dates';
import { VisualEraRegistry, type VisualExperience, type VisualFamily } from '../theme/registry';
import './gallery.css';

const STATUSES = ['complete', 'partial', 'planned'] as const;
const dayNum = (d: string) => Date.parse(`${d}T00:00:00Z`) / 86_400_000;
const fromNum = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10) as ISODate;
const yr = (d: string) => Number(d.slice(0, 4));

/** A representative date inside the experience, never later than "today". */
export function midDate(e: VisualExperience): ISODate {
  const today = todayISO();
  const end = e.to > today ? today : e.to;
  if (e.from >= end) return e.from;
  return fromNum(Math.round((dayNum(e.from) + dayNum(end)) / 2));
}

const years = (e: VisualExperience) => `${yr(e.from)}–${e.to.startsWith('2999') ? 'now' : yr(e.to)}`;

function Preview({ exp, date, label }: { exp: VisualExperience; date: ISODate; label: string }) {
  return (
    <figure className="xg-frame">
      <figcaption><strong>{label}</strong> {exp.name} <span>{date}</span></figcaption>
      <iframe title={`Live preview: ${exp.name} on ${date}`} src={`/?previewDate=${date}`} loading="lazy" />
    </figure>
  );
}

export default function ExperienceGallery({ onClose }: { onClose: () => void }) {
  const all = useMemo(() => VisualEraRegistry.all(), []);
  const families = useMemo(() => [...new Set(all.map((e) => e.family))] as VisualFamily[], [all]);
  const [q, setQ] = useState('');
  const [fam, setFam] = useState('all');
  const [status, setStatus] = useState('all');
  const [compare, setCompare] = useState(false);
  const [picked, setPicked] = useState<string[]>([all[Math.floor(all.length / 2)]?.id ?? '']);
  const [override, setOverride] = useState<Record<string, string>>({});
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((e) => (fam === 'all' || e.family === fam) && (status === 'all' || e.status === status)
      && (!needle || `${e.id} ${e.name} ${e.family} ${e.archetype} ${years(e)}`.toLowerCase().includes(needle)));
  }, [all, q, fam, status]);

  const choose = (id: string) => {
    setPicked((p) => {
      if (!compare) return [id];
      if (p.includes(id)) return p.filter((x) => x !== id);
      return p.length >= 2 ? [p[1], id] : [...p, id];
    });
  };
  const exps = picked.map((id) => VisualEraRegistry.byId(id)).filter(Boolean) as VisualExperience[];
  const dateOf = (e: VisualExperience) => (override[e.id] && override[e.id] >= e.from && override[e.id] <= e.to ? override[e.id] : midDate(e)) as ISODate;
  const counts = STATUSES.map((s) => `${all.filter((e) => e.status === s).length} ${s}`).join(' · ');

  return (
    <div className="xg" role="dialog" aria-modal="true" aria-label="Experience gallery (development only)">
      <header className="xg-top">
        <h1>Experience Gallery <small>dev only &middot; {all.length} experiences &middot; {counts}</small></h1>
        <label className="xg-toggle"><input type="checkbox" checked={compare} onChange={(e) => { setCompare(e.target.checked); setPicked((p) => p.slice(0, e.target.checked ? 2 : 1)); }} /> Compare two</label>
        <button ref={closeRef} onClick={onClose}>Close (Esc)</button>
      </header>
      <div className="xg-body">
        <aside className="xg-side">
          <div className="xg-filters">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, id, year, archetype" aria-label="Search experiences" />
            <select value={fam} onChange={(e) => setFam(e.target.value)} aria-label="Filter by family">
              <option value="all">All families</option>{families.map((f) => <option key={f}>{f}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">Any status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <p className="xg-count" aria-live="polite">{list.length} shown{compare ? ` · ${picked.length}/2 picked` : ''}</p>
          <ul className="xg-list">
            {list.map((e) => {
              const on = picked.includes(e.id);
              return (
                <li key={e.id}>
                  <button className={on ? 'on' : ''} aria-pressed={on} onClick={() => choose(e.id)}>
                    <span className="yrs">{years(e)}</span>
                    <span className="nm">{e.name}</span>
                    <span className="meta">{e.family} / {e.archetype}</span>
                    <span className={`badge ${e.status}`}>{e.status}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        <main className="xg-main">
          {exps.length === 0 ? <p className="xg-empty">Pick an experience from the list.</p> : (
            <>
              <div className="xg-info">
                {exps.map((e, i) => (
                  <section key={e.id}>
                    <h2>{compare ? `${'AB'[i]} · ` : ''}{e.name} <span className={`badge ${e.status}`}>{e.status}</span></h2>
                    <p className="meta">{e.id} &middot; {years(e)} &middot; {e.family} / {e.archetype} &middot; nav {e.nav.model}</p>
                    <p>{e.rationale}</p>
                    <label>Preview date{' '}
                      <input type="date" min={e.from.length === 10 && e.from >= '1000-01-01' ? e.from : undefined} max={e.to > todayISO() ? todayISO() : e.to}
                        value={dateOf(e)} onChange={(ev) => setOverride((o) => ({ ...o, [e.id]: ev.target.value }))} />
                    </label>
                  </section>
                ))}
              </div>
              <div className={`xg-frames${exps.length > 1 ? ' two' : ''}`}>
                {exps.map((e, i) => <Preview key={`${e.id}:${dateOf(e)}`} exp={e} date={dateOf(e)} label={compare ? 'AB'[i] : 'Live'} />)}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
