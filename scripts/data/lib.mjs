// Shared helpers for the data build. Node 18+ (global fetch, zlib).
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const OUT = join(ROOT, 'public', 'data');
export const CACHE = join(ROOT, '.data-cache');
// Wikipedia and others ask bots to identify themselves with a way to reach the operator.
// Set DATA_CONTACT (an email or URL) when you run the data build yourself.
loadDotEnv();
const ua = () => `MarketTimeMachine/0.2 (educational historical simulator; ${process.env.DATA_CONTACT || 'https://github.com/jtouevsky/market-time-machine'})`;

/** Minimal .env reader (KEY=value lines) so the data build needs no extra dependency. */
function loadDotEnv() {
  const f = new URL('../../.env', import.meta.url);
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function get(url, { tries = 6, timeout = 45000, headers = {}, binary = false, cache = true } = {}) {
  const key = join(CACHE, createHash('sha1').update(url).digest('hex'));
  if (cache && existsSync(key)) return binary ? readFileSync(key) : readFileSync(key, 'utf8');
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeout);
      const res = await fetch(url, { headers: { 'User-Agent': ua(), ...headers }, signal: ctl.signal });
      clearTimeout(t);
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) { const e = new Error(`HTTP ${res.status} ${url}`); e.status = res.status; throw e; }
      const body = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
      if (cache) { mkdirSync(CACHE, { recursive: true }); writeFileSync(key, body); }
      return body;
    } catch (e) {
      last = e;
      if (e.status && e.status < 500 && e.status !== 429) throw e;
      await sleep(1500 * (i + 1) ** 2);
    }
  }
  throw last;
}

export function writeGz(rel, data) {
  const p = join(OUT, rel);
  mkdirSync(dirname(p), { recursive: true });
  const buf = gzipSync(Buffer.from(JSON.stringify(data)), { level: 9 });
  writeFileSync(p, buf);
  return buf.length;
}
export function writeJson(rel, data) {
  const p = join(OUT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 1));
}

export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export const isoFromUnix = (t) => new Date(t * 1000).toISOString().slice(0, 10);
/** Round to ~5 significant digits to keep files small without visible loss. */
export const sig = (v) => (v == null || !isFinite(v) ? null : Number(v.toPrecision(v >= 1 ? 6 : 5)));

export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}
