#!/usr/bin/env node
/**
 * Regenerates the per-experience tables inside docs/design-reference.md from the registry so the
 * document cannot drift from the code. Hand-written text lives outside the GEN markers.
 *   node scripts/gen-design-doc.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(mkdtempSync(join(tmpdir(), 'mtm-doc-')), 'registry.mjs');
await build({ entryPoints: [join(root, 'src/theme/registry/index.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error' });
const { CATALOG } = await import(pathToFileURL(out).href);

/**
 * Design conventions and source categories per archetype. "Sources" names a CATEGORY of period material
 * (typography specimens, interface guidelines, trade manuals), never a specific publication to copy.
 */
const NOTES = {
  gazette: ['Dense text-first columns, long-s and ligature-era letterforms, ornamental rules and a woodcut or royal-arms style cut at the masthead; commodity and shipping lists set as running text.', 'period printing manuals; type specimens of old-style faces'],
  archive: ['Narrow multi-column broadsheet in an old-style serif, small caps for section heads, price lists in tabular columns separated by dotted leaders.', 'period newspaper typography; commercial-printing manuals'],
  victorian: ['Ornate display faces mixed in one masthead, engraved borders, ruled column boxes and heavy small-caps headings.', 'Victorian jobbing-type specimens; engraved periodical layout'],
  broadsheet: ['Stacked multi-deck headlines in condensed gothics, a banner head, tight columns and a ticker-like market table.', 'period newspaper typography; early-20th-century front-page layout'],
  deco: ['Geometric sans display capitals, chevron and sunburst ornament, strong horizontal bands, gold-and-black palettes.', 'Art Deco poster and masthead typography'],
  wire: ['Telegraph-style compression: all-caps datelines, short bulletin paragraphs, flat grids and minimal ornament for speed.', 'wire-service and wartime bulletin layout conventions'],
  radio: ['Rounded bakelite-cabinet framing, dial and station-listing motifs, a programme-schedule feel layered over a newspaper grid.', 'broadcast programme-listing layout; industrial design of the period'],
  midcentury: ['Grotesque sans heads over a serif body, generous white space, modular grids and restrained colour accents.', 'mid-century editorial design; early International Style'],
  swiss: ['Flush-left ragged-right sans on a strict modular grid, asymmetry, rule-driven hierarchy and almost no ornament.', 'International Typographic Style grid systems'],
  broadcast: ['Screen-within-a-frame layout: a rounded CRT bezel, lower-third strips, bold caps and a bulletin crawl.', 'television graphics conventions; broadcast safe-area practice'],
  teletext: ['Fixed 40x24 character grid, seven saturated colours on black, double-height headings, page-number navigation and coloured fastext keys.', 'teletext/videotex display standards (block mosaic graphics)'],
  terminal: ['Monochrome phosphor text on a character grid, a command line, function-key legend, scanline and glow effects.', 'CRT terminal conventions; VT-class text interfaces'],
  dos: ['Blue-on-grey or white-on-black text mode, box-drawing frames, drop-down menu bar with hotkeys, status line of key hints.', 'DOS text-mode UI conventions (CUA-style menus)'],
  workstation: ['Tiled bitmap windows, monochrome dithering, thin title bars and a menu-driven file-manager look.', 'early workstation window-system conventions'],
  desktop: ['Overlapping windows with title bars, icon grid in a program-manager style, a 3D bevel on every control.', 'Macintosh Human Interface Guidelines; Windows 3.x UI guidelines'],
  hypertext: ['Grey default background, blue underlined links, Times body, left-aligned single column, inline images and horizontal rules.', 'early browser default stylesheets; HTML 2.0-era page conventions'],
  directory: ['Category directory with a search box on top, bulleted topic lists, small coloured-link banners and tight table layouts.', 'late-1990s web directory and table-based layout conventions'],
  personal: ['Hand-built pages: tiled backgrounds, centred headings, counters, "under construction" signs and webring badges (generic, unbranded).', 'personal home page vernacular; early HTML tutorials'],
  win98: ['Grey bevelled controls, a navy title-bar gradient, taskbar with a start button and sunken status panes.', 'Windows 95/98 UI guidelines'],
  portal: ['Crowded tabbed portal: a channel list, boxed modules, a weather and quote strip, and a hero headline in a table grid.', 'late-1990s portal layout; table-based page design'],
  xp: ['Rounded luna-style title bars, task-pane sidebar, bright blue and green accents, soft gradients.', 'Windows XP visual style guidelines'],
  enterprise: ['Dense intranet dashboards: sober blue, tree navigation, grids and toolbars, form-heavy layout.', 'enterprise web application conventions of the early 2000s'],
  flash: ['Full-bleed vector stage, animated intro-style transitions, custom oversized nav and glossy buttons.', 'multimedia-plugin site design of the period'],
  web2: ['Centred fixed-width page, rounded corners, gradient buttons, reflections, pastel badges, large friendly sans.', 'Web 2.0 style guides and CSS-era layout patterns'],
  mobile: ['Glossy or textured touch UI: tab bar, grouped lists, large tappable rows, stitched leather or linen surfaces.', 'early touch-platform human-interface guidelines'],
  metro: ['Flat colour tiles on a grid, large light typography, content-first with no chrome and horizontal panorama sections.', 'typography-led flat design guidelines'],
  material: ['Elevation via shadow, a top app bar with drawer, floating action button, bold primary colour and baseline grid.', 'Material Design guidelines'],
  flat: ['Flat surfaces without gradients, thin dividers, system sans-serif, a top bar and generous touch targets.', 'flat-design and responsive web conventions'],
  minimal: ['Few elements, large type and white space, hairline rules, one accent colour.', 'minimalist interface practice'],
  fintech: ['Card-based dashboards, rounded containers, green/red deltas with tabular numerals, a soft neutral palette.', 'consumer finance app patterns'],
  dataterm: ['Dense dark grid, monospaced numerals, colour-coded columns, keyboard-first command bar.', 'professional trading-terminal conventions'],
  retail: ['Single-purpose list-and-chart screens, big tap targets, friendly rounded sans, confetti-free restraint.', 'mobile retail-investing app patterns'],
  glass: ['Translucent blurred panels over gradients, subtle borders, light-on-dark type.', 'glassmorphism interface trends'],
  bento: ['Modular rounded tiles of mixed size on one grid, each tile one idea.', 'bento-grid dashboard layout'],
  research: ['Document-like reading column, inline citations and sidebars, calm neutral palette, tables over charts.', 'research-notebook and long-form reading UI'],
  spatial: ['Floating layered panels with depth, large radii, soft shadows and a dock.', 'spatial/depth-based interface guidelines'],
  finos: ['Stacked cards and bold type with an ambient gradient, motion-forward micro-interactions.', 'contemporary fintech app design'],
  liquid: ['Fluid translucent surfaces, specular highlights and morphing controls over a content-first layout.', 'current system-level design language trends'],
};

const yrs = (e) => `${e.from.slice(0, 4)}–${e.to.startsWith('2999') ? 'now' : e.to.slice(0, 4)}`;
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

const lines = [];
const families = [...new Set(CATALOG.map((e) => e.family))];
for (const f of families) {
  const list = CATALOG.filter((e) => e.family === f);
  lines.push(`### ${f} (${list.length})`, '', '| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |', '|---|---|---|---|---|---|');
  for (const e of list) {
    const [conv, src] = NOTES[e.archetype] ?? ['(add notes for this archetype in scripts/gen-design-doc.mjs)', 'n/a'];
    lines.push(`| \`${e.id}\` | ${yrs(e)} | ${e.archetype} | ${cell(e.rationale)} | ${cell(conv)} | ${cell(src)} |`);
  }
  lines.push('');
}
const missing = [...new Set(CATALOG.map((e) => e.archetype))].filter((a) => !NOTES[a]);
if (missing.length) console.warn('archetypes without notes:', missing.join(', '));

const docPath = join(root, 'docs/design-reference.md');
const doc = readFileSync(docPath, 'utf8');
const re = /(<!-- GEN:START -->)[\s\S]*(<!-- GEN:END -->)/;
if (!re.test(doc)) throw new Error('docs/design-reference.md is missing the GEN markers');
writeFileSync(docPath, doc.replace(re, `$1\n\n${lines.join('\n')}\n$2`));
console.log(`wrote ${CATALOG.length} experiences, ${families.length} families`);
