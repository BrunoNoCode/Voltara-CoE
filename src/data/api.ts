// Data access layer. Every screen reads data through these functions.
// Environments come live from the Power Platform for Admins connector when the
// app runs inside the Power Apps host (cached in the browser); resources come live per
// environment from Dataverse FetchXML. Outside the host, and for the other
// resources/tags/activity, demo data is used until those are wired up.
import { getContext } from '@microsoft/power-apps/app';
import * as mock from './mockData';
import { applyEnvMeta, fetchLiveEnvironments, readCachedEnvironments, writeCachedEnvironments } from './liveEnvironments';
import { fetchEnvironmentResources, type FetchPlan, type ResourceRefresh } from './liveResources';
import { initResourceCache } from './resourceCache';
import { readStoredTags } from '../lib/settingsTransfer';
import type { Activity, Environment, Resource, Tag } from './types';

export interface Snapshot {
  environments: Environment[];
  resources: Resource[];
  tags: Tag[];
  activity: Activity[];
}

/** Where the environment list currently shown comes from. */
export type EnvSource = 'live' | 'cache' | 'demo';

export interface EnvLoad {
  environments: Environment[];
  source: EnvSource;
  /** When the list was last fetched from the connector. */
  fetchedAt?: string;
}

let hostedPromise: Promise<boolean> | null = null;

/** True when running inside the Power Apps player (connectors only work there). */
export function isHosted(): Promise<boolean> {
  hostedPromise ??= Promise.race([
    getContext().then(() => true),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000)),
  ]).catch(() => false);
  return hostedPromise;
}

/** Resources, tags and activity (demo data for now). */
export async function fetchSnapshot(): Promise<Omit<Snapshot, 'environments'>> {
  return {
    resources: structuredClone(mock.resources),
    // Tag definitions are kept in the browser once the user has changed them.
    tags: readStoredTags() ?? structuredClone(mock.tags),
    activity: structuredClone(mock.activity),
  };
}

/** Instant, synchronous read of the last cached environment list. */
export function loadCachedEnvironments(): EnvLoad | null {
  const cached = readCachedEnvironments();
  if (!cached) return null;
  return { environments: applyEnvMeta(cached.environments), source: 'cache', fetchedAt: cached.savedAt };
}

/** Fetches the environment list live (or demo data outside the host) and refreshes the cache. */
export async function refreshEnvironments(): Promise<EnvLoad> {
  if (!(await isHosted())) return { environments: applyEnvMeta(structuredClone(mock.environments)), source: 'demo' };
  const live = await fetchLiveEnvironments();
  writeCachedEnvironments(live);
  return { environments: applyEnvMeta(live), source: 'live', fetchedAt: new Date().toISOString() };
}

/**
 * Live resource inventory (flows, apps, agents, AI models, tables, processes) of one
 * environment via Dataverse FetchXML. Resolves with null outside the host, where the
 * demo resources are kept.
 */
export async function refreshEnvironmentResources(env: Environment, plan?: FetchPlan): Promise<ResourceRefresh | null> {
  if (!(await isHosted())) return null;
  await initResourceCache(); // failed groups keep their cached rows, so the cache must be loaded first
  return fetchEnvironmentResources(env, plan);
}

export { NoDataverseError } from './liveFlows';
export { FULL_PLAN, LIVE_GROUPS, groupKeyOf, groupOfType, readCachedResources, removeCachedResources, staleGroups, type FetchPlan, type LiveGroup, type ResourceRefresh } from './liveResources';

export interface CurrentUser {
  fullName: string;
  upn?: string;
}

// Uses the Power Apps host context when running inside the player; falls back
// to a placeholder when running locally outside the host.
export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const ctx = await Promise.race([
      getContext(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
    if (ctx.user.fullName) return { fullName: ctx.user.fullName, upn: ctx.user.userPrincipalName };
  } catch {
    // not hosted in Power Apps
  }
  return { fullName: 'Alex Silva' };
}
