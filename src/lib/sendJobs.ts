// Send jobs for e-mail action rules. A job is created from a rule's review step and
// processed in this browser, one e-mail at a time, through the Office 365 Outlook
// connector (no Power Automate). The app must stay open while a job runs; progress is
// kept in localStorage so a job continues where it stopped when the app is reopened.
import { useEffect } from 'react';
import { Office365OutlookService } from '../generated/services/Office365OutlookService';
import { isHosted } from '../data/api';
import { withTimeout } from '../data/liveEnvironments';
import { emailHtml, newId, persisted, type EmailDesign, type EmailRow, type PlannedEmail } from './actions';

/** An item is retried after a failure; after more failures than this the job pauses itself. */
export const MAX_FAILURES = 5;
/** Wait before retry n (1-based), in minutes. */
const RETRY_MINUTES = [1, 2, 5, 10, 15];
/** Pause between two e-mails, to stay well under the connector's throttling limits. */
const GAP_MS = 1500;
const SEND_TIMEOUT_MS = 60_000;
const KEEP_JOBS = 50;
const KEEP_NOTIFICATIONS = 30;

export type JobState = 'running' | 'paused' | 'failed' | 'completed' | 'cancelled';

export interface SendItem {
  id: string;
  recipientName: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  /** Branded layout with its texts filled in (logos are referenced, not copied). */
  design?: EmailDesign;
  rows?: EmailRow[];
  resourceCount: number;
  status: 'pending' | 'sent';
  /** Failed attempts since the job was last started / resumed. */
  attempts: number;
  lastError?: string;
  /** Earliest time of the next attempt after a failure. */
  nextAt?: string;
  sentAt?: string;
}

export interface SendJob {
  id: string;
  ruleId: string;
  ruleName: string;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  finishedAt?: string;
  state: JobState;
  /** Why the job stopped (failed) or the most recent error while it keeps retrying. */
  lastError?: string;
  items: SendItem[];
  /** Job whose unsent e-mails this job resubmits. */
  resubmitOf?: string;
  /** Jobs created by resubmitting e-mails of this job. */
  resubmittedAs?: string[];
}

export interface AppNotification {
  id: string;
  at: string;
  kind: 'error' | 'success' | 'info';
  text: string;
  read: boolean;
  /** Route to open when the notification is clicked. */
  link?: string;
}

const jobsStore = persisted<SendJob[]>('ppm.sendJobs.v1', () => []);
const notesStore = persisted<AppNotification[]>('ppm.notifications.v1', () => []);

export const useSendJobs = jobsStore.use;
export const readSendJobs = jobsStore.read;
export const useNotifications = notesStore.use;

export function notify(kind: AppNotification['kind'], text: string, link?: string) {
  notesStore.write([{ id: newId('n'), at: new Date().toISOString(), kind, text, read: false, link }, ...notesStore.read()].slice(0, KEEP_NOTIFICATIONS));
}
export const markNotificationsRead = () => notesStore.write(notesStore.read().map((n) => (n.read ? n : { ...n, read: true })));
export const clearNotifications = () => notesStore.write([]);

const ACTIVE: JobState[] = ['running', 'paused', 'failed'];
export const isActiveJob = (j: SendJob) => ACTIVE.includes(j.state);

/** Most recent job of a rule. */
export const latestJob = (jobs: SendJob[], ruleId: string) => jobs.filter((j) => j.ruleId === ruleId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

export function jobProgress(j: SendJob) {
  const total = j.items.length;
  const sent = j.items.filter((i) => i.status === 'sent').length;
  const retrying = j.items.filter((i) => i.status === 'pending' && i.attempts > 0).length;
  return { total, sent, retrying, pct: total ? Math.floor((sent / total) * 100) : 100 };
}

const updateJob = (id: string, fn: (j: SendJob) => SendJob) =>
  jobsStore.write(jobsStore.read().map((j) => (j.id === id ? { ...fn(j), updatedAt: new Date().toISOString() } : j)));

function addJob(job: SendJob, jobs = jobsStore.read()) {
  // Keep the newest jobs; active ones are never dropped.
  const keep = [...jobs.filter(isActiveJob), ...jobs.filter((j) => !isActiveJob(j)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))].slice(0, KEEP_JOBS - 1);
  jobsStore.write([...keep, job]);
}

const freshItem = (i: Omit<SendItem, 'id' | 'status' | 'attempts'>): SendItem => ({
  id: newId('mail'),
  recipientName: i.recipientName,
  to: i.to,
  cc: i.cc,
  subject: i.subject,
  body: i.body,
  ...(i.design ? { design: i.design, rows: i.rows } : {}),
  resourceCount: i.resourceCount,
  status: 'pending',
  attempts: 0,
});

export function createSendJob(ruleId: string, ruleName: string, emails: PlannedEmail[], createdBy?: string): SendJob {
  const now = new Date().toISOString();
  const job: SendJob = {
    id: newId('job'),
    ruleId,
    ruleName,
    createdAt: now,
    createdBy,
    updatedAt: now,
    state: 'running',
    items: emails.map((e) => freshItem({ ...e, resourceCount: e.resources.length })),
  };
  addJob(job);
  return job;
}

/** E-mails of a job that were not sent; only meaningful once the job has stopped (failed, paused or cancelled). */
export const unsentItems = (j: SendJob) => (j.state === 'running' || j.state === 'completed' ? [] : j.items.filter((i) => i.status === 'pending'));

/**
 * Sends unsent e-mails of a stopped job again, as a new job (all unsent ones, or only `itemIds`).
 * The resubmitted e-mails leave the original job; if that job was paused / failed with e-mails
 * still unsent it is cancelled, so the same e-mail is never sent twice. Its remaining unsent
 * e-mails can be resubmitted later.
 */
export function resubmitJob(id: string, createdBy?: string, itemIds?: string[]): SendJob | undefined {
  const jobs = jobsStore.read();
  const old = jobs.find((j) => j.id === id);
  const items = old ? unsentItems(old).filter((i) => !itemIds || itemIds.includes(i.id)) : [];
  if (!old || !items.length) return undefined;
  const now = new Date().toISOString();
  const job: SendJob = {
    id: newId('job'),
    ruleId: old.ruleId,
    ruleName: old.ruleName,
    createdAt: now,
    createdBy,
    updatedAt: now,
    state: 'running',
    resubmitOf: old.id,
    items: items.map(freshItem),
  };
  // The resubmitted e-mails leave the original job, which keeps its sent e-mails and any others still unsent.
  const moved = new Set(items.map((i) => i.id));
  const rest = old.items.filter((i) => !moved.has(i.id));
  const updatedOld: SendJob = {
    ...old,
    items: rest,
    resubmittedAs: [...(old.resubmittedAs ?? []), job.id],
    updatedAt: now,
    ...(rest.every((i) => i.status === 'sent')
      ? { state: 'completed' as const, finishedAt: old.finishedAt ?? now, lastError: undefined }
      : isActiveJob(old)
        ? { state: 'cancelled' as const, finishedAt: now }
        : {}),
  };
  addJob(job, jobs.map((j) => (j.id === id ? updatedOld : j)));
  return job;
}

export const pauseJob = (id: string) => updateJob(id, (j) => (j.state === 'running' ? { ...j, state: 'paused' } : j));

/** Resumes a paused or auto-paused job; failed e-mails get a fresh set of attempts. */
export const resumeJob = (id: string) =>
  updateJob(id, (j) =>
    j.state === 'paused' || j.state === 'failed'
      ? { ...j, state: 'running', lastError: undefined, items: j.items.map((i) => (i.status === 'pending' ? { ...i, attempts: 0, nextAt: undefined } : i)) }
      : j,
  );

export const cancelJob = (id: string) => updateJob(id, (j) => (isActiveJob(j) ? { ...j, state: 'cancelled', finishedAt: new Date().toISOString() } : j));

/* ---------- Sending ---------- */

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) return String((err as { message: unknown }).message);
  return String(err ?? 'Unknown error');
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendEmail(item: SendItem) {
  if (!(await isHosted())) {
    // Local preview: no connector available, simulate the send.
    await delay(600);
    if (localStorage.getItem('ppm.demoSendFail') === '1') throw new Error('Simulated send failure (demo mode)');
    return;
  }
  const result = await withTimeout(
    Office365OutlookService.SendEmailV2({
      To: item.to.join(';'),
      Cc: item.cc.length ? item.cc.join(';') : undefined,
      Subject: item.subject,
      Body: emailHtml(item),
      Importance: 'Normal',
    }),
    SEND_TIMEOUT_MS,
  );
  if (!result.success) throw result.error ?? new Error('The e-mail could not be sent.');
}

/* ---------- Processor ---------- */

// Only one tab sends at a time: the tab holding a short lease in localStorage.
const TAB_ID = newId('tab');
const LOCK_KEY = 'ppm.sendLock';
const LOCK_MS = 15_000;

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

async function tick() {
  if (busy) return;
  const running = jobsStore.read().filter((j) => j.state === 'running');
  if (!running.length || !holdLock()) return;
  busy = true;
  try {
    const now = Date.now();
    for (const job of running.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const pending = job.items.filter((i) => i.status === 'pending');
      if (!pending.length) {
        updateJob(job.id, (j) => ({ ...j, state: 'completed', finishedAt: new Date().toISOString(), lastError: undefined }));
        notify('success', `"${job.ruleName}": all ${job.items.length} e-mail(s) sent.`, '/actions');
        continue;
      }
      const item = pending.find((i) => !i.nextAt || Date.parse(i.nextAt) <= now);
      if (!item) continue; // everything left is waiting for a retry
      try {
        await sendEmail(item);
        updateJob(job.id, (j) => ({
          ...j,
          items: j.items.map((i) => (i.id === item.id ? { ...i, status: 'sent', sentAt: new Date().toISOString(), nextAt: undefined } : i)),
        }));
      } catch (err) {
        const msg = errorText(err);
        const attempts = item.attempts + 1;
        const giveUp = attempts > MAX_FAILURES;
        const nextAt = giveUp ? undefined : new Date(Date.now() + RETRY_MINUTES[Math.min(attempts, RETRY_MINUTES.length) - 1]! * 60_000).toISOString();
        updateJob(job.id, (j) => ({
          ...j,
          // A pause / cancel made while the e-mail was in flight wins.
          state: giveUp && j.state === 'running' ? 'failed' : j.state,
          lastError: giveUp ? `E-mail to ${item.to.join(', ')} failed ${attempts} times: ${msg}` : msg,
          items: j.items.map((i) => (i.id === item.id ? { ...i, attempts, lastError: msg, nextAt } : i)),
        }));
        if (giveUp) notify('error', `"${job.ruleName}" was paused: the e-mail to ${item.to.join(', ')} failed ${attempts} times (${msg}).`, '/actions');
      }
      await delay(GAP_MS);
      return; // one e-mail per tick
    }
  } finally {
    busy = false;
  }
}

/** Runs the send queue while the app is open. Mount once, at the app root. */
export function useSendProcessor() {
  useEffect(() => {
    const timer = setInterval(() => void tick(), 1000);
    // Warn before closing the app while e-mails are still being sent.
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (jobsStore.read().some((j) => j.state === 'running')) e.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);
}
