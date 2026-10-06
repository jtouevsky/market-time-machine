import React from 'react';
import type { Quote } from '../../core/types';
import { useSim } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';
import { fmtChange, fmtQuoteValue, headline } from '../../theme/format';
import { Est, Prov } from './Provenance';

export function Section({ title, className = '', children, aside, id }: { title: string; className?: string; children: React.ReactNode; aside?: React.ReactNode; id?: string }) {
  const era = useEra();
  return (
    <section className={`m-section ${className}`} id={id}>
      <header className="m-section-head">
        <h2 className="m-section-title">{headline(title, era)}</h2>
        {aside ? <div className="m-section-aside">{aside}</div> : null}
      </header>
      <div className="m-section-body">{children}</div>
    </section>
  );
}

export function dir(q: { change: number | null }) {
  if (q.change === null || q.change === 0) return 'flat';
  return q.change > 0 ? 'up' : 'down';
}

export function QuoteRow({ q, onOpen, mode = 'pct' }: { q: Quote; onOpen?: () => void; mode?: 'abs' | 'pct' | 'both' }) {
  const era = useEra();
  const { date } = useSim();
  const d = dir(q);
  const name = onOpen ? <button type="button" className="m-link" onClick={onOpen}>{q.name}</button> : q.name;
  return (
    <tr className={`m-quote is-${d}`}>
      <th scope="row" className="m-quote-name">{name}</th>
      <td className="m-num m-quote-value">{fmtQuoteValue(q, era, date)}<Est p={q.provenance} /><Prov p={q.provenance} /></td>
      {mode === 'both' ? <td className="m-num m-quote-chg m-quote-abs">{fmtChange(q, era, date, 'abs')}</td> : null}
      <td className="m-num m-quote-chg">{fmtChange(q, era, date, mode === 'abs' ? 'abs' : 'pct')}</td>
    </tr>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="m-empty">{children}</p>;
}

/** Era-voiced placeholder while a module's provider answers. */
export function Loading() {
  const era = useEra();
  const text = era.module === 'print' ? 'Setting type…' : era.module === 'terminal' ? 'RETRIEVING…' : era.id === 'directory' || era.id === 'portal' ? 'Loading...' : 'Loading';
  return <p className="m-loading" aria-busy="true">{text}</p>;
}
