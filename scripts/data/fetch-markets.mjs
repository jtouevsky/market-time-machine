// REAL market data: daily OHLCV, splits and dividends from Yahoo Finance's public chart
// endpoint (no key). Writes:
//   public/data/markets/securities.json         metadata + coverage + splits for every symbol
//   public/data/markets/prices/<SYM>.json.gz    full daily history (split-adjusted OHLCV)
//   public/data/markets/daily/<YEAR>.json.gz    every symbol's close for each trading day of a year
import { UNIVERSE } from './universe.mjs';
import { get, isoFromUnix, pool, sig, writeGz, writeJson } from './lib.mjs';

export const fileId = (id) => id.replace(/[^A-Za-z0-9-]/g, '_');

async function fetchOne(entry) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(entry.id)}?period1=-2208988800&period2=${Math.floor(Date.now() / 1000)}&interval=1d&events=div%2Csplit&includeAdjustedClose=true`;
  const body = await get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (MarketTimeMachine data build)' } });
  const json = JSON.parse(body).chart;
  if (json.error) throw new Error(`${entry.id}: ${json.error.description}`);
  const r = json.result[0];
  const q = r.indicators.quote[0];
  const firstAllowed = entry.from ?? entry.names[0][0];
  const rows = [];
  r.timestamp.forEach((t, i) => {
    const date = isoFromUnix(t + (r.meta.gmtoffset ?? 0));
    if (date < firstAllowed || q.close[i] == null) return;
    rows.push([date, sig(q.open[i] ?? q.close[i]), sig(q.high[i] ?? q.close[i]), sig(q.low[i] ?? q.close[i]), sig(q.close[i]), q.volume[i] ?? 0]);
  });
  // de-duplicate dates (Yahoo occasionally repeats the live bar)
  const seen = new Map();
  for (const row of rows) seen.set(row[0], row);
  const clean = [...seen.values()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const splits = Object.values(r.events?.splits ?? {})
    .map((s) => [isoFromUnix(s.date), s.numerator / s.denominator])
    .filter(([d]) => d >= firstAllowed)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const divs = Object.values(r.events?.dividends ?? {})
    .map((d) => [isoFromUnix(d.date), sig(d.amount)])
    .filter(([d]) => d >= firstAllowed)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));
  return { entry, rows: clean, splits, divs };
}

function encode(rows) {
  // dates as day deltas; prices split-adjusted
  const base = Date.UTC(1900, 0, 1) / 864e5;
  let prev = 0;
  const d = rows.map(([iso]) => { const n = Date.parse(iso) / 864e5 - base; const delta = n - prev; prev = n; return delta; });
  return { d, o: rows.map((r) => r[1]), h: rows.map((r) => r[2]), l: rows.map((r) => r[3]), c: rows.map((r) => r[4]), v: rows.map((r) => r[5]) };
}

export async function fetchMarkets(log = console.log) {
  const results = await pool(UNIVERSE, 3, async (e) => {
    try { const x = await fetchOne(e); log(`  ${e.id.padEnd(8)} ${x.rows.length} rows ${x.rows[0]?.[0]} → ${x.rows.at(-1)?.[0]}`); return x; }
    catch (err) { log(`  ${e.id} FAILED: ${err.message}`); return null; }
  });
  const ok = results.filter((x) => x && x.rows.length);
  const securities = [];
  let bytes = 0;
  const byYear = new Map();
  for (const { entry, rows, splits, divs } of ok) {
    const fid = fileId(entry.id);
    bytes += writeGz(`markets/prices/${fid}.json.gz`, { id: entry.id, splits, divs, ...encode(rows) });
    securities.push({
      id: entry.id, file: fid, kind: entry.kind ?? 'stock', sector: entry.sector ?? null, unit: entry.unit ?? null, intl: !!entry.intl,
      names: entry.names, tickers: entry.tickers ?? [[rows[0][0], entry.id]], exchange: entry.exchange ?? (entry.kind && entry.kind !== 'stock' ? [] : [[rows[0][0], 'NYSE']]),
      first: rows[0][0], last: rows.at(-1)[0], splits, source: 'Yahoo Finance chart API (daily bars)',
    });
    for (const row of rows) {
      const y = row[0].slice(0, 4);
      if (!byYear.has(y)) byYear.set(y, new Map());
      const ym = byYear.get(y);
      if (!ym.has(row[0])) ym.set(row[0], {});
      ym.get(row[0])[entry.id] = row[4];
    }
  }
  // per-year close matrices
  const years = [...byYear.keys()].sort();
  const lastClose = {};
  for (const y of years) {
    const days = [...byYear.get(y).keys()].sort();
    const syms = [...new Set(days.flatMap((d) => Object.keys(byYear.get(y).get(d))))].sort();
    const c = {};
    for (const s of syms) c[s] = days.map((d) => byYear.get(y).get(d)[s] ?? null);
    const prev = {};
    for (const s of syms) if (lastClose[s] != null) prev[s] = lastClose[s];
    bytes += writeGz(`markets/daily/${y}.json.gz`, { year: Number(y), days, prev, c });
    for (const s of syms) { const arr = c[s]; for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) { lastClose[s] = arr[i]; break; } }
  }
  writeJson('markets/securities.json', { generatedAt: new Date().toISOString(), years: years.map(Number), securities });
  log(`  markets: ${ok.length}/${UNIVERSE.length} symbols, ${(bytes / 1e6).toFixed(1)} MB gz`);
}

if (import.meta.url === `file://${process.argv[1]}`) fetchMarkets();
