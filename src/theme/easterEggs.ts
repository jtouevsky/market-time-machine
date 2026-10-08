/**
 * Era easter eggs: tiny, ORIGINAL, harmless delights keyed by archetype (and a few by experience id).
 * Rules for every entry: playful and clearly fictional; no real brands, ads, headlines, quotes, prices
 * or events; no sound; text only (plus ASCII art).
 *
 * Triggers (handled by components/world/EasterEggs.tsx):
 *   konami        up up down down left right left right B A
 *   word          type the letters anywhere (letters and digits only; spaces ignored). Inside a text field
 *                 the field's whole value must equal the word and Enter is pressed, so normal typing never fires one
 *   clicks        click the masthead / page title N times within 4 seconds
 */
import type { Archetype, VisualExperience } from './registry/types';

export type EggTrigger =
  | { kind: 'konami' }
  | { kind: 'word'; word: string }
  | { kind: 'clicks'; n: number };

export interface Egg {
  id: string;
  trigger: EggTrigger;
  title: string;
  /** Short lines shown (and announced) when the egg fires. */
  lines: string[];
  /** Optional ASCII art, shown in a monospace block and hidden from screen readers. */
  art?: string;
}

const egg = (id: string, trigger: EggTrigger, title: string, lines: string[], art?: string): Egg => ({ id, trigger, title, lines, art });
const clicks5 = { kind: 'clicks', n: 5 } as const;
const konami = { kind: 'konami' } as const;
const word = (w: string): EggTrigger => ({ kind: 'word', word: w });

const DEVIL = [' (\\_/)', ' (o.o)  <- the printer\'s devil', ' / > [type]'].join('\n');
const FLOPPY = ['+----------+', '|  [====]  |', '|  |    |  |', '|  |____|  |', '+----------+'].join('\n');
const KITE = ['    /\\', '   /  \\', '  / () \\', '  \\    /', '   \\  /', '    \\/'].join('\n');

export const EGGS_BY_ARCHETYPE: Record<Archetype, Egg[]> = {
  gazette: [egg('gazette-devil', clicks5, 'A Note from the Printer\'s Devil', ['Pardon the smudge, reader. The compositor swears the missing letter was never in the case, and the devil says it was the cat.', 'No news herein has been verified by anyone who owns a cat.'], DEVIL)],
  archive: [egg('archive-errata', clicks5, 'Errata, Such as They Are', ['Correction: the corrections column has been moved to page eleven, where nobody will look.', 'We regret nothing in particular.'])],
  victorian: [egg('victorian-flourish', clicks5, 'An Unnecessary Flourish', ['Three typefaces were used in this masthead. The fourth was held back out of modesty.', '~*~ Fine Printing While You Wait ~*~'])],
  broadsheet: [egg('broadsheet-hold', clicks5, 'Hold the Front Page (For a Moment)', ['The headline deck has been stacked three high. A fourth deck is in the drawer in case of excitement.', 'Late edition: nothing has happened yet, and this is it.'])],
  deco: [egg('deco-sunburst', konami, 'Sunburst Mode', ['    \\ | /', '  -- (*) --', '    / | \\', 'Gold leaf is purely theoretical.'])],
  wire: [egg('wire-stop', word('stopstop'), 'STOP. STOP. STOP.', ['TRANSMISSION RECEIVED STOP', 'NO TELEGRAM WAS HARMED IN THE MAKING OF THIS PAGE STOP', 'PLEASE REPLY BY POST STOP']) ],
  radio: [egg('radio-tune', word('tuning'), 'Between Stations', ['(a faint hum of pure, silent static, in text form only)', 'You have found the empty spot on the dial. It is quite peaceful.'])],
  midcentury: [egg('midcentury-boomerang', konami, 'Atomic Boomerang', ['  ~ ~ ~', ' <  ) )  boomerang pattern unlocked', '  ~ ~ ~', 'Please accept this decorative shape with our compliments.'])],
  swiss: [egg('swiss-grid', clicks5, 'The Grid Is Showing', ['Every element on this page sits on an invisible grid.', 'This message sits on it too. It is flush left. It could not be otherwise.'])],
  broadcast: [egg('broadcast-standby', word('standby'), 'Please Stand By', ['The picture is fine. Do not adjust your set. Do adjust your posture.', '[ test pattern, left as an exercise for the reader ]'])],
  teletext: [egg('teletext-888', word('page888'), 'Page 888', ['Hidden page found. It contains: this page.', 'Fastext hint: red, green, yellow and cyan are all unavailable. Please enjoy white.'])],
  terminal: [egg('terminal-xyzzy', word('xyzzy'), 'xyzzy', ['Nothing happens. (It is a very old way of saying hello.)', 'You are in a maze of twisty little tickers, all alike.'])],
  dos: [egg('dos-format', word('formatc'), 'Format Complete (Not Really)', ['Just kidding. Nothing was formatted.', 'Please do not try this at a real prompt.', 'Bad command or file name: your_sense_of_humour'])],
  workstation: [egg('workstation-hello', word('hello'), 'hello, world', ['main() { puts("hello, market"); }', 'Compiled in zero seconds, running in your imagination.'])],
  desktop: [egg('desktop-floppy', konami, 'Please Insert Disk 2 of 1', ['The disk is in the other drive. The other drive is in the other room.', 'Volume label: IMAGINARY'], FLOPPY)],
  hypertext: [egg('hypertext-link', word('hyperlink'), 'This Link Goes Nowhere', ['Blue and underlined, as nature intended.', 'Click here to read more about clicking here.'])],
  directory: [egg('directory-category', word('category'), 'A Brand New Category', ['Filed under: Things Filed Under Things.', 'See also: See also.'])],
  personal: [egg('personal-hardhat', word('welcome'), 'Under Construction (Forever)', ['  [=====]   <- tiny hard hat', ' WORK IN PROGRESS since the dawn of this page.', 'You are visitor number: enough.'])],
  win98: [egg('win98-wait', konami, 'It Is Now Safe To Use This Page', ['An hourglass has been imagined on your behalf.', 'No blue screens were issued today. Please be seated.'])],
  portal: [egg('portal-channels', word('channels'), 'Channel 0 of 0', ['Your personalised channel list is: this one.', 'Weather: pleasantly decorative. Horoscope: you will scroll.'])],
  xp: [egg('xp-hills', konami, 'Rolling Green Hills', ['A calm field and a tidy sky have been provisioned.', 'No paperclips were summoned. (They are in a better place.)'])],
  enterprise: [egg('enterprise-synergy', word('synergy'), 'Synergy Dashboard', ['Q-ish: leverage up 12 percent in a fictional unit.', 'Action item: schedule a meeting about scheduling meetings.'])],
  flash: [egg('flash-skip', word('skipintro'), 'Intro Skipped', ['You skipped an intro that never existed. Respect.', 'A loading bar fills to 100 percent, then politely leaves.'])],
  web2: [egg('web2-beta', word('betabeta'), 'Perpetual Beta', ['This page has been in beta since it was born and likes it that way.', 'Features: rounded corners. More rounded corners coming soon.'])],
  mobile: [egg('mobile-pinch', konami, 'Pinch to Zoom (Imaginary)', ['You pinched the air. The air says thanks.', 'Stitching on the interface is decorative and not load-bearing.'])],
  metro: [egg('metro-tile', word('livetile'), 'Live Tile, Dead Calm', ['Nothing is updating. It is simply a nice square.', 'Typography is the interface. This sentence is the interface.'])],
  material: [egg('material-ripple', clicks5, 'Ripple Effect', ['A ripple expands from nowhere in particular.', 'Elevation: 24dp of pure ceremony.'])],
  flat: [egg('flat-depth', word('noshadow'), 'We Removed the Shadow', ['It was here a minute ago.', 'Depth is a state of mind and also a z-index.'])],
  minimal: [egg('minimal-less', word('lessismore'), 'Less', ['(this space intentionally left slightly less empty)'])],
  fintech: [egg('fintech-confetti', konami, 'Confetti, In Moderation', ['* . * . *', '  . * . *  No actual confetti. Your balance is imaginary and so is this.', 'Past performance, as ever, is a rumour.'])],
  dataterm: [egg('dataterm-hjkl', word('hjkl'), 'Keyboard-Only Mode', ['The mouse has been politely excused.', 'Type a command, any command. Nothing will be executed. (It is a mood.)'])],
  retail: [egg('retail-streak', konami, 'Nice Streak', ['You opened this page in a good mood. That counts as a streak.', 'Congratulations on a figure we made up: 42.'])],
  glass: [egg('glass-frost', clicks5, 'Frosted', ['The panel behind this one is blurred. So is the one behind that.', 'Transparency has been achieved. Clarity not guaranteed.'])],
  bento: [egg('bento-box', word('bento'), 'Fits the Grid', ['One tile. One idea. One tiny rounded rectangle of joy.', ' [ idea ][ idea ]\n [   bigger   ]'])],
  research: [egg('research-footnote', word('footnote'), 'A Footnote to a Footnote', ['1. See note 2.', '2. See note 1.', 'The citation needed has been cited.'])],
  spatial: [egg('spatial-float', konami, 'Floating', ['The panels hover slightly to the left of reality.', 'Depth: 4 layers, 0 gravity.'])],
  finos: [egg('finos-gradient', clicks5, 'Ambient Gradient', ['A gradient shifted by 0.3 degrees. You will not notice. We did.', 'Micro-interaction complete.'])],
  liquid: [egg('liquid-bubble', word('liquid'), 'Surface Tension', ['A bubble formed, thought better of it, and became a rounded rectangle.', 'Specular highlight: yes.'], KITE)],
};

/** Extra eggs for individual experiences (on top of their archetype's egg). */
export const EGGS_BY_ID: Record<string, Egg[]> = {
  'newsbook-1600': [egg('newsbook-ink', konami, 'Ink Is Wet', ['Please do not touch the type. It is not dry. It will never be dry in this simulation.'])],
  'amber-1983': [egg('amber-plugh', word('plugh'), 'plugh', ['A hollow voice says "plugh." It is a bit smug about it.'])],
  'dos-1985': [egg('dos-ver', word('versioncheck'), 'Version', ['Version: imaginary 0.0. Please do not report this as a bug.'])],
  'win3-1991': [egg('win3-minesweep', word('minefield'), 'Not That Game', ['A field of squares, a flag and a tiny sense of dread. Left out on purpose.'])],
  'netscape-1995': [egg('netscape-star', word('shootingstar'), 'Shooting Star', ['  *  .  *\n .  *  .  *\nA star (ASCII) crosses the page and leaves quietly.'])],
  'flash-2000': [egg('flash-replay', konami, 'Replay Intro?', ['[ Yes ]  [ Yes ]\nOnly one of these buttons is a decoy.'])],
};

/** All eggs that can fire on a given experience, deduplicated by id. */
export function eggsFor(exp: Pick<VisualExperience, 'id' | 'archetype'>): Egg[] {
  const out = [...(EGGS_BY_ARCHETYPE[exp.archetype] ?? []), ...(EGGS_BY_ID[exp.id] ?? [])];
  return out.filter((e, i) => out.findIndex((x) => x.id === e.id) === i);
}

export const EGG_COUNT = new Set([
  ...Object.values(EGGS_BY_ARCHETYPE).flat().map((e) => e.id),
  ...Object.values(EGGS_BY_ID).flat().map((e) => e.id),
]).size;
