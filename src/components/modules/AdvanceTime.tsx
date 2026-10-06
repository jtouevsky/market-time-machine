import { useState } from 'react';
import { addDays, addMonths, addYears, type ISODate } from '../../core/dates';
import { useSim } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';

/** The persistent "advance time" control. Always forward; the portal is for going back. */
export function AdvanceTime({ placement = 'bar' }: { placement?: 'bar' | 'inline' }) {
  const era = useEra();
  const { date, advanceTo, pending, provider } = useSim();
  const [custom, setCustom] = useState(false);
  const [target, setTarget] = useState<ISODate>(addMonths(date, 6));
  const L = era.labels;
  const steps: ((d: ISODate) => ISODate)[] = [(d) => addDays(d, 1), (d) => addDays(d, 7), (d) => addMonths(d, 1), (d) => addYears(d, 1)];
  const atHorizon = date >= provider.horizon;
  const T = era.module === 'terminal';

  const customForm = (
    <form className="m-adv-custom" onSubmit={(e) => { e.preventDefault(); if (target > date) { advanceTo(target); setCustom(false); } }}>
      <label htmlFor="adv-date">{T ? 'GO TO' : era.module === 'print' ? 'Edition of' : 'Go to'}</label>
      <input id="adv-date" type="date" min={addDays(date, 1)} max={provider.horizon} value={target} onChange={(e) => setTarget(e.target.value)} />
      <button type="submit" className="m-btn m-btn-primary" disabled={pending || !(target > date)}>{T ? '<GO>' : 'Go'}</button>
      <button type="button" className="m-btn" onClick={() => setCustom(false)}>{T ? 'CANCEL' : 'Cancel'}</button>
    </form>
  );

  if (era.id === 'portal') {
    // A 1999 site would have offered a dropdown and a Go button.
    return (
      <div className={`m-adv m-adv-${placement}`}>
        <form className="m-adv-portal" onSubmit={(e) => {
          e.preventDefault();
          const v = (e.currentTarget.elements.namedItem('step') as HTMLSelectElement).value;
          if (v === 'custom') setCustom(true); else advanceTo(steps[Number(v)](date));
        }}>
          <label htmlFor="adv-step"><b>{L.advance}:</b></label>
          <select id="adv-step" name="step" defaultValue="2" disabled={atHorizon}>
            {L.advanceOptions.slice(0, 4).map((o, i) => <option key={o} value={i}>{o}</option>)}
            <option value="custom">{L.advanceOptions[4]}</option>
          </select>
          <button type="submit" className="m-btn" disabled={pending || atHorizon}>Go</button>
        </form>
        {custom ? customForm : null}
      </div>
    );
  }

  return (
    <div className={`m-adv m-adv-${placement}${pending ? ' is-pending' : ''}`}>
      <span className="m-adv-label">{L.advance}</span>
      <div className="m-adv-buttons" role="group" aria-label={L.advance}>
        {steps.map((s, i) => (
          <button key={i} type="button" className="m-btn m-adv-btn" disabled={pending || atHorizon} onClick={() => advanceTo(s(date))}>
            {T ? <><span className="m-fkey">F{i + 5}</span>{L.advanceOptions[i]}</> : L.advanceOptions[i]}
          </button>
        ))}
        <button type="button" className="m-btn m-adv-btn" disabled={pending || atHorizon} onClick={() => { setTarget(addMonths(date, 6) > provider.horizon ? provider.horizon : addMonths(date, 6)); setCustom((c) => !c); }}>
          {T ? <><span className="m-fkey">F9</span>{L.advanceOptions[4]}</> : L.advanceOptions[4]}
        </button>
      </div>
      {custom ? customForm : null}
      {atHorizon ? <span className="m-adv-note">{T ? 'END OF RECORDS' : 'You have reached the end of the archive.'}</span> : null}
    </div>
  );
}
