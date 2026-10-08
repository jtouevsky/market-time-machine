/**
 * Turns a VisualExperience into CSS custom properties on the .world element.
 * Experiences marked `opts.native` keep the long-standing stylesheet tokens for palette and type
 * (they are listed in the catalog for documentation) and only add their explicit `tokens`.
 */
import type { CSSProperties } from 'react';
import type { VisualExperience } from './registry/types';

type Vars = Record<string, string>;

type RGB = [number, number, number];
/** Flattens a translucent colour (rgba / 8-digit hex alpha) over a backdrop. */
function flatten(css: string, backdrop: string): string {
  const m = css.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/i);
  const under = toRGB(backdrop);
  if (!m || !under) return css;
  const a = Math.min(1, Math.max(0, +m[4]));
  return hexOf([0, 1, 2].map((i) => +m[i + 1] * a + under[i] * (1 - a)) as RGB);
}
function toRGB(css: string): RGB | null {
  const hex = css.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) { const h = hex[1].length === 3 ? hex[1].replace(/./g, '$&$&') : hex[1]; return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB; }
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  return m ? [+m[1], +m[2], +m[3]] : null;
}
const lum = ([r, g, b]: RGB) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a: RGB, b: RGB) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hexOf = ([r, g, b]: RGB) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Nudges `fg` toward black or white (whichever the background allows) until it reaches `min` contrast against `bg`. */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
  const f = toRGB(fg), b = toRGB(bg);
  if (!f || !b || ratio(f, b) >= min) return fg;
  const target: RGB = lum(b) > 0.4 ? [0, 0, 0] : [255, 255, 255];
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const c = f.map((v, i) => v + (target[i] - v) * t) as RGB;
    if (ratio(c, b) >= min) return hexOf(c);
  }
  // can't reach the target in this direction: take whichever extreme reads better
  const alt: RGB = target[0] === 0 ? [255, 255, 255] : [0, 0, 0];
  return hexOf(ratio(target, b) >= ratio(alt, b) ? target : alt);
}

/** Relative brightness (0–1) of the first colour found in a CSS value, or null if none can be read. */
function brightness(css: string): number | null {
  const hex = css.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/i);
  const rgb = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  let r: number, g: number, b: number;
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, '$&$&') : hex[1];
    [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else if (rgb) [r, g, b] = [+rgb[1], +rgb[2], +rgb[3]];
  else return null;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
const inkFor = (bg: string): string | null => { const b = brightness(bg); return b !== null && b < 0.45 ? '#f4efe4' : null; };

/** Dark page behind dark text means the content must sit on a paper sheet (bakelite radio, desk blotter…). */
export function needsSheet(exp: VisualExperience): boolean {
  if (exp.opts?.native) return false;
  const bg = brightness(exp.palette.bg), ink = brightness(exp.palette.ink);
  return bg !== null && ink !== null && bg < 0.45 && ink < 0.45;
}

export function experienceVars(exp: VisualExperience): Vars {
  const v: Vars = {};
  if (!exp.opts?.native) {
    const p = exp.palette;
    Object.assign(v, {
      '--bg': p.bg, '--paper': p.paper, '--ink': p.ink, '--ink-2': p.ink2 ?? p.ink, '--mute': p.mute, '--rule': p.rule, '--accent': p.accent,
      '--on-accent': p.onAccent ?? '#fff', '--up': p.up, '--down': p.down, '--link': p.link, '--focus': p.focus ?? p.accent,
    });
    if (p.panel) v['--panel'] = p.panel;
    // text-like colours must stay legible on the surfaces they sit on, whatever the palette author chose
    const surfaces = [flatten(p.paper, p.bg)].filter((c) => toRGB(c));
    const fit = (c: string, min = 4.5) => surfaces.reduce((acc, bgc) => ensureContrast(acc, bgc, min), c);
    v['--mute'] = fit(p.mute); v['--up'] = fit(p.up); v['--down'] = fit(p.down); v['--link'] = fit(p.link);
    v['--accent-ink'] = fit(p.accent, 6);
    { const oa = p.onAccent ?? '#ffffff', a = toRGB(p.accent), o = toRGB(oa);
      v['--on-accent'] = a && o && ratio(o, a) < 4.5 ? (ratio([255, 255, 255], a) >= ratio([0, 0, 0], a) ? '#ffffff' : '#000000') : oa; }
    v.colorScheme = brightness(p.bg) !== null && (brightness(needsSheet(exp) ? p.paper : p.bg) ?? 1) < 0.45 ? 'dark' : 'light';
    const t = exp.typography;
    Object.assign(v, { '--head-font': t.head, '--body-font': t.body, '--num-font': t.num, '--lead-font': t.lead ?? t.head });
    const set = (k: string, val?: string) => { if (val) v[k] = val; };
    set('--fs', t.fs); set('--lh', t.lh); set('--lead-fs', t.leadFs); set('--lead-fw', t.leadFw); set('--story-fs', t.storyFs); set('--story-fw', t.storyFw);
    set('--section-fs', t.sectionFs); set('--section-tt', t.sectionTt); set('--section-ls', t.sectionLs); set('--section-fw', t.sectionFw);
    const s = exp.spacing;
    if (s) { set('--maxw', s.maxw); set('--gutter', s.gutter); set('--main-pad', s.mainPad); set('--section-gap', s.sectionGap); set('--cell-pad', s.cellPad); set('--story-pad', s.storyPad); set('--radius', s.radius); }
  }
  if (exp.tokens) Object.assign(v, exp.tokens);
  const a2 = v['--accent-2'] ? toRGB(v['--accent-2']) : null;
  if (a2) v['--on-accent-2'] = ratio([255, 255, 255], a2) >= ratio([0, 0, 0], a2) ? '#ffffff' : '#000000';
  if (v['--dock-bg'] && !v['--dock-ink']) { const ink = inkFor(v['--dock-bg']); if (ink) v['--dock-ink'] = ink; }
  if (exp.motion.enter) v['--enter'] = exp.motion.enter;
  return v;
}

export function experienceStyle(exp: VisualExperience): CSSProperties {
  const style: Record<string, string> = experienceVars(exp);
  if (exp.background && !exp.opts?.native) style.background = exp.background;
  return style as CSSProperties;
}
