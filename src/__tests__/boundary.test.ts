import { describe, expect, it } from 'vitest';
import { isInformationAvailable, filterAvailable } from '../core/availability';
import { parseDateInput, isParseError } from '../core/dateParser';
import { createMockProvider, DATA_HORIZON } from '../data/mockProvider';
import { createGuardedProvider } from '../data/guardedProvider';
import { addDays } from '../core/dates';

const DEMO = ['1869-09-24', '1929-10-29', '1969-07-20', '1987-10-19', '2000-03-10', '2001-09-11', '2007-01-09', '2008-09-15', '2020-03-11'];

describe('isInformationAvailable', () => {
  it('allows same-day and past, blocks future, fails closed', () => {
    expect(isInformationAvailable({ availableAt: '2007-01-09' }, '2007-01-09')).toBe(true);
    expect(isInformationAvailable({ availableAt: '2007-01-08' }, '2007-01-09')).toBe(true);
    expect(isInformationAvailable({ availableAt: '2007-01-10' }, '2007-01-09')).toBe(false);
    expect(isInformationAvailable({}, '2007-01-09')).toBe(false);
    expect(isInformationAvailable({ availableAt: 'soon' }, '2007-01-09')).toBe(false);
    expect(filterAvailable([{ availableAt: '1999-01-01' }, { availableAt: '2001-01-01' }], '2000-01-01')).toHaveLength(1);
  });
});

describe('date parser', () => {
  const ok = (s: string) => { const r = parseDateInput(s, DATA_HORIZON); if (isParseError(r)) throw new Error(r.error); return r.date; };
  it('parses the formats the portal promises', () => {
    expect(ok('October 29, 1929')).toBe('1929-10-29');
    expect(ok('July 20 1969')).toBe('1969-07-20');
    expect(ok('March 10 2000')).toBe('2000-03-10');
    expect(ok('September 15 2008')).toBe('2008-09-15');
    expect(ok('January 9 2007')).toBe('2007-01-09');
    expect(ok('1999')).toBe('1999-01-04');
    expect(ok('the day the iPhone was announced')).toBe('2007-01-09');
    expect(ok('10/19/1987')).toBe('1987-10-19');
    expect(ok('Black Monday')).toBe('1987-10-19');
    expect(ok('9/11')).toBe('2001-09-11');
    expect(ok('Oct. 29th, 1929')).toBe('1929-10-29');
    expect(ok('29 October 1929')).toBe('1929-10-29');
  });
  it('rejects the future', () => {
    expect(isParseError(parseDateInput('2031', DATA_HORIZON))).toBe(true);
  });
});

describe('mock provider respects the boundary', () => {
  const raw = createMockProvider();
  for (const date of DEMO) {
    it(`never returns future items on ${date}`, async () => {
      const news = await raw.getNews(date, { limit: 100 });
      news.forEach((n) => expect(n.availableAt <= date).toBe(true));
      const snap = await raw.getMarketSnapshot(date);
      [...snap.indexes, ...snap.commodities, ...snap.rates, ...snap.international, ...snap.digital, ...snap.movers]
        .forEach((q) => expect(q.asOf <= date).toBe(true));
      for (const c of await raw.listCompanies(date)) {
        const prof = await raw.getCompanyProfile(c.ticker, date);
        prof?.products.forEach((p) => expect(p.availableAt <= date).toBe(true));
        prof?.financials.forEach((f) => expect(f.availableAt <= date).toBe(true));
        const hist = await raw.getStockHistory(c.ticker, date);
        if (hist.length) expect(hist[hist.length - 1].date <= date).toBe(true);
      }
      for (const r of await raw.search('apple stock market crash bank', date)) expect(r.date <= date).toBe(true);
      for (const e of await raw.getEconomicData(date)) expect(e.availableAt <= date).toBe(true);
    });
  }

  it('Apple in January 2004 knows nothing of the iPhone', async () => {
    const prof = await raw.getCompanyProfile('AAPL', '2004-01-01');
    const text = JSON.stringify(prof);
    expect(text).not.toMatch(/iPhone|Apple Watch|iPod mini|Tim Cook, CEO/);
    expect(prof!.products.map((p) => p.name)).toContain('iTunes Music Store');
    const results = await raw.search('Apple', '2004-01-01');
    expect(JSON.stringify(results)).not.toMatch(/iPhone/);
  });

  it('iPhone appears on 2007-01-09, not the day before', async () => {
    expect(JSON.stringify(await raw.getNews('2007-01-08', { limit: 200 }))).not.toMatch(/iPhone/);
    expect(JSON.stringify(await raw.getNews('2007-01-09'))).toMatch(/iPhone/);
  });

  it('August 2008 jobs report is unknown before its release', async () => {
    const before = await raw.getEconomicData('2008-09-01');
    const after = await raw.getEconomicData('2008-09-15');
    expect(before.find((r) => r.seriesId === 'UNRATE')!.period).toBe('Jul 2008');
    expect(after.find((r) => r.seriesId === 'UNRATE')!.period).toBe('Aug 2008');
  });

  it('demo crash days hit their anchors', async () => {
    const q = await raw.getQuote('DJIA', '1987-10-19');
    expect(q!.value).toBeCloseTo(1738.74, 1);
    expect(q!.changePct!).toBeCloseTo(-22.6, 0);
    const leh = await raw.getQuote('LEH', '2008-09-15');
    expect(leh!.value).toBeCloseTo(0.21, 2);
  });

  it('weekend dates use the last session', async () => {
    const s = await raw.getMarketSnapshot('1969-07-20');
    expect(s.closedReason).toBe('Sunday');
    expect(s.indexes[0].asOf).toBe('1969-07-18');
  });
});

describe('guarded provider', () => {
  it('refuses requests past the clock', async () => {
    const g = createGuardedProvider(createMockProvider(), () => '2000-03-10');
    await expect(g.getNews('2000-03-11')).rejects.toThrow();
    await expect(g.getStockHistory('CSCO', addDays('2000-03-10', 30))).rejects.toThrow();
    const h = await g.getStockHistory('CSCO', '2000-03-10');
    expect(h[h.length - 1].date).toBe('2000-03-10');
  });
});
