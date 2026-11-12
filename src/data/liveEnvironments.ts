// Live environment inventory from the "Power Platform for Admins" connector,
// with a browser-side cache (stale-while-revalidate) and monitor metadata kept
// in localStorage. Nothing is stored in Dataverse.
import { PowerPlatformforAdminsService } from '../generated/services/PowerPlatformforAdminsService';
import { PowerPlatformforAdminsV2Service } from '../generated/services/PowerPlatformforAdminsV2Service';
import type { Environment as AdminEnvironment } from '../generated/models/PowerPlatformforAdminsModel';
import type { Clause, ResourceQueryResponse } from '../generated/models/PowerPlatformforAdminsV2Model';
import type { EnvType, Environment } from './types';

const API_VERSION = '2021-04-01';
const GROUPS_API_VERSIONS = ['2022-03-01-preview', '2024-10-01'];
const GROUP_NAMES_KEY = 'ppm.envGroupNames.v1';
const CACHE_KEY = 'ppm.environments.v1';
const META_KEY = 'ppm.envMeta.v1';
const PAGE_TIMEOUT_MS = 30_000;
const MAX_PAGES = 50;

// Fields returned by newer api-versions that the generated model does not declare.
type RawEnvironment = AdminEnvironment & {
  properties?: NonNullable<AdminEnvironment['properties']> & {
    description?: string;
    governanceConfiguration?: { protectionLevel?: string };
    linkedEnvironmentMetadata?: { securityGroupId?: string; instanceUrl?: string; resourceId?: string; instanceState?: string };
    // Power Platform environment group the environment belongs to (managed environments only).
    parentEnvironmentGroup?: { id?: string; displayName?: string; name?: string };
  };
};

/** Monitor-specific fields that the connector does not know about. The group comes from the API. */
export interface EnvMeta {
  monitored?: boolean;
  flags?: string[];
  name?: string;
  lastSynced?: string;
}

interface CachedList {
  savedAt: string;
  environments: Environment[];
}

const REGIONS: Record<string, string> = {
  europe: 'Europe',
  unitedstates: 'United States',
  unitedstatesfirstrelease: 'United States (Preview)',
  asia: 'Asia Pacific',
  australia: 'Australia',
  canada: 'Canada',
  india: 'India',
  japan: 'Japan',
  unitedkingdom: 'United Kingdom',
  france: 'France',
  germany: 'Germany',
  switzerland: 'Switzerland',
  norway: 'Norway',
  southamerica: 'South America',
  uae: 'UAE',
  korea: 'Korea',
  southafrica: 'South Africa',
  singapore: 'Singapore',
  sweden: 'Sweden',
};

export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Fired on window when the browser refuses to save something (storage full or disabled). */
export const STORAGE_FULL_EVENT = 'ppm:storage-full';

export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // Storage full or disabled: the app still works, just without persistence. The app shows a warning.
    console.warn(`Could not save ${key} in the browser`, err);
    window.dispatchEvent(new CustomEvent(STORAGE_FULL_EVENT, { detail: key }));
    return false;
  }
}

export function readCachedEnvironments(): CachedList | null {
  return readJson<CachedList>(CACHE_KEY);
}

export function writeCachedEnvironments(environments: Environment[]) {
  writeJson(CACHE_KEY, { savedAt: new Date().toISOString(), environments } satisfies CachedList);
}

export function readEnvMeta(): Record<string, EnvMeta> {
  return readJson<Record<string, EnvMeta>>(META_KEY) ?? {};
}

export function saveEnvMeta(id: string, patch: EnvMeta) {
  const all = readEnvMeta();
  all[id] = { ...all[id], ...patch };
  writeJson(META_KEY, all);
}

/** Overlays locally stored monitor metadata onto an environment list. */
export function applyEnvMeta(environments: Environment[]): Environment[] {
  const meta = readEnvMeta();
  return environments.map((e) => {
    const m = meta[e.id];
    if (!m) return e;
    return {
      ...e,
      monitored: m.monitored ?? e.monitored,
      flags: m.flags ?? e.flags,
      name: m.name || e.name,
      lastSynced: m.lastSynced ?? e.lastSynced,
    };
  });
}

function mapType(raw: RawEnvironment): EnvType {
  const p = raw.properties;
  if (p?.isDefault) return 'Default';
  const sku = (p?.environmentSku ?? '').toLowerCase();
  if (sku === 'production') return 'Production';
  if (sku === 'developer') return 'Developer';
  if (sku === 'default') return 'Default';
  return 'Sandbox'; // Sandbox, Trial, Teams and other SKUs
}

function mapEnvironment(raw: RawEnvironment): Environment | null {
  const id = raw.name;
  const p = raw.properties;
  if (!id || !p) return null;
  const linked = p.linkedEnvironmentMetadata;
  const location = raw.location ?? '';
  const ready = (p.provisioningState ?? 'Succeeded') === 'Succeeded' && (!linked?.instanceState || linked.instanceState === 'Ready');
  const protection = p.governanceConfiguration?.protectionLevel;
  const envGroup = p.parentEnvironmentGroup;
  return {
    id,
    name: p.displayName || id,
    type: mapType(raw),
    region: REGIONS[location.toLowerCase()] ?? (location || p.azureRegionHint || 'Unknown'),
    flags: [],
    managed: !!protection && protection !== 'Basic',
    // The response usually only carries the group ID; the name is resolved in fetchLiveEnvironments.
    group: envGroup?.displayName || envGroup?.name || envGroup?.id || '',
    groupId: envGroup?.id,
    // Health scoring is not implemented yet; surface provisioning problems only.
    status: ready ? 'Healthy' : 'Warning',
    created: p.createdTime ?? '',
    lastSynced: '',
    lastActivity: p.lastModifiedTime ?? p.createdTime ?? '',
    url: linked?.instanceUrl ?? '',
    organizationId: linked?.resourceId ?? '',
    securityGroup: linked?.securityGroupId ? { id: linked.securityGroupId, name: linked.securityGroupId } : undefined,
    monitored: false,
    description: p.description,
  };
}

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Connector call timed out')), ms))]);
}

function skipTokenOf(nextLink: string | undefined): string | undefined {
  if (!nextLink) return undefined;
  try {
    return new URL(nextLink).searchParams.get('$skiptoken') ?? undefined;
  } catch {
    return undefined;
  }
}

/** Connector payloads sometimes arrive as a JSON string or wrapped in a { body } envelope. */
export function unwrapData(data: unknown): unknown {
  let d = data;
  for (let i = 0; i < 4; i++) {
    if (typeof d === 'string') {
      try {
        d = JSON.parse(d);
      } catch {
        return d;
      }
    } else if (d && typeof d === 'object' && !Array.isArray(d) && 'body' in d && !('id' in d) && !('value' in d)) {
      d = (d as { body: unknown }).body;
    } else break;
  }
  return d;
}

/** Readable text of a connector error (Error, string or error payload). */
export function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  const e = unwrapData(err) as { message?: string; error?: { message?: string; code?: string } } | null;
  return e?.error?.message || e?.message || e?.error?.code || JSON.stringify(err);
}

type GroupLike = { id?: string; name?: string; displayName?: string; properties?: { displayName?: string } };

/** Accepts { value: [...] }, a bare array, or a single group. */
function groupsOf(data: unknown): { id: string; name: string }[] {
  const d = unwrapData(data);
  const list: GroupLike[] = Array.isArray(d) ? d : Array.isArray((d as { value?: unknown })?.value) ? (d as { value: GroupLike[] }).value : d && typeof d === 'object' ? [d as GroupLike] : [];
  return list
    .map((g) => {
      const id = (g.id ?? g.name ?? '').split('/').pop() ?? '';
      return { id: id.toLowerCase(), name: g.displayName || g.properties?.displayName || '' };
    })
    .filter((g) => g.id && g.name);
}

const cachedGroupNames = () => readJson<Record<string, string>>(GROUP_NAMES_KEY) ?? {};
const cacheGroupNames = (names: Record<string, string>) => writeJson(GROUP_NAMES_KEY, { ...cachedGroupNames(), ...names });

/** Last error of the environment group name lookup (shown when hovering an unresolved group ID). */
let lastEnvGroupError: string | undefined;
export const envGroupLookupError = () => lastEnvGroupError;

/** Cached display name of an environment group, if it was resolved before. */
export const cachedEnvGroupName = (id: string | undefined) => (id ? cachedGroupNames()[id.toLowerCase()] : undefined);

const INVENTORY_API_VERSION = '2024-10-01';
const ENV_GROUP_TYPE = 'microsoft.powerplatform/environmentgroups';
const GROUP_EXPAND = 'properties.parentEnvironmentGroup';

const shortId = (id: string | undefined) => (id ?? '').split('/').pop()?.toLowerCase() ?? '';

/**
 * Environment groups from the Power Platform inventory (Azure Resource Graph, the same source as
 * the PPAC "Inventory" page) via "Query Power Platform resources". Memoized per session.
 */
let inventoryPromise: Promise<Record<string, string>> | undefined;
function groupNamesFromInventory(): Promise<Record<string, string>> {
  inventoryPromise ??= (async () => {
    const errors: string[] = [];
    // KQL "==" is case-sensitive; "=~" is the case-insensitive fallback.
    for (const operator of ['==', '=~']) {
      try {
        const names: Record<string, string> = {};
        let skipToken: string | undefined;
        for (let page = 0; page < MAX_PAGES; page++) {
          const clauses = [
            { $type: 'where', FieldName: 'type', Operator: operator, Values: [`'${ENV_GROUP_TYPE}'`] },
            { $type: 'project', FieldList: ['id', 'name', 'type', 'properties'] },
          ] as unknown as Clause[];
          const result = await withTimeout(
            PowerPlatformforAdminsV2Service.QueryResources(INVENTORY_API_VERSION, {
              TableName: 'PowerPlatformResources',
              Clauses: clauses,
              Options: skipToken ? { Top: 1000, SkipToken: skipToken } : { Top: 1000 },
            }),
            PAGE_TIMEOUT_MS,
          );
          if (!result.success) throw result.error ?? new Error('QueryResources failed');
          const data = unwrapData(result.data) as ResourceQueryResponse | null;
          for (const item of data?.data ?? []) {
            const id = shortId(item.name || item.id);
            const name = (item.properties as { displayName?: string } | undefined)?.displayName;
            if (id && name) names[id] = name;
          }
          skipToken = data?.skipToken || undefined;
          if (!skipToken) break;
        }
        if (Object.keys(names).length) return names;
        errors.push(`Inventory (${operator}): no environment groups returned`);
      } catch (err) {
        errors.push(`Inventory (${operator}): ${errorText(err)}`);
      }
    }
    throw new Error(errors.join(' | '));
  })();
  // Failures are retried on the next lookup.
  inventoryPromise.catch(() => (inventoryPromise = undefined));
  return inventoryPromise;
}

/** Harvests parentEnvironmentGroup display names from raw admin environments. */
function groupNamesOfEnvironments(raws: RawEnvironment[]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const raw of raws) {
    const g = raw.properties?.parentEnvironmentGroup;
    const id = shortId(g?.id || g?.name);
    if (id && g?.displayName && g.displayName.toLowerCase() !== id) names[id] = g.displayName;
  }
  return names;
}

/** Admin environment list with $expand=properties.parentEnvironmentGroup. Memoized per session. */
let expandedPromise: Promise<Record<string, string>> | undefined;
function groupNamesFromExpandedEnvironments(): Promise<Record<string, string>> {
  expandedPromise ??= (async () => {
    const raws: RawEnvironment[] = [];
    let skipToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await withTimeout(PowerPlatformforAdminsService.Get_AdminEnvironment(API_VERSION, skipToken, undefined, GROUP_EXPAND), PAGE_TIMEOUT_MS);
      if (!result.success) throw result.error ?? new Error('Get-AdminEnvironment failed');
      raws.push(...((result.data?.value ?? []) as RawEnvironment[]));
      skipToken = skipTokenOf(result.data?.nextLink);
      if (!skipToken) break;
    }
    const names = groupNamesOfEnvironments(raws);
    if (!Object.keys(names).length) throw new Error('no group display names in the response');
    return names;
  })();
  expandedPromise.catch(() => (expandedPromise = undefined));
  return expandedPromise;
}

/** ListEnvironmentGroups on each api-version until one answers. */
async function groupNamesFromList(): Promise<Record<string, string>> {
  const errors: string[] = [];
  for (const version of GROUPS_API_VERSIONS) {
    try {
      const result = await withTimeout(PowerPlatformforAdminsV2Service.ListEnvironmentGroups(version), PAGE_TIMEOUT_MS);
      if (!result.success) throw result.error ?? new Error('ListEnvironmentGroups failed');
      const groups = groupsOf(result.data);
      if (groups.length) return Object.fromEntries(groups.map((g) => [g.id, g.name]));
      errors.push(`(${version}): no groups in the response`);
    } catch (err) {
      errors.push(`(${version}): ${errorText(err)}`);
    }
  }
  throw new Error(errors.join(', '));
}

/** GetEnvironmentGroup per ID, on each api-version. */
async function groupNamesFromGet(ids: string[]): Promise<Record<string, string>> {
  const names: Record<string, string> = {};
  const errors: string[] = [];
  await Promise.all(
    ids.map(async (id) => {
      for (const version of GROUPS_API_VERSIONS) {
        try {
          const result = await withTimeout(PowerPlatformforAdminsV2Service.GetEnvironmentGroup(id, version), PAGE_TIMEOUT_MS);
          if (!result.success) throw result.error ?? new Error('GetEnvironmentGroup failed');
          const name = groupsOf(result.data)[0]?.name;
          if (name) {
            names[id] = name;
            return;
          }
          errors.push(`(${version}): response had no displayName`);
        } catch (err) {
          errors.push(`(${version}): ${errorText(err)}`);
        }
      }
    }),
  );
  if (!Object.keys(names).length && errors.length) throw new Error([...new Set(errors)].join(', '));
  return names;
}

/**
 * Resolves environment group display names, trying each source in order until every ID is known:
 * inventory query, expanded environment list, ListEnvironmentGroups, GetEnvironmentGroup.
 * Results are cached in localStorage; failures are not.
 */
async function resolveGroupNames(groupIds: string[], opts: { skipExpanded?: boolean } = {}): Promise<Map<string, string>> {
  const map = new Map<string, string>(Object.entries(cachedGroupNames()));
  const wanted = [...new Set(groupIds.map(shortId))].filter(Boolean);
  const missing = () => wanted.filter((id) => !map.has(id));
  if (!missing().length) return map;
  const sources: [string, () => Promise<Record<string, string>>][] = [
    ['Inventory query', groupNamesFromInventory],
    ...(opts.skipExpanded ? [] : ([['Environments $expand', groupNamesFromExpandedEnvironments]] as [string, () => Promise<Record<string, string>>][])),
    ['ListEnvironmentGroups', groupNamesFromList],
    ['GetEnvironmentGroup', () => groupNamesFromGet(missing())],
  ];
  const errors: string[] = [];
  for (const [label, run] of sources) {
    try {
      const names = await run();
      cacheGroupNames(names);
      for (const [id, name] of Object.entries(names)) map.set(id, name);
      if (!missing().length) break;
      errors.push(`${label}: group not found`);
    } catch (err) {
      errors.push(`${label}: ${errorText(err)}`);
    }
  }
  if (missing().length) {
    lastEnvGroupError = errors.join(' | ');
    console.warn(`Could not resolve environment group(s) ${missing().join(', ')}: ${lastEnvGroupError}`);
  } else lastEnvGroupError = undefined;
  return map;
}

/** Display name of one environment group (see resolveGroupNames for the sources tried). */
export async function fetchEnvironmentGroupName(groupId: string): Promise<{ name: string | null; error?: string }> {
  const id = shortId(groupId);
  const name = (await resolveGroupNames([id])).get(id);
  return name ? { name } : { name: null, error: lastEnvGroupError };
}

/** PPAC links. */
export const ppacEnvironmentUrl = (envId: string) => `https://admin.powerplatform.microsoft.com/manage/environments/environment/${envId}/hub`;
export const ppacEnvironmentGroupUrl = (groupId: string) => `https://admin.powerplatform.microsoft.com/manage/environmentGroups/${groupId}`;

/** Fetches every environment the signed-in user can see as an admin, following paging. */
export async function fetchLiveEnvironments(): Promise<Environment[]> {
  const load = async (expand?: string) => {
    const raws: RawEnvironment[] = [];
    let skipToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await withTimeout(PowerPlatformforAdminsService.Get_AdminEnvironment(API_VERSION, skipToken, undefined, expand), PAGE_TIMEOUT_MS);
      if (!result.success) throw result.error ?? new Error('Get-AdminEnvironment failed');
      raws.push(...((result.data?.value ?? []) as RawEnvironment[]));
      skipToken = skipTokenOf(result.data?.nextLink);
      if (!skipToken) break;
    }
    return raws;
  };
  // Ask for the parent environment group to be expanded (gives its display name); retry plain if refused.
  let expanded = true;
  const raws = await load(GROUP_EXPAND).catch(() => {
    expanded = false;
    return load();
  });
  cacheGroupNames(groupNamesOfEnvironments(raws));
  const out = raws.map(mapEnvironment).filter((e): e is Environment => e !== null);
  // Group names are a nice-to-have: if the lookup fails, the group ID is shown instead.
  const groupIds = out.map((e) => e.groupId).filter((id): id is string => !!id);
  const names = await resolveGroupNames(groupIds, { skipExpanded: expanded }).catch(() => new Map<string, string>());
  for (const e of out) {
    const name = e.groupId && names.get(e.groupId.toLowerCase());
    if (name) e.group = name;
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
