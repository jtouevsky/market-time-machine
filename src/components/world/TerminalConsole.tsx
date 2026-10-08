import { useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '../../state/page';
import { addDays, addMonths, addYears } from '../../core/dates';
import { isParseError, parseDateInput } from '../../core/dateParser';
import { useSim } from '../../state/simulation';
import { useEra } from '../../theme/EraThemeProvider';
import type { NewsItem } from '../../core/types';

const HELP = [
  'COMMANDS',
  '  NEWS, MARKETS, COMPANIES, SPORTS, PORTFOLIO      SWITCH SCREENS',
  '  <TICKER>            e.g. IBM — SECURITY DESCRIPTION & GRAPH',
  '  FIND <WORDS>        SEARCH THE WIRE AND SECURITY FILES',
  '  BUY <TICKER> <QTY>  PLACE A MARKET ORDER',
  '  +1D +1W +1M +1Y     ADVANCE THE CALENDAR',
  '  GO <DATE>           ADVANCE TO A LATER DATE, e.g. GO 12/31/89',
  '  SOURCES             DATA SOURCES FOR THIS SCREEN',
  '  CRT                 TOGGLE SCREEN CURVATURE / SCANLINES / GLOW',
  '  HIST                SHOW COMMAND HISTORY (UP/DOWN ARROWS RECALL)',
  '  TAB                 COMPLETE A COMMAND OR TICKER (TAB TWICE LISTS CHOICES)',
  '  HELP <COMMAND>      ONE-LINE HELP, e.g. HELP BUY',
  '  F1-F4               SWITCH SCREENS (WHERE THE SYSTEM HAS THEM)',
  '  LOGOFF              LEAVE THE TERMINAL',
];

const COMMANDS = ['HELP', 'NEWS', 'MARKETS', 'COMPANIES', 'SPORTS', 'PORTFOLIO', 'FIND', 'BUY', 'GO', 'SOURCES', 'CRT', 'HIST', 'LOGOFF', '+1D', '+1W', '+1M', '+1Y'];
const NEEDS_ARG = new Set(['FIND', 'BUY', 'GO']);
const ONE_LINERS: Record<string, string> = {
  BUY: 'BUY <TICKER> <QTY>  — MARKET ORDER AT TODAY\'S CLOSE. EXAMPLE: BUY IBM 10',
  FIND: 'FIND <WORDS>  — SEARCH THE WIRE AND THE SECURITY FILES',
  GO: 'GO <DATE>  — ADVANCE THE CALENDAR TO A LATER DATE',
  CRT: 'CRT  — TOGGLE GLOW, SCAN LINES AND SCREEN CURVATURE',
  HIST: 'HIST  — LIST THE LAST EIGHT COMMANDS; UP/DOWN RECALLS THEM',
  NEWS: 'NEWS  — JUMP TO THE NEWS WIRE', MARKETS: 'MARKETS  — JUMP TO WORLD MARKETS', PORTFOLIO: 'PORTFOLIO  — YOUR POSITIONS AND CASH',
};
const BELL_RE = /^(UNKNOWN|INVALID|CANNOT|USAGE|INSUFFICIENT|ENTER A WHOLE|NO QUOTATION|POSITION|THIS SECURITY)/;

interface Ticket { sym: string; name: string; qty: number; price: number; total: number; cash: number }

const scrollTo = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

/**
 * The 1980s interface: a real command line plus function keys. Underneath it calls the same
 * routing, search and trading functions as every other era.
 */
export function TerminalConsole({ onSources, news = [] }: { onSources: () => void; news?: NewsItem[] }) {
  const era = useEra();
  const { go, date, provider, buy, advanceTo, exit, pending, portfolio } = useSim();
  const [cmd, setCmd] = useState('');
  const [out, setOut] = useState<string[]>(['TYPE HELP FOR A LIST OF COMMANDS']);
  const input = useRef<HTMLInputElement>(null);
  const { setPage } = usePage();
  const pages = era.exp.composition?.pages;
  const pageNo = usePage().page + 1;
  const history = useRef<string[]>([]);
  const cursor = useRef(0);
  const [crt, setCrt] = useState(() => { try { return localStorage.getItem('mtm-crt') !== 'off'; } catch { return true; } });
  useEffect(() => {
    document.body.classList.toggle('no-crt', !crt);
    try { localStorage.setItem('mtm-crt', crt ? 'on' : 'off'); } catch { /* preference simply isn't remembered */ }
    return () => document.body.classList.remove('no-crt');
  }, [crt]);

  const [gen, setGen] = useState(0);
  const [bell, setBell] = useState(0);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [pos, setPos] = useState(0);
  const [focused, setFocused] = useState(false);
  const [syms, setSyms] = useState<{ ticker: string; sym: string; name: string }[]>([]);
  const awaiting = useRef<{ sym: string; qty: number; name: string } | null>(null);
  const lastTab = useRef('');
  const crtLabel = crt ? 'ON' : 'OFF';

  useEffect(() => {
    let live = true;
    provider.listCompanies(date).then((l) => { if (live) setSyms(l.map((c) => ({ ticker: c.ticker, sym: (c.symbol ?? c.ticker).toUpperCase(), name: c.name }))); }).catch(() => undefined);
    return () => { live = false; };
  }, [provider, date]);

  /** On paged compositions, jump to the screen that carries a module (news, markets, sports); otherwise scroll the home page. */
  const toScreen = (m: string, anchor: string) => {
    go({ name: 'home' });
    const i = pages ? pages.findIndex((pg) => Object.values(pg.comp.regions).some((sl) => sl.some((x) => x.m === m))) : -1;
    if (i >= 0) setPage(i); else scrollTo(anchor);
  };
  const say = (...lines: string[]) => { setTicket(null); setOut(lines); setGen((g) => g + 1); if (BELL_RE.test(lines[0] ?? '')) setBell((b) => b + 1); };

  const fill = portfolio.activity[0]?.text;
  useEffect(() => {
    const w = awaiting.current;
    const m = fill ? /^Bought (\d+) (\S+) at ([\d.]+)/.exec(fill) : null;
    if (!w || !m) return;
    awaiting.current = null;
    const price = Number(m[3]);
    setTicket({ sym: w.sym, name: w.name, qty: w.qty, price, total: price * w.qty, cash: portfolio.cash });
    setOut(['ORDER ROUTED TO THE FLOOR']); setGen((g) => g + 1);
  }, [fill, portfolio.cash, portfolio.activity.length]);

  const complete = () => {
    const raw = cmd.toUpperCase();
    const parts = raw.split(/\s+/);
    const last = parts[parts.length - 1];
    const first = parts.length === 1;
    const pool = first ? [...COMMANDS, ...syms.map((c) => c.sym)] : parts[0] === 'BUY' && parts.length === 2 ? syms.map((c) => c.sym) : [];
    const hits = Array.from(new Set(pool.filter((x) => x.startsWith(last))));
    if (!hits.length || !last && first) { say('NO COMPLETIONS'); return; }
    let common = hits[0];
    for (const h of hits) while (!h.startsWith(common)) common = common.slice(0, -1);
    const next = [...parts.slice(0, -1), hits.length === 1 && NEEDS_ARG.has(hits[0]) && first ? hits[0] + ' ' : common].join(' ');
    const replaced = hits.length === 1 && !(NEEDS_ARG.has(hits[0]) && first) ? next + (first ? '' : ' ') : next;
    if (hits.length > 1 && replaced.trim() === raw.trim() && lastTab.current === raw) { setOut([`CHOICES: ${hits.slice(0, 24).join('  ')}${hits.length > 24 ? ' …' : ''}`]); setGen((g) => g + 1); }
    lastTab.current = raw;
    setCmd(replaced); setPos(replaced.length);
  };

  const run = async (raw: string) => {
    const c = raw.trim().toUpperCase();
    if (!c) return;
    const [verb, ...rest] = c.split(/\s+/);
    if (history.current[history.current.length - 1] !== c) history.current.push(c);
    cursor.current = history.current.length;
    switch (verb) {
      case 'HELP': case '?':
        if (rest[0] && ONE_LINERS[rest[0]]) return say(ONE_LINERS[rest[0]]);
        return say(...HELP);
      case 'CRT': setCrt((v) => !v); return say(crt ? 'CRT EFFECTS OFF' : 'CRT EFFECTS ON');
      case 'HIST': return say('COMMAND HISTORY', ...(history.current.length ? history.current.slice(-8).map((h, i) => `  ${i + 1}. ${h}`) : ['  (EMPTY)']));
      case 'NEWS': case 'N': toScreen('news', 'sec-news'); return say('NEWS WIRE');
      case 'MARKETS': case 'MKTS': case 'W': toScreen('markets', 'sec-markets'); return say('WORLD MARKETS');
      case 'SPORTS': toScreen('sports', 'sec-sports'); return say('SPORTS WIRE');
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
        if (!sym) return say('USAGE: BUY <TICKER> <QTY>');
        if (!co) return say(`UNKNOWN SECURITY: ${sym ?? ''}`);
        awaiting.current = { sym, qty: Number(qty), name: co.name };
        const err = await buy(co.ticker, Number(qty));
        if (err) awaiting.current = null;
        return err ? say(err.toUpperCase()) : undefined;
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
      const screen = /^F([1-4])$/.exec(e.key);
      if (screen && pages && Number(screen[1]) <= pages.length) { e.preventDefault(); setPage(Number(screen[1]) - 1); go({ name: 'home' }); say(`SCREEN ${e.key}: ${pages[Number(screen[1]) - 1].label}`); return; }
      const c = keys[e.key];
      if (c) { e.preventDefault(); run(c); }
      else if (e.key === '/' && document.activeElement !== input.current) { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const fkeys: [string, string, string][] = [['F1', 'MKTS', 'MARKETS'], ['F2', 'NEWS', 'NEWS'], ['F3', 'CO', 'COMPANIES'], ['F4', 'SPORT', 'SPORTS'], ['F5', 'PORT', 'PORTFOLIO'],
    ['F6', '+1D', '+1D'], ['F7', '+1W', '+1W'], ['F8', '+1M', '+1M'], ['F9', '+1Y', '+1Y'], ['F10', 'SRC', 'SOURCES']];
  const prompt = era.exp.archetype === 'dos' ? 'C:\\MTM>' : `${era.labels.search}>`;
  const tape = useMemo(() => news.filter((n) => n.title).slice(0, 14).map((n) => n.title.toUpperCase()), [news]);
  const sync = (el: HTMLInputElement) => setPos(el.selectionStart ?? el.value.length);
  const sub = era.sub;

  return (
    <div className={`term-console tc-${era.exp.archetype}${pending ? ' is-pending' : ''}`} data-sub={sub}>
      {bell ? <div key={bell} className="term-bell" aria-hidden /> : null}
      {era.exp.archetype === 'workstation' && tape.length ? (
        <div className="term-tape" role="marquee" aria-label="News tape" tabIndex={0}>
          <span className="term-tape-tag">WIRE</span>
          <div className="term-tape-run"><div className="term-tape-track">
            {[0, 1].map((k) => <span key={k} aria-hidden={k === 1}>{tape.map((t, i) => <span key={i} className="term-tape-item"><b>{String(i + 1).padStart(2, '0')}</b> {t}</span>)}</span>)}
          </div></div>
        </div>
      ) : null}
      <div className="term-out" aria-live="polite" key={gen}>
        {out.map((l, i) => <div key={i} style={{ ['--i' as string]: i }} className={BELL_RE.test(l) ? 'is-err' : undefined}>{BELL_RE.test(l) ? <span className="term-bel" title="Bell">^G </span> : null}{l}</div>)}
        {ticket ? (
          <div className="term-ticket" role="group" aria-label="Order ticket">
            <div className="term-ticket-head"><span>ORDER TICKET</span><span>FILLED</span></div>
            <dl>
              <div><dt>SIDE</dt><dd>BUY</dd></div>
              <div><dt>SECURITY</dt><dd>{ticket.sym}</dd></div>
              <div><dt>NAME</dt><dd>{ticket.name.toUpperCase()}</dd></div>
              <div><dt>QTY</dt><dd>{ticket.qty.toLocaleString()}</dd></div>
              <div><dt>PRICE</dt><dd>{ticket.price.toFixed(2)}</dd></div>
              <div className="is-total"><dt>TOTAL</dt><dd>${ticket.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd></div>
              <div><dt>CASH LEFT</dt><dd>${Math.round(ticket.cash).toLocaleString()}</dd></div>
            </dl>
          </div>
        ) : null}
      </div>
      <form className="term-cmd" onSubmit={(e) => { e.preventDefault(); run(cmd); setCmd(''); setPos(0); }}>
        <label htmlFor="term-input">{prompt}</label>
        <span className={`term-field${focused ? ' is-focus' : ''}`} style={{ ['--pos' as string]: pos }}>
          <input id="term-input" ref={input} value={cmd} onChange={(e) => { setCmd(e.target.value); sync(e.target); }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyUp={(e) => sync(e.currentTarget)} onClick={(e) => sync(e.currentTarget)} onSelect={(e) => sync(e.currentTarget)}
            onKeyDown={(e) => {
              const h = history.current;
              if (e.key === 'Tab' && cmd.trim() && !e.shiftKey) { e.preventDefault(); complete(); }
              else if (e.key === 'ArrowUp' && h.length) { e.preventDefault(); cursor.current = Math.max(0, cursor.current - 1); const v = h[cursor.current] ?? ''; setCmd(v); setPos(v.length); }
              else if (e.key === 'ArrowDown' && h.length) { e.preventDefault(); cursor.current = Math.min(h.length, cursor.current + 1); const v = h[cursor.current] ?? ''; setCmd(v); setPos(v.length); }
            }} autoComplete="off" spellCheck={false} placeholder="TYPE A COMMAND OR TICKER, THEN <GO>" />
          <span className="term-caret" aria-hidden />
        </span>
        <button type="submit" className="term-go">&lt;GO&gt;</button>
      </form>
      <div className="term-fkeys" role="toolbar" aria-label="Function keys">
        {fkeys.map(([f, label, c], i) => {
          const scr = pages && i < Math.min(4, pages.length) ? pages[i] : null;
          return <button key={f} type="button" onClick={() => (scr ? (setPage(i), go({ name: 'home' })) : run(c))} disabled={!scr && pending && c.startsWith('+')}><span className="m-fkey">{f}</span>{scr ? scr.label : label}</button>;
        })}
        <button type="button" aria-pressed={crt} onClick={() => setCrt((v) => !v)}><span className="m-fkey">CRT</span>{crtLabel}</button>
        <button type="button" onClick={() => run('LOGOFF')}><span className="m-fkey">ESC</span>LOGOFF</button>
      </div>
      {era.exp.archetype === 'workstation' || sub === 'amber-1983' ? (
        <div className="term-statusbar" role="status">
          <span className="ts-cell"><i className={`ts-led${pending ? ' is-busy' : ''}`} aria-hidden /> {pending ? 'WORKING' : 'LINK OK'}</span>
          <span className="ts-cell">SCR {String((pages ? (pageNo) : 1)).padStart(2, '0')}</span>
          <span className="ts-cell">HIST {String(history.current.length).padStart(2, '0')}</span>
          <span className="ts-cell">TAB=COMPLETE</span>
          <span className="ts-cell ts-fill">CASH ${Math.round(portfolio.cash).toLocaleString()}</span>
          <span className="ts-cell">CRT {crtLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
