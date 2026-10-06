import { useState } from 'react';
import { useSim } from '../../state/simulation';
import { useHistorical } from '../../state/useHistorical';
import { useEra } from '../../theme/EraThemeProvider';
import { bigMoney, fmtChange, fmtQuoteValue, headline, money } from '../../theme/format';
import { Empty, Section, dir } from './common';
import { PriceChart } from './PriceChart';

function BuyBox({ ticker }: { ticker: string }) {
  const era = useEra();
  const { buy, portfolio, date } = useSim();
  const quote = useHistorical((p, d) => p.getQuote(ticker, d), [ticker]);
  const [shares, setShares] = useState('10');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!quote || quote.note) return null;
  const n = Math.floor(Number(shares));
  const cost = n > 0 ? n * quote.value : 0;
  const max = Math.floor(portfolio.cash / quote.value);
  return (
    <form className="m-trade" onSubmit={async (e) => {
      e.preventDefault();
      const err = await buy(ticker, n);
      setMsg(err ? { ok: false, text: err } : { ok: true, text: era.module === 'terminal' ? `FILLED ${n} ${ticker} @ ${fmtQuoteValue(quote, era, date)}` : `Bought ${n} shares at ${fmtQuoteValue(quote, era, date)}.` });
    }}>
      <div className="m-trade-row">
        <label htmlFor="trade-shares">{era.module === 'terminal' ? 'QTY' : 'Shares'}</label>
        <input id="trade-shares" inputMode="numeric" value={shares} onChange={(e) => { setShares(e.target.value.replace(/[^\d]/g, '')); setMsg(null); }} />
        <button type="button" className="m-link m-trade-max" onClick={() => setShares(String(Math.max(0, max)))}>{era.module === 'terminal' ? 'MAX' : `Max (${max})`}</button>
        <button type="submit" className="m-btn m-btn-primary" disabled={!n || cost > portfolio.cash}>{era.labels.buy} {ticker}</button>
      </div>
      <p className="m-trade-info">
        {era.module === 'terminal' ? 'EST COST' : 'Estimated cost'} {money(cost)} · {era.labels.cash} {money(portfolio.cash)}
      </p>
      {msg ? <p className={`m-trade-msg ${msg.ok ? 'is-ok' : 'is-err'}`} role="status">{msg.text}</p> : null}
    </form>
  );
}

export function CompanyPage({ ticker }: { ticker: string }) {
  const era = useEra();
  const { date, go } = useSim();
  const prof = useHistorical((p, d) => p.getCompanyProfile(ticker, d), [ticker]);
  const L = era.labels;
  if (prof === undefined) return <div className="v-company"><Empty>…</Empty></div>;
  if (prof === null) {
    return (
      <div className="v-company">
        <Section title={ticker}><Empty>{era.module === 'terminal' ? `${ticker} — NO SECURITY ON FILE AS OF ${era.formatShort(date)}` : 'No public record of this company exists as of this date.'}</Empty></Section>
      </div>
    );
  }
  const q = prof.quote;
  return (
    <div className="v-company">
      <header className="m-co-head">
        <div className="m-co-id">
          <h1 className="m-co-name">{headline(prof.name, era)}</h1>
          <p className="m-co-sub">{prof.ticker} · {prof.exchange} · {prof.sector}</p>
        </div>
        {q ? (
          <div className={`m-co-quote is-${dir(q)}`}>
            <span className="m-co-price">{fmtQuoteValue(q, era, date)}</span>
            <span className="m-co-chg">{fmtChange(q, era, date, 'abs')} ({fmtChange(q, era, date, 'pct')})</span>
            <span className="m-co-asof">{q.asOf === date ? (era.module === 'terminal' ? 'CLOSE' : 'Close') : `${era.module === 'terminal' ? 'LAST' : 'As of'} ${era.formatShort(q.asOf)}`}</span>
          </div>
        ) : null}
      </header>
      {prof.statusNote ? <p className="m-co-status">{prof.statusNote}</p> : null}

      <div className="m-co-grid">
        <div className="m-co-main">
          <PriceChart symbol={ticker} />
          {prof.status === 'listed' && !q?.note ? <BuyBox ticker={ticker} /> : null}
          <Section title={era.module === 'terminal' ? 'DESCRIPTION' : 'Profile'} className="m-co-desc">
            <p>{prof.description}</p>
            <dl className="m-facts">
              <div><dt>{L.marketCap}</dt><dd>{prof.marketCap ? bigMoney(prof.marketCap) : '—'}</dd></div>
              <div><dt>{era.module === 'terminal' ? 'HQ' : 'Headquarters'}</dt><dd>{prof.headquarters}</dd></div>
            </dl>
          </Section>
          <Section title={L.commentary} className="m-co-news">
            {prof.commentary.length ? (
              <ul className="m-news">
                {prof.commentary.map((n) => (
                  <li key={n.id} className="m-story">
                    <h3 className="m-story-title">{headline(n.title, era)}</h3>
                    {n.summary ? <p className="m-story-summary">{n.summary}</p> : null}
                    <div className="m-story-meta"><span className="m-story-when">{era.formatShort(n.availableAt)}</span></div>
                  </li>
                ))}
              </ul>
            ) : <Empty>{era.module === 'terminal' ? 'NO STORIES' : 'No recent coverage.'}</Empty>}
          </Section>
        </div>
        <div className="m-co-side">
          <Section title={L.leadership}>
            <ul className="m-plain">{prof.leadership.map((l) => <li key={`${l.name}-${l.title}`}><strong>{l.name}</strong><span>{l.title}</span></li>)}</ul>
          </Section>
          <Section title={L.products}>
            <ul className="m-plain m-products">{prof.products.slice(0, 10).map((p) => <li key={p.name}><strong>{p.name}</strong><span>{p.availableAt.slice(0, 4)}</span></li>)}</ul>
          </Section>
          <Section title={L.competitors}>
            <ul className="m-plain">{prof.competitors.map((c) => <li key={c}>{c}</li>)}</ul>
          </Section>
          {prof.financials.length ? (
            <Section title={L.financials}>
              <table className="m-table m-fin">
                <thead><tr><th>FY</th><th className="m-num">{era.module === 'terminal' ? 'REV $MM' : 'Revenue'}</th><th className="m-num">{era.module === 'terminal' ? 'NI $MM' : 'Net income'}</th></tr></thead>
                <tbody>
                  {prof.financials.slice(0, 5).map((f) => (
                    <tr key={f.fiscalYear}><td>{f.fiscalYear}</td><td className="m-num">{era.module === 'terminal' ? f.revenue.toLocaleString() : bigMoney(f.revenue * 1e6)}</td><td className={`m-num ${f.netIncome < 0 ? 'm-down' : ''}`}>{era.module === 'terminal' ? f.netIncome.toLocaleString() : bigMoney(f.netIncome * 1e6)}</td></tr>
                  ))}
                </tbody>
              </table>
            </Section>
          ) : null}
          <button type="button" className="m-link m-back" onClick={() => go({ name: 'home' })}>{era.module === 'terminal' ? '<MENU> RETURN' : `← ${L.home}`}</button>
        </div>
      </div>
    </div>
  );
}
