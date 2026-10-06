// ARCHIVAL news & events from Wikipedia (CC BY-SA), fetched through the MediaWiki API in
// batches. Three kinds of page are used:
//   * "Portal:Current events/YYYY Month D"  — written on the day, with links to the original
//                                              reports (2002 onward)       → kind 'current'
//   * "Month YYYY" articles (e.g. "October 1929") — day-by-day chronologies  → kind 'month'
//   * "YYYY" and "YYYY in the United States"  — dated event lists           → kind 'year'
//
// The last two are written in hindsight, so every item goes through a hindsight scrubber
// (no later years, no "would later…", no birth notices) before it is kept.
//
// Output: public/data/news/<YEAR>.json.gz = { year, items: [[date, cat, text, src, url, kind, pageTitle]] }
import { get, pool, sleep, writeGz } from './lib.mjs';

const API = 'https://en.wikipedia.org/w/api.php';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

async function fetchPages(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 20) {
    const batch = titles.slice(i, i + 20);
    const url = `${API}?action=query&format=json&formatversion=2&prop=revisions&rvprop=content&rvslots=main&maxlag=5&titles=${encodeURIComponent(batch.join('|'))}`;
    let json;
    try { json = JSON.parse(await get(url)); } catch (e) { console.log('   batch failed', e.message); continue; }
    for (const p of json.query?.pages ?? []) {
      const text = p.revisions?.[0]?.slots?.main?.content;
      if (text && !/^#REDIRECT/i.test(text)) out.set(p.title, text);
    }
    await sleep(350);
  }
  return out;
}

// ------------------------------------------------------------------ wikitext → plain text
function stripTemplates(s) {
  let out = '', depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{' && s[i + 1] === '{') { depth++; i++; continue; }
    if (s[i] === '}' && s[i + 1] === '}' && depth) { depth--; i++; continue; }
    if (!depth) out += s[i];
  }
  return out;
}
export function clean(raw) {
  let s = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  s = stripTemplates(s);
  s = s
    .replace(/\[\[(?:File|Image):[^\]]*(?:\[\[[^\]]*\]\][^\]]*)*\]\]/gi, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1')
    .replace(/\[https?:\/\/\S+\]/g, '')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

/** First contemporaneous citation in a wikitext bullet: {{cite news |work=… |date=… |url=…}} */
function citation(raw) {
  const m = raw.match(/\{\{\s*cite (?:news|web|journal|magazine)([^}]*)\}\}/i);
  if (!m) return null;
  const f = (k) => (m[1].match(new RegExp(`\\|\\s*${k}\\s*=\\s*([^|]+)`, 'i'))?.[1] ?? '').trim();
  const work = clean(f('work') || f('newspaper') || f('journal') || f('magazine') || f('publisher'));
  if (!work) return null;
  return { work, date: f('date'), url: f('url') };
}

const HINDSIGHT = /\b(would (later|go on|become|eventually|be (the )?(last|first))|(which|who|that) later|later (becomes?|became|known|renamed|called)|went on to|eventually|posthumous|in retrospect|what (would|became)|for the (last|first) time until|until \d{4}|(the )?first of (many|several))\b/i;
export const BIRTH_NOTICE = /^[A-Z][\p{L}.'’-]+(?:\s+(?:[A-Z][\p{L}.'’-]+|de|van|von|da|del|la|Jr\.?|II|III))+,\s+(?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?\s+)*[a-z][a-z\s/,-]*(?:\(d\.[^)]*\))?\.?$/u;
const LATER = /\b(which|who|that|are|is|was|were|be|been|it|they)\s+(\w+\s+)?later\b|\blater\s+(found|proved|proven|revealed|confirmed|identified|discovered|becomes?|became|renamed|known|called|convicted|acquitted|retracted|overturned)\b/i;
export function hindsightFree(text, year) {
  if (BIRTH_NOTICE.test(text) || LATER.test(text)) return false;
  if (HINDSIGHT.test(text)) return false;
  for (const m of text.matchAll(/\b(1[6-9]\d\d|20\d\d)\b/g)) if (Number(m[1]) > year) return false;
  if (/\b(\d{4})s\b/.test(text)) { const d = Number(RegExp.$1); if (d > year) return false; }
  return true;
}

const CAT_RULES = [
  ['finance', /\b(stock|market|dow|nasdaq|s&p|shares?|bank|banks|banking|interest rate|federal reserve|fed\b|treasury|bond|dollar|currency|inflation|recession|economy|economic|gdp|imf|bankrupt|bailout|exchange)\b/i],
  ['business', /\b(compan(y|ies)|corporation|merger|acquir|ceo|ipo|founded|airline|retailer|automaker|chain|brand|firm)\b/i],
  ['technology', /\b(computer|internet|software|launch(ed)?|satellite|spacecraft|nasa|rocket|technology|smartphone|iphone|microsoft|apple|google|intel|ibm|television broadcast|first flight|patent|invent)\b/i],
  ['science', /\b(scientist|discover|vaccine|disease|epidemic|pandemic|telescope|nobel|physics|chemistry|medical)\b/i],
  ['sports', /\b(world series|super bowl|olympic|championship|cup final|tournament|defeat(ed|s)|wins? the|grand prix|wimbledon|nba|nfl|nhl|mlb|fifa|boxing|heavyweight|league)\b/i],
  ['culture', /\b(film|movie|album|song|novel|premiere|broadcast|television|tv series|opera|play opened|actor|actress|singer|band|museum|award|oscar|grammy|emmy|festival)\b/i],
  ['politics', /\b(president|prime minister|election|elected|congress|senate|parliament|government|minister|governor|vote|treaty|law|court|supreme court|king|queen|party)\b/i],
  ['world', /./],
];
const categorize = (t) => CAT_RULES.find(([, re]) => re.test(t))[0];

const CE_CATS = {
  'armed conflicts and attacks': 'world', 'arts and culture': 'culture', 'business and economy': 'finance', 'business and economics': 'finance',
  'disasters and accidents': 'world', 'health and environment': 'science', 'health and medicine': 'science', 'international relations': 'world',
  'law and crime': 'politics', 'politics and elections': 'politics', 'science and technology': 'technology', 'sports': 'sports',
};

/**
 * Current-events entries are contemporaneous, but Wikipedia later renames linked articles
 * ("Iraqi Civil War (2014–2017)"). Strip such hindsight labels; keep genuine forward-looking
 * mentions ("the 2016 Olympics") only when the sentence is clearly about a plan or schedule.
 */
const FORWARD = /\b(scheduled|upcoming|plans?|planned|will|bid|host|to be held|due|by|until|before|deadline|target|forecast|expected|next|proposed|election|olympics|world cup|games|budget|fiscal)\b/i;
export function scrubCurrent(text, year) {
  let t = text
    .replace(/\s*\((?:[^()]*?\b)?(1[89]\d\d|20\d\d)\s*[–—-]\s*(?:(1[89]\d\d|20\d\d|\d\d)|present)\)/g, (m, a, b) => '')
    .replace(/\b(1[89]\d\d|20\d\d)\s*[–—-]\s*(present|(1[89]|20)\d\d)\s+(?=[A-Z])/g, (m, a, b) => (Number(b) > year || b === 'present' ? '' : m));
  for (const m of t.matchAll(/\b(1[89]\d\d|20\d\d)\b/g)) {
    const y = Number(m[1]);
    if (y > year && !(y <= year + 8 && FORWARD.test(t))) return null;
  }
  return t.replace(/\s{2,}/g, ' ').trim();
}

// ------------------------------------------------------------------ parsers
function parseCurrentEvents(text, date, title) {
  const items = [];
  let cat = 'world';
  let topic = '';
  for (const line of text.split('\n')) {
    const header = line.match(/^'''([^']+)'''\s*$/) || line.match(/^;\s*(.+)$/);
    if (header) { cat = CE_CATS[clean(header[1]).toLowerCase()] ?? cat; continue; }
    const b = line.match(/^(\*+)\s*(.*)$/);
    if (!b) continue;
    const depth = b[1].length;
    const raw = b[2];
    const links = [...raw.matchAll(/\[(https?:\/\/\S+)\s+\(([^)\]]+)\)\]/g)];
    const textOnly = clean(raw.replace(/\[(https?:\/\/\S+)\s+\(([^)\]]+)\)\]/g, ''));
    if (!links.length) { if (depth === 1) topic = textOnly; continue; }
    if (textOnly.length < 25) continue;
    const y0 = Number(date.slice(0, 4));
    const scrubbed = scrubCurrent(topic && depth > 1 ? `${topic}: ${textOnly}` : textOnly, y0);
    if (!scrubbed) continue;
    const src = links[0][2].trim();
    const url = links[0][1];
    const finalText = topic && depth > 1 && !textOnly.toLowerCase().includes(topic.toLowerCase().slice(0, 12)) ? scrubbed : scrubCurrent(textOnly, y0);
    if (finalText) items.push([date, cat, finalText, src, url, 'current', title]);
  }
  return items;
}

function parseMonthArticle(text, year, month, title) {
  const items = [];
  let date = null;
  let skipChildren = false;
  for (const line of text.split('\n')) {
    const h = line.match(/^==+\s*(?:[A-Z][a-z]+day,?\s*)?(?:\[\[)?([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
    if (h) {
      const mi = MONTHS.indexOf(h[1]);
      date = mi === month - 1 && Number(h[3]) === year ? `${year}-${String(month).padStart(2, '0')}-${String(h[2]).padStart(2, '0')}` : null;
      continue;
    }
    if (!date) continue;
    const b = line.match(/^(\*+)\s*(.*)$/);
    if (!b) continue;
    const depth = b[1].length;
    let t = clean(b[2]);
    if (depth === 1) skipChildren = /^(Born|Died)\s*:/i.test(t);
    if (skipChildren || /^(Born|Died)\s*:/i.test(t)) continue;
    if (depth > 1 && !t) continue;
    if (t.length < 30 || !hindsightFree(t, year)) continue;
    if (t.length > 420) t = t.slice(0, 400).replace(/\s+\S*$/, '') + '…';
    const cite = citation(b[2]);
    const page = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    items.push([date, categorize(t), t, cite ? `${cite.work}${cite.date ? `, ${cite.date}` : ''}` : 'Wikipedia', cite?.url || page, 'month', title]);
  }
  return items;
}

function parseYearList(text, year, title) {
  // Events section only
  const ev = text.split(/\n==[^=\n]*?(Births|Deaths|Nobel|Fields Medal|Templeton|Right Livelihood|See also|References|External links|New English|Notes|Sources)[^=\n]*==/i)[0];
  const items = [];
  let pendingDate = null;
  for (const line of ev.split('\n')) {
    const b = line.match(/^(\*+)\s*(.*)$/);
    if (!b) continue;
    const depth = b[1].length;
    const raw = b[2];
    const dm = raw.match(/^\[?\[?([A-Z][a-z]+)\s+(\d{1,2})\]?\]?\s*(?:[–—-]|&ndash;|&mdash;)?\s*(.*)$/);
    let date = null, body = raw;
    if (dm && MONTHS.includes(dm[1])) {
      let mon = MONTHS.indexOf(dm[1]) + 1, day = Number(dm[2]);
      body = dm[3];
      // date ranges ("October 24–29") are filed under their LAST day: nothing is known early
      const rg = body.match(/^\s*(?:[–—-]|&ndash;)\s*(?:\[\[)?(?:([A-Z][a-z]+)\s+)?(\d{1,2})(?:\|[^\]]*)?(?:\]\])?\s*(?:[–—:-]|&ndash;|&mdash;)?\s*(.*)$/);
      if (rg) { if (rg[1] && MONTHS.includes(rg[1])) mon = MONTHS.indexOf(rg[1]) + 1; day = Number(rg[2]); body = rg[3]; }
      date = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (!clean(body)) { pendingDate = date; continue; }
      pendingDate = date;
    } else if (depth > 1 && pendingDate) date = pendingDate;
    else continue;
    let t = clean(body);
    if (t.length < 30 || !hindsightFree(t, year)) continue;
    if (t.length > 420) t = t.slice(0, 400).replace(/\s+\S*$/, '') + '…';
    items.push([date, categorize(t), t, 'Wikipedia', `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`, 'year', title]);
  }
  return items;
}

const validDate = (d) => !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;

export async function fetchNews({ from = 1800, to = new Date().getUTCFullYear(), log = console.log } = {}) {
  const byYear = new Map();
  const add = (items) => { for (const it of items) { if (!validDate(it[0])) continue; const y = Number(it[0].slice(0, 4)); if (!byYear.has(y)) byYear.set(y, []); byYear.get(y).push(it); } };

  // 1) year pages + "in the United States"
  const yearTitles = [];
  for (let y = from; y <= to; y++) yearTitles.push(String(y), `${y} in the United States`);
  const yearPages = await fetchPages(yearTitles);
  for (const [title, text] of yearPages) { const y = Number(title.slice(0, 4)); add(parseYearList(text, y, title)); }
  log(`  year pages: ${yearPages.size}`);

  // 2) month chronologies
  const monthTitles = [];
  for (let y = Math.max(from, 1890); y <= Math.min(to, 2010); y++) for (const m of MONTHS) monthTitles.push(`${m} ${y}`);
  const monthPages = await fetchPages(monthTitles);
  for (const [title, text] of monthPages) {
    const [mn, ys] = title.split(' ');
    add(parseMonthArticle(text, Number(ys), MONTHS.indexOf(mn) + 1, title));
  }
  log(`  month chronologies: ${monthPages.size}`);

  // 3) daily Current events portal
  const ceTitles = [];
  const start = Date.UTC(Math.max(from, 2002), 0, 1);
  const end = Math.min(Date.UTC(to, 11, 31), Date.now() - 864e5);
  for (let t = start; t <= end; t += 864e5) {
    const d = new Date(t);
    ceTitles.push(`Portal:Current events/${d.getUTCFullYear()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`);
  }
  const cePages = await fetchPages(ceTitles);
  for (const [title, text] of cePages) {
    const m = title.match(/(\d{4}) ([A-Z][a-z]+) (\d+)$/);
    const date = `${m[1]}-${String(MONTHS.indexOf(m[2]) + 1).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
    add(parseCurrentEvents(text, date, title));
  }
  log(`  current-events days: ${cePages.size}`);

  let bytes = 0, count = 0;
  for (const [y, items] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    // de-duplicate identical texts, keep the richest kind
    const rank = { current: 3, month: 2, year: 1 };
    const seen = new Map();
    for (const it of items) { const k = it[0] + it[2].slice(0, 80).toLowerCase(); const prev = seen.get(k); if (!prev || rank[it[5]] > rank[prev[5]]) seen.set(k, it); }
    const list = [...seen.values()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    count += list.length;
    bytes += writeGz(`news/${y}.json.gz`, { year: y, source: 'Wikipedia (CC BY-SA 4.0)', items: list });
  }
  log(`  news: ${count} items, ${(bytes / 1e6).toFixed(1)} MB gz`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [a, b] = process.argv.slice(2).map(Number);
  fetchNews({ from: a || 1800, to: b || new Date().getUTCFullYear() });
}
