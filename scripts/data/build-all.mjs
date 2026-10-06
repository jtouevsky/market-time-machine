#!/usr/bin/env node
/**
 * Rebuild every dataset in public/data from free public sources. No API keys needed.
 *
 *   npm run data:refresh            # everything (markets, macro, news, sports, culture)
 *   npm run data:refresh -- markets # just one or more: markets macro news sports culture
 *
 * Responses are cached in .data-cache/ so re-runs are fast and polite. Delete it to force
 * a fresh download. A failing source is reported and skipped; the others still run, and
 * the previous file for the failed source is left untouched.
 */
import { fetchMarkets } from './fetch-markets.mjs';
import { fetchFred } from './fetch-fred.mjs';
import { fetchNews } from './fetch-news.mjs';
import { fetchSports } from './fetch-sports.mjs';
import { fetchCulture } from './fetch-culture.mjs';

const STEPS = {
  markets: () => fetchMarkets(),
  macro: () => fetchFred(),
  news: () => fetchNews({ from: 1800, to: new Date().getUTCFullYear() }),
  sports: () => fetchSports(),
  culture: () => fetchCulture(),
};
const want = process.argv.slice(2).filter((a) => a in STEPS);
const run = want.length ? want : Object.keys(STEPS);
const failed = [];
for (const name of run) {
  const t = Date.now();
  console.log(`\n▶ ${name}`);
  try { await STEPS[name](); console.log(`✓ ${name} (${((Date.now() - t) / 1000).toFixed(0)}s)`); }
  catch (e) { failed.push(name); console.error(`✗ ${name}: ${e?.message ?? e}`); }
}
if (failed.length) { console.error(`\nFailed: ${failed.join(', ')} — previous files kept.`); process.exitCode = 1; }
else console.log('\nAll datasets rebuilt in public/data.');
