# Design reference

Internal reference for the 63 era experiences in `src/theme/registry`. The per-experience tables below are
generated (`node scripts/gen-design-doc.mjs`); everything else is hand-written.

## Ground rules

- **Original work only.** Every experience is an homage to *genre conventions* (typography, grid, UI paradigm),
  never a copy of a particular publication, site, product or advertisement. Publication names, mottos, prices and
  decor in the registry are invented.
- **No real brands, ads, headlines or quotes are reproduced.** News content comes from the dated data layer;
  ads and badges are generic, unbranded and clearly decorative. Easter eggs are playful and original.
- **Dates are design targets, not claims** that every publication of a period looked alike.
- **Honest status.** `complete` / `partial` / `planned` in the registry is shown in the dev gallery. Most
  experiences are `planned`: they render through their family shell with era tokens but not yet bespoke chrome.
- **Accessibility is not period-accurate and is never traded away.** 4.5:1 text contrast is enforced in
  `theme/styleVars.ts` (`ensureContrast`); motion respects `prefers-reduced-motion`; all interaction paradigms
  have keyboard paths.
- **Fonts.** Period faces are approximated with openly licensed web fonts, loaded on demand per experience
  (`theme/fonts.ts`), with system-font fallbacks. `src/__tests__/fonts.test.ts` guards coverage.

## How an experience is composed

1. **Family**: which lazily loaded shell supplies the page (print, terminal, portal, ...).
2. **Archetype**: page structure, navigation model and home composition inside the family.
3. **Tokens**: palette, typography, spacing, decor, motion: pure data in the catalog. Components never branch on the year.

## Families

| family | span | paradigm | what we borrow |
|---|---|---|---|
| print | 1000s-1950s | the page as a printed sheet | column grids, old-style then grotesque type, rules and ornament, price tables |
| broadcast | 1950s-1970s | the screen as a frame | CRT bezels, lower thirds, tuning dials, teletext page grids |
| terminal | 1980s | text on a phosphor screen | character-cell grids, function keys, command lines, text-mode menus |
| desktop | 1989-1992 | windows and icons | bevelled controls, overlapping windows, program-manager icon grids |
| earlyweb | 1993-1998 | hand-built hypertext | default link colours, tiled backgrounds, table layouts, directories |
| portal | 1999-2002, 2016 | everything on one page | boxed modules, channel tabs, task panes, dense intranet grids |
| web2 | 2003-2008 | the friendly web | rounded corners, gradients, reflections, badges |
| skeuo | 2009-2012 | touch with physical metaphors | leather, linen, gloss, tab bars, grouped lists |
| flat | 2013-2017 | content over chrome | tiles, elevation, flat colour, responsive grids |
| modern | 2018-2024 | systems and cards | tabular numerals, bento tiles, glass, calm research layouts |
| experimental | 2000, 2025-now | outliers and the present | vector-stage sites; fluid, translucent interfaces |

## Family notes

### print
Pre-1800 pages are set in old-style serifs with long columns and few images; 19th-century pages add display
faces, engraved borders and stacked headline decks; the 1920s-30s bring geometric sans and Art Deco ornament;
the 1940s compress to wire-service bulletins; the 1950s-60s move to grotesques and the modular grid. Market
tables use dotted leaders, fractions where the era quoted them, and tabular figures.
*Sources: type specimens, printing and layout manuals of each period.*

### broadcast
Television-era experiences frame the page inside a screen. 1950s-60s: rounded bezel, bold caps, a crawl or tape.
Colour TV adds saturated bars. Teletext and videotex use a fixed 40x24 grid of block graphics with page-number
navigation and four colour keys; the date format follows that medium (`Mon 03 Jul 77`).
*Sources: broadcast graphics conventions, teletext display standards.*

### terminal
Monochrome phosphor (green, amber) text with scanlines and glow; commands, function-key legends and numbered
menus. DOS adds text-mode box drawing and menu bars with hotkeys; workstations add tiled monochrome windows.
*Sources: CRT terminal conventions, DOS text-mode UI conventions.*

### desktop, earlyweb, portal
The GUI and early-web eras share bevelled 3D controls, then diverge: early web is browser defaults and table
hacks (counters, "under construction" signs, webrings as generic badges); portals pack channels and modules;
XP-era portals use rounded title bars and a task pane; enterprise sites go sober and form-heavy.
*Sources: Macintosh and Windows interface guidelines, early browser default stylesheets, HTML tutorials of the time.*

### web2, skeuo
Fixed-width centred pages, gradients, glossy buttons, reflections and beta badges (2003-08); then touch
interfaces with physical metaphors: stitched leather, linen, glossy icons, tab bars (2009-12).
*Sources: early touch-platform interface guidelines, Web 2.0-era style guides.*

### flat, modern, experimental
Tiles and typography-first screens (2013), elevation and app bars (2014, 2017), minimal flat pages (2015-16, 2018);
dense terminal-style dashboards (2019), friendly retail apps (2020), glass (2021), bento grids (2022), research
notebooks (2023), spatial depth (2024), contemporary fintech (2025) and a liquid, translucent present (2026+).
*Sources: Material and other platform guidelines, contemporary product-design practice.*

## Easter eggs

Each experience has at least a small original delight (`src/theme/easterEggs.ts`): a hidden command on terminal
eras, a masthead click-streak on print eras, the Konami code on GUI and web eras, a typed word elsewhere. They
announce through an `aria-live` region, close with Escape, make no sound, skip animation under
`prefers-reduced-motion`, and contain no historical claims.

## Dev gallery

`npm run dev`, then open `/?gallery` (or press Ctrl+Shift+G). Previews are iframes at `/?previewDate=YYYY-MM-DD`
and use a synthetic session, so the real saved session is never read or written. The gallery is dev-only and is
not part of production builds.

## Per-experience reference

Columns: **modelled on** is the registry's own `rationale`; **conventions applied** and **source category** come
from the archetype notes in `scripts/gen-design-doc.mjs`.

<!-- GEN:START -->

### print (19)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `newsbook-1600` | 1000–1699 | gazette | English "corantos" and newsbooks: one dense column, black-letter masthead, woodcut ornaments, a merchant-price list printed on the back leaf. | Dense text-first columns, long-s and ligature-era letterforms, ornamental rules and a woodcut or royal-arms style cut at the masthead; commodity and shipping lists set as running text. | period printing manuals; type specimens of old-style faces |
| `gazette-1700` | 1700–1749 | gazette | Colonial-American and Georgian gazettes: four narrow columns, formal masthead with a royal-arms style cut, Foreign Advices, a Marine List of shipping and commodity prices. | Dense text-first columns, long-s and ligature-era letterforms, ornamental rules and a woodcut or royal-arms style cut at the masthead; commodity and shipping lists set as running text. | period printing manuals; type specimens of old-style faces |
| `gazette-1750` | 1750–1799 | gazette | Late 18th-century papers: three structured columns, a stronger typographic hierarchy, printed Notices set in ruled boxes, engraved-style separators. | Dense text-first columns, long-s and ligature-era letterforms, ornamental rules and a woodcut or royal-arms style cut at the masthead; commodity and shipping lists set as running text. | period printing manuals; type specimens of old-style faces |
| `mercantile-1800` | 1800–1829 | archive | Early-19th-century commercial papers led with prices current, shipping manifests and commodity quotations; news was a small side column, imagery was nearly absent. | Narrow multi-column broadsheet in an old-style serif, small caps for section heads, price lists in tabular columns separated by dotted leaders. | period newspaper typography; commercial-printing manuals |
| `penny-1830` | 1830–1849 | archive | The penny papers of the 1830s–40s: cheap, urban, with bigger headlines, compact columns, and a far wider range of news than the old mercantile sheets. | Narrow multi-column broadsheet in an old-style serif, small caps for section heads, price lists in tabular columns separated by dotted leaders. | period newspaper typography; commercial-printing manuals |
| `victorian-1850` | 1850–1869 | victorian | Illustrated weeklies and metropolitan dailies of the mid-Victorian period: ornate mastheads, engraved image frames, fine decorative lines, dense market tables. | Ornate display faces mixed in one masthead, engraved borders, ruled column boxes and heavy small-caps headings. | Victorian jobbing-type specimens; engraved periodical layout |
| `industrial-1870` | 1870–1889 | archive | Post-Civil-War financial dailies: confident business identity, exchange quotations in structured columns, railway and bank stocks, a ticker-tape strip. | Narrow multi-column broadsheet in an old-style serif, small caps for section heads, price lists in tabular columns separated by dotted leaders. | period newspaper typography; commercial-printing manuals |
| `turn-1890` | 1890–1899 | broadsheet | The 1890s "yellow press" era: large display headlines, decorative advertisements, strong illustration and editorial hierarchy, multi-deck banner heads. | Stacked multi-deck headlines in condensed gothics, a banner head, tight columns and a ticker-like market table. | period newspaper typography; early-20th-century front-page layout |
| `edwardian-1900` | 1900–1909 | broadsheet | Edwardian dailies: six or more tightly ruled columns, dense stacked headlines, fine ornamental borders, minimal photography. | Stacked multi-deck headlines in condensed gothics, a banner head, tight columns and a ticker-like market table. | period newspaper typography; early-20th-century front-page layout |
| `earlymod-1910` | 1910–1913 | broadsheet | Early 1910s metropolitan dailies: cleaner four-column grids, bolder serif headlines, illustrated department-store advertisements. | Stacked multi-deck headlines in condensed gothics, a banner head, tight columns and a ticker-like market table. | period newspaper typography; early-20th-century front-page layout |
| `wartime-1914` | 1914–1918 | wire | Great War bulletins and extras: urgent oversized headlines, numbered dispatches, restrained black-and-red printing. A design language only — no war news is implied for any given date. | Telegraph-style compression: all-caps datelines, short bulletin paragraphs, flat grids and minimal ornament for speed. | wire-service and wartime bulletin layout conventions |
| `postwar-1919` | 1919–1924 | broadsheet | Early-1920s business dailies: tables first, broader white space, calmer headlines — the page of a nation back at work. | Stacked multi-deck headlines in condensed gothics, a banner head, tight columns and a ticker-like market table. | period newspaper typography; early-20th-century front-page layout |
| `deco-1925` | 1925–1929 | deco | Late-1920s metropolitan dailies and bank-hall graphics: Art Deco chevrons and stepped dividers, bold condensed headlines, a market-ticker band across the masthead. | Geometric sans display capitals, chevron and sunburst ornament, strong horizontal bands, gold-and-black palettes. | Art Deco poster and masthead typography |
| `depression-1930` | 1930–1934 | broadsheet | Early-1930s dailies: heavy black headlines, compact market tables, stark editorial design with little ornament. | Stacked multi-deck headlines in condensed gothics, a banner head, tight columns and a ticker-like market table. | period newspaper typography; early-20th-century front-page layout |
| `radio-1935` | 1935–1939 | radio | The golden age of network radio: newspaper-plus-program-guide graphics, a bakelite set with a tuning dial, bulletin panels per station. | Rounded bakelite-cabinet framing, dial and station-listing motifs, a programme-schedule feel layered over a newspaper grid. | broadcast programme-listing layout; industrial design of the period |
| `wire-1940` | 1940–1945 | wire | Wire-service copy of the 1940s: typewriter type on paper strips, numbered slugs and datelines, restrained graphics. A design language only — no events are implied for any date. | Telegraph-style compression: all-caps datelines, short bulletin paragraphs, flat grids and minimal ornament for speed. | wire-service and wartime bulletin layout conventions |
| `postwar-1946` | 1946–1949 | midcentury | Late-1940s modernist editorial design: cleaner grids, early sans-serif display type, an asymmetric front page built around the day’s photograph or front-page scan. | Grotesque sans heads over a serif body, generous white space, modular grids and restrained colour accents. | mid-century editorial design; early International Style |
| `midcentury-1950` | 1950–1954 | midcentury | Early-1950s metropolitan press: strong sans-serif section mastheads, a four-column newspaper grid, black-and-white photography (here, the day’s real front-page scans). | Grotesque sans heads over a serif body, generous white space, modular grids and restrained colour accents. | mid-century editorial design; early International Style |
| `swiss-1960` | 1960–1964 | swiss | International Typographic Style applied to business publishing: a twelve-column grid, flush-left sans-serif type, one red accent, generous white space. | Flush-left ragged-right sans on a strict modular grid, asymmetry, rule-driven hierarchy and almost no ornament. | International Typographic Style grid systems |

### broadcast (5)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `tv-1955` | 1955–1959 | broadcast | Black-and-white network news: a cabinet television set, hand-lettered title cards, and simple bulletin graphics over a monochrome CRT. | Screen-within-a-frame layout: a rounded CRT bezel, lower-third strips, bold caps and a bulletin crawl. | television graphics conventions; broadcast safe-area practice |
| `space-1965` | 1965–1969 | broadcast | Mid-1960s network news: modernist geometry, a console television, broadcast news strips, space-age type and the evening newscast structure. | Screen-within-a-frame layout: a rounded CRT bezel, lower-third strips, bold caps and a bulletin crawl. | television graphics conventions; broadcast safe-area practice |
| `colortv-1970` | 1970–1973 | broadcast | Early-1970s colour newscasts: saturated broadcast browns and oranges, rounded slab type, bold lower-third banners, large information panels. | Screen-within-a-frame layout: a rounded CRT bezel, lower-third strips, bold caps and a bulletin crawl. | television graphics conventions; broadcast safe-area practice |
| `teletext-1974` | 1974–1976 | teletext | Broadcast teletext (Ceefax/Oracle era): a 40×24 block-character grid, seven colours, three-digit page numbers and four coloured navigation keys. | Fixed 40x24 character grid, seven saturated colours on black, double-height headings, page-number navigation and coloured fastext keys. | teletext/videotex display standards (block mosaic graphics) |
| `videotex-1977` | 1977–1979 | teletext | Viewdata / videotex services (Prestel-style): a blue frame, character-cell graphics, numeric menu navigation and data-table pages for financial subscribers. | Fixed 40x24 character grid, seven saturated colours on black, double-height headings, page-number navigation and coloured fastext keys. | teletext/videotex display standards (block mosaic graphics) |

### terminal (4)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `green-1980` | 1980–1982 | terminal | Early timesharing and videotext terminals: monochrome green phosphor, box-drawing frames, keyboard-only operation and dense quotation tables. | Monochrome phosphor text on a character grid, a command line, function-key legend, scanline and glow effects. | CRT terminal conventions; VT-class text interfaces |
| `amber-1983` | 1983–1984 | terminal | Dedicated financial-information terminals: amber on black, structured quote screens selected with function keys, a status line with the clock. | Monochrome phosphor text on a character grid, a command line, function-key legend, scanline and glow effects. | CRT terminal conventions; VT-class text interfaces |
| `dos-1985` | 1985–1986 | dos | Dial-up information services on the IBM PC: cyan and white text on blue, ASCII-framed menus and numeric shortcuts. | Blue-on-grey or white-on-black text mode, box-drawing frames, drop-down menu bar with hotkeys, status line of key hints. | DOS text-mode UI conventions (CUA-style menus) |
| `workstation-1987` | 1987–1988 | workstation | Late-1980s trading-desk workstations: several panes at once — wires, quote boards, indices — with price changes highlighted and a command line along the bottom. | Tiled bitmap windows, monochrome dithering, thin title bars and a menu-driven file-manager look. | early workstation window-system conventions |

### desktop (2)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `mono-1989` | 1989–1990 | desktop | First-generation graphical desktops: 1-bit black-and-white windows with pixel borders, a menu bar with pull-downs, folder icons and draggable windows. | Overlapping windows with title bars, icon grid in a program-manager style, a 3D bevel on every control. | Macintosh Human Interface Guidelines; Windows 3.x UI guidelines |
| `win3-1991` | 1991–1992 | desktop | Early-1990s PC graphical shells: a Program-Manager-style group window, grey beveled controls, navy title bars and a teal desktop. | Overlapping windows with title bars, icon grid in a program-manager style, a 3D bevel on every control. | Macintosh Human Interface Guidelines; Windows 3.x UI guidelines |

### earlyweb (5)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `hypertext-1993` | 1993–1994 | hypertext | The first graphical browsers (Mosaic era): a plain grey page, black Times text, underlined blue links, headings and horizontal rules. No tables, no images, almost no layout. | Grey default background, blue underlined links, Times body, left-aligned single column, inline images and horizontal rules. | early browser default stylesheets; HTML 2.0-era page conventions |
| `netscape-1995` | 1995–1995 | hypertext | The browser itself is part of the page: grey chrome, toolbar buttons, a location field, directory buttons and a throbber, over a white document with blue links. | Grey default background, blue underlined links, Times body, left-aligned single column, inline images and horizontal rules. | early browser default stylesheets; HTML 2.0-era page conventions |
| `personal-1996` | 1996–1996 | personal | Hand-built personal homepages: tiled starfield background, cream content boxes, rainbow rules, a visitor counter and a webring footer. Original decorations only. | Hand-built pages: tiled backgrounds, centred headings, counters, "under construction" signs and webring badges (generic, unbranded). | personal home page vernacular; early HTML tutorials |
| `directory-1997` | 1997–1997 | directory | Yahoo-style web directories: a compact category index in a table, “What’s New”, search box on top, minimal graphics and a lot of underlined links. | Category directory with a search box on top, bulleted topic lists, small coloured-link banners and tight table layouts. | late-1990s web directory and table-based layout conventions |
| `win98-1998` | 1998–1998 | win98 | Late-90s corporate finance sites built to look like the desktop around them: grey beveled bars, dense link grids, a quick-links column and a status bar. | Grey bevelled controls, a navy title-bar gradient, taskbar with a start button and sunken status panes. | Windows 95/98 UI guidelines |

### portal (4)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `portal-1999` | 1999–1999 | portal | Late-90s “everything” portals: coloured tab navigation, a scrolling market ticker, banner ad modules, and a search box above a dense three-column page. | Crowded tabbed portal: a channel list, boxed modules, a weather and quote strip, and a hero headline in a table grid. | late-1990s portal layout; table-based page design |
| `flash-2000` | 2000–2000 | flash | The Flash-intro era: a loading bar and a skippable intro, pixel-font navigation buttons, neon-on-dark panels and “movie” frames around content. | Full-bleed vector stage, animated intro-style transitions, custom oversized nav and glossy buttons. | multimedia-plugin site design of the period |
| `xp-2001` | 2001–2001 | xp | Luna-era software and web: rounded glossy blue title bars, tan control panels, task-pane navigation and a small system status bar. | Rounded luna-style title bars, task-pane sidebar, bright blue and green accents, soft gradients. | Windows XP visual style guidelines |
| `enterprise-2002` | 2002–2002 | enterprise | Corporate and institutional portals: blue-grey gradients, a left tree of links, breadcrumbs, nested tables and “tabbed panel” boxes. | Dense intranet dashboards: sober blue, tree navigation, grids and toolbars, form-heavy layout. | enterprise web application conventions of the early 2000s |

### web2 (6)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `clean-2003` | 2003–2003 | web2 | Web-standards era: table layouts replaced with CSS columns, more white space, a clean left sidebar, Georgia headings with Verdana body. | Centred fixed-width page, rounded corners, gradient buttons, reflections, pastel badges, large friendly sans. | Web 2.0 style guides and CSS-era layout patterns |
| `rounded-2004` | 2004–2004 | web2 | The first rounded-corner, soft-gradient sites: friendly Trebuchet headings, green accents, rounded module headers and glossy-lite buttons. | Centred fixed-width page, rounded corners, gradient buttons, reflections, pastel badges, large friendly sans. | Web 2.0 style guides and CSS-era layout patterns |
| `ajax-2005` | 2005–2005 | web2 | Early “web as application” dashboards: panels you can collapse, expand and reorder without a page load, soft gradients and compact controls. | Centred fixed-width page, rounded corners, gradient buttons, reflections, pastel badges, large friendly sans. | Web 2.0 style guides and CSS-era layout patterns |
| `social-2006` | 2006–2006 | web2 | Portals borrowing from social networks: a saturated blue header bar, a central “feed” of dated items, modular sidebars of widgets. | Centred fixed-width page, rounded corners, gradient buttons, reflections, pastel badges, large friendly sans. | Web 2.0 style guides and CSS-era layout patterns |
| `aqua-2007` | 2007–2007 | web2 | Mac OS X Aqua language on the web: pinstripe backgrounds, glass pill buttons, a reflected logo, gel-style tabs and Lucida Grande type. | Centred fixed-width page, rounded corners, gradient buttons, reflections, pastel badges, large friendly sans. | Web 2.0 style guides and CSS-era layout patterns |
| `web2-2008` | 2008–2008 | web2 | Peak Web 2.0: glossy navigation with nested dropdowns, dense widget sidebars, gradients on everything, rounded modules and the “beta” badge. | Centred fixed-width page, rounded corners, gradient buttons, reflections, pastel badges, large friendly sans. | Web 2.0 style guides and CSS-era layout patterns |

### skeuo (4)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `dash-2009` | 2009–2009 | mobile | The first app-store dashboards: dark glass widgets with chrome edges, glossy gauges and “flip” cards, designed for a small screen and scaled up. | Glossy or textured touch UI: tab bar, grouped lists, large tappable rows, stitched leather or linen surfaces. | early touch-platform human-interface guidelines |
| `leather-2010` | 2010–2010 | mobile | Peak texture: leather, green felt, paper ledgers and real-looking buttons with highlights and inner shadows, layered like objects on a desk. | Glossy or textured touch UI: tab bar, grouped lists, large tappable rows, stitched leather or linen surfaces. | early touch-platform human-interface guidelines |
| `ios-2011` | 2011–2011 | mobile | Handheld-app skeuomorphism at its height: a linen background, stitched leather header, segmented controls, tile “cards” with glossy highlights. | Glossy or textured touch UI: tab bar, grouped lists, large tappable rows, stitched leather or linen surfaces. | early touch-platform human-interface guidelines |
| `hybrid-2012` | 2012–2012 | mobile | The pivot year: responsive layouts, subtle gradients replacing heavy textures, buttons that are half skeuomorphic, half flat. | Glossy or textured touch UI: tab bar, grouped lists, large tappable rows, stitched leather or linen surfaces. | early touch-platform human-interface guidelines |

### flat (5)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `metro-2013` | 2013–2013 | metro | Windows 8 “Metro” language and the first flat sites: flat coloured live tiles, oversized light typography, no gradients or shadows. | Flat colour tiles on a grid, large light typography, content-first with no chrome and horizontal panorama sections. | typography-led flat design guidelines |
| `material-2014` | 2014–2014 | material | Material Design’s first year: a coloured app bar, hamburger drawer, layered paper cards with real elevation, a floating action button and purposeful motion. | Elevation via shadow, a top app bar with drawer, floating action button, bold primary colour and baseline grid. | Material Design guidelines |
| `flat-2015` | 2015–2015 | flat | Flat design settled: a left rail, white cards with hairline borders, restrained shadows and a blue accent. Index tiles at the top. | Flat surfaces without gradients, thin dividers, system sans-serif, a top bar and generous touch targets. | flat-design and responsive web conventions |
| `portal-2016` | 2016–2016 | flat | Modern responsive portals: a strict 12-column grid, four index tiles up top, a chart-led lead story and clearly separated modules. | Flat surfaces without gradients, thin dividers, system sans-serif, a top bar and generous touch targets. | flat-design and responsive web conventions |
| `material-2017` | 2017–2017 | material | Refined Material: a taller app bar with scroll collapse, tonal surfaces, subtle ripple on interaction and a rail of live movers. | Elevation via shadow, a top app bar with drawer, floating action button, bold primary colour and baseline grid. | Material Design guidelines |

### modern (7)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `minimal-2018` | 2018–2018 | minimal | Consumer-fintech minimalism: a single reading column, very large type, almost no chrome, hairline rules and one accent colour. | Few elements, large type and white space, hairline rules, one accent colour. | minimalist interface practice |
| `dataterm-2019` | 2019–2019 | dataterm | Pro-trading dark UIs: dense monospace numbers, tight twelve-column panels, restrained accent colours, tabular layouts with live-style tickers. | Dense dark grid, monospaced numerals, colour-coded columns, keyboard-first command bar. | professional trading-terminal conventions |
| `retail-2020` | 2020–2020 | retail | Mobile-first trading apps: a giant chart as the hero, a watchlist rail, large green/red P&L numbers, pill-shaped actions and a dark surface. | Single-purpose list-and-chart screens, big tap targets, friendly rounded sans, confetti-free restraint. | mobile retail-investing app patterns |
| `glass-2021` | 2021–2021 | glass | Glassmorphism: translucent frosted panels over a soft colour-blob gradient, thin white borders, pastel accents and rounded 20px cards. | Translucent blurred panels over gradients, subtle borders, light-on-dark type. | glassmorphism interface trends |
| `bento-2022` | 2022–2022 | bento | Bento-grid dashboards: modular blocks of different sizes, big rounded corners, soft pastel fills, bold numerals and generous gaps. | Modular rounded tiles of mixed size on one grid, each tile one idea. | bento-grid dashboard layout |
| `research-2023` | 2023–2023 | research | Research assistants and notebooks: a prominent “ask” bar, command palette, citations shown in a contextual side panel, calm neutral surfaces. | Document-like reading column, inline citations and sidebars, calm neutral palette, tables over charts. | research-notebook and long-form reading UI |
| `spatial-2024` | 2024–2024 | spatial | Spatial interfaces: layered translucent planes with depth, parallax tilt on pointer, soft ambient light, and interactive data layers. | Floating layered panels with depth, large radii, soft shadows and a dock. | spatial/depth-based interface guidelines |

### experimental (2)

| id | years | archetype | modelled on (registry rationale) | conventions applied | source category |
|---|---|---|---|---|---|
| `finos-2025` | 2025–2025 | finos | A financial “operating system”: floating app panels with a menu bar and dock, adaptive layouts that rearrange by pane width, and polished transitions. | Stacked cards and bold type with an ambient gradient, motion-forward micro-interactions. | contemporary fintech app design |
| `liquid-2026` | 2026–now | liquid | Contemporary premium interface: refractive liquid-glass controls with specular edges, fluid morphing of the active pill, and refined motion. | Fluid translucent surfaces, specular highlights and morphing controls over a content-first layout. | current system-level design language trends |

<!-- GEN:END -->
