import { useEffect, useRef } from 'react';
import { diffDays } from '../../core/dates';
import type { NewsItem } from '../../core/types';
import { useSim } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';
import { headline, money, pct } from '../../theme/format';

export function HistoricalTimeline({ events }: { events: NewsItem[] }) {
  const era = useEra();
  if (!events.length) return <p className="m-empty">{era.module === 'terminal' ? 'NO MAJOR EVENTS' : 'A quiet stretch — no major events on record.'}</p>;
  const byYear = new Map<string, NewsItem[]>();
  for (const e of events) {
    const y = e.availableAt.slice(0, 4);
    byYear.set(y, [...(byYear.get(y) ?? []), e]);
  }
  return (
    <ol className="m-timeline">
      {[...byYear.entries()].map(([y, list]) => (
        <li key={y} className="m-tl-year">
          <span className="m-tl-yearlabel">{y}</span>
          <ol>
            {list.map((e) => (
              <li key={e.id} className={`m-tl-item cat-${e.category}`}>
                <span className="m-tl-date">{era.formatShort(e.availableAt)}</span>
                <span className="m-tl-title">{headline(e.title, era)}</span>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

function span(days: number) {
  if (days >= 365) { const y = days / 365.25; return `${y >= 10 ? Math.round(y) : y.toFixed(1)} years`; }
  if (days >= 60) return `${Math.round(days / 30.44)} months`;
  return `${days} days`;
}

export function RevealModal() {
  const era = useEra();
  const { reveal, closeReveal, portfolio, go } = useSim();
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (reveal) ref.current?.focus(); }, [reveal]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') closeReveal(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [closeReveal]);
  if (!reveal) return null;
  const T = era.module === 'terminal';
  const days = diffDays(reveal.from, reveal.to);
  const periodReturn = (reveal.after / reveal.before - 1) * 100;
  const totalReturn = (reveal.after / portfolio.startingCash - 1) * 100;
  const hasLots = reveal.lots.length > 0;

  return (
    <div className="m-modal-backdrop" onClick={closeReveal}>
      <div className="m-modal m-reveal" role="dialog" aria-modal="true" aria-labelledby="reveal-title" onClick={(e) => e.stopPropagation()}>
        <div className="m-modal-titlebar">
          <span id="reveal-title">{headline(era.labels.reveal, era)}</span>
          <button type="button" className="m-modal-x" onClick={closeReveal} aria-label="Close">×</button>
        </div>
        <div className="m-modal-body">
          <p className="m-reveal-span">
            {era.formatDate(reveal.from)} <span className="m-reveal-arrow">→</span> {era.formatDate(reveal.to)}
            <small> · {span(days)}{T ? ' ELAPSED' : ' later'}</small>
          </p>

          {hasLots ? (
            <>
              <div className="m-reveal-stats">
                <div><span>{T ? 'START' : 'Before'}</span><strong>{money(reveal.before)}</strong></div>
                <div><span>{T ? 'NOW' : 'Now'}</span><strong>{money(reveal.after)}</strong></div>
                <div className={periodReturn >= 0 ? 'm-up' : 'm-down'}><span>{T ? 'PERIOD' : 'This period'}</span><strong>{pct(periodReturn)}</strong></div>
                <div className={totalReturn >= 0 ? 'm-up' : 'm-down'}><span>{T ? 'SINCE START' : 'Since you began'}</span><strong>{pct(totalReturn)}</strong></div>
                {reveal.benchmarkReturnPct !== null ? (
                  <div className={reveal.benchmarkReturnPct >= 0 ? 'm-up' : 'm-down'}><span>{reveal.benchmarkName}</span><strong>{pct(reveal.benchmarkReturnPct)}</strong></div>
                ) : null}
              </div>
              <div className="m-scroll">
                <table className="m-table m-reveal-table">
                  <thead><tr><th>{T ? 'SYM' : 'Investment'}</th><th className="m-num">{T ? 'COST' : 'Invested'}</th><th className="m-num">{T ? 'VALUE' : 'Worth now'}</th><th className="m-num">{T ? 'RTN' : 'Return'}</th><th className="m-num">{T ? 'VS IDX' : 'Index, same dates'}</th></tr></thead>
                  <tbody>
                    {reveal.lots.map((r) => (
                      <tr key={r.lot.id}>
                        <td>
                          <button type="button" className="m-link" onClick={() => { closeReveal(); go({ name: 'company', ticker: r.lot.ticker }); }}>{r.lot.company}</button>
                          <small className="m-reveal-bought"> {T ? 'BOT' : 'bought'} {era.formatShort(r.lot.purchaseDate)}</small>
                          {r.settled ? <small className="m-reveal-settled">{r.settled}</small> : null}
                        </td>
                        <td className="m-num">{money(r.lot.costBasis)}</td>
                        <td className="m-num">{money(r.value)}</td>
                        <td className={`m-num ${r.returnPct >= 0 ? 'm-up' : 'm-down'}`}>{pct(r.returnPct)}</td>
                        <td className="m-num">{r.benchReturnPct !== null ? pct(r.benchReturnPct) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : reveal.benchmarkReturnPct !== null ? (
            <p className="m-reveal-bench">{reveal.benchmarkName}: <strong className={reveal.benchmarkReturnPct >= 0 ? 'm-up' : 'm-down'}>{pct(reveal.benchmarkReturnPct)}</strong> {T ? 'OVER PERIOD' : 'over the period.'}</p>
          ) : null}

          {reveal.notes.length ? <ul className="m-reveal-notes">{reveal.notes.map((n) => <li key={n}>{n}</li>)}</ul> : null}

          <h3 className="m-reveal-sub">{headline(era.labels.between, era)}</h3>
          <HistoricalTimeline events={reveal.events} />
        </div>
        <div className="m-modal-foot">
          <button ref={ref} type="button" className="m-btn m-btn-primary" onClick={closeReveal}>{T ? 'CONTINUE <ENTER>' : era.module === 'print' ? 'Read To-day’s Paper' : 'Continue'}</button>
        </div>
      </div>
    </div>
  );
}

export function DigestToast() {
  const era = useEra();
  const { digest, closeDigest } = useSim();
  useEffect(() => { if (!digest) return; const t = setTimeout(closeDigest, 9000); return () => clearTimeout(t); }, [digest, closeDigest]);
  if (!digest) return null;
  return (
    <div className="m-digest" role="status">
      <div className="m-digest-head">
        <strong>{era.module === 'terminal' ? 'NEW STORIES' : era.module === 'print' ? 'Late Bulletins' : 'New since your last visit'}</strong>
        <button type="button" className="m-modal-x" onClick={closeDigest} aria-label="Dismiss">×</button>
      </div>
      <ul>{digest.map((d) => <li key={d.id}>{headline(d.title, era)}</li>)}</ul>
    </div>
  );
}
