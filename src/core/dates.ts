/**
 * Calendar utilities. All simulation dates are plain ISO calendar days ("YYYY-MM-DD"),
 * handled in UTC so that timezones can never shift a day (and therefore never leak a day
 * of future information).
 */
export type ISODate = string;

export const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function isISODate(s: unknown): s is ISODate {
  if (typeof s !== 'string' || !ISO_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function toISO(y: number, m: number, d: number): ISODate {
  const dt = new Date(Date.UTC(2000, m - 1, d));
  dt.setUTCFullYear(y);
  return fromDate(dt);
}

export function fromDate(dt: Date): ISODate {
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth() + 1;
  const d = dt.getUTCDate();
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function toDate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(2000, m - 1, d));
  dt.setUTCFullYear(y);
  return dt;
}

/** Days since 1970-01-01 (can be negative). */
export function dayNumber(iso: ISODate): number {
  return Math.round(toDate(iso).getTime() / DAY_MS);
}
export function fromDayNumber(n: number): ISODate {
  return fromDate(new Date(n * DAY_MS));
}

export function parts(iso: ISODate) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d, weekday: toDate(iso).getUTCDay() };
}

export function addDays(iso: ISODate, n: number): ISODate {
  return fromDayNumber(dayNumber(iso) + n);
}
export function addMonths(iso: ISODate, n: number): ISODate {
  const { y, m, d } = parts(iso);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = daysInMonth(ny, nm);
  return toISO(ny, nm, Math.min(d, last));
}
export function addYears(iso: ISODate, n: number): ISODate {
  return addMonths(iso, n * 12);
}
export function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
export function diffDays(a: ISODate, b: ISODate) {
  return dayNumber(b) - dayNumber(a);
}

export function yearOf(iso: ISODate) { return Number(iso.slice(0, 4)); }

export function todayISO(): ISODate {
  const now = new Date();
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// ---------------------------------------------------------------------------
// Exchange calendar (New York). Approximate but era-aware.
// ---------------------------------------------------------------------------

function nthWeekday(y: number, m: number, weekday: number, n: number): number {
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
}
function lastWeekday(y: number, m: number, weekday: number): number {
  const last = daysInMonth(y, m);
  const lw = new Date(Date.UTC(y, m - 1, last)).getUTCDay();
  return last - ((lw - weekday + 7) % 7);
}
function easter(y: number): { m: number; d: number } {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, mm = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * mm + 114) / 31);
  const day = ((h + l - 7 * mm + 114) % 31) + 1;
  return { m: month, d: day };
}

/** Special closures, with a reason that era-appropriate UI can display. */
export const SPECIAL_CLOSURES: Record<ISODate, string> = {
  '1929-11-01': 'Exchange closed to clear the backlog of paperwork',
  '1933-03-06': 'National Bank Holiday', '1933-03-07': 'National Bank Holiday', '1933-03-08': 'National Bank Holiday',
  '1933-03-09': 'National Bank Holiday', '1933-03-10': 'National Bank Holiday', '1933-03-13': 'National Bank Holiday',
  '1933-03-14': 'National Bank Holiday',
  '1963-11-25': 'Funeral of President Kennedy',
  '1968-04-09': 'Day of mourning for Dr. Martin Luther King Jr.',
  '1969-07-21': 'National Day of Participation for the lunar exploration',
  '1977-07-14': 'New York City blackout',
  '1985-09-27': 'Hurricane Gloria',
  '2001-09-11': 'Exchanges closed following the attacks on New York and Washington',
  '2001-09-12': 'Exchanges closed following the attacks', '2001-09-13': 'Exchanges closed following the attacks',
  '2001-09-14': 'Exchanges closed following the attacks',
  '2004-06-11': 'National Day of Mourning for President Reagan',
  '2007-01-02': 'National Day of Mourning for President Ford',
  '2012-10-29': 'Hurricane Sandy', '2012-10-30': 'Hurricane Sandy',
  '2018-12-05': 'National Day of Mourning for President George H.W. Bush',
};

const holidayCache = new Map<number, Set<ISODate>>();
function holidays(y: number): Set<ISODate> {
  const hit = holidayCache.get(y);
  if (hit) return hit;
  const s = new Set<ISODate>();
  const observe = (m: number, d: number) => {
    const iso = toISO(y, m, d);
    const wd = toDate(iso).getUTCDay();
    if (wd === 6 && y >= 1953) s.add(addDays(iso, -1));
    else if (wd === 0) s.add(addDays(iso, 1));
    else s.add(iso);
  };
  observe(1, 1);
  observe(7, 4);
  observe(12, 25);
  if (y >= 1998) s.add(toISO(y, 1, nthWeekday(y, 1, 1, 3)));
  if (y >= 1971) s.add(toISO(y, 2, nthWeekday(y, 2, 1, 3)));
  else observe(2, 22);
  const e = easter(y);
  s.add(addDays(toISO(y, e.m, e.d), -2));
  if (y >= 1971) s.add(toISO(y, 5, lastWeekday(y, 5, 1)));
  else observe(5, 30);
  if (y >= 1887) s.add(toISO(y, 9, nthWeekday(y, 9, 1, 1)));
  s.add(toISO(y, 11, y >= 1942 ? nthWeekday(y, 11, 4, 4) : lastWeekday(y, 11, 4)));
  if (y >= 2022) observe(6, 19);
  holidayCache.set(y, s);
  return s;
}

/** World War I closure of the New York Stock Exchange. */
function wwiClosure(iso: ISODate) {
  return iso >= '1914-07-31' && iso <= '1914-12-11';
}

export function marketClosureReason(iso: ISODate): string | null {
  const wd = toDate(iso).getUTCDay();
  if (wd === 0) return 'Sunday';
  // The NYSE held short Saturday sessions until June 1952.
  if (wd === 6 && iso >= '1952-06-01') return 'Saturday';
  if (SPECIAL_CLOSURES[iso]) return SPECIAL_CLOSURES[iso];
  if (wwiClosure(iso)) return 'Exchange closed on account of the European war';
  if (holidays(yearOf(iso)).has(iso)) return 'Exchange holiday';
  return null;
}

export function isTradingDay(iso: ISODate) {
  return marketClosureReason(iso) === null;
}
