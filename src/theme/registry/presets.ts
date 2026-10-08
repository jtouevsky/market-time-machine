/**
 * Shared building blocks for the catalog: type stacks, palettes and the `xp()` helper that
 * fills in sensible defaults so each catalog entry only states what makes it different.
 */
import type { Palette, Typography, VisualExperience } from './types';

// ------------------------------------------------------------------ type stacks
export const F = {
  fell: "'IM Fell English', Georgia, 'Times New Roman', serif",
  fellSC: "'IM Fell English SC', 'IM Fell English', Georgia, serif",
  fellDP: "'IM Fell Double Pica', 'IM Fell English', Georgia, serif",
  fellDW: "'IM Fell DW Pica', 'IM Fell English', Georgia, serif",
  black: "'UnifrakturMaguntia', 'Old English Text MT', Georgia, serif",
  oldstd: "'Old Standard TT', 'Times New Roman', Georgia, serif",
  bask: "'Libre Baskerville', Baskerville, Georgia, serif",
  slab: "'Alfa Slab One', 'Rockwell', 'Roboto Slab', Georgia, serif",
  bree: "'Bree Serif', Georgia, serif",
  playfair: "'Playfair Display', 'Old Standard TT', Georgia, serif",
  cinzel: "'Poiret One', 'Jost', 'Futura', 'Century Gothic', sans-serif",
  typewriter: "'Special Elite', 'Courier Prime', 'Courier New', monospace",
  courier: "'Courier Prime', 'Courier New', monospace",
  vt: "'VT323', 'IBM Plex Mono', monospace",
  plexmono: "'IBM Plex Mono', 'Courier New', monospace",
  pixel: "'Press Start 2P', 'VT323', monospace",
  teletext: "'VT323', 'Courier New', monospace",
  jost: "'Jost', 'Futura', 'Century Gothic', sans-serif",
  swiss: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  times: "'Times New Roman', Times, serif",
  arial: "Arial, Helvetica, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Verdana, Geneva, sans-serif",
  trebuchet: "'Trebuchet MS', Verdana, sans-serif",
  comic: "'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif",
  lucida: "'Lucida Grande', 'Lucida Sans Unicode', Verdana, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  helv: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  roboto: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
  robotoSlab: "'Roboto Slab', Georgia, serif",
  segoe: "'Segoe UI', 'Open Sans', Tahoma, sans-serif",
  open: "'Open Sans', 'Segoe UI', Arial, sans-serif",
  lato: "'Lato', 'Helvetica Neue', Arial, sans-serif",
  inter: "'Inter', 'Manrope', system-ui, sans-serif",
  manrope: "'Manrope', 'Inter', system-ui, sans-serif",
  space: "'Space Grotesk', 'Manrope', system-ui, sans-serif",
  plex: "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
  display: "'Sora', 'Manrope', system-ui, sans-serif",
};

/** Google Fonts specs (loaded lazily, only for the experience that needs them). */
export const GF = {
  fell: ['IM+Fell+English:ital@0;1', 'IM+Fell+English+SC', 'IM+Fell+Double+Pica:ital@0;1', 'IM+Fell+DW+Pica:ital@0;1'],
  black: ['UnifrakturMaguntia'],
  oldstd: ['Old+Standard+TT:ital,wght@0,400;0,700;1,400'],
  bask: ['Libre+Baskerville:ital,wght@0,400;0,700;1,400'],
  slab: ['Alfa+Slab+One', 'Roboto+Slab:wght@400;700'],
  bree: ['Bree+Serif'],
  playfair: ['Playfair+Display:ital,wght@0,400;0,700;0,900;1,400'],
  deco: ['Poiret+One', 'Jost:wght@400;500;700'],
  typewriter: ['Special+Elite', 'Courier+Prime:wght@400;700'],
  courier: ['Courier+Prime:wght@400;700'],
  vt: ['VT323', 'IBM+Plex+Mono:wght@400;600'],
  pixel: ['Press+Start+2P', 'VT323'],
  inter: ['Inter:wght@300;400;500;600;700'],
  manrope: ['Manrope:wght@300;400;500;600;700'],
  space: ['Space+Grotesk:wght@400;500;700', 'Inter:wght@400;500;600'],
  plex: ['IBM+Plex+Sans:wght@300;400;500;600', 'IBM+Plex+Mono:wght@400;500'],
  roboto: ['Roboto:wght@300;400;500;700'],
  open: ['Open+Sans:wght@300;400;600;700'],
  lato: ['Lato:wght@300;400;700;900'],
  sora: ['Sora:wght@300;400;600;700', 'Manrope:wght@400;500;600'],
};

export const type = (o: Partial<Typography> & Pick<Typography, 'head' | 'body'>): Typography => ({ num: o.body, ...o });
export const pal = (o: Palette): Palette => o;

const FAMILY_MODULE = {
  print: 'print', broadcast: 'print', terminal: 'terminal', desktop: 'web', earlyweb: 'web', portal: 'web', web2: 'web', skeuo: 'web',
  flat: 'web', modern: 'web', experimental: 'web',
} as const;

type Required_ = 'id' | 'name' | 'from' | 'to' | 'family' | 'archetype' | 'rationale' | 'publication' | 'motto' | 'typography' | 'palette' | 'nav' | 'search' | 'market' | 'news' | 'portfolio' | 'interactions';

/**
 * Fills in defaults. Everything defaulted here is a sane baseline — entries override what makes
 * them distinct (fonts, palette, composition, decor, interaction model).
 */
export function xp(o: Pick<VisualExperience, Required_> & Partial<Omit<VisualExperience, Required_>>): VisualExperience {
  const web = FAMILY_MODULE[o.family] === 'web';
  return {
    status: 'complete',
    module: FAMILY_MODULE[o.family],
    ticker: 'none',
    chart: web ? 'flat' : 'print',
    fractions: o.from < '2001-04-09',
    headlineCase: web ? 'title' : 'upper',
    motion: { profile: 'subtle' },
    decor: [],
    responsive: { collapseAt: 760, stack: true },
    a11y: { contrast: 'AA', reducedMotion: 'respect', minText: web ? 12 : 12 },
    loading: web ? 'Loading' : 'Setting type…',
    details: [],
    ...o,
  };
}
