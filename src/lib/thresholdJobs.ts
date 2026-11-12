// Background jobs for "Set limits" (Copilot Credit limits of many agents at once). The queue is kept in
// localStorage and processed by the app root, so it keeps going when the panel is closed or another page
// is opened, and resumes when the app is reopened. Throttling (429) pauses the whole job and retries.
import { useEffect } from 'react';
import { isHosted } from '../data/api';
import { setResourceThreshold, thresholdErrorText, type ThresholdSettings } from '../data/liveThresholds';
import type { Resource } from '../data/types';
import { newId, persisted } from './actions';
import { notify } from './sendJobs';

/** Agents updated at the same time. */
const CONCURRENCY = 3;
/** Pause after the n-th throttling in a row (seconds); the last value repeats. */
const THROTTLE_SECONDS = [30, 60, 120, 180, 300];
/** Other transient errors (5xx, timeouts) are tried this many times per agent. */
const MAX_ATTEMPTS = 3;
/** An agent is marked failed after being throttled this many times. */
const MAX_THROTTLES = 15;
const GAP_MS = 500;
const KEEP_JOBS = 5;

export type ThresholdJobState = 'running' | 'completed' | 'cancelled';

export interface ThresholdItem {
  envId: string;
  resourceId: string;
  name: string;
  envName: string;
  owner: string;
  status: 'pending' | 'ok' | 'failed';
  attempts: number;
  throttles: number;
  error?: string;
}

export interface ThresholdJob {
  id: string;
  createdAt: string;
  finishedAt?: string;
  state: ThresholdJobState;
  settings: ThresholdSettings;
  items: ThresholdItem[];
  /** Set while paused after a 429: requests resume at this time. */
  throttledUntil?: string;
  /** Throttlings in a row (drives the pause length). */
  throttleStreak: number;
  /** Start of the requests in flight (to show that the service is answering slowly). */
  busySince?: string;
}

const store = persisted<ThresholdJob[]>('ppm.thresholdJobs.v1', () => []);

export const useThresholdJobs = store.use;
export const isActiveThresholdJob = (j?: ThresholdJob) => j?.state === 'running';
/** Most recent job. */
export const latestThresholdJob = (jobs: ThresholdJob[]) => [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

export function thresholdJobProgress(j: ThresholdJob) {
  const total = j.items.length;
  const ok = j.items.filter((i) => i.status === 'ok').length;
  const failed = j.items.filter((i) => i.status === 'failed').length;
  return { total, ok, failed, done: ok + failed };
}

const updateJob = (id: string, fn: (j: ThresholdJob) => ThresholdJob) => store.write(store.read().map((j) => (j.id === id ? fn(j) : j)));

export function startThresholdJob(agents: Resource[], settings: ThresholdSettings, envName: (envId: string) => string): ThresholdJob {
  const job: ThresholdJob = {
    id: newId('tjob'),
    createdAt: new Date().toISOString(),
    state: 'running',
    settings,
    throttleStreak: 0,
    items: agents.map((r) => ({ envId: r.envId, resourceId: r.id, name: r.name, envName: envName(r.envId), owner: r.owner, status: 'pending', attempts: 0, throttles: 0 })),
  };
  const all = store.read();
  // Jobs still running are kept: they are processed one after the other.
  const running = all.filter((j) => j.state === 'running');
  const others = all.filter((j) => j.state !== 'running').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, KEEP_JOBS - 1);
  store.write([...others, ...running, job]);
  return job;
}

/** Stops a job; agents not updated yet keep their current limit. */
export const cancelThresholdJob = (id: string) =>
  updateJob(id, (j) => (j.state === 'running' ? { ...j, state: 'cancelled', finishedAt: new Date().toISOString(), throttledUntil: undefined, busySince: undefined } : j));

export const clearThresholdJobs = () => store.write(store.read().filter((j) => j.state === 'running'));

/* ---------- Processing ---------- */

const isThrottled = (msg: string) => /\b429\b|too many requests|throttl|rate limit/i.test(msg);
const isTransient = (msg: string) => /\b50[0234]\b|timed? ?out|timeout|temporarily|try again|network/i.test(msg);

/** Seconds from a "Retry-After" hint in the error text, if any. */
function retryAfterSeconds(msg: string): number | undefined {
  const m = /retry[- ]?after\D{0,6}(\d{1,4})/i.exec(msg);
  return m ? Math.min(600, Math.max(5, Number(m[1]))) : undefined;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apply(job: ThresholdJob, item: ThresholdItem) {
  if (!(await isHosted())) {
    // Local preview: no connector available, simulate the update.
    await delay(400);
    if (localStorage.getItem('ppm.demoThrottle') === '1' && Math.random() < 0.2) throw new Error('429 Too Many Requests (demo mode)');
    return;
  }
  await setResourceThreshold(item.envId, item.resourceId, job.settings);
}

// Only one tab processes at a time: the tab holding a short lease in localStorage.
const TAB_ID = newId('tab');
const LOCK_KEY = 'ppm.thresholdLock';
const LOCK_MS = 120_000;

function holdLock(): boolean {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    const lock = raw ? (JSON.parse(raw) as { owner: string; until: number }) : undefined;
    if (lock && lock.owner !== TAB_ID && lock.until > Date.now()) return false;
    localStorage.setItem(LOCK_KEY, JSON.stringify({ owner: TAB_ID, until: Date.now() + LOCK_MS }));
    return true;
  } catch {
    return true;
  }
}

let busy = false;

function finish(id: string) {
  const job = store.read().find((j) => j.id === id);
  if (!job || job.state !== 'running') return;
  updateJob(id, (j) => ({ ...j, state: 'completed', finishedAt: new Date().toISOString(), throttledUntil: undefined, busySince: undefined }));
  const p = thresholdJobProgress(job);
  if (p.failed) notify('error', `Set limits: ${p.ok} of ${p.total} agent(s) updated, ${p.failed} failed. Open "Set limits" in the AI Hub for details.`, '/ai-hub');
  else notify('success', `Set limits: all ${p.total} agent(s) updated.`, '/ai-hub');
}

async function tick(onUpdated: () => void) {
  if (busy) return;
  const job = store.read().find((j) => j.state === 'running');
  if (!job) return;
  if (job.throttledUntil && Date.parse(job.throttledUntil) > Date.now()) return;
  if (!holdLock()) return;
  const batch = job.items.filter((i) => i.status === 'pending').slice(0, CONCURRENCY);
  if (!batch.length) {
    finish(job.id);
    return;
  }
  busy = true;
  updateJob(job.id, (j) => ({ ...j, throttledUntil: undefined, busySince: new Date().toISOString() }));
  try {
    const results = await Promise.all(
      batch.map((item) =>
        apply(job, item).then(
          () => ({ item, error: '' }),
          (err: unknown) => ({ item, error: thresholdErrorText(err) || 'unknown error' }),
        ),
      ),
    );
    const current = store.read().find((j) => j.id === job.id);
    if (!current || current.state !== 'running') return; // cancelled meanwhile
    const throttled = results.filter((r) => r.error && isThrottled(r.error));
    const byKey = new Map(results.map((r) => [`${r.item.envId}:${r.item.resourceId}`, r]));
    let pauseSeconds = 0;
    if (throttled.length) {
      const hint = Math.max(0, ...throttled.map((r) => retryAfterSeconds(r.error) ?? 0));
      pauseSeconds = hint || THROTTLE_SECONDS[Math.min(current.throttleStreak, THROTTLE_SECONDS.length - 1)]!;
    }
    updateJob(job.id, (j) => ({
      ...j,
      busySince: undefined,
      throttleStreak: throttled.length ? j.throttleStreak + 1 : results.some((r) => !r.error) ? 0 : j.throttleStreak,
      throttledUntil: pauseSeconds ? new Date(Date.now() + pauseSeconds * 1000).toISOString() : undefined,
      items: j.items.map((i) => {
        const r = byKey.get(`${i.envId}:${i.resourceId}`);
        if (!r || i.status !== 'pending') return i;
        if (!r.error) return { ...i, status: 'ok', error: undefined };
        if (isThrottled(r.error)) {
          const throttles = i.throttles + 1;
          return throttles >= MAX_THROTTLES ? { ...i, throttles, status: 'failed', error: r.error } : { ...i, throttles, error: r.error };
        }
        const attempts = i.attempts + 1;
        return isTransient(r.error) && attempts < MAX_ATTEMPTS ? { ...i, attempts, error: r.error } : { ...i, attempts, status: 'failed', error: r.error };
      }),
    }));
    if (results.some((r) => !r.error)) onUpdated();
    if (!pauseSeconds) await delay(GAP_MS);
  } finally {
    busy = false;
  }
}

/**
 * Runs the "Set limits" queue while the app is open. Mount once, at the app root.
 * onUpdated is called after agents were updated (their limits are cached by setResourceThreshold).
 */
const noop = () => undefined;

export function useThresholdProcessor(onUpdated: () => void = noop) {
  useEffect(() => {
    // A request in flight when the app was closed is simply sent again.
    const stale = store.read().find((j) => j.state === 'running' && j.busySince);
    if (stale) updateJob(stale.id, (j) => ({ ...j, busySince: undefined }));
    const timer = setInterval(() => void tick(onUpdated), 1000);
    return () => clearInterval(timer);
  }, [onUpdated]);
}
