/**
 * Natural-language date resolution for the time portal.
 * Accepts exact dates in many formats, bare years, month+year, and named moments.
 */
import { MONTHS, isISODate, toISO, addDays, isTradingDay, type ISODate } from './dates';

export const EARLIEST_DATE: ISODate = '1800-01-01';

export interface ParsedDate {
  date: ISODate;
  /** Human description of how the input was interpreted. */
  interpretation: string;
  precision: 'day' | 'month' | 'year' | 'event';
}
export interface ParseError { error: string }

interface NamedMoment { date: ISODate; label: string; keys: string[][] }

/** Each entry matches if ALL words of ANY key group appear in the input. */
export const NAMED_MOMENTS: NamedMoment[] = [
  { date: '1869-09-24', label: 'Black Friday, the gold panic of 1869', keys: [['black', 'friday', '1869'], ['gold', 'panic'], ['gould', 'gold']] },
  { date: '1912-04-15', label: 'The sinking of the Titanic', keys: [['titanic']] },
  { date: '1918-11-11', label: 'Armistice Day', keys: [['armistice']] },
  { date: '1929-10-24', label: 'Black Thursday', keys: [['black', 'thursday']] },
  { date: '1929-10-29', label: 'Black Tuesday, the Great Crash', keys: [['black', 'tuesday'], ['crash', '1929'], ['great', 'crash'], ['wall', 'street', 'crash']] },
  { date: '1933-03-04', label: 'Franklin Roosevelt’s first inauguration', keys: [['roosevelt', 'inaugurat'], ['fdr', 'inaugurat']] },
  { date: '1941-12-07', label: 'The attack on Pearl Harbor', keys: [['pearl', 'harbor']] },
  { date: '1944-06-06', label: 'D-Day', keys: [['d-day'], ['dday'], ['normandy']] },
  { date: '1945-05-08', label: 'Victory in Europe Day', keys: [['v-e day'], ['ve day'], ['victory', 'europe']] },
  { date: '1963-11-22', label: 'The assassination of President Kennedy', keys: [['kennedy', 'assassinat'], ['jfk']] },
  { date: '1969-07-20', label: 'The Apollo 11 moon landing', keys: [['moon', 'landing'], ['apollo', '11'], ['man', 'moon'], ['armstrong']] },
  { date: '1984-01-24', label: 'The Macintosh goes on sale', keys: [['macintosh'], ['mac', 'introduced']] },
  { date: '1987-10-19', label: 'Black Monday', keys: [['black', 'monday'], ['crash', '1987']] },
  { date: '1989-11-09', label: 'The fall of the Berlin Wall', keys: [['berlin', 'wall']] },
  { date: '1995-08-09', label: 'The Netscape IPO', keys: [['netscape']] },
  { date: '2000-01-03', label: 'The first trading day of the new millennium', keys: [['y2k'], ['millennium']] },
  { date: '2000-03-10', label: 'The Nasdaq’s dot-com peak', keys: [['dot', 'com'], ['dotcom'], ['nasdaq', 'peak'], ['tech', 'bubble']] },
  { date: '2001-09-11', label: 'September 11, 2001', keys: [['9/11'], ['911'], ['september', '11'], ['twin', 'towers']] },
  { date: '2004-08-19', label: 'Google’s IPO', keys: [['google', 'ipo']] },
  { date: '2007-01-09', label: 'The day the iPhone was announced', keys: [['iphone']] },
  { date: '2008-09-15', label: 'The collapse of Lehman Brothers', keys: [['lehman'], ['financial', 'crisis'], ['crash', '2008'], ['great', 'recession']] },
  { date: '2009-01-03', label: 'The Bitcoin genesis block', keys: [['bitcoin', 'genesis'], ['bitcoin', 'created']] },
  { date: '2009-03-09', label: 'The bottom of the 2009 bear market', keys: [['market', 'bottom', '2009'], ['bear', 'bottom']] },
  { date: '2010-05-06', label: 'The Flash Crash', keys: [['flash', 'crash']] },
  { date: '2012-05-18', label: 'Facebook’s IPO', keys: [['facebook', 'ipo']] },
  { date: '2016-06-24', label: 'The morning after the Brexit vote', keys: [['brexit']] },
  { date: '2020-03-11', label: 'The day COVID-19 was declared a pandemic', keys: [['covid'], ['pandemic'], ['coronavirus'], ['crash', '2020']] },
  { date: '2021-01-27', label: 'The GameStop short squeeze', keys: [['gamestop'], ['short', 'squeeze']] },
  { date: '2022-11-30', label: 'The launch of ChatGPT', keys: [['chatgpt']] },
];

const MONTH_ALIASES: Record<string, number> = {};
MONTHS.forEach((m, i) => {
  MONTH_ALIASES[m.toLowerCase()] = i + 1;
  MONTH_ALIASES[m.slice(0, 3).toLowerCase()] = i + 1;
});
MONTH_ALIASES['sept'] = 9;

function expandYear(y: string): number {
  if (y.length === 4) return Number(y);
  const n = Number(y);
  return n <= 29 ? 2000 + n : 1900 + n;
}

function firstTradingDay(y: number, m: number): ISODate {
  let d = toISO(y, m, 1);
  for (let i = 0; i < 10 && !isTradingDay(d); i++) d = addDays(d, 1);
  return d;
}

function fmt(iso: ISODate) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function bounds(date: ISODate, horizon: ISODate): ParseError | null {
  if (date < EARLIEST_DATE) return { error: 'The archive begins in 1800. Try a later date.' };
  if (date > horizon) return { error: `The machine can only travel back. Choose a date on or before ${fmt(horizon)}.` };
  return null;
}

export function parseDateInput(raw: string, horizon: ISODate): ParsedDate | ParseError {
  const input = raw.trim().toLowerCase().replace(/[,]+/g, ' ').replace(/\s+/g, ' ');
  if (!input) return { error: 'Enter a date.' };

  const done = (date: ISODate, interpretation: string, precision: ParsedDate['precision']): ParsedDate | ParseError => {
    if (!isISODate(date)) return { error: 'That date does not exist on the calendar.' };
    return bounds(date, horizon) ?? { date, interpretation, precision };
  };

  // ISO: 1929-10-29
  let m = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return done(toISO(+m[1], +m[2], +m[3]), fmt(toISO(+m[1], +m[2], +m[3])), 'day');

  // Numeric US: 10/29/1929, 10-29-29, 10.29.1929
  m = input.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (m) {
    const y = expandYear(m[3]);
    const iso = toISO(y, +m[1], +m[2]);
    return done(iso, fmt(iso), 'day');
  }

  const cleaned = input.replace(/(\d+)(st|nd|rd|th)\b/g, '$1').replace(/\./g, '').replace(/\bof\b/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = cleaned.split(' ');
  const monthIdx = tokens.findIndex((t) => MONTH_ALIASES[t] !== undefined);

  if (monthIdx !== -1) {
    const month = MONTH_ALIASES[tokens[monthIdx]];
    const nums = tokens.filter((t) => /^\d+$/.test(t));
    const year = nums.find((n) => n.length === 4) ?? nums.find((n, i) => n.length === 2 && i > 0);
    const day = nums.find((n) => n !== year && n.length <= 2 && +n >= 1 && +n <= 31);
    if (year && day && tokens.length <= 5) {
      const iso = toISO(expandYear(year), month, +day);
      return done(iso, fmt(iso), 'day');
    }
    if (year && !day && tokens.length <= 3) {
      const iso = firstTradingDay(expandYear(year), month);
      return done(iso, `${MONTHS[month - 1]} ${expandYear(year)} — arriving on the first trading day, ${fmt(iso)}`, 'month');
    }
  }

  // Bare year
  m = cleaned.match(/^(?:in |the year )?(\d{4})$/);
  if (m) {
    const iso = firstTradingDay(+m[1], 1);
    return done(iso, `${m[1]} — arriving on the first trading day, ${fmt(iso)}`, 'year');
  }

  // Named moments
  const words = cleaned.replace(/[’'"?!]/g, '');
  let best: NamedMoment | null = null;
  let bestScore = 0;
  for (const nm of NAMED_MOMENTS) {
    for (const group of nm.keys) {
      if (group.every((k) => words.includes(k))) {
        const score = group.join('').length;
        if (score > bestScore) { best = nm; bestScore = score; }
      }
    }
  }
  if (best) return done(best.date, `${best.label} — ${fmt(best.date)}`, 'event');

  // Last resort: the platform parser, for inputs like "Tue Oct 29 1929"
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) {
    const dt = new Date(t);
    const iso = toISO(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    return done(iso, fmt(iso), 'day');
  }

  return { error: 'The machine could not place that moment. Try a date like “October 19, 1987”.' };
}

export function isParseError(x: ParsedDate | ParseError): x is ParseError {
  return (x as ParseError).error !== undefined;
}
