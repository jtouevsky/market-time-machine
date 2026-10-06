/**
 * Static dataset loader + small network helpers.
 *
 *  - Datasets live in /public/data (built by `npm run data:refresh`) and ship with the app.
 *  - Files are gzip-compressed JSON; we decompress with the browser's DecompressionStream.
 *  - Every request is memoised (request de-duplication + in-memory cache).
 *  - Remote API calls get a timeout and a small localStorage cache.
 *
 * In tests (Node) a reader can be injected with setDataReader().
 */
type Reader = (path: string) => Promise<Uint8Array | string | null>;

let reader: Reader | null = null;
export function setDataReader(r: Reader | null) { reader = r; cache.clear(); }

const cache = new Map<string, Promise<unknown>>();

function base() {
  // Vite injects BASE_URL ('/' in dev); fall back for other bundlers.
  try { return (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'; } catch { return '/'; }
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return new TextDecoder().decode(bytes);
  const DS = (globalThis as unknown as { DecompressionStream?: typeof DecompressionStream }).DecompressionStream;
  if (!DS) throw new Error('This browser cannot decompress datasets (DecompressionStream missing).');
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DS('gzip'));
  return await new Response(stream).text();
}

/** Load /data/<path> as JSON. Resolves to null if the file does not exist. */
export function loadData<T>(path: string): Promise<T | null> {
  const hit = cache.get(path);
  if (hit) return hit as Promise<T | null>;
  const p = (async () => {
    let raw: Uint8Array | string | null;
    if (reader) raw = await reader(path);
    else {
      const res = await fetch(`${base()}data/${path}`);
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('text/html')) return null; // SPA fallback served instead of a missing file
      raw = new Uint8Array(await res.arrayBuffer());
    }
    if (raw == null) return null;
    const text = typeof raw === 'string' ? raw : await gunzip(raw);
    return JSON.parse(text) as T;
  })().catch((e) => { console.warn(`[data] ${path}: ${e.message}`); return null; });
  cache.set(path, p);
  return p;
}

// ------------------------------------------------------------------ remote helpers
const inflight = new Map<string, Promise<unknown>>();
const LS_PREFIX = 'mtm-cache:';

export async function fetchJson<T>(url: string, { timeout = 7000, ttlDays = 30 }: { timeout?: number; ttlDays?: number } = {}): Promise<T> {
  try {
    const raw = localStorage.getItem(LS_PREFIX + url);
    if (raw) {
      const { t, v } = JSON.parse(raw);
      if (Date.now() - t < ttlDays * 864e5) return v as T;
    }
  } catch { /* storage unavailable */ }
  const hit = inflight.get(url);
  if (hit) return hit as Promise<T>;
  const p = (async () => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const v = (await res.json()) as T;
      try { localStorage.setItem(LS_PREFIX + url, JSON.stringify({ t: Date.now(), v })); } catch { evictSome(); }
      return v;
    } finally {
      clearTimeout(timer);
      inflight.delete(url);
    }
  })();
  inflight.set(url, p);
  return p;
}

function evictSome() {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX));
    keys.slice(0, Math.ceil(keys.length / 2)).forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

/** Resolve a promise or give up after `ms`, returning the fallback. */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]).catch(() => fallback);
}
