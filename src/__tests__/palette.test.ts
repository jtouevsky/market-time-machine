import { describe, expect, it } from 'vitest';
import { CATALOG } from '../theme/registry';
import { ensureContrast, experienceVars, needsSheet } from '../theme/styleVars';

const rgb = (h: string): [number, number, number] => { const m = h.match(/^#([0-9a-f]{6})$/i); const n = m ? parseInt(m[1], 16) : 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (c: [number, number, number]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a: string, b: string) => { const x = lum(rgb(a)), y = lum(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

describe('palette legibility', () => {
  it('ensureContrast lifts weak colours to 4.5:1 in either direction', () => {
    expect(ratio(ensureContrast('#999999', '#ffffff'), '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(ratio(ensureContrast('#555555', '#000000'), '#000000')).toBeGreaterThanOrEqual(4.5);
    expect(ensureContrast('#000000', '#ffffff')).toBe('#000000');
  });

  it.each(CATALOG.filter((e) => !e.opts?.native).map((e) => [e.id, e] as const))('%s keeps text colours legible on its paper', (_id, exp) => {
    const v = experienceVars(exp);
    const paper = /^#[0-9a-f]{6}$/i.test(exp.palette.paper) ? exp.palette.paper : null;
    if (!paper) return; // translucent surfaces are checked in the browser audit
    for (const k of ['--mute', '--up', '--down', '--link']) if (/^#[0-9a-f]{6}$/i.test(v[k])) expect(ratio(v[k], paper), `${k} on paper`).toBeGreaterThanOrEqual(4.5);
  });

  it('puts content on a paper sheet only when page and ink are both dark', () => {
    const radio = CATALOG.find((e) => e.id === 'radio-1935')!;
    expect(needsSheet(radio)).toBe(true);
    expect(needsSheet(CATALOG.find((e) => e.id === 'dash-2009')!)).toBe(false);
  });
});
