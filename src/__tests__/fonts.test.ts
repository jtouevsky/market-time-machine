import { describe, expect, it } from 'vitest';
import { CATALOG } from '../theme/registry';

/** Families that ship with an operating system (or are generic keywords): no network request needed. */
const SYSTEM = new Set([
  'arial', 'helvetica', 'helvetica neue', 'verdana', 'geneva', 'tahoma', 'trebuchet ms', 'times new roman', 'times', 'georgia',
  'courier new', 'courier', 'comic sans ms', 'lucida grande', 'lucida sans unicode', 'lucida console', 'segoe ui', 'consolas', 'menlo',
  'sf mono', 'monaco', 'palatino', 'palatino linotype', 'book antiqua', 'impact', 'system-ui', '-apple-system', 'ui-monospace',
  'ui-sans-serif', 'ui-serif', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'inherit', 'baskerville', 'rockwell',
]);

const primary = (stack: string) => stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase();
const specName = (spec: string) => decodeURIComponent(spec.split(':')[0].replace(/\+/g, ' ')).toLowerCase();

describe('lazy font loader coverage', () => {
  it.each(CATALOG.map((e) => [e.id, e] as const))('%s: every non-system primary font is in its fonts list', (_id, e) => {
    const t = e.typography;
    const loaded = new Set((t.fonts ?? []).map(specName));
    for (const stack of [t.head, t.body, t.num, t.lead].filter(Boolean) as string[]) {
      const name = primary(stack);
      if (SYSTEM.has(name)) continue;
      expect(loaded.has(name), `${e.id}: "${name}" is not system and not in typography.fonts`).toBe(true);
    }
  });

  it('font specs are well-formed Google Fonts family strings', () => {
    for (const e of CATALOG) for (const s of e.typography.fonts ?? []) expect(s).toMatch(/^[A-Za-z0-9+]+(:[A-Za-z0-9,;@.]+)?$/);
  });
});
