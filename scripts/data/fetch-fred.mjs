// REAL economic & rates data from FRED / ALFRED (Federal Reserve Bank of St. Louis). No key needed:
// we use the public CSV graph endpoints.
//
//   macro/series.json.gz    market-observed series (known the same day / at period end)
//   macro/vintages.json.gz  ALFRED real-time snapshots: what each statistic looked like on a date
//   macro/latest.json.gz    today's revised history, used (labelled DERIVED) before vintages exist
import { get, parseCsv, pool, writeGz } from './lib.mjs';

const fredCsv = async (id, vintage) => {
  const url = vintage
    ? `https://alfred.stlouisfed.org/graph/alfredgraph.csv?id=${id}&vintage_date=${vintage}`
    : `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;
  const rows = parseCsv(await get(url, { headers: { 'User-Agent': 'curl/8.5.0', Accept: '*/*' } }));
  if (!rows.length || rows[0][0] !== 'observation_date') return [];
  return rows.slice(1).filter((r) => r[1] !== '' && r[1] !== '.' && r[1] !== undefined).map((r) => [r[0], Number(r[1])]);
};

// Series that are market prices/rates: observed and public on the day (daily) or at period end (monthly).
export const MARKET_SERIES = [
  { id: 'DFF', label: 'Federal funds rate (effective)', freq: 'd', unit: '%', kind: 'rate' },
  { id: 'DTB3', label: '3-month Treasury bill', freq: 'd', unit: '%', kind: 'rate' },
  { id: 'DGS10', label: '10-year Treasury yield', freq: 'd', unit: '%', kind: 'rate' },
  { id: 'TB3MS', label: '3-month Treasury bill (monthly avg.)', freq: 'm', unit: '%', kind: 'rate' },
  { id: 'GS10', label: '10-year Treasury yield (monthly avg.)', freq: 'm', unit: '%', kind: 'rate' },
  { id: 'M13001USM156NNBR', label: 'Call money rate, New York', freq: 'm', unit: '%', kind: 'rate' },
  { id: 'M13002US35620M156NNBR', label: 'Commercial paper rate, New York', freq: 'm', unit: '%', kind: 'rate' },
  { id: 'M1109BUSM293NNBR', label: 'Dow Jones Industrials (monthly)', freq: 'm', unit: '', kind: 'index' },
  { id: 'DCOILWTICO', label: 'Crude oil, WTI spot', freq: 'd', unit: '$/bbl', kind: 'commodity' },
  { id: 'WTISPLC', label: 'Crude oil, WTI spot (monthly avg.)', freq: 'm', unit: '$/bbl', kind: 'commodity' },
  { id: 'DEXUSUK', label: 'U.S. dollars per pound', freq: 'd', unit: '$', kind: 'fx' },
  { id: 'DEXJPUS', label: 'Yen per U.S. dollar', freq: 'd', unit: '¥', kind: 'fx' },
  { id: 'DEXUSEU', label: 'U.S. dollars per euro', freq: 'd', unit: '$', kind: 'fx' },
  { id: 'DEXGEUS', label: 'Deutsche marks per U.S. dollar', freq: 'd', unit: 'DM', kind: 'fx' },
];

// Statistics that are revised after publication. snapDay = day of month we snapshot ALFRED,
// chosen to fall after the usual release window, so a snapshot never contains a number
// that was published later than the snapshot date.
export const VINTAGE_SERIES = [
  { id: 'UNRATE', label: 'Unemployment rate', unit: '%', snapDay: 9, freq: 'm', lag: 8, latestFrom: 'UNRATE' },
  { id: 'PAYEMS', label: 'Nonfarm payrolls', unit: 'k', snapDay: 9, freq: 'm', lag: 8, latestFrom: 'PAYEMS' },
  { id: 'CPIAUCSL', label: 'Consumer prices', unit: 'index', snapDay: 22, freq: 'm', lag: 21, latestFrom: 'CPIAUCNS' },
  { id: 'INDPRO', label: 'Industrial production', unit: 'index', snapDay: 20, freq: 'm', lag: 18, latestFrom: 'INDPRO' },
  { id: 'GNPC96', label: 'Real output (GNP)', unit: 'bn', snapDay: 1, freq: 'q', lag: 31, until: '1991-12-31', latestFrom: 'GNPC96' },
  { id: 'GDPC1', label: 'Real GDP', unit: 'bn', snapDay: 1, freq: 'q', lag: 31, since: '1992-01-01', latestFrom: 'GDPC1' },
];

function monthsBetween(from, to, day) {
  const out = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

async function firstVintage(id, lo = 1955, hi = 2026) {
  // binary search the first year with a usable vintage (on the series' snap day)
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const rows = await fredCsv(id, `${mid}-06-15`).catch(() => []);
    if (rows.length) hi = mid; else lo = mid + 1;
  }
  return lo;
}

export async function fetchFred(log = console.log) {
  const today = new Date().toISOString().slice(0, 10);
  const series = {};
  for (const s of MARKET_SERIES) {
    const rows = await fredCsv(s.id).catch((e) => { log(`  ${s.id} FAILED ${e.message}`); return []; });
    if (!rows.length) continue;
    series[s.id] = { ...s, rows };
    log(`  ${s.id.padEnd(22)} ${rows.length} obs ${rows[0]?.[0]} → ${rows.at(-1)?.[0]}`);
  }
  let bytes = writeGz('macro/series.json.gz', { source: 'FRED, Federal Reserve Bank of St. Louis', generatedAt: today, series });

  const latest = {};
  for (const v of VINTAGE_SERIES) latest[v.id] = { ...v, rows: await fredCsv(v.latestFrom).catch(() => []) };
  bytes += writeGz('macro/latest.json.gz', { source: 'FRED (current vintage)', series: latest });

  const vintages = {};
  for (const v of VINTAGE_SERIES) {
    const startYear = Math.max(await firstVintage(v.id), v.since ? Number(v.since.slice(0, 4)) : 0);
    const end = v.until && v.until < today ? v.until : today;
    let dates = monthsBetween(`${startYear}-01`, end.slice(0, 7), v.snapDay).filter((d) => d <= today && (!v.since || d >= v.since));
    const snaps = await pool(dates, 4, async (d) => {
      const rows = await fredCsv(v.id, d).catch(() => []);
      return rows.length ? [d, rows.slice(-14)] : null;
    });
    vintages[v.id] = { ...v, snapshots: snaps.filter(Boolean) };
    log(`  vintage ${v.id.padEnd(9)} ${vintages[v.id].snapshots.length} snapshots from ${startYear}`);
  }
  bytes += writeGz('macro/vintages.json.gz', { source: 'ALFRED, Federal Reserve Bank of St. Louis', generatedAt: today, vintages });
  log(`  macro: ${(bytes / 1e6).toFixed(2)} MB gz`);
}

if (import.meta.url === `file://${process.argv[1]}`) fetchFred();
