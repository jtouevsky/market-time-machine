import { useId, useState } from 'react';
import { useSim, type View } from '../../../state/simulation';
import { useHistorical } from '../../../state/useHistorical';

function hashDate(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** A decorative counter: the number is derived from the simulated date, not from real traffic. */
export function VisitorCounter() {
  const { date } = useSim();
  const n = 1200 + (hashDate(date) % 98000);
  const digits = String(n).padStart(6, '0').split('');
  return (
    <div className="ew-counter">
      <span className="ew-counter-label" id="ew-counter-label">You are visitor number</span>
      <span className="ew-counter-digits" role="img" aria-labelledby="ew-counter-label" aria-describedby="ew-counter-note" title={String(n)}>
        {digits.map((d, i) => <b key={i}>{d}</b>)}
      </span>
      <small id="ew-counter-note">decorative counter, not real traffic</small>
    </div>
  );
}

export function ConstructionBanner() {
  return (
    <div className="ew-construct" role="note">
      <span className="ew-construct-sign" aria-hidden="true"><i /></span>
      <span className="ew-construct-text">UNDER CONSTRUCTION &mdash; pardon my dust!</span>
      <span className="ew-construct-sign" aria-hidden="true"><i /></span>
    </div>
  );
}

/** A scrolling welcome line. Stays still (and fully readable) for reduced-motion users. */
export function PersonalMarquee() {
  const { date } = useSim();
  const text = `Welcome to my corner of the web!  Best viewed in any browser at 800x600.  Please sign the guestbook!  Page updated ${date}.`;
  return (
    <div className="ew-marquee" role="note" aria-label={text}>
      <span className="ew-marquee-run" aria-hidden="true">{text}&nbsp;&nbsp;&bull;&nbsp;&nbsp;{text}</span>
      <span className="ew-marquee-still">{text}</span>
    </div>
  );
}

/** Original, made-up "awards" in the spirit of 1990s personal pages. */
export function AwardBadges() {
  const badges = [
    { t: 'Cool Page', s: 'of the Week', c: 'a' },
    { t: 'Money Smart', s: 'Site Award', c: 'b' },
    { t: 'Top 5%', s: 'Finance Pages', c: 'c' },
    { t: 'Netizen', s: 'Approved', c: 'd' },
  ];
  return (
    <ul className="ew-awards" aria-label="Awards (made up for this simulation)">
      {badges.map((b) => <li key={b.t} className={`ew-award is-${b.c}`}><b>{b.t}</b><span>{b.s}</span></li>)}
    </ul>
  );
}

const sameView = (a: View, b: View) => a.name === b.name && (a.name !== 'company' || (b.name === 'company' && a.ticker === b.ticker));

export function WebRing() {
  const { view, go } = useSim();
  const companies = useHistorical((p, d) => p.listCompanies(d));
  const ring: { label: string; to: View }[] = [{ label: 'Home Page', to: { name: 'home' } }, ...(companies ?? []).slice(0, 7).map((c) => ({ label: c.name, to: { name: 'company', ticker: c.ticker } as View }))];
  const cur = ring.findIndex((r) => sameView(r.to, view));
  const step = (d: number) => go(ring[(((cur < 0 ? (d > 0 ? -1 : 0) : cur) + d) % ring.length + ring.length) % ring.length].to);
  const random = () => {
    const pool = ring.filter((_, i) => i !== cur);
    go(pool[Math.floor(Math.random() * pool.length)].to);
  };
  return (
    <nav className="ew-ring" aria-label="Market Time web ring">
      <div className="ew-ring-title">The Market Time Web Ring</div>
      <p className="ew-ring-now">{cur >= 0 ? `Page ${cur + 1} of ${ring.length}: ${ring[cur].label}` : `${ring.length} pages in this ring`}</p>
      <div className="ew-ring-btns">
        <button type="button" className="m-btn ew-go" onClick={() => step(-1)} disabled={ring.length < 2} data-target="ring-previous">&laquo; Previous</button>
        <button type="button" className="m-btn ew-go" onClick={random} disabled={ring.length < 2} data-target="ring-random">Random</button>
        <button type="button" className="m-btn ew-go" onClick={() => step(1)} disabled={ring.length < 2} data-target="ring-next">Next &raquo;</button>
      </div>
    </nav>
  );
}

export function Guestbook() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<{ name: string; msg: string }[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const id = useId();
  return (
    <div className="ew-guest">
      <button type="button" className="m-link ew-go" aria-expanded={open} aria-controls={`${id}-p`} data-target="guestbook" onClick={() => setOpen(!open)}>
        {open ? 'Close the guestbook' : 'Sign my guestbook!'}
      </button>
      {open ? (
        <div className="ew-guest-panel" id={`${id}-p`}>
          <form onSubmit={(e) => { e.preventDefault(); if (!msg.trim()) return; setEntries([{ name: name.trim() || 'Anonymous', msg: msg.trim() }, ...entries]); setMsg(''); }}>
            <label>Your name <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} /></label>
            <label>Message <input value={msg} maxLength={120} onChange={(e) => setMsg(e.target.value)} /></label>
            <button type="submit" className="m-btn">Sign</button>
          </form>
          <p className="ew-guest-note">Entries stay in this browser tab only.</p>
          {entries.length ? <ul>{entries.map((e, i) => <li key={i}><b>{e.name}</b> wrote: {e.msg}</li>)}</ul> : <p className="ew-guest-note">No entries yet. Be the first!</p>}
        </div>
      ) : null}
    </div>
  );
}

export function PersonalFooterExtras() {
  return (
    <div className="ew-pers-foot">
      <AwardBadges />
      <VisitorCounter />
      <WebRing />
      <Guestbook />
    </div>
  );
}
