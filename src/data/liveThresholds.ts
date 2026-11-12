// Copilot Credit limits (resource thresholds) of agents: read from GET /licensing/entitlements/MCSMessages/resourceThresholds
// (see fetchResourceThresholds in liveResourceConsumption.ts) and written with
// PUT /licensing/environments/{env}/entitlements/MCSMessages/resources/{resourceId}/threshold.
// Thresholds and the default settings are cached in localStorage (no Dataverse).
import { PowerPlatformforAdminsV2Service } from '../generated/services/PowerPlatformforAdminsV2Service';
import { readJson, writeJson } from './liveEnvironments';
import type { Resource } from './types';

const CACHE_KEY = 'ppm.resourceThresholds.v1';
const DEFAULTS_KEY = 'ppm.thresholdDefaults.v1';
const VERSION_KEY = 'ppm.thresholdApiVersion.v1';
export const ENTITLEMENT = 'MCSMessages';
/** api-version values to try, in order: the documented one first, then the connector swagger default. */
export const THRESHOLD_API_VERSIONS = ['1', '2024-10-01'];

export interface ThresholdSettings {
  /** Copilot Credits the resource can use (0 = no limit). */
  limit: number;
  /** Notify at this percentage of the limit. */
  notificationThreshold: number;
  notifyIfOverCapacity: boolean;
  stopIfOverCapacity: boolean;
  /** Turns the resource off. */
  stopResource: boolean;
}

export interface ResourceThreshold extends ThresholdSettings {
  resourceId: string;
  environmentId: string;
  /** Credits consumed in the current period. */
  consumption: number;
  createdOn?: string;
}

export interface ThresholdCache {
  savedAt: string;
  byKey: Record<string, ResourceThreshold>;
  /** False when the browser refused to save it (storage full): it is then only kept in memory. */
  persisted?: boolean;
}

export const DEFAULT_THRESHOLD: ThresholdSettings = { limit: 1000, notificationThreshold: 80, notifyIfOverCapacity: true, stopIfOverCapacity: false, stopResource: false };

/** Ids are compared lowercase, without braces. */
const normId = (id: string) => id.toLowerCase().replace(/[{}]/g, '').trim();

export const thresholdKey = (envId: string, resourceId: string) => `${normId(envId)}:${normId(resourceId)}`;

export function cachedThresholds(): ThresholdCache {
  return readJson<ThresholdCache>(CACHE_KEY) ?? { savedAt: '', byKey: {} };
}

/** Replaces the cache with the rows read from the API and returns it (to use in memory even when it could not be saved). */
export function saveThresholds(rows: ResourceThreshold[]): ThresholdCache {
  const byKey: Record<string, ResourceThreshold> = {};
  for (const t of rows) byKey[thresholdKey(t.environmentId, t.resourceId)] = t;
  const cache: ThresholdCache = { savedAt: new Date().toISOString(), byKey };
  cache.persisted = writeJson(CACHE_KEY, cache);
  return cache;
}

function saveOne(t: ResourceThreshold) {
  const c = cachedThresholds();
  c.byKey[thresholdKey(t.environmentId, t.resourceId)] = t;
  writeJson(CACHE_KEY, c);
}

/** Threshold row of an agent (resource id = botid). */
export function thresholdOf(cache: ThresholdCache, r: Resource): ResourceThreshold | undefined {
  return cache.byKey[thresholdKey(r.envId, r.id)] ?? byResourceId(cache).get(normId(r.id));
}

// Fallback match on the resource id alone (when the API reports the environment id differently).
const resourceIndex = new WeakMap<ThresholdCache, Map<string, ResourceThreshold>>();
function byResourceId(cache: ThresholdCache) {
  let m = resourceIndex.get(cache);
  if (!m) {
    m = new Map(Object.values(cache.byKey).map((t) => [normId(t.resourceId), t]));
    resourceIndex.set(cache, m);
  }
  return m;
}

/** A limit is defined when it is above 0 or the resource is stopped. */
export const isThresholdDefined = (t?: ThresholdSettings) => !!t && (t.limit > 0 || t.stopResource);

export function thresholdDefaults(): ThresholdSettings {
  return { ...DEFAULT_THRESHOLD, ...(readJson<Partial<ThresholdSettings>>(DEFAULTS_KEY) ?? {}) };
}

export function saveThresholdDefaults(s: ThresholdSettings) {
  writeJson(DEFAULTS_KEY, s);
}

/** api-version values in the order to try them: the one that worked last first. */
export function apiVersionsToTry(): string[] {
  const last = readJson<string>(VERSION_KEY);
  return last ? [last, ...THRESHOLD_API_VERSIONS.filter((v) => v !== last)] : THRESHOLD_API_VERSIONS;
}

export function rememberApiVersion(v: string) {
  writeJson(VERSION_KEY, v);
}

export function thresholdErrorText(e: unknown): string {
  if (!e) return 'unknown error';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e).slice(0, 300);
  } catch {
    return String(e);
  }
}

const num = (v: unknown, fallback = 0) => (typeof v === 'number' ? v : Number(v) || fallback);

/** Credits of a "resourceConsumption" value: a number, a numeric string ("1,234.5") or an object holding the amount. */
export function creditAmount(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.max(0, v) : 0;
  if (typeof v === 'string') return Math.max(0, Number(v.replace(/[,\s]/g, '')) || 0);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const k = Object.keys(o).find((x) => /^(value|consumed|consumption|amount|total|credits)$/i.test(x));
    return k ? creditAmount(o[k]) : 0;
  }
  return 0;
}

/** Builds a threshold from an API row (any casing). */
export function thresholdFromRow(row: Record<string, unknown>, get: (row: Record<string, unknown>, name: string) => unknown): ResourceThreshold {
  const s = (n: string) => {
    const v = get(row, n);
    return typeof v === 'string' ? v : '';
  };
  return {
    resourceId: s('resourceId').toLowerCase(),
    environmentId: s('environmentId').toLowerCase(),
    limit: num(get(row, 'limit')),
    notificationThreshold: num(get(row, 'notificationThreshold')),
    notifyIfOverCapacity: get(row, 'notifyIfOverCapacity') === true,
    stopIfOverCapacity: get(row, 'stopIfOverCapacity') === true,
    stopResource: get(row, 'stopResource') === true,
    consumption: creditAmount(get(row, 'resourceConsumption')),
    createdOn: s('createdOn') || undefined,
  };
}

/** Creates or updates the threshold of one agent. Throws with the API error on failure. */
export async function setResourceThreshold(envId: string, resourceId: string, settings: ThresholdSettings): Promise<ResourceThreshold> {
  const body = {
    limit: Math.max(0, Math.round(settings.limit)),
    notificationThreshold: Math.min(100, Math.max(0, Math.round(settings.notificationThreshold))),
    notifyIfOverCapacity: settings.notifyIfOverCapacity,
    stopIfOverCapacity: settings.stopIfOverCapacity,
    stopResource: settings.stopResource,
  };
  let lastError = '';
  // Throttling and server errors are not caused by the api-version: report them instead of trying the next one.
  const fatal = (msg: string) => /\b429\b|too many requests|throttl|rate limit|\b50[0234]\b|timed? ?out|timeout/i.test(msg);
  for (const v of apiVersionsToTry()) {
    let r;
    try {
      r = await PowerPlatformforAdminsV2Service.UpsertResourceThreshold(envId, ENTITLEMENT, resourceId, v, body);
    } catch (err) {
      lastError = thresholdErrorText(err);
      if (fatal(lastError)) break;
      continue;
    }
    if (!r.success) {
      lastError = thresholdErrorText(r.error);
      if (fatal(lastError)) break;
      continue;
    }
    rememberApiVersion(v);
    const prev = cachedThresholds().byKey[thresholdKey(envId, resourceId)];
    const d = (r.data ?? {}) as Record<string, unknown>;
    const t: ResourceThreshold = {
      ...body,
      resourceId: resourceId.toLowerCase(),
      environmentId: envId.toLowerCase(),
      consumption: d.resourceConsumption != null ? creditAmount(d.resourceConsumption) : prev?.consumption ?? 0,
      createdOn: (typeof d.createdOn === 'string' ? d.createdOn : undefined) ?? prev?.createdOn,
    };
    saveOne(t);
    return t;
  }
  throw new Error(lastError || 'threshold update failed');
}
