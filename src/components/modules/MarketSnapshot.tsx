import { useMemo } from 'react';
import { addDays } from '../../core/dates';
import type { EconomicReading, MarketSnapshot as Snap, NewsItem, Quote } from '../../core/types';
import { useSim } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';
import { fmtChange, fmtQuoteValue, num } from '../../theme/format';
import { Empty, QuoteRow, Section, dir } from './common';
import { Est } from './Provenance';

function Group({ title, quotes, open }: { title: string; quotes: Quote[]; open?: (q: Quote) => void }) {
  if (!quotes.length) return null;
  return (
    <div className="m-group">
      <h4 className="m-group-title">{title}</h4>
      <table className="m-table">
        <tbody>{quotes.map((q) => <QuoteRow key={q.id} q={q} mode="both" onOpen={open ? () => open(q) : undefined} />)}</tbody>
      </table>
    </div>
  );
}

export function ClosedNotice({ snap }: { snap: Snap }) {
  const era = useEra();
  if (!snap.closedReason) return null;
  const weekend = snap.closedReason === 'Saturday' || snap.closedReason === 'Sunday';
  return (
    <p className={`m-closed${weekend ? '' : ' is-special'}`}>
      <strong>{era.labels.closed}</strong>{' '}
      {weekend ? `— ${era.module === 'terminal' ? 'LAST' : 'Prices as of'} ${era.formatShort(snap.sessionDate!)}` : `— ${snap.closedReason}`}
    </p>
  );
}

export function MarketSnapshot({ snap, groups = ['indexes', 'commodities', 'rates', 'international', 'digital'], title }: {
  snap: Snap; groups?: ('indexes' | 'commodities' | 'rates' | 'international' | 'digital')[]; title?: string;
}) {
  const era = useEra();
  const L = era.labels;
  const openIndex = undefined;
  const any = groups.some((g) => snap[g].length);
  return (
    <Section title={title ?? L.markets} className="m-markets">
      <ClosedNotice snap={snap} />
      {!any ? <Empty>{era.id === 'archive' ? 'No published averages of stock prices exist as yet; quotations of the Gold Room and the money market follow.' : 'No quotations.'}</Empty> : null}
      {groups.includes('indexes') ? <Group title={L.indexes} quotes={snap.indexes} open={openIndex} /> : null}
      {groups.includes('commodities') ? <Group title={L.commodities} quotes={snap.commodities} /> : null}
      {groups.includes('rates') ? <Group title={L.rates} quotes={snap.rates} /> : null}
      {groups.includes('international') ? <Group title={L.international} quotes={snap.international} /> : null}
      {groups.includes('digital') && L.digital ? <Group title={L.digital} quotes={snap.digital} /> : null}
      {groups.some((g) => snap[g].some((q) => q.provenance === 'MOCK')) ? (
        <p className="m-footnote">† {era.module === 'terminal' ? 'EST. — NO DAILY RECORD ON FILE' : era.module === 'print' ? 'Estimated; no daily record on file.' : 'Estimate — no daily record on file.'}</p>
      ) : null}
    </Section>
  );
}

export function MarketMovers({ snap, limit = 6 }: { snap: Snap; limit?: number }) {
  const era = useEra();
  const { go, date } = useSim();
  return (
    <Section title={era.labels.movers} className="m-movers">
      {snap.movers.length ? (
        <table className="m-table">
          <tbody>
            {snap.movers.slice(0, limit).map((q) => (
              <tr key={q.id} className={`m-quote is-${dir(q)}`}>
                <th scope="row" className="m-quote-name">
                  <button type="button" className="m-link" onClick={() => go({ name: 'company', ticker: q.id })}>
                    {era.module === 'terminal' ? q.symbol ?? q.id : q.name}
                  </button>
                </th>
                <td className="m-num">{fmtQuoteValue(q, era, date)}<Est p={q.provenance} /></td>
                <td className="m-num m-quote-chg">{fmtChange(q, era, date, 'pct')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <Empty>{era.module === 'terminal' ? 'NO ACTIVITY' : 'No listed issues in our files for this session.'}</Empty>}
    </Section>
  );
}

export function CompaniesInNews({ news, snap }: { news: NewsItem[]; snap: Snap }) {
  const era = useEra();
  const { go, date } = useSim();
  const tickers = useMemo(() => {
    const since = addDays(date, -60);
    const counts = new Map<string, number>();
    for (const n of news) if (n.availableAt >= since) for (const t of n.tickers ?? []) counts.set(t, (counts.get(t) ?? 0) + n.importance);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 6);
  }, [news, date]);
  const fallback = snap.movers.map((m) => m.id).filter((t) => !tickers.includes(t));
  const list = [...tickers, ...fallback].slice(0, 6);
  if (!list.length) return null;
  return (
    <Section title={era.labels.companiesInNews} className="m-companies">
      <ul className="m-company-list">
        {list.map((t) => {
          const q = snap.movers.find((m) => m.id === t);
          const headlineFor = news.find((n) => n.tickers?.includes(t));
          return (
            <li key={t}>
              <button type="button" className="m-company" onClick={() => go({ name: 'company', ticker: t })}>
                <span className="m-company-ticker">{t}</span>
                {headlineFor ? <span className="m-company-hl">{headlineFor.title}</span> : q ? <span className="m-company-hl">{q.name}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function EconomicSnapshot({ economy, snap }: { economy: EconomicReading[]; snap: Snap }) {
  const era = useEra();
  const { date } = useSim();
  const rates = snap.rates;
  return (
    <Section title={era.labels.economy} className="m-economy">
      <dl className="m-econ">
        {economy.map((r) => (
          <div key={r.id} className="m-econ-row">
            <dt>{r.label}</dt>
            <dd>
              <span className="m-econ-value">{num(r.value, 1)}{r.unit}</span>
              <span className="m-econ-period">{r.period}{r.prior !== undefined ? ` · prior ${num(r.prior, 1)}${r.unit}` : ''}</span>
              <span className="m-econ-release">{era.module === 'terminal' ? `REL ${era.formatShort(r.publishedAt)}` : `Released ${era.formatShort(r.publishedAt)}`}</span>
            </dd>
          </div>
        ))}
        {rates.map((q) => (
          <div key={q.id} className="m-econ-row">
            <dt>{q.name}</dt>
            <dd><span className="m-econ-value">{fmtQuoteValue(q, era, date)}</span></dd>
          </div>
        ))}
        {!economy.length && !rates.length ? <Empty>No statistics are compiled.</Empty> : null}
      </dl>
      {!economy.some((e) => e.seriesId === 'UNRATE') && date < '1948-01-01' ? (
        <p className="m-footnote">{era.id === 'archive' || era.id === 'broadsheet' ? 'No official count of the unemployed is kept.' : 'Monthly unemployment data not yet published.'}</p>
      ) : null}
    </Section>
  );
}
