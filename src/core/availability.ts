/**
 * THE INFORMATION BOUNDARY
 * ------------------------
 * The single source of truth for "could someone have known this on the simulated date?".
 * Nothing else in the codebase compares content dates against the simulated date.
 *
 * Rules:
 *  1. An item is available iff item.availableAt <= simulatedDate (calendar-day precision,
 *     the simulated "present" is the evening edition of that day).
 *  2. Fail closed: an item with a missing or malformed availableAt is NEVER available.
 */
import { ISO_RE, type ISODate } from './dates';

export interface Dated { availableAt?: unknown }

export function isInformationAvailable(item: Dated | null | undefined, simulatedDate: ISODate): boolean {
  if (!item || typeof item.availableAt !== 'string') return false;
  const day = item.availableAt.slice(0, 10);
  if (!ISO_RE.test(day) || !ISO_RE.test(simulatedDate)) return false;
  return day <= simulatedDate;
}

export function filterAvailable<T extends Dated>(items: readonly T[], simulatedDate: ISODate): T[] {
  return items.filter((it) => isInformationAvailable(it, simulatedDate));
}

/** Items that became knowable after `from` and on/before `to` — used for fast-forward reveals. */
export function newlyAvailable<T extends Dated>(items: readonly T[], from: ISODate, to: ISODate): T[] {
  return items.filter((it) => isInformationAvailable(it, to) && !isInformationAvailable(it, from));
}

export class InformationLeakError extends Error {}

/**
 * Defence in depth: called by UI hooks on whatever a provider returns.
 * A leak is a bug in a provider — in development we shout, and in every mode we strip it.
 */
export function assertNoLeak<T extends Dated>(items: readonly T[], simulatedDate: ISODate, context: string): T[] {
  const ok = filterAvailable(items, simulatedDate);
  if (ok.length !== items.length) {
    const leaked = items.filter((i) => !ok.includes(i));
    // eslint-disable-next-line no-console
    console.error(`[information-boundary] ${leaked.length} future item(s) blocked in ${context}`, leaked);
  }
  return ok;
}
