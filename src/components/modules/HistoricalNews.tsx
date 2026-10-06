import { MONTHS, parts, type ISODate } from '../../core/dates';
import type { NewsItem } from '../../core/types';
import { useSim } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';
import { headline } from '../../theme/format';
import { Empty } from './common';
import { Prov } from './Provenance';

function when(item: NewsItem, today: ISODate, era: ReturnType<typeof useEra>) {
  if (item.availableAt === today) return era.module === 'terminal' ? 'TODAY' : era.module === 'print' ? '' : 'Today';
  const p = parts(item.availableAt);
  if (era.module === 'terminal') return era.formatShort(item.availableAt);
  if (era.module === 'print') return `${MONTHS[p.m - 1].slice(0, 3)}. ${p.d}`;
  return era.formatShort(item.availableAt);
}

function Tickers({ item }: { item: NewsItem }) {
  const { go } = useSim();
  if (!item.tickers?.length) return null;
  return (
    <span className="m-story-tickers">
      {item.tickers.map((t) => <button key={t} type="button" className="m-chip" onClick={() => go({ name: 'company', ticker: t })}>{t}</button>)}
    </span>
  );
}

export function LeadStory({ item }: { item?: NewsItem }) {
  const era = useEra();
  const { date } = useSim();
  if (!item) return null;
  return (
    <article className={`m-lead${item.solemn ? ' is-solemn' : ''}`}>
      {item.dateline && era.module !== 'terminal' ? null : null}
      <h1 className="m-lead-title">{headline(item.title, era)}</h1>
      {item.summary ? (
        <p className="m-lead-deck">
          {item.dateline && era.module === 'print' ? <span className="m-dateline">{item.dateline}, {era.formatShort(item.availableAt)}.— </span> : null}
          {item.summary}
        </p>
      ) : null}
      <div className="m-story-meta">
        <span className="m-story-when">{when(item, date, era)}</span>
        <span className="m-story-source">{item.publication && item.publication !== 'Wikipedia' ? item.publication : item.source}</span>
        <Tickers item={item} />
        <Prov p={item.provenance} />
      </div>
    </article>
  );
}

export function HistoricalNews({ items, limit = 8, withSummary = true, className = '' }: { items: NewsItem[]; limit?: number; withSummary?: boolean; className?: string }) {
  const era = useEra();
  const { date } = useSim();
  if (!items.length) return <Empty>{era.module === 'terminal' ? 'NO STORIES ON FILE' : 'No dispatches received.'}</Empty>;
  return (
    <ul className={`m-news ${className}`}>
      {items.slice(0, limit).map((n) => (
        <li key={n.id} className={`m-story imp-${n.importance} cat-${n.category}`}>
          {era.module === 'terminal' ? <span className="m-story-when">{when(n, date, era) || 'TODAY'}</span> : null}
          <h3 className="m-story-title">{headline(n.title, era)}<Prov p={n.provenance} /></h3>
          {withSummary && n.summary && era.module !== 'terminal' ? <p className="m-story-summary">{n.summary}</p> : null}
          {era.module !== 'terminal' ? (
            <div className="m-story-meta">
              {when(n, date, era) ? <span className="m-story-when">{when(n, date, era)}</span> : null}
              <span className="m-story-cat">{n.category}</span>
              <Tickers item={n} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Splits news into the lead story and the rest. The lead is what an editor that evening would
 * have put on top: today's news beats yesterday's, a provider-flagged lead (the market on a
 * crash day) beats everything, and a written headline beats a one-line chronology entry.
 */
export function splitLead(items: NewsItem[], today: ISODate) {
  const t0 = Date.parse(today);
  const score = (n: NewsItem, i: number) => {
    const days = Math.max(0, (t0 - Date.parse(n.availableAt)) / 864e5);
    return (n.lead ? 20 : 0) + n.importance + (n.major ? 1.5 : 0) + (n.provenance === 'DERIVED' ? 2.5 : 0) - 2 * Math.min(days, 5) - i * 0.01;
  };
  let lead: NewsItem | undefined, best = -Infinity;
  items.forEach((n, i) => { const s = score(n, i); if (s > best) { best = s; lead = n; } });
  return { lead, rest: items.filter((i) => i !== lead) };
}
