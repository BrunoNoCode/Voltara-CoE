// Month scoping of the AI Hub data: consumption caches are kept per UTC month ("yyyy-mm"), and only the last
// MONTHS_KEPT months are kept in the browser (older month keys are removed when a new month is saved).
import { readJson, writeJson } from './liveEnvironments';

export const MONTHS_KEPT = 3;

/** UTC month key, e.g. "2026-11". */
export function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Month key `offset` months away from the current one (-1 = last month). */
export function monthKeyOffset(offset: number, now = new Date()): string {
  return monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 15)));
}

export const currentMonthKey = () => monthKey();
export const isCurrentMonth = (key: string) => key === monthKey();

/** A date in the middle of the month (safe to pass to billingPeriod / monthLabel). */
export function monthDate(key: string): Date {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 15));
}

/** First and last instant of the month (UTC). */
export function monthPeriod(key: string) {
  const [y, m] = key.split('-').map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)).toISOString(),
    end: new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)).toISOString(),
  };
}

export const daysInMonth = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** Elapsed share of the month: day of month / days in month for the current month, 1 for a past month. */
export function monthElapsed(key: string, now = new Date()): number {
  if (!isCurrentMonth(key)) return 1;
  return now.getUTCDate() / daysInMonth(key);
}

/** The months the user can pick: current month first, then last month. */
export const selectableMonths = () => [monthKeyOffset(0), monthKeyOffset(-1)];

/** localStorage key of a monthly cache entry: `${base}.${envId}.${month}.v1`. */
export const monthCacheKey = (base: string, envId: string, month: string) => `${base}.${envId}.${month}.v1`;

const MONTH_KEY_RE = /\.(\d{4}-\d{2})\.v1$/;

/** Removes the monthly entries of `base` older than the last MONTHS_KEPT months. */
export function pruneMonths(base: string) {
  const keep = new Set(Array.from({ length: MONTHS_KEPT }, (_, i) => monthKeyOffset(-i)));
  try {
    const drop: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const m = k && k.startsWith(`${base}.`) ? MONTH_KEY_RE.exec(k) : null;
      if (k && m && !keep.has(m[1])) drop.push(k);
    }
    drop.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage disabled: nothing to prune.
  }
}

/**
 * Reads a monthly entry. For the current month it falls back to the legacy per-environment key (`${base}.${envId}.v1`)
 * when that entry belongs to the month (its `from` date starts with the month key).
 */
export function readMonth<T extends { from?: string }>(base: string, envId: string, month: string): T | null {
  const v = readJson<T>(monthCacheKey(base, envId, month));
  if (v) return v;
  const legacy = readJson<T>(`${base}.${envId}.v1`);
  return legacy && legacy.from?.startsWith(month) ? legacy : null;
}

/** Writes a monthly entry, drops the legacy per-environment entry and prunes months older than MONTHS_KEPT. */
export function writeMonth(base: string, envId: string, month: string, value: unknown) {
  writeJson(monthCacheKey(base, envId, month), value);
  try {
    localStorage.removeItem(`${base}.${envId}.v1`);
  } catch {
    // Storage disabled.
  }
  pruneMonths(base);
}
