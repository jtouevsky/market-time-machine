import { usePage } from '../../../state/page';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { NavItem } from './common';

/** DOS-style menu bar: the digit (or letter) is the real shortcut, highlighted like a hot-key. */
function DosMenuBar() {
  const era = useEra();
  const { go, view } = useSim();
  const { page, setPage } = usePage();
  const pages = era.exp.composition?.pages ?? [];
  const home = view.name === 'home';
  const short = (l: string) => l.replace(/^(HEADLINE|MARKET|ECONOMIC|SPORTS)\b.*/i, (_m, w: string) => w[0] + w.slice(1).toLowerCase()).replace(/^MAIN MENU$/i, 'Menu');
  const pick = (i: number) => { setPage(i); if (!home) go({ name: 'home' }); };
  return (
    <nav className="h-dos-bar" aria-label="Menu bar">
      {pages.map((p, i) => (
        <button key={p.key} type="button" className={`h-dos-item${home && i === page ? ' is-on' : ''}`} aria-current={home && i === page ? 'page' : undefined} onClick={() => pick(i)}>
          <kbd>{i}</kbd>{short(p.label)}
        </button>
      ))}
      <span className="h-dos-sep" aria-hidden>│</span>
      <button type="button" className={`h-dos-item${view.name === 'portfolio' ? ' is-on' : ''}`} onClick={() => go({ name: 'portfolio' })}><kbd className="is-letter">P</kbd>ortfolio</button>
      <button type="button" className={`h-dos-item${view.name === 'search' ? ' is-on' : ''}`} onClick={() => go({ name: 'search', q: '' })}><kbd className="is-letter">F</kbd>ind</button>
      <span className="h-dos-fill" />
      <span className="h-dos-hint">Esc=Menu</span>
    </nav>
  );
}

export function TerminalHeader() {
  const era = useEra();
  const { date, view, portfolio } = useSim();
  const { page } = usePage();
  const isHome = view.name === 'home';
  const arch = era.exp.archetype;
  const pages = era.exp.composition?.pages ?? [];
  const screen = pages[Math.min(page, Math.max(0, pages.length - 1))];
  const cash = `$${Math.round(portfolio.cash).toLocaleString()}`;
  const where = isHome ? (screen?.label ?? 'MAIN') : view.name === 'company' ? `SECURITY ${view.ticker}` : view.name === 'portfolio' ? 'ACCOUNT' : 'SECURITY LIST';

  if (arch === 'dos') {
    return (
      <header className="h-term h-dos">
        <div className="h-term-status">
          <span>{era.publication} {era.motto}</span>
          <span className="h-term-date">{era.formatDate(date)} 16:30 ET</span>
          <span className="h-term-user">USER MTM01 · CASH {cash}</span>
        </div>
        <DosMenuBar />
      </header>
    );
  }
  return (
    <header className={`h-term${era.sub === 'amber-1983' ? ' h-amber' : ''}${arch === 'workstation' ? ' h-ws' : ''}`}>
      <div className="h-term-status">
        <span>{era.publication} {era.motto}</span>
        <span className="h-term-date">{era.formatDate(date)} 16:30 ET</span>
        <span className="h-term-user">USER MTM01 · CASH {cash}</span>
      </div>
      <nav className="h-term-menu" aria-label="Menu">
        <NavItem to={{ name: 'home' }} label="1 MAIN" active={isHome} />
        <NavItem to={{ name: 'portfolio' }} label="2 PORT" active={view.name === 'portfolio'} />
        <NavItem to={{ name: 'search', q: '' }} label="3 SECURITY LIST" active={view.name === 'search'} />
        <span className="h-nav-sep" />
        <span className="h-term-hint">TYPE HELP &lt;GO&gt; FOR COMMANDS</span>
      </nav>
      {era.sub === 'amber-1983' ? (
        <div className="h-fields" aria-label="Screen fields">
          <span className="h-field"><i>SCREEN</i><b>{where}</b></span>
          <span className="h-field"><i>FUNC</i><b>{isHome && screen ? screen.key : '--'}</b></span>
          <span className="h-field"><i>MKT</i><b>CLOSED</b></span>
          <span className="h-field"><i>PAGE</i><b>{isHome && pages.length ? `${page + 1}/${pages.length}` : '1/1'}</b></span>
          <span className="h-field h-field-wide"><i>ENTER=SELECT</i><i>F1-F4=SCREEN</i><i>F5=PORT</i><i>ESC=LOGOFF</i></span>
        </div>
      ) : null}
      {era.sub === 'green-1980' ? (
        <div className="h-ready" aria-hidden><span>LOGON ACCEPTED</span><span>LINE 1200 BAUD</span><span className="h-ready-cur">READY</span></div>
      ) : null}
    </header>
  );
}
