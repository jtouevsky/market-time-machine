import { describe, expect, it } from 'vitest';
import { CATALOG, VisualEraRegistry, validateCatalog } from '../theme/registry';

describe('VisualEraRegistry', () => {
  it('covers every day with no gaps, overlaps or duplicate ids', () => {
    expect(validateCatalog()).toEqual([]);
  });

  it('gives every year from 1995 to 2026 its own experience', () => {
    const ids = VisualEraRegistry.forYears(1995, 2026).map((y) => y.exp.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves the boundary dates to different experiences', () => {
    const pairs: [string, string][] = [['1998-12-31', '1999-01-01'], ['2004-12-31', '2005-01-01'], ['2012-12-31', '2013-01-01'], ['2018-12-31', '2019-01-01'], ['2023-12-31', '2024-01-01']];
    for (const [a, b] of pairs) expect(VisualEraRegistry.resolve(a).id).not.toBe(VisualEraRegistry.resolve(b).id);
  });

  it.each([1700, 1800, 1860, 1900, 1929, 1944, 1958, 1969, 1975, 1983, 1987, 1992, 2001, 2026])('resolves %i', (y) => {
    const e = VisualEraRegistry.resolve(`${y}-06-15`);
    expect(e.from <= `${y}-06-15` && `${y}-06-15` <= e.to).toBe(true);
  });

  it('never names a year later than the experience it describes in its own dates', () => {
    for (const e of CATALOG) expect(e.from <= e.to).toBe(true);
  });
});
