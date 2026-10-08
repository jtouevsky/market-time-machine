/**
 * VisualEraRegistry
 * -----------------
 *   VisualEraRegistry.resolve(date)  → the complete VisualExperience for that day
 *   eraFor(date)                     → the same, shaped as the EraTheme the components already use
 *
 * No component branches on the year. Everything that differs by period is data in the catalog.
 */
import { MONTHS, WEEKDAYS, parts, type ISODate } from '../../core/dates';
import { ERAS, longDate, mdy, shortMonth, type BaseTheme, type EraTheme } from '../eras';
import { MID_CATALOG } from './catalog-mid';
import { PRINT_CATALOG } from './catalog-print';
import { WEB_CATALOG } from './catalog-web';
import type { Archetype, VisualExperience } from './types';

export type { Archetype, VisualExperience, VisualFamily } from './types';

/** Which of the original eleven label sets an archetype speaks in. */
const LABEL_BASE: Record<Archetype, BaseTheme['id']> = {
  gazette: 'archive', archive: 'archive', victorian: 'archive', broadsheet: 'broadsheet', deco: 'broadsheet', wire: 'broadsheet',
  radio: 'broadcast', midcentury: 'midcentury', swiss: 'midcentury', broadcast: 'broadcast', teletext: 'terminal', terminal: 'terminal',
  dos: 'terminal', workstation: 'terminal', desktop: 'portal', hypertext: 'directory', directory: 'directory', personal: 'directory',
  win98: 'portal', portal: 'portal', xp: 'portal', enterprise: 'portal', flash: 'portal', web2: 'web2', mobile: 'mobile', metro: 'flat',
  material: 'flat', flat: 'flat', minimal: 'flat', fintech: 'fintech', dataterm: 'fintech', retail: 'fintech', glass: 'fintech',
  bento: 'fintech', research: 'fintech', spatial: 'fintech', finos: 'fintech', liquid: 'fintech',
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const DATE_FORMATS: Partial<Record<Archetype, { long: (d: ISODate) => string; short: (d: ISODate) => string }>> = {
  teletext: {
    long: (d) => { const p = parts(d); return `${WEEKDAYS[p.weekday].slice(0, 3)} ${pad2(p.d)} ${MONTHS[p.m - 1].slice(0, 3)} ${String(p.y).slice(2)}`; },
    short: (d) => { const p = parts(d); return `${pad2(p.d)}/${pad2(p.m)}/${String(p.y).slice(2)}`; },
  },
  dos: {
    long: (d) => { const p = parts(d); return `${pad2(p.m)}-${pad2(p.d)}-${p.y}`; },
    short: (d) => { const p = parts(d); return `${pad2(p.m)}-${pad2(p.d)}-${String(p.y).slice(2)}`; },
  },
  desktop: { long: (d) => longDate(d), short: (d) => mdy(d, false) },
  personal: { long: (d) => shortMonth(d), short: (d) => mdy(d, false) },
  win98: { long: (d) => longDate(d), short: (d) => mdy(d, false) },
  xp: { long: (d) => longDate(d), short: (d) => mdy(d, false) },
  enterprise: { long: (d) => longDate(d), short: (d) => mdy(d, false) },
  flash: { long: (d) => shortMonth(d).toUpperCase(), short: (d) => mdy(d, false) },
};

export const CATALOG: VisualExperience[] = [...PRINT_CATALOG, ...MID_CATALOG, ...WEB_CATALOG].sort((a, b) => a.from.localeCompare(b.from));

const byId = new Map(CATALOG.map((e) => [e.id, e]));
const themeMemo = new Map<string, EraTheme>();

function find(date: ISODate): VisualExperience {
  // binary search for the last entry whose `from` <= date (catalog is contiguous and sorted)
  let lo = 0, hi = CATALOG.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (CATALOG[mid].from <= date) lo = mid; else hi = mid - 1;
  }
  return CATALOG[lo];
}

export function themeFor(exp: VisualExperience): EraTheme {
  const hit = themeMemo.get(exp.id);
  if (hit) return hit;
  const base = ERAS.find((e) => e.id === LABEL_BASE[exp.archetype])!;
  const fmt = DATE_FORMATS[exp.archetype];
  const theme: EraTheme = {
    ...base,
    id: exp.archetype, family: exp.family, exp, sub: exp.id, variant: exp.id, name: exp.name, from: exp.from, to: exp.to,
    module: exp.module, ticker: exp.ticker, chart: exp.chart, publication: exp.publication, motto: exp.motto,
    headlineCase: exp.headlineCase ?? base.headlineCase, fractions: exp.fractions ?? base.fractions, price: exp.price,
    formatDate: fmt?.long ?? base.formatDate, formatShort: fmt?.short ?? base.formatShort,
    labels: { ...base.labels, ...exp.labels },
  };
  themeMemo.set(exp.id, theme);
  return theme;
}

export const VisualEraRegistry = {
  resolve: (date: ISODate): VisualExperience => find(date),
  resolveTheme: (date: ISODate): EraTheme => themeFor(find(date)),
  all: (): readonly VisualExperience[] => CATALOG,
  byId: (id: string): VisualExperience | undefined => byId.get(id),
  /** Experiences that would be on screen for each calendar year in [from, to]. */
  forYears: (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => ({ year: from + i, exp: find(`${from + i}-07-01`) })),
};

/** The legacy label/style family an archetype inherits stylesheet tokens from. */
export const baseOf = (a: Archetype): string => LABEL_BASE[a];

export const eraFor = (date: ISODate): EraTheme => themeFor(find(date));

/** Used by tests and the gallery: reports gaps, overlaps and duplicate ids. */
export function validateCatalog(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  CATALOG.forEach((e, i) => {
    if (ids.has(e.id)) problems.push(`duplicate id ${e.id}`);
    ids.add(e.id);
    if (e.from > e.to) problems.push(`${e.id}: from > to`);
    const next = CATALOG[i + 1];
    if (next) {
      const d = new Date(`${e.to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1);
      const expected = d.toISOString().slice(0, 10);
      if (next.from !== expected) problems.push(`${e.id} → ${next.id}: expected next from ${expected}, got ${next.from}`);
    }
  });
  if (CATALOG[0].from > '1000-01-01') problems.push('catalog does not start at 1000-01-01');
  if (CATALOG[CATALOG.length - 1].to < '2999-12-31') problems.push('catalog does not extend to 2999-12-31');
  return problems;
}
