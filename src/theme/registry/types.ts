/**
 * VISUAL ERA REGISTRY — types
 * ---------------------------
 * A VisualExperience is a complete, data-only description of how the app looks and behaves on a
 * given range of dates. Components never branch on the year: they read the resolved experience.
 *
 * Reuse works on three levels:
 *   family     — which lazily-loaded code bundle supplies the shell (print, terminal, portal, …)
 *   archetype  — which page structure inside that family (header + home composition + chrome)
 *   composition/tokens — configurable layout and styling on top of an archetype
 */
import type { ISODate } from '../../core/dates';

export type VisualFamily =
  | 'print' | 'broadcast' | 'terminal' | 'desktop' | 'earlyweb' | 'portal'
  | 'web2' | 'skeuo' | 'flat' | 'modern' | 'experimental';

/** Page structure. Each id has its own header, navigation model and home composition. */
export type Archetype =
  // print
  | 'gazette' | 'archive' | 'victorian' | 'broadsheet' | 'deco' | 'wire' | 'radio' | 'midcentury' | 'swiss'
  // broadcast
  | 'broadcast' | 'teletext'
  // terminal
  | 'terminal' | 'dos' | 'workstation'
  // desktop
  | 'desktop'
  // early web
  | 'hypertext' | 'directory' | 'personal' | 'win98'
  // portal
  | 'portal' | 'xp' | 'enterprise'
  // web 2.0
  | 'web2'
  // skeuomorphic
  | 'mobile'
  // flat
  | 'metro' | 'material' | 'flat' | 'minimal'
  // modern
  | 'fintech' | 'dataterm' | 'retail' | 'glass' | 'bento' | 'research' | 'spatial'
  // experimental
  | 'flash' | 'finos' | 'liquid';

export type ModuleStyle = 'print' | 'terminal' | 'web';
export type TickerStyle = 'tape' | 'bulletin' | 'crawl' | 'terminal' | 'marquee' | 'glossy' | 'none';
export type ChartStyle = 'engraved' | 'print' | 'phosphor' | 'pixel' | 'gloss' | 'skeuo' | 'flat' | 'smooth';

export type NavModel =
  | 'sections'   // click newspaper section headings
  | 'pages'      // turn newspaper pages
  | 'dial'       // tune a frequency / channel dial
  | 'pagenum'    // type teletext page numbers, coloured keys
  | 'fkeys'      // terminal function keys + command line
  | 'menu'       // numbered menu
  | 'icons'      // program-manager icon grid + windows
  | 'links'      // underlined hyperlink bar
  | 'tabs'       // tabs (optionally with dropdown)
  | 'sidebar'    // persistent side navigation
  | 'tiles'      // metro tiles
  | 'segmented'  // segmented control
  | 'drawer'     // hamburger drawer + top app bar
  | 'topbar'     // flat top bar
  | 'palette'    // command palette (⌘K)
  | 'dock';      // floating dock

export type SearchKind = 'inquiry' | 'command' | 'pagenum' | 'form' | 'box' | 'omnibar' | 'palette' | 'dropdown-form' | 'ask';
export type MarketViz = 'table' | 'tape' | 'board' | 'tiles' | 'sparkcards' | 'chart-first' | 'heat';
export type NewsLayout = 'columns' | 'strips' | 'list' | 'cards' | 'directory' | 'bulletins' | 'feed' | 'tiles';
export type PortfolioStyle = 'ledger' | 'terminal' | 'form' | 'cards' | 'dashboard';
export type MotionProfile = 'still' | 'subtle' | 'rich';

export interface Typography {
  head: string; body: string; num: string; lead?: string;
  /** base size / line height / lead size etc. as CSS values */
  fs?: string; lh?: string; leadFs?: string; leadFw?: string; storyFs?: string; storyFw?: string;
  sectionFs?: string; sectionTt?: string; sectionLs?: string; sectionFw?: string;
  /** Google Fonts family specs to load on demand, e.g. "IM+Fell+English:ital@0;1" */
  fonts?: string[];
}

export interface Palette {
  bg: string; paper: string; ink: string; ink2?: string; mute: string; rule: string;
  accent: string; onAccent?: string; up: string; down: string; link: string; panel?: string; focus?: string;
}

export interface Spacing {
  maxw?: string; gutter?: string; mainPad?: string; sectionGap?: string; cellPad?: string; storyPad?: string; radius?: string;
}

/** A named slot a composition can place in a region. */
export type Slot =
  | { m: 'lead' } | { m: 'banner' }
  | { m: 'news'; from?: number; to?: number; title?: string; summary?: boolean; links?: boolean }
  | { m: 'markets'; groups?: ('indexes' | 'commodities' | 'rates' | 'international' | 'digital')[]; title?: string }
  | { m: 'movers'; limit?: number } | { m: 'economy' } | { m: 'companies' }
  | { m: 'sports'; limit?: number } | { m: 'culture' } | { m: 'weather' }
  | { m: 'ad'; i?: number } | { m: 'frontpages'; limit?: number }
  | { m: 'chart'; symbol?: string; title?: string }
  | { m: 'tiles'; count?: number } | { m: 'cats'; count?: number } | { m: 'ticker' }
  | { m: 'note'; text: string; className?: string };

/** Data-driven layout for composer-based homes: CSS grid + which slots go where. */
export interface Composition {
  /** grid-template-columns value */
  cols: string;
  /** optional grid-template-areas rows, e.g. ["lead lead side", "news mkts side"] */
  areas?: string[];
  regions: Record<string, Slot[]>;
  /** className hook so a family stylesheet can style the composition */
  className?: string;
  /** collapse to a single column at or below this width (px) */
  collapseAt?: number;
  /** Optional multi-page composition: only one page shows at a time and the nav model switches it. */
  pages?: ComposedPage[];
}

export interface ComposedPage {
  label: string;
  /** teletext page number, function key (F1…), or menu number — the nav model decides how it is shown */
  key: string;
  comp: Omit<Composition, 'pages'>;
}

export type DecorId =
  | 'ornament-rule' | 'woodcut' | 'engraved-border' | 'fleuron' | 'deco-chevrons' | 'ink-grain' | 'paper-fold'
  | 'counter' | 'construction' | 'under-construction' | 'webring' | 'netscape-n' | 'status-bar' | 'bevel' | 'scanlines'
  | 'vignette' | 'tv-bezel' | 'snow' | 'aurora' | 'depth' | 'noise' | 'stitches' | 'linen' | 'leather' | 'reflection'
  | 'start-bar' | 'visitor-badge' | 'beta-badge' | 'ticker-bar' | 'grid-paper';

export type Interaction =
  | 'turn-pages' | 'expand-articles' | 'section-jump' | 'tune-dial' | 'teletext-pages' | 'fkeys' | 'command-line' | 'numeric-menu'
  | 'movable-windows' | 'hyperlinks' | 'directory-browse' | 'dropdown-nav' | 'tab-nav' | 'collapsible-widgets' | 'segmented-controls'
  | 'tile-nav' | 'drawer-nav' | 'command-palette' | 'contextual-panel' | 'hover-cards' | 'chart-scrub' | 'dock-nav' | 'screens';

export interface VisualExperience {
  id: string;
  name: string;
  from: ISODate;
  to: ISODate;
  family: VisualFamily;
  archetype: Archetype;
  /** Honest implementation state — shown in the gallery. */
  status: 'complete' | 'partial' | 'planned';
  /** What the design is modelled on and why (short, shown in the gallery and design reference). */
  rationale: string;
  publication: string;
  motto: string;
  price?: string;
  headlineCase?: 'upper' | 'title';
  module: ModuleStyle;
  ticker: TickerStyle;
  chart: ChartStyle;
  fractions?: boolean;
  typography: Typography;
  palette: Palette;
  spacing?: Spacing;
  /** extra raw CSS custom properties (borders, shadows, dock, modal…) */
  tokens?: Record<string, string>;
  /** CSS `background` shorthand for the page */
  background?: string;
  nav: { model: NavModel; items?: string[] };
  search: SearchKind;
  market: MarketViz;
  news: NewsLayout;
  portfolio: PortfolioStyle;
  motion: { profile: MotionProfile; enter?: string; loop?: boolean };
  interactions: Interaction[];
  decor: DecorId[];
  responsive: { collapseAt: number; stack?: boolean };
  a11y: { contrast: 'AA' | 'AAA'; reducedMotion: 'respect'; minText: number };
  composition?: Composition;
  /** era-voiced loading string (also used by the Suspense fallback) */
  loading: string;
  /** small year-specific details (counters, status bars, …) — real UI, not fabricated content */
  details: string[];
  /** label overrides on top of the archetype's label set */
  labels?: Partial<import('../eras').EraLabels>;
  /** free-form per-experience options consumed by the family shell (e.g. { dropdown: true }) */
  opts?: Record<string, string | number | boolean>;
  variant?: string;
}
