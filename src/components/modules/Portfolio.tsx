import { useEffect, useState } from 'react';
import { useSim, type LotResult } from '../../state/simulation';
import { useHistorical } from '../../state/useHistorical';
import { useEra } from '../../theme/EraThemeProvider';
import { money, pct } from '../../theme/format';
import { Empty, Section } from './common';

export function Portfolio() {
  const era = useEra();
  const { portfolio, date, valueAt, sell, go } = useSim();
  const [val, setVal] = useState<{ total: number; lots: LotResult[] } | null>(null);
  const [sellQty, setSellQty] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const companies = useHistorical((p, d) => p.listCompanies(d));
  useEffect(() => { let live = true; valueAt(date).then((v) => live && setVal(v)); return () => { live = false; }; }, [date, portfolio, valueAt]);
  const L = era.labels;
  const T = era.module === 'terminal';
  const invested = portfolio.lots.reduce((s, l) => s + l.costBasis, 0);

  return (
    <div className="v-portfolio">
      <Section title={L.portfolio} className="m-pf-summary">
        <div className="m-pf-totals">
          <div><span className="m-pf-label">{L.totalValue}</span><span className="m-pf-big">{val ? money(val.total) : '…'}</span></div>
          <div><span className="m-pf-label">{L.cash}</span><span className="m-pf-mid">{money(portfolio.cash)}</span></div>
          <div><span className="m-pf-label">{T ? 'COST BASIS' : 'Invested'}</span><span className="m-pf-mid">{money(invested)}</span></div>
          <div><span className="m-pf-label">{T ? 'START CAP' : 'Starting capital'}</span><span className="m-pf-mid">{money(portfolio.startingCash)}</span></div>
        </div>
        <p className="m-footnote">
          {T ? `MARKED TO LAST CLOSE ${era.formatShort(date)}. PRICE RETURN ONLY.` : `Valued at the latest close available on ${era.formatDate(date)}. Dividends are not included.`}
        </p>
      </Section>

      <Section title={L.holdings} className="m-pf-holdings">
        {portfolio.lots.length ? (
          <div className="m-scroll">
            <table className="m-table m-pf-table">
              <thead>
                <tr>
                  <th>{T ? 'SYM' : 'Security'}</th><th className="m-num">{T ? 'QTY' : 'Shares'}</th><th>{T ? 'DATE' : 'Bought'}</th>
                  <th className="m-num">{T ? 'COST' : 'Cost'}</th><th className="m-num">{T ? 'LAST' : 'Price'}</th><th className="m-num">{T ? 'VALUE' : 'Value'}</th>
                  <th className="m-num">{T ? 'P/L%' : 'Gain'}</th><th>{L.sell}</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.lots.map((lot) => {
                  const r = val?.lots.find((x) => x.lot.id === lot.id);
                  return (
                    <tr key={lot.id}>
                      <td><button type="button" className="m-link" onClick={() => go({ name: 'company', ticker: lot.ticker })}>{T ? lot.ticker : lot.company}</button></td>
                      <td className="m-num">{lot.shares.toLocaleString()}</td>
                      <td>{era.formatShort(lot.purchaseDate)}</td>
                      <td className="m-num">{money(lot.costBasis)}</td>
                      <td className="m-num">{r ? money(r.price) : '…'}</td>
                      <td className="m-num">{r ? money(r.value) : '…'}</td>
                      <td className={`m-num ${r && r.returnPct >= 0 ? 'm-up' : 'm-down'}`}>{r ? pct(r.returnPct) : '…'}</td>
                      <td className="m-pf-sell">
                        <input aria-label={`Shares of ${lot.ticker} to sell`} inputMode="numeric" value={sellQty[lot.id] ?? String(lot.shares)}
                          onChange={(e) => setSellQty({ ...sellQty, [lot.id]: e.target.value.replace(/[^\d]/g, '') })} />
                        <button type="button" className="m-btn" onClick={async () => {
                          const err = await sell(lot.id, Number(sellQty[lot.id] ?? lot.shares));
                          setMsg(err ?? (T ? `SOLD ${lot.ticker}` : `Sold ${lot.ticker}.`));
                        }}>{L.sell}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>{T ? 'NO POSITIONS. SELECT A SECURITY TO BUY.' : 'You hold no securities yet. Choose a company below to make your first purchase.'}</Empty>
        )}
        {msg ? <p className="m-trade-msg is-ok" role="status">{msg}</p> : null}
      </Section>

      <Section title={L.companies} className="m-directory">
        <ul className="m-directory-list">
          {companies?.map((c) => (
            <li key={c.ticker}><button type="button" className="m-link" onClick={() => go({ name: 'company', ticker: c.ticker })}>{c.name}</button> <span className="m-directory-sym">{c.ticker}</span></li>
          ))}
          {companies && !companies.length ? <li>{T ? 'NO LISTINGS ON FILE' : 'No listed companies are on file for this date.'}</li> : null}
        </ul>
      </Section>

      {portfolio.activity.length ? (
        <Section title={T ? 'ACTIVITY' : 'Activity'} className="m-pf-activity">
          <ul className="m-plain">{portfolio.activity.slice(0, 12).map((a, i) => <li key={i}><span>{era.formatShort(a.date)}</span> {a.text}</li>)}</ul>
        </Section>
      ) : null}
    </div>
  );
}
