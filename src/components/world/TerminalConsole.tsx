import { useEffect, useRef, useState } from 'react';
import { addDays, addMonths, addYears } from '../../core/dates';
import { isParseError, parseDateInput } from '../../core/dateParser';
import { useSim } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';

const HELP = [
  'COMMANDS',
  '  NEWS, MARKETS, COMPANIES, SPORTS, PORTFOLIO      SWITCH SCREENS',
  '  <TICKER>            e.g. IBM — SECURITY DESCRIPTION & GRAPH',
  '  FIND <WORDS>        SEARCH THE WIRE AND SECURITY FILES',
  '  BUY <TICKER> <QTY>  PLACE A MARKET ORDER',
  '  +1D +1W +1M +1Y     ADVANCE THE CALENDAR',
  '  GO <DATE>           ADVANCE TO A LATER DATE, e.g. GO 12/31/89',
  '  SOURCES             DATA SOURCES FOR THIS SCREEN',
  '  LOGOFF              LEAVE THE TERMINAL',
];

const scrollTo = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

/**
 * The 1980s interface: a real command line plus function keys. Underneath it calls the same
 * routing, search and trading functions as every other era.
 */
export function TerminalConsole({ onSources }: { onSources: () => void }) {
  const era = useEra();
  const { go, date, provider, buy, advanceTo, exit, pending } = useSim();
  const [cmd, setCmd] = useState('');
  const [out, setOut] = useState<string[]>(['TYPE HELP FOR A LIST OF COMMANDS']);
  const input = useRef<HTMLInputElement>(null);

  const say = (...lines: string[]) => setOut(lines);

  const run = async (raw: string) => {
    const c = raw.trim().toUpperCase();
    if (!c) return;
    const [verb, ...rest] = c.split(/\s+/);
    switch (verb) {
      case 'HELP': case '?': return say(...HELP);
      case 'NEWS': case 'N': go({ name: 'home' }); scrollTo('sec-news'); return say('NEWS WIRE');
      case 'MARKETS': case 'MKTS': case 'W': go({ name: 'home' }); scrollTo('sec-markets'); return say('WORLD MARKETS');
      case 'SPORTS': go({ name: 'home' }); scrollTo('sec-sports'); return say('SPORTS WIRE');
      case 'COMPANIES': case 'CO': go({ name: 'search', q: '' }); return say('SECURITY LIST');
      case 'PORTFOLIO': case 'PORT': go({ name: 'portfolio' }); return say('ACCOUNT POSITIONS');
      case 'SOURCES': case 'S': onSources(); return say('SOURCES');
      case 'LOGOFF': case 'EXIT': case 'QUIT': return exit();
      case 'FIND': case 'SRCH': case 'SEARCH':
        if (!rest.length) return say('USAGE: FIND <WORDS>');
        go({ name: 'search', q: rest.join(' ').toLowerCase() }); return say(`SEARCHING: ${rest.join(' ')}`);
      case '+1D': return void advanceTo(addDays(date, 1));
      case '+1W': return void advanceTo(addDays(date, 7));
      case '+1M': return void advanceTo(addMonths(date, 1));
      case '+1Y': return void advanceTo(addYears(date, 1));
      case 'GO': {
        const r = parseDateInput(rest.join(' '), provider.horizon);
        if (isParseError(r)) return say(`INVALID DATE: ${rest.join(' ')}`);
        if (r.date <= date) return say('CANNOT GO BACKWARD. LOGOFF TO RETURN TO THE PORTAL.');
        return void advanceTo(r.date);
      }
      case 'BUY': {
        const [sym, qty] = rest;
        const co = (await provider.listCompanies(date)).find((x) => (x.symbol ?? x.ticker).toUpperCase() === sym || x.ticker === sym);
        if (!co) return say(`UNKNOWN SECURITY: ${sym ?? ''}`);
        const err = await buy(co.ticker, Number(qty));
        return say(err ? err.toUpperCase() : `ORDER FILLED: BOT ${qty} ${sym}`);
      }
      default: {
        const co = (await provider.listCompanies(date)).find((x) => (x.symbol ?? x.ticker).toUpperCase() === verb || x.ticker === verb);
        if (co) { go({ name: 'company', ticker: co.ticker }); return say(`${verb} <EQUITY> DES`); }
        return say(`UNKNOWN COMMAND OR SECURITY: ${verb}. TYPE HELP.`);
      }
    }
  };

  useEffect(() => {
    const keys: Record<string, string> = { F1: 'MARKETS', F2: 'NEWS', F3: 'COMPANIES', F4: 'SPORTS', F5: 'PORTFOLIO', F6: '+1D', F7: '+1W', F8: '+1M', F9: '+1Y', F10: 'SOURCES' };
    const k = (e: KeyboardEvent) => {
      const c = keys[e.key];
      if (c) { e.preventDefault(); run(c); }
      else if (e.key === '/' && document.activeElement !== input.current) { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const fkeys: [string, string, string][] = [['F1', 'MKTS', 'MARKETS'], ['F2', 'NEWS', 'NEWS'], ['F3', 'CO', 'COMPANIES'], ['F4', 'SPORT', 'SPORTS'], ['F5', 'PORT', 'PORTFOLIO'],
    ['F6', '+1D', '+1D'], ['F7', '+1W', '+1W'], ['F8', '+1M', '+1M'], ['F9', '+1Y', '+1Y'], ['F10', 'SRC', 'SOURCES']];

  return (
    <div className={`term-console${pending ? ' is-pending' : ''}`}>
      <div className="term-out" aria-live="polite">{out.map((l, i) => <div key={i}>{l}</div>)}</div>
      <form className="term-cmd" onSubmit={(e) => { e.preventDefault(); run(cmd); setCmd(''); }}>
        <label htmlFor="term-input">{era.labels.search}&gt;</label>
        <input id="term-input" ref={input} value={cmd} onChange={(e) => setCmd(e.target.value)} autoComplete="off" spellCheck={false} placeholder="TYPE A COMMAND OR TICKER, THEN <GO>" />
        <button type="submit" className="term-go">&lt;GO&gt;</button>
      </form>
      <div className="term-fkeys" role="toolbar" aria-label="Function keys">
        {fkeys.map(([f, label, c]) => (
          <button key={f} type="button" onClick={() => run(c)} disabled={pending && c.startsWith('+')}><span className="m-fkey">{f}</span>{label}</button>
        ))}
        <button type="button" onClick={() => run('LOGOFF')}><span className="m-fkey">ESC</span>LOGOFF</button>
      </div>
    </div>
  );
}
