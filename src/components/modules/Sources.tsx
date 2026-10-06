import { useEffect, useRef } from 'react';
import type { Provenance } from '../../core/types';
import type { HomeData } from '../../state/useHistorical';
import { useEra } from '../../theme/EraThemeProvider';
import { Prov } from './Provenance';

export interface SourceRow { item: string; source: string; publication?: string; date: string; url?: string; provenance?: Provenance }

/** Everything on the page, traced back to where it came from. */
export function collectSources(d: HomeData): SourceRow[] {
  const rows: SourceRow[] = [];
  const quotes = [...d.markets.indexes, ...d.markets.commodities, ...d.markets.rates, ...d.markets.international, ...d.markets.digital, ...d.markets.movers];
  for (const q of quotes) rows.push({ item: `${q.name} ${q.value.toFixed(2)}`, source: q.publication ?? 'Market data', date: q.asOf, url: q.sourceUrl, provenance: q.provenance });
  for (const n of d.news.slice(0, 30)) rows.push({ item: n.title, source: n.source, publication: n.publication, date: n.publishedAt, url: n.sourceUrl, provenance: n.provenance });
  for (const e of d.economy) rows.push({ item: `${e.label}: ${e.value.toFixed(1)}${e.unit} (${e.period})`, source: e.source, publication: e.publication, date: e.publishedAt, url: e.sourceUrl, provenance: e.provenance });
  for (const s of d.sports) rows.push({ item: s.title, source: s.source, date: s.availableAt, url: s.sourceUrl, provenance: s.provenance });
  for (const c of d.culture) rows.push({ item: c.line, source: c.source, date: c.availableAt, url: c.sourceUrl, provenance: c.provenance });
  for (const w of d.weather) rows.push({ item: `${w.city}: ${w.high}°/${w.low}° ${w.sky}`, source: w.source, publication: w.publication, date: w.availableAt, url: w.sourceUrl, provenance: w.provenance });
  for (const f of d.frontPages) rows.push({ item: `${f.publicationTitle}, front page`, source: f.source, date: f.publishedAt, url: f.pageUrl, provenance: f.provenance });
  for (const a of d.ads) rows.push({ item: `${a.brand} advertisement`, source: 'Fictional period advertisement (invented brand)', date: a.availableAt, provenance: 'MOCK' });
  return rows;
}

export function SourcesPanel({ rows, onClose }: { rows: SourceRow[]; onClose: () => void }) {
  const era = useEra();
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const T = era.module === 'terminal';
  const title = era.module === 'print' ? 'Sources & Archives' : T ? 'SOURCES' : 'Sources';
  const counts = rows.reduce<Record<string, number>>((m, r) => { const k = r.provenance ?? 'UNLABELLED'; m[k] = (m[k] ?? 0) + 1; return m; }, {});
  return (
    <div className="m-modal-backdrop" onClick={onClose}>
      <div className="m-modal m-sources" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="m-modal-titlebar">
          <span>{title}</span>
          <button ref={ref} type="button" className="m-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="m-modal-body">
          <p className="m-sources-intro">
            {T ? 'DATA SOURCES FOR THIS SCREEN.' : 'Where everything on this page came from.'}{' '}
            {Object.entries(counts).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(' · ')}
          </p>
          <div className="m-scroll">
            <table className="m-table m-sources-table">
              <thead><tr><th>{T ? 'ITEM' : 'Item'}</th><th>{T ? 'SOURCE' : 'Source'}</th><th>{T ? 'DATE' : 'Original date'}</th><th>{T ? 'TYPE' : 'Type'}</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.item}</td>
                    <td>{r.url ? <a className="m-link" href={r.url} target="_blank" rel="noreferrer">{r.publication && r.publication !== r.source ? `${r.publication} — ` : ''}{r.source}</a> : r.source}</td>
                    <td className="m-num">{r.date}</td>
                    <td><span className={`m-ptype p-${(r.provenance ?? 'x').toLowerCase()}`}>{r.provenance ?? '—'}</span><Prov p={r.provenance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m-footnote">
            REAL = measured data · ARCHIVAL = archived text/images · DERIVED = computed or editorial summary of a documented fact · MOCK = estimate (marked † on the page).
          </p>
        </div>
      </div>
    </div>
  );
}

export function SourcesLink({ onOpen }: { onOpen: () => void }) {
  const era = useEra();
  const label = era.module === 'print' ? 'Sources & Archives' : era.module === 'terminal' ? '[S] SOURCES' : era.id === 'directory' || era.id === 'portal' ? 'Sources' : 'Sources';
  return (
    <button type="button" className="m-sources-link" onClick={onOpen} aria-label="Show sources">
      {era.id === 'fintech' || era.id === 'flat' ? <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M8 7.2v4M8 4.6v.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg> : null}
      <span>{label}</span>
    </button>
  );
}
