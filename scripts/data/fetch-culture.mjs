// ARCHIVAL culture data from Wikipedia list articles (CC BY-SA):
//   * Billboard Hot 100 number-one singles, 1958–present (by chart issue date)
//   * Weekend box-office number-one films in the United States (by weekend)
// Output: public/data/culture/<YEAR>.json.gz = { items: [[availableDate, kind, title, byline, sourceUrl]] }
import { get, sleep, writeGz } from './lib.mjs';
import { clean } from './fetch-news.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const API = 'https://en.wikipedia.org/w/api.php';

async function page(title) {
  const j = JSON.parse(await get(`${API}?action=query&format=json&formatversion=2&prop=revisions&rvprop=content&rvslots=main&redirects=1&titles=${encodeURIComponent(title)}`));
  await sleep(300);
  return j.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content ?? null;
}
const iso = (y, mName, d) => `${y}-${String(MONTHS.indexOf(mName) + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const addDays = (d, n) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);

function rows(text) {
  const out = [];
  for (const table of text.split('\n{|').slice(1)) {
    const body = table.split('\n|}')[0];
    for (const row of body.split(/\n\|-[^\n]*/).slice(1)) {
      const cells = [];
      for (const line of row.split('\n')) {
        if (!line.startsWith('|') || line.startsWith('|+')) continue;
        for (let c of line.slice(1).split('||')) {
          // drop cell attributes:  align="center" rowspan="7"|content
          const m = c.match(/^\s*[a-z-]+\s*=\s*("[^"]*"|\S+)(?:\s+[a-z-]+\s*=\s*("[^"]*"|\S+))*\s*\|(?!\|)(.*)$/i);
          if (m) c = m[3];
          cells.push(c.trim());
        }
      }
      out.push(cells);
    }
  }
  return out;
}

function billboard(text, year, url) {
  const items = [];
  let song = null, artist = null;
  for (const cells of rows(text)) {
    const raw = cells.map((c) => c.replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, ''));
    const dts = raw.map((c) => c.match(/\{\{dts\|(\d{4})\|([A-Z][a-z]+)\|(\d{1,2})/)).find(Boolean);
    const txt = raw.map(clean);
    let date = dts ? iso(dts[1], dts[2], dts[3]) : null;
    if (!date) { const k = txt.find((c) => new RegExp(`^(${MONTHS.join('|')}) \\d{1,2}$`).test(c)); if (k) { const [mn, d] = k.split(' '); date = iso(year, mn, d); } }
    if (!date) continue;
    const si = txt.findIndex((c) => /^".+"/.test(c));
    if (si >= 0) { song = txt[si].replace(/[†‡*]/g, '').trim(); artist = txt[si + 1] ?? artist; }
    if (song && date.startsWith(String(year))) items.push([date, 'music', song, artist ?? '', url]);
  }
  return items;
}

function boxOffice(text, year, url) {
  const items = [];
  let film = null;
  for (const cells of rows(text)) {
    const raw = cells.map((c) => c.replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, ''));
    const dts = raw.map((c) => c.match(/\{\{dts\|(\d{4})\|([A-Z][a-z]+)\|(\d{1,2})/)).find(Boolean);
    const txt = raw.map(clean);
    let date = dts ? iso(dts[1], dts[2], dts[3]) : null;
    if (!date) { const k = txt.find((c) => new RegExp(`^(${MONTHS.join('|')}) \\d{1,2}(, \\d{4})?$`).test(c)); if (k) { const m = k.match(/^(\w+) (\d+)/); date = iso(year, m[1], m[2]); } }
    if (!date) continue;
    const fi = raw.findIndex((c) => /''.+''/.test(c) && !/^\s*''[^']*''\s*(reclaimed|became|broke|was|is)/.test(c));
    if (fi >= 0) film = clean(raw[fi].match(/''(.+?)''/)[1]);
    const gross = txt.find((c) => /^\$[\d,]+/.test(c));
    if (film) items.push([addDays(date, 1), 'film', film, gross ? `${gross} weekend` : '', url]);
  }
  return items;
}

export async function fetchCulture({ from = 1958, to = new Date().getUTCFullYear(), log = console.log } = {}) {
  const byYear = new Map();
  const add = (list) => { for (const it of list) { const y = Number(it[0].slice(0, 4)); if (!byYear.has(y)) byYear.set(y, []); byYear.get(y).push(it); } };
  for (let y = from; y <= to; y++) {
    const bt = `List of Billboard Hot 100 number ones of ${y}`;
    const b = await page(bt).catch(() => null);
    if (b) add(billboard(b, y, `https://en.wikipedia.org/wiki/${encodeURIComponent(bt.replace(/ /g, '_'))}`));
    const ft = `List of ${y} box office number-one films in the United States`;
    const f = y >= 1975 ? await page(ft).catch(() => null) : null;
    if (f) add(boxOffice(f, y, `https://en.wikipedia.org/wiki/${encodeURIComponent(ft.replace(/ /g, '_'))}`));
    if (y % 10 === 0) log(`   culture ${y}…`);
  }
  let bytes = 0, n = 0;
  for (const [y, list] of byYear) { list.sort((a, b) => (a[0] < b[0] ? -1 : 1)); n += list.length; bytes += writeGz(`culture/${y}.json.gz`, { year: y, source: 'Wikipedia (CC BY-SA 4.0)', items: list }); }
  log(`  culture: ${n} chart entries, ${(bytes / 1e3).toFixed(0)} KB gz`);
}

if (import.meta.url === `file://${process.argv[1]}`) fetchCulture();
