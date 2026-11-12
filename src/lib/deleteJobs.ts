// Delete jobs for "Delete resources" action rules. A job is created from a rule's review step and
// processed in this browser, one resource at a time (no Power Automate):
// - canvas / code apps through the Power Apps for Admins connector (Remove-AdminApp),
// - flows (workflow rows), model-driven apps (appmodule rows) and custom tables (EntityDefinitions)
//   through the Dataverse connector.
// The history (which resources were deleted / failed) is kept in localStorage; failed resources
// can be retried as a new job.
import { useEffect } from 'react';
import { MicrosoftDataverseService } from '../generated/services/MicrosoftDataverseService';
import { PowerAppsforAdminsService } from '../generated/services/PowerAppsforAdminsService';
import { isHosted } from '../data/api';
import { withTimeout } from '../data/liveEnvironments';
import { ADMIN_APPS_API } from '../data/liveResources';
import type { Environment, ResourceType } from '../data/types';
import { newId, persisted, type PlannedItem } from './actions';
import { notify } from './sendJobs';

/** Dataverse entity set of the record behind each resource type (apps use the admin connector). */
const ENTITY_SET: Partial<Record<ResourceType, string>> = {
  'Model-driven App': 'appmodules',
  'Cloud Flow': 'workflows',
  'Scheduled Flow': 'workflows',
  'Desktop Flow': 'workflows',
  'Agent Flow': 'workflows',
  'Dataverse Table': 'EntityDefinitions',
};

/** Transient errors (throttling, timeouts, server errors) are retried this many times. */
const MAX_ATTEMPTS = 3;
/** Wait before retry n (1-based), in seconds. */
const RETRY_SECONDS = [30, 120];
/** Pause between two deletes. */
const GAP_MS = 1500;
/** Deleting a table can take a while. */
const DELETE_TIMEOUT_MS = 180_000;
const KEEP_JOBS = 50;

export type DeleteJobState = 'running' | 'paused' | 'completed' | 'cancelled';

export interface DeleteItem {
  id: string;
  resourceId: string;
  /** Canvas / code app GUID. */
  appId?: string;
  name: string;
  type: ResourceType;
  envId: string;
  envName: string;
  orgUrl?: string;
  status: 'pending' | 'deleted' | 'failed';
  attempts: number;
  lastError?: string;
  /** Earliest time of the next attempt after a transient failure. */
  nextAt?: string;
  finishedAt?: string;
  /** e.g. "Already deleted". */
  note?: string;
  /** Job that retries this failed item. */
  retriedIn?: string;
}

export interface DeleteJob {
  id: string;
  ruleId: string;
  ruleName: string;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  finishedAt?: string;
  state: DeleteJobState;
  items: DeleteItem[];
  /** Job whose failed items this job retries. */
  retryOf?: string;
  /** Jobs created by retrying failed items of this job. */
  retriedAs?: string[];
}

const jobsStore = persisted<DeleteJob[]>('ppm.deleteJobs.v1', () => []);

export const useDeleteJobs = jobsStore.use;
export const readDeleteJobs = jobsStore.read;

export const isActiveDeleteJob = (j: DeleteJob) => j.state === 'running' || j.state === 'paused';

/** Most recent delete job of a rule. */
export const latestDeleteJob = (jobs: DeleteJob[], ruleId: string) =>
  jobs.filter((j) => j.ruleId === ruleId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

export function deleteProgress(j: DeleteJob) {
  const total = j.items.length;
  const deleted = j.items.filter((i) => i.status === 'deleted').length;
  const failed = j.items.filter((i) => i.status === 'failed').length;
  const done = deleted + failed;
  return { total, deleted, failed, pending: total - done, pct: total ? Math.floor((done / total) * 100) : 100 };
}

/** Failed items of a job that were not retried yet. */
export const retryableItems = (j: DeleteJob) => j.items.filter((i) => i.status === 'failed' && !i.retriedIn);

const updateJob = (id: string, fn: (j: DeleteJob) => DeleteJob) =>
  jobsStore.write(jobsStore.read().map((j) => (j.id === id ? { ...fn(j), updatedAt: new Date().toISOString() } : j)));

function addJob(job: DeleteJob, jobs = jobsStore.read()) {
  // Keep the newest jobs; active ones are never dropped.
  const keep = [...jobs.filter(isActiveDeleteJob), ...jobs.filter((j) => !isActiveDeleteJob(j)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))].slice(0, KEEP_JOBS - 1);
  jobsStore.write([...keep, job]);
}

const freshItem = (i: Pick<DeleteItem, 'resourceId' | 'appId' | 'name' | 'type' | 'envId' | 'envName' | 'orgUrl'>): DeleteItem => ({
  id: newId('del'),
  resourceId: i.resourceId,
  ...(i.appId ? { appId: i.appId } : {}),
  name: i.name,
  type: i.type,
  envId: i.envId,
  envName: i.envName,
  ...(i.orgUrl ? { orgUrl: i.orgUrl } : {}),
  status: 'pending',
  attempts: 0,
});

/** Creates a delete job for the applicable (supported, changing) items of a rule plan. */
export function createDeleteJob(ruleId: string, ruleName: string, items: PlannedItem[], environments: Environment[], createdBy?: string): DeleteJob {
  const now = new Date().toISOString();
  const envOf = (id: string) => environments.find((e) => e.id === id);
  const job: DeleteJob = {
    id: newId('djob'),
    ruleId,
    ruleName,
    createdAt: now,
    createdBy,
    updatedAt: now,
    state: 'running',
    items: items
      .filter((i) => i.supported && !i.noChange)
      .map(({ resource: r }) =>
        freshItem({ resourceId: r.id, appId: r.appId, name: r.name, type: r.type, envId: r.envId, envName: envOf(r.envId)?.name ?? r.envId, orgUrl: envOf(r.envId)?.url }),
      ),
  };
  addJob(job);
  return job;
}

/** Retries failed items of a job (all of them, or only `itemIds`) as a new job. */
export function retryDeleteJob(id: string, createdBy?: string, itemIds?: string[]): DeleteJob | undefined {
  const jobs = jobsStore.read();
  const old = jobs.find((j) => j.id === id);
  const items = old ? retryableItems(old).filter((i) => !itemIds || itemIds.includes(i.id)) : [];
  if (!old || !items.length) return undefined;
  const now = new Date().toISOString();
  const job: DeleteJob = {
    id: newId('djob'),
    ruleId: old.ruleId,
    ruleName: old.ruleName,
    createdAt: now,
    createdBy,
    updatedAt: now,
    state: 'running',
    retryOf: old.id,
    items: items.map(freshItem),
  };
  const moved = new Set(items.map((i) => i.id));
  const updatedOld: DeleteJob = {
    ...old,
    items: old.items.map((i) => (moved.has(i.id) ? { ...i, retriedIn: job.id } : i)),
    retriedAs: [...(old.retriedAs ?? []), job.id],
    updatedAt: now,
  };
  addJob(job, jobs.map((j) => (j.id === id ? updatedOld : j)));
  return job;
}

export const pauseDeleteJob = (id: string) => updateJob(id, (j) => (j.state === 'running' ? { ...j, state: 'paused' } : j));
export const resumeDeleteJob = (id: string) => updateJob(id, (j) => (j.state === 'paused' ? { ...j, state: 'running' } : j));
/** Stops a job; resources not deleted yet stay untouched. */
export const cancelDeleteJob = (id: string) =>
  updateJob(id, (j) => (isActiveDeleteJob(j) ? { ...j, state: 'cancelled', finishedAt: new Date().toISOString() } : j));

/* ---------- Deleting ---------- */

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) return String((err as { message: unknown }).message);
  return String(err ?? 'Unknown error');
}

// Narrow on purpose: a missing connection or operation must be reported as a failure, not as "already deleted".
const isNotFound = (msg: string) => /does not exist|AppNotFound|ObjectDoesNotExist/i.test(msg);
const isTransient = (msg: string) => /\b429\b|\b50[0234]\b|throttl|too many requests|timed? ?out|timeout|temporarily|try again|network/i.test(msg);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function deleteResource(item: DeleteItem) {
  if (!(await isHosted())) {
    // Local preview: no connector available, simulate the delete.
    await delay(600);
    if (localStorage.getItem('ppm.demoDeleteFail') === '1') throw new Error('Simulated delete failure (demo mode)');
    return;
  }
  if (item.type === 'Canvas App' || item.type === 'Code App') {
    const result = await withTimeout(PowerAppsforAdminsService.Remove_AdminApp(item.envId, item.appId ?? item.resourceId, ADMIN_APPS_API), DELETE_TIMEOUT_MS);
    if (!result.success) throw result.error ?? new Error('The app could not be deleted.');
    return;
  }
  const entitySet = ENTITY_SET[item.type];
  if (!entitySet) throw new Error(`Deleting a ${item.type} is not supported.`);
  if (!item.orgUrl) throw new Error('The environment has no Dataverse database.');
  const result = await withTimeout(MicrosoftDataverseService.DeleteRecordWithOrganization(item.orgUrl, entitySet, item.resourceId), DELETE_TIMEOUT_MS);
  if (!result.success) throw result.error ?? new Error('The resource could not be deleted.');
}

/* ---------- Processor ---------- */

// Only one tab deletes at a time: the tab holding a short lease in localStorage.
const TAB_ID = newId('tab');
const LOCK_KEY = 'ppm.deleteLock';
const LOCK_MS = DELETE_TIMEOUT_MS + 15_000;

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

function finishJob(job: DeleteJob) {
  const p = deleteProgress(job);
  updateJob(job.id, (j) => ({ ...j, state: 'completed', finishedAt: new Date().toISOString() }));
  if (p.failed) notify('error', `"${job.ruleName}": ${p.deleted} of ${p.total} resource(s) deleted, ${p.failed} failed. Open the delete history to retry them.`, '/actions');
  else notify('success', `"${job.ruleName}": all ${p.total} resource(s) deleted.`, '/actions');
}

async function tick(onDeleted: (envId: string, resourceId: string) => void) {
  if (busy) return;
  const running = jobsStore.read().filter((j) => j.state === 'running');
  if (!running.length || !holdLock()) return;
  busy = true;
  try {
    const now = Date.now();
    for (const job of running.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const pending = job.items.filter((i) => i.status === 'pending');
      if (!pending.length) {
        finishJob(job);
        continue;
      }
      const item = pending.find((i) => !i.nextAt || Date.parse(i.nextAt) <= now);
      if (!item) continue; // everything left is waiting for a retry
      const setItem = (patch: Partial<DeleteItem>) =>
        updateJob(job.id, (j) => ({ ...j, items: j.items.map((i) => (i.id === item.id ? { ...i, ...patch } : i)) }));
      try {
        await deleteResource(item);
        setItem({ status: 'deleted', finishedAt: new Date().toISOString(), nextAt: undefined, lastError: undefined });
        onDeleted(item.envId, item.resourceId);
      } catch (err) {
        const msg = errorText(err);
        const attempts = item.attempts + 1;
        if (isNotFound(msg)) {
          setItem({ status: 'deleted', attempts, finishedAt: new Date().toISOString(), note: 'Already deleted', nextAt: undefined });
          onDeleted(item.envId, item.resourceId);
        } else if (isTransient(msg) && attempts < MAX_ATTEMPTS) {
          setItem({ attempts, lastError: msg, nextAt: new Date(Date.now() + RETRY_SECONDS[attempts - 1]! * 1000).toISOString() });
        } else {
          setItem({ status: 'failed', attempts, lastError: msg, finishedAt: new Date().toISOString(), nextAt: undefined });
        }
      }
      await delay(GAP_MS);
      return; // one resource per tick
    }
  } finally {
    busy = false;
  }
}

/**
 * Runs the delete queue while the app is open. Mount once, at the app root.
 * onDeleted removes a deleted resource from the inventory (state and cache).
 */
export function useDeleteProcessor(onDeleted: (envId: string, resourceId: string) => void) {
  useEffect(() => {
    const timer = setInterval(() => void tick(onDeleted), 1000);
    // Warn before closing the app while resources are still being deleted.
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (jobsStore.read().some((j) => j.state === 'running')) e.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [onDeleted]);
}
