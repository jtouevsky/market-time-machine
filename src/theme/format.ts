import type { ISODate } from '../core/dates';
import type { Quote } from '../core/types';
import type { EraTheme } from './eras';

const EIGHTHS = ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞'];

/** NYSE quoted in eighths until June 1997, sixteenths until decimalization in 2001. */
export function fractionPrice(v: number, date: ISODate): string {
  const sixteenths = date >= '1997-06-24';
  const denom = sixteenths ? 16 : 8;
  const total = Math.round(v * denom);
  const whole = Math.floor(total / denom);
  const rem = total % denom;
  if (rem === 0) return `${whole.toLocaleString('en-US')}`;
  let frac: string;
  if (!sixteenths || rem % 2 === 0) frac = EIGHTHS[sixteenths ? rem / 2 : rem];
  else frac = ` ${rem}/16`;
  return whole === 0 ? frac.trim() : `${whole.toLocaleString('en-US')}${frac}`;
}

export function num(v: number, decimals = 2) {
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtQuoteValue(q: Pick<Quote, 'value' | 'kind' | 'decimals' | 'unit'>, theme: EraTheme, date: ISODate): string {
  if (q.kind === 'stock' && theme.fractions && date < '2001-04-09' && q.value >= 1) return fractionPrice(q.value, date);
  if (q.kind === 'rate') return `${num(q.value, q.decimals)}%`;
  const prefix = q.unit === '$' || q.unit === '$/oz' || q.unit === '$/bbl' || q.unit === '$/bu' ? '$' : '';
  const dec = q.kind === 'crypto' && q.value > 1000 ? 0 : q.decimals;
  return `${prefix}${num(q.value, dec)}`;
}

export function fmtChange(q: Pick<Quote, 'change' | 'changePct' | 'kind' | 'decimals'>, theme: EraTheme, date: ISODate, mode: 'abs' | 'pct' = 'pct'): string {
  if (q.change === null || q.changePct === null) return '—';
  if (Math.abs(q.change) < 1e-9) return theme.module === 'terminal' ? 'UNCH' : theme.module === 'print' ? 'unch.' : '0.00';
  if (mode === 'pct') return `${q.changePct >= 0 ? '+' : ''}${num(q.changePct, 2)}%`;
  if (q.kind === 'stock' && theme.fractions && date < '2001-04-09') {
    const s = fractionPrice(Math.abs(q.change), date);
    return `${q.change >= 0 ? '+' : '−'}${s === '' ? '0' : s}`;
  }
  return `${q.change >= 0 ? '+' : '−'}${num(Math.abs(q.change), q.kind === 'rate' ? 2 : q.decimals)}`;
}

export function money(v: number, decimals = 2) {
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${v < 0 ? '−' : ''}$${s}`;
}

export function bigMoney(v: number) {
  const a = Math.abs(v);
  if (a >= 1e12) return `$${(v / 1e12).toFixed(2)} trillion`;
  if (a >= 1e9) return `$${(v / 1e9).toFixed(1)} billion`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(0)} million`;
  return money(v, 0);
}

export function pct(v: number, decimals = 1) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

const KEEP = new Set(['WHO', 'NBA', 'NFL', 'NCAA', 'AIG', 'IBM', 'U.S.', 'UK', 'CEO', 'IPO', 'AOL', 'HP', 'GM', 'RCA', 'ECB', 'FDA', 'S&P', 'II', 'III']);
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
function titleCase(text: string) {
  return text.split(/(\s+)/).map((w, i) => {
    if (/^\s+$/.test(w)) return w;
    const core = w.replace(/[^A-Za-z.&]/g, '');
    if (KEEP.has(core.toUpperCase())) return w.toUpperCase();
    if (/^IPHONE/i.test(core)) return w.replace(/iphone/i, 'iPhone');
    const lower = w.toLowerCase();
    if (i > 0 && SMALL.has(lower)) return lower;
    return lower.replace(/^([^a-z]*)([a-z])/, (_m, p: string, c: string) => p + c.toUpperCase());
  }).join('');
}

/** Wire copy arrives in its own era's casing; modern web layouts re-case shouted banners. */
export function headline(text: string, theme: EraTheme) {
  if (theme.headlineCase === 'upper') return text.toUpperCase();
  if (theme.module === 'web') {
    const letters = text.replace(/[^A-Za-z]/g, '');
    const upper = letters.replace(/[^A-Z]/g, '').length;
    if (letters.length > 6 && upper / letters.length > 0.8) return titleCase(text);
  }
  return text;
}
