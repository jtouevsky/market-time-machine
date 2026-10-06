import { useEffect, useState } from 'react';
import { useSim } from '../../state/simulation';
import { useHistorical } from '../../state/useHistorical';
import { useEra } from '../../theme/EraThemeProvider';
import { headline } from '../../theme/format';
import { Empty, Section } from './common';

export function HistoricalSearch({ compact = false, autoFocus = false }: { compact?: boolean; autoFocus?: boolean }) {
  const era = useEra();
  const { go, view } = useSim();
  const [q, setQ] = useState(view.name === 'search' ? view.q : '');
  useEffect(() => { if (view.name !== 'search') setQ(''); }, [view.name]);
  return (
    <form className={`m-search${compact ? ' is-compact' : ''}`} role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go({ name: 'search', q: q.trim() }); }}>
      {era.module === 'terminal' ? <span className="m-search-prompt">{era.labels.search}&gt;</span> : null}
      <label htmlFor="hist-search" className="sr-only">{era.labels.search}</label>
      <input id="hist-search" className="m-search-input" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={era.labels.searchPlaceholder} autoComplete="off" autoFocus={autoFocus} spellCheck={false} />
      <button type="submit" className="m-btn m-search-btn">{era.labels.searchButton}</button>
    </form>
  );
}

export function SearchResults({ q }: { q: string }) {
  const era = useEra();
  const { go, date } = useSim();
  const results = useHistorical((p, d) => p.search(q, d), [q]);
  const companies = useHistorical((p, d) => p.listCompanies(d));
  return (
    <div className="v-search">
      <Section title={`${era.labels.search}: “${q}”`} className="m-results"
        aside={<span className="m-results-count">{results ? `${results.length} ${era.module === 'terminal' ? 'HITS' : results.length === 1 ? 'result' : 'results'}` : '…'}</span>}>
        <p className="m-results-note">
          {era.module === 'terminal' ? `INDEX CURRENT THROUGH ${era.formatShort(date)}` : `Index current through ${era.formatDate(date)}`}
        </p>
        {results && !results.length ? <Empty>{era.labels.noResults}</Empty> : null}
        <ol className="m-result-list">
          {results?.map((r) => (
            <li key={r.id} className={`m-result kind-${r.kind}`}>
              {r.kind === 'company' && r.ticker ? (
                <button type="button" className="m-link m-result-title" onClick={() => go({ name: 'company', ticker: r.ticker! })}>{headline(r.title, era)}</button>
              ) : (
                <span className="m-result-title">{headline(r.title, era)}</span>
              )}
              {r.snippet ? <p className="m-result-snippet">{r.snippet}</p> : null}
              <span className="m-result-meta">
                {r.kind === 'company' ? `${r.source}` : `${era.formatShort(r.date)} · ${r.kind}`}
                {r.ticker && r.kind !== 'company' ? <> · <button type="button" className="m-link" onClick={() => go({ name: 'company', ticker: r.ticker! })}>{r.ticker}</button></> : null}
              </span>
            </li>
          ))}
        </ol>
      </Section>
      {companies?.length ? (
        <Section title={era.labels.companies} className="m-directory">
          <ul className="m-directory-list">
            {companies.map((c) => (
              <li key={c.ticker}><button type="button" className="m-link" onClick={() => go({ name: 'company', ticker: c.ticker })}>{c.name}</button> <span className="m-directory-sym">{c.ticker}</span></li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
