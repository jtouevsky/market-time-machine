import { describe, expect, it } from 'vitest';
import { CATALOG } from '../theme/registry';
import { EGG_COUNT, eggsFor } from '../theme/easterEggs';

describe('easter eggs', () => {
  it('has at least 20 eggs and every experience has one', () => {
    expect(EGG_COUNT).toBeGreaterThanOrEqual(20);
    for (const e of CATALOG) expect(eggsFor(e).length, e.id).toBeGreaterThan(0);
  });
  it('word triggers are lowercase alphanumerics', () => {
    for (const e of CATALOG) for (const g of eggsFor(e)) if (g.trigger.kind === 'word') expect(g.trigger.word).toMatch(/^[a-z0-9]{4,}$/);
  });
  it('contains no brand-ish or attribution text', () => {
    for (const e of CATALOG) for (const g of eggsFor(e)) expect(JSON.stringify(g)).not.toMatch(/claude|anthropic|\bAI\b|\$\d/i);
  });
});
