/**
 * Random-date audit of the REAL data path. Runs against the datasets in /public/data.
 * Network sources (NOAA, Library of Congress) are disabled here; they are checked by the guard
 * at runtime exactly like everything else.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setDataReader } from '../data/real/loader';
import { createRealProvider } from '../data/realProvider';
import { createGuardedProvider } from '../data/guardedProvider';
import { HistoricalContextAggregator } from '../data/aggregator';
import { eraFor } from '../theme/registry';

const DATA = join(__dirname, '../../public/data');
const HAVE_DATA = existsSync(join(DATA, 'markets/securities.json'));

export const RANDOM_DATES = [
  '1926-06-04', '1957-02-18', '1974-08-12', '1983-05-06', '1994-04-07', '1997-06-17', '2004-11-03', '2011-02-12', '2016-05-19',
  // plus the famous ones
  '1929-10-29', '1969-07-21', '1987-10-19', '2000-03-10', '2008-09-15', '2020-03-11',
];

beforeAll(() => {
  setDataReader(async (p) => { const f = join(DATA, p); return existsSync(f) ? new Uint8Array(readFileSync(f)) : null; });
  (globalThis as { fetch: typeof fetch }).fetch = (() => Promise.reject(new Error('network disabled in tests'))) as typeof fetch;
});

describe.skipIf(!HAVE_DATA)('real data on random dates', () => {
  for (const date of RANDOM_DATES) {
    it(`${date}: nothing from the future, nothing that did not exist`, async () => {
      const raw = createRealProvider();
      const g = createGuardedProvider(raw, () => date);
      const agg = new HistoricalContextAggregator(g);
      const w = await agg.snapshot(date);

      for (const n of [...w.topStories, ...w.worldNews, ...w.businessNews]) expect(n.availableAt <= date).toBe(true);
      const quotes = [...w.markets.indexes, ...w.markets.commodities, ...w.markets.rates, ...w.markets.international, ...w.markets.digital, ...w.markets.movers];
      for (const q of quotes) expect(q.asOf <= date, `${q.id} ${q.asOf}`).toBe(true);
      for (const e of w.economicData) expect(e.availableAt <= date).toBe(true);
      for (const s of w.sports) expect(s.availableAt <= date && s.eventDate < date).toBe(true);
      for (const c of w.culture) expect(c.availableAt <= date).toBe(true);

      // no impossible securities
      const ids = quotes.map((q) => q.id);
      if (date < '2010-06-29') expect(ids).not.toContain('TSLA');
      if (date < '1971-02-05') expect(ids).not.toContain('^IXIC');
      if (date < '2014-09-17') expect(ids).not.toContain('BTC-USD');
      for (const c of await g.listCompanies(date)) {
        const prof = await g.getCompanyProfile(c.ticker, date);
        if (prof?.quote) expect(prof.quote.asOf <= date).toBe(true);
      }
      // headline text must not mention a later year (hindsight scrub)
      const y = Number(date.slice(0, 4));
      for (const n of w.topStories) {
        const text = `${n.title} ${n.summary ?? ''}`;
        // no retrospective labels like "(2014–2017)"
        for (const m of text.matchAll(/\b(1[89]\d\d|20\d\d)\s*[–-]\s*(1[89]\d\d|20\d\d)\b/g)) expect(Number(m[2]) <= y, text).toBe(true);
        // retrospective chronologies may not mention later years at all
        if (!/Current events/.test(n.source)) for (const m of text.matchAll(/\b(1[89]\d\d|20\d\d)\b/g)) expect(Number(m[1]) <= y, text).toBe(true);
      }
      // no birth notices ("Name, occupation" — the occupation is hindsight) and no "later found…"
      for (const n of [...w.topStories, ...w.worldNews, ...w.businessNews, ...w.technologyNews]) {
        expect(n.title, n.title).not.toMatch(/^[A-Z][\p{L}.'’-]+(\s+[A-Z][\p{L}.'’-]+)+,\s+[a-z][a-z\s/,-]*(player|singer|actor|actress|writer|politician|director|musician|driver|gymnast|murderer|personality|comedian|poet)\b[a-z\s/,-]*$/u);
        expect(`${n.title} ${n.summary ?? ''}`).not.toMatch(/\b(which|who|that|are|is|was|were)\s+(\w+\s+)?later\s+(found|proved|became|becomes|revealed)/i);
      }

      // the page has something to show
      expect(w.topStories.length).toBeGreaterThan(0);
      expect(eraFor(date)).toBeTruthy();
    }, 30000);
  }

  it('on a crash day the market leads the front page', async () => {
    const g = createGuardedProvider(createRealProvider(), () => '1987-10-19');
    const [lead] = await g.getNews('1987-10-19');
    expect(['finance', 'economy']).toContain(lead.category);
    expect(lead.availableAt).toBe('1987-10-19');
  });

  it('TSLA does not exist in 1995 — search and company page both come back empty', async () => {
    const g = createGuardedProvider(createRealProvider(), () => '1995-06-01');
    const res = await g.search('TSLA', '1995-06-01');
    expect(res.filter((r) => r.kind === 'company')).toHaveLength(0);
    expect(await g.getCompanyProfile('TSLA', '1995-06-01')).toBeNull();
    expect(await g.getQuote('TSLA', '1995-06-01')).toBeNull();
  });

  it('prints prices as they were quoted then (IBM on Black Monday)', async () => {
    const g = createGuardedProvider(createRealProvider(), () => '1987-10-19');
    const q = await g.getQuote('IBM', '1987-10-19');
    expect(q!.value).toBeCloseTo(103.25, 0);
    const s = await g.getQuote('^GSPC', '1987-10-19');
    expect(s!.value).toBeCloseTo(224.84, 1);
    expect(s!.provenance).toBe('REAL');
  });

  it('point-in-time identity: Exxon was XON in 1985, Facebook was FB in 2015', async () => {
    const a = await createRealProvider().getQuote('XOM', '1985-06-03');
    expect(a!.symbol).toBe('XON');
    expect(a!.name).toMatch(/Exxon/);
    const b = await createRealProvider().getQuote('META', '2015-06-01');
    expect(b!.symbol).toBe('FB');
    expect(b!.name).toBe('Facebook');
  });
});
