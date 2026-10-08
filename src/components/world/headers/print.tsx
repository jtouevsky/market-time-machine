import React from 'react';
import { dayNumber, yearOf } from '../../../core/dates';
import { useSim } from '../../../state/simulation';
import { useEra } from '../../../theme/EraThemeProvider';
import { SourcesLink } from '../../modules/Sources';
import { DefaultFooter } from '../shared';
import { NavItem, roman, scrollTo } from './common';

/** Masthead furniture for each pre-1950 paper: what stands in the "ears" and which ornament crowns the nameplate. */
type Furniture = { l?: React.ReactNode; r?: React.ReactNode; kind?: string; weekly?: boolean; folio?: boolean; strap?: string };
const FURNITURE: Record<string, Furniture> = {
  'newsbook-1600': { kind: 'woodcut', weekly: true, folio: false, strap: 'Imprinted at the Sign of the Quill' },
  'gazette-1700': { kind: 'arms', weekly: true, folio: false, strap: 'Published every Week, by the Printer' },
  'gazette-1750': { kind: 'rule', weekly: true, folio: false, l: <span className="h-cut h-cut-ship" aria-hidden />, r: <span className="h-cut h-cut-sun" aria-hidden />, strap: 'Printed at the Sign of the Press' },
  'mercantile-1800': { l: <>Prices Current<br />Shipping List<br />Marine Intelligence</>, r: <>Exchange Hours<br />Bank Notices<br />Foreign Advices</>, folio: false, strap: 'Counting-Room Edition' },
  'penny-1830': { l: <span className="h-cut h-cut-sun h-cut-big" aria-hidden />, r: 'price', strap: 'Cheap, Quick & Plain' },
  'victorian-1850': { l: <span className="h-cut h-cut-vign" aria-hidden />, r: <span className="h-cut h-cut-vign" aria-hidden />, kind: 'engraved', strap: 'Engraved & Printed Daily' },
  'industrial-1870': { l: <>Railways<br />Banks<br />Exchange</>, r: <>Latest<br />Quotations<br /><small>see the Tape</small></>, strap: 'Commercial & Financial' },
  'turn-1890': { l: <span className="h-burst" aria-hidden>Latest!</span>, r: <>Pictures<br />Sports<br />Markets</>, strap: 'Read It Here First' },
  'edwardian-1900': { l: <>Late<br />Edition</>, r: <>Stock<br />Prices</>, kind: 'fine' },
  'earlymod-1910': { l: <>Business<br />Day<br />Edition</>, r: <>Market<br />Closing<br />Prices</> },
  'wartime-1914': { l: <span className="h-stamp" aria-hidden>Dispatch<br />Sheet</span>, r: 'price', kind: 'sheet' },
  'postwar-1919': { l: <>Money &amp;<br />Markets</>, r: <>Exchange<br />Reports</> },
  'deco-1925': { l: <span className="h-deco-step" aria-hidden />, r: <span className="h-deco-step" aria-hidden />, kind: 'deco' },
  'depression-1930': { l: <>Home<br />Edition</>, r: <>Final<br />Markets</>, kind: 'stark' },
  'radio-1935': { l: <span className="h-lamp">ON THE AIR</span>, r: <>Bulletin<br />Hour</>, kind: 'radio' },
  'wire-1940': { kind: 'wire' },
};

export function PaperHeader() {
  const era = useEra();
  const { date, view, exit, portfolio, go } = useSim();
  const L = era.labels;
  const id = era.exp.id;
  const fx: Furniture = FURNITURE[id] ?? {};
  const isHome = view.name === 'home';
  const yr = yearOf(date);
  const founded = Math.min(Number(era.exp.opts?.founded) || (era.sub === 'colonial' ? 1704 : era.sub === 'antebellum' ? 1797 : yr - 4), yr);
  const age = Math.max(0, dayNumber(date) - dayNumber(`${founded}-09-18`));
  const vol = roman(Math.max(1, yr - founded + 1));
  const no = fx.weekly ? String(Math.floor(age / 7) + 1) : Math.max(1, age).toLocaleString('en-US');
  const sections: [string, () => void, boolean][] = [
    [era.id === 'archive' || fx.weekly ? 'Intelligence' : 'News', () => { go({ name: 'home' }); scrollTo('sec-news'); }, isHome],
    [era.id === 'archive' || fx.weekly ? 'Prices Current' : 'Financial', () => { go({ name: 'home' }); scrollTo('sec-markets'); }, false],
    ['Sporting', () => { go({ name: 'home' }); scrollTo('sec-sports'); }, false],
    [L.portfolio, () => go({ name: 'portfolio' }), view.name === 'portfolio'],
    [L.search, () => go({ name: 'search', q: '' }), view.name === 'search'],
  ];
  const ear = (side: 'l' | 'r', v: React.ReactNode) => {
    if (v === 'price') return <div className={`h-ear h-ear-price${side === 'r' ? ' h-ear-right' : ''}`}><b>{era.price}</b></div>;
    if (v) return <div className={`h-ear${side === 'r' ? ' h-ear-right' : ''}`}>{v}</div>;
    return <div className={`h-ear h-ear-void${side === 'r' ? ' h-ear-right' : ''}`} aria-hidden />;
  };
  const fallbackL = era.id === 'archive' ? <>THE<br />EVENING<br />EDITION</> : <>“Late City Edition”<br /><small>Closing Stock Prices</small></>;
  const fallbackR = era.id === 'archive' ? <>COMMERCIAL<br />AND<br />FINANCIAL</> : <>{portfolio.lots.length ? 'YOUR ACCOUNT IS OPEN' : 'MEMBERS N. Y. STOCK EXCH.'}<br /><small>Brokerage Department</small></>;
  const hasEars = !FURNITURE[id] || fx.l !== undefined || fx.r !== undefined;
  return (
    <header className={`h-paper${fx.kind ? ` hk-${fx.kind}` : ''}`} data-exp={id}>
      {fx.kind === 'woodcut' || fx.kind === 'arms' || fx.kind === 'rule' || fx.kind === 'engraved' ? <div className="h-ornament" aria-hidden /> : null}
      <div className={`h-ears${hasEars ? '' : ' no-ears'}`}>
        {hasEars ? ear('l', fx.l ?? (FURNITURE[id] ? undefined : fallbackL)) : null}
        <div className="h-masthead-wrap">
          <div className="h-masthead">{era.publication}</div>
          <div className="h-motto">{era.motto}</div>
        </div>
        {hasEars ? ear('r', fx.r ?? (FURNITURE[id] ? undefined : fallbackR)) : null}
      </div>
      {fx.strap ? <div className="h-strap">{fx.strap}</div> : null}
      <div className="h-dateline">
        <span className="h-vol">{fx.weekly ? <>Numb. {no}</> : <>VOL. {vol}…No. {no}</>}</span>
        <span className="h-date">{id === 'wire-1940' ? era.formatDate(date).toUpperCase() : <>NEW-YORK, {era.formatDate(date)}</>}</span>
        <span className="h-price">{era.price ? <>PRICE {era.price}</> : <>MEMBERS ONLY</>}</span>
      </div>
      <nav className={`h-nav h-sections${fx.folio === false ? ' no-folio' : ''}`} aria-label="Sections">
        <span className="h-index-label" aria-hidden>{fx.folio === false ? '☞' : 'Index'}</span>
        {sections.map(([label, fn, active], i) => (
          <React.Fragment key={label}>
            {i ? <span className="h-sec-dot" aria-hidden>·</span> : null}
            <button type="button" className={`h-nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={fn}>{label}</button>
          </React.Fragment>
        ))}
        <span className="h-nav-sep" />{<button type="button" className="h-exit" onClick={exit}>{L.exit}</button>}
      </nav>
    </header>
  );
}

/** Imprint at the foot of the last column — every printer was obliged to say who made the paper. */
const IMPRINT: Record<string, string> = {
  'newsbook-1600': 'Imprinted at the Sign of the Quill, for the use of Merchants and others.',
  'gazette-1700': 'Printed by the Printer hereof, at the Sign of the Press; where Advertisements are taken in.',
  'gazette-1750': 'Printed for the Proprietors, and sold at the Printing-Office; Notices inserted at moderate rates.',
  'mercantile-1800': 'Printed at the Counting-Room, for the Proprietors. Prices Current corrected to the hour of going to press.',
  'penny-1830': 'Printed and published daily at the office of the proprietors. Single copies sold by the street-boys.',
  'victorian-1850': 'Engraved and printed at the Illustrated Courier press; published every morning.',
  'industrial-1870': 'Published daily, Sundays excepted, at the Chronicle counting-room. Quotations by the Exchange.',
  'turn-1890': 'Printed by the steam presses of the proprietors. Extras issued whenever the news is hot.',
  'edwardian-1900': 'Printed and published daily by the proprietors. Entered as a newspaper; all rights reserved.',
  'earlymod-1910': 'Printed by rotary press at the Tribune building. Late editions go to press at the closing bell.',
  'wartime-1914': 'Dispatches set as received. Matter of doubtful accuracy is marked; corrections follow.',
  'postwar-1919': 'Printed and published by the proprietors. Market reports prepared at the close of the exchanges.',
  'deco-1925': 'Set in the composing-room of the Evening Ticker; printed nightly on the high-speed presses.',
  'depression-1930': 'Published every evening. The paper is delivered to your door or sold on the corner.',
  'radio-1935': 'Compiled from the bulletins of the air. Listings subject to change at the last minute.',
  'wire-1940': 'END OF TRANSMISSION. SERVICE OPERATES DAY AND NIGHT.',
  'postwar-1946': 'Printed in two colours at the Daily Courier plant. Photographs by the staff.',
};

export function PrintFooter({ onSources }: { onSources: () => void }) {
  const era = useEra();
  const { date } = useSim();
  const line = IMPRINT[era.exp.id];
  if (!line) return <DefaultFooter onSources={onSources} />;
  const src = <SourcesLink onOpen={onSources} />;
  return (
    <footer className="w-foot w-foot-print">
      <div className="fp-orn" aria-hidden>❦</div>
      <p className="fp-imprint">{line}</p>
      <p className="fp-fine">{era.publication} · {era.formatDate(date)} · Quotations furnished for information only. {src}</p>
    </footer>
  );
}

export function MidHeader() {
  const era = useEra();
  const { date, view, exit } = useSim();
  const L = era.labels;
  const isHome = view.name === 'home';
  const exitBtn = <button type="button" className="h-exit" onClick={exit}>{L.exit}</button>;
      return (
        <header className="h-mid">
          <div className="h-mid-top">
            <div className="h-mid-brand"><span className="h-mid-star" aria-hidden /><span className="h-mid-logo">{era.publication}</span><span className="h-mid-ed">{era.motto}</span></div>
            {era.id === 'swiss' ? <div className="h-mid-num" aria-hidden>{Number(date.slice(8, 10))}</div> : null}
            <div className="h-mid-date">{era.formatDate(date)}<small>Price {era.price}</small></div>
          </div>
          <nav className="h-nav" aria-label="Sections">
            <NavItem to={{ name: 'home' }} label="Front Page" active={isHome} />
            <NavItem to={{ name: 'portfolio' }} label={L.portfolio} active={view.name === 'portfolio'} />
            <NavItem to={{ name: 'search', q: '' }} label={L.search} active={view.name === 'search'} />
            <span className="h-nav-sep" />{exitBtn}
          </nav>
        </header>
      );
}

