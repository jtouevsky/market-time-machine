import { useState } from 'react';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';

/** The 2023 "ask" bar. It runs a real search over what is knowable on the simulated day. */
export function AskBar() {
  const { go, date } = useSim();
  const era = useEra();
  const [q, setQ] = useState('');
  const suggestions = ['What moved the market today?', 'Biggest companies in the news', 'Interest rates'];
  return (
    <form className="rs-askbar" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go({ name: 'search', q: q.trim() }); }} role="search">
      <label htmlFor="rs-ask-input" className="rs-ask-label">Ask about {era.formatDate(date)}</label>
      <div className="rs-ask-row">
        <input id="rs-ask-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about companies, events or numbers as of this day…" autoComplete="off" />
        <button type="submit" className="m-btn m-btn-primary">Ask</button>
      </div>
      <div className="rs-ask-chips">
        {suggestions.map((s) => <button key={s} type="button" className="m-chip" onClick={() => go({ name: 'search', q: s.replace(/[?]/g, '') })}>{s}</button>)}
      </div>
    </form>
  );
}
