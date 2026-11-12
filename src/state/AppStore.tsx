import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  LIVE_GROUPS,
  NoDataverseError,
  staleGroups,
  fetchSnapshot,
  getCurrentUser,
  groupKeyOf,
  loadCachedEnvironments,
  readCachedResources,
  refreshEnvironmentResources,
  removeCachedResources,
  refreshEnvironments,
  type CurrentUser,
  type EnvSource,
  type FetchPlan,
  type LiveGroup,
  type Snapshot,
} from '../data/api';
import { applyEnvMeta, saveEnvMeta } from '../data/liveEnvironments';
import { initResourceCache } from '../data/resourceCache';
import type { Environment, Resource, Tag } from '../data/types';
import { setHideSystem } from '../lib/hideSystem';
import { applyRuleTags } from '../lib/tagRules';
import { mergeTags, writeStoredTags, type SettingsFile } from '../lib/settingsTransfer';

/** What an imported settings file changed. */
export interface ImportSummary {
  tagsAdded: number;
  tagsUpdated: number;
  environments: number;
  /** Environments in the file that this user cannot see (their settings are kept for later). */
  unknownEnvironments: number;
}

/** Live resource inventory state of one environment. */
export interface ResourceLoad {
  state: 'loading' | 'ready' | 'error' | 'unavailable';
  /** When the inventory shown was fetched live (may come from the cache). */
  fetchedAt?: string;
  /** True while a background refresh runs on top of cached rows. */
  refreshing?: boolean;
  /** Rows come from the browser cache only (no live refresh yet in this session). */
  cachedOnly?: boolean;
  error?: string;
  /** Resource groups whose last live query failed (they show cached rows, if any). */
  groupErrors?: Partial<Record<LiveGroup, string>>;
}

/** Outcome of a resource sync over several environments. */
export interface ResourceSyncResult {
  total: number;
  failed: number;
  noDataverse: number;
  failedNames: string[];
}

interface Store extends Snapshot {
  loading: boolean;
  user: CurrentUser;
  /** Origin of the environment list and when it was last fetched live. */
  envSource: EnvSource;
  envFetchedAt?: string;
  envError?: string;
  monitorEnvironment: (id: string, flags: string[], displayName?: string) => void;
  setEnvironmentFlags: (id: string, flags: string[]) => void;
  /** Stops monitoring an environment (it can be added again later). */
  unmonitorEnvironment: (id: string) => void;
  /** Per-environment state of the live resource inventory (hosted only). */
  resourceLoads: Record<string, ResourceLoad>;
  /**
   * Loads an environment's live resources: cached rows first, then a live refresh. No-op if already loaded unless forced.
   * A plan limits the refresh to some groups / lookups (Action Center evaluations).
   */
  loadEnvironmentResources: (id: string, force?: boolean, plan?: FetchPlan) => Promise<boolean>;
  /** Shows cached rows for environments not loaded yet in this session (no live calls). */
  showCachedResources: (ids: string[]) => void;
  /** Re-fetches an environment's resources live and marks it synced. */
  syncEnvironment: (id: string) => Promise<void>;
  /** Re-fetches the environment list live; resolves with how many environments were loaded. */
  syncAllEnvironments: () => Promise<number>;
  /**
   * Loads the resources of every monitored environment, or only of `ids` (3 at a time). Already-loaded environments are
   * skipped unless forced. Progress is shared through `resourceSync`.
   */
  syncMonitoredResources: (force?: boolean, ids?: string[]) => Promise<ResourceSyncResult>;
  /** Progress of the running resource sync (any page), null when none runs. */
  resourceSync: { done: number; total: number } | null;
  /**
   * Refreshes only what the plan needs in the given environments, skipping groups fetched less than
   * maxAgeMs ago. onProgress is called after each environment.
   */
  syncResourcesForPlan: (
    envIds: string[],
    plan: FetchPlan,
    maxAgeMs: number,
    onProgress?: (done: number) => void,
  ) => Promise<{ total: number; failed: number; refreshed: number }>;
  /** Removes a deleted resource from the inventory and its cache. */
  removeResource: (envId: string, id: string) => void;
  createTag: (tag: Omit<Tag, 'id' | 'resources' | 'active'>) => void;
  toggleTag: (id: string) => void;
  /** Replaces fields of one tag (e.g. refreshed group members). */
  updateTag: (id: string, change: Partial<Omit<Tag, 'id'>>) => void;
  deleteTag: (id: string) => void;
  /** Applies an exported settings file (tags, environment settings, hide-SYSTEM preference). */
  importSettings: (file: SettingsFile) => ImportSummary;
}

const AppStoreContext = createContext<Store | null>(null);

const empty: Snapshot = { environments: [], resources: [], tags: [], activity: [] };

const errorText = (err: unknown, fallback = 'Could not load environments') =>
  err instanceof Error ? err.message : typeof err === 'string' ? err : fallback;

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const cached = useRef(loadCachedEnvironments());
  const [data, setData] = useState<Snapshot>(() => ({ ...empty, environments: cached.current?.environments ?? [] }));
  const [loading, setLoading] = useState(!cached.current);
  const [user, setUser] = useState<CurrentUser>({ fullName: '' });
  const [envSource, setEnvSource] = useState<EnvSource>(cached.current ? 'cache' : 'demo');
  const [envFetchedAt, setEnvFetchedAt] = useState(cached.current?.fetchedAt);
  const [envError, setEnvError] = useState<string>();

  const reloadEnvironments = useCallback(async () => {
    try {
      const res = await refreshEnvironments();
      const environments = res.environments;
      setData((d) => ({ ...d, environments }));
      setEnvSource(res.source);
      setEnvFetchedAt(res.fetchedAt);
      setEnvError(undefined);
      return environments.length;
    } catch (err) {
      // Keep showing the cached list (if any) and report the failure.
      setEnvError(errorText(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Pages may already have put cached rows on screen: keep them, the snapshot only fills the other environments.
    fetchSnapshot().then((s) =>
      setData((d) => {
        const shown = new Set(d.resources.map((r) => r.envId));
        return { ...d, ...s, resources: [...s.resources.filter((r) => !shown.has(r.envId)), ...d.resources] };
      }),
    );
    // Nothing syncs at start-up: the cached list is shown and refreshed only by a Sync button.
    // Only the very first run (nothing cached yet) loads the list.
    if (!cached.current) reloadEnvironments().catch(() => undefined);
    getCurrentUser().then(setUser);
  }, [reloadEnvironments]);

  const updateEnv = useCallback((id: string, patch: (e: Environment) => Environment) => {
    setData((d) => ({ ...d, environments: d.environments.map((e) => (e.id === id ? patch(e) : e)) }));
  }, []);

  const monitorEnvironment = useCallback((id: string, flags: string[], displayName?: string) => {
    const now = new Date().toISOString();
    setData((d) => {
      const env = d.environments.find((e) => e.id === id);
      return {
        ...d,
        environments: d.environments.map((e) =>
          e.id === id ? { ...e, monitored: true, flags, name: displayName?.trim() || e.name, lastSynced: now } : e,
        ),
        activity: env
          ? [{ id: `a-${Date.now()}-${id}`, title: 'Environment added', subtitle: displayName?.trim() || env.name, kind: 'env' as const, minutesAgo: 0 }, ...d.activity]
          : d.activity,
      };
    });
    // No name typed: keep the custom name saved earlier.
    saveEnvMeta(id, { monitored: true, flags, ...(displayName?.trim() ? { name: displayName.trim() } : {}), lastSynced: now });
  }, []);

  const setEnvironmentFlags = useCallback(
    (id: string, flags: string[]) => {
      updateEnv(id, (e) => ({ ...e, flags }));
      saveEnvMeta(id, { flags });
    },
    [updateEnv],
  );

  const unmonitorEnvironment = useCallback((id: string) => {
    setData((d) => {
      const env = d.environments.find((e) => e.id === id);
      return {
        ...d,
        environments: d.environments.map((e) => (e.id === id ? { ...e, monitored: false } : e)),
        activity: env
          ? [{ id: `a-${Date.now()}-${id}`, title: 'Environment removed', subtitle: env.name, kind: 'env' as const, minutesAgo: 0 }, ...d.activity]
          : d.activity,
      };
    });
    saveEnvMeta(id, { monitored: false });
  }, []);

  const markSynced = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      updateEnv(id, (e) => ({ ...e, lastSynced: now }));
      saveEnvMeta(id, { lastSynced: now });
    },
    [updateEnv],
  );

  const [resourceLoads, setResourceLoads] = useState<Record<string, ResourceLoad>>({});
  // Refs so the loader stays stable and always sees the latest state.
  const dataRef = useRef(data);
  const loadsRef = useRef(resourceLoads);
  const inFlight = useRef(new Map<string, Promise<boolean>>());
  /** Plan of the load in flight (undefined = full load). */
  const inFlightPlan = useRef(new Map<string, FetchPlan | undefined>());
  useEffect(() => {
    dataRef.current = data;
    loadsRef.current = resourceLoads;
  }, [data, resourceLoads]);

  const setLoad = useCallback((id: string, load: ResourceLoad | undefined) => {
    setResourceLoads((cur) => {
      const next = { ...cur };
      if (load) next[id] = load;
      else delete next[id];
      loadsRef.current = next;
      return next;
    });
  }, []);

  /** Replaces an environment's rows of the given groups (other groups keep their rows). */
  const replaceGroups = useCallback((envId: string, rows: Resource[], groups: readonly LiveGroup[]) => {
    const set = new Set(groups);
    setData((d) => ({
      ...d,
      resources: [...d.resources.filter((r) => !(r.envId === envId && set.has(groupKeyOf(r)))), ...rows],
    }));
  }, []);

  const loadEnvironmentResources = useCallback(
    function load(id: string, force = false, plan?: FetchPlan): Promise<boolean> {
      const pending = inFlight.current.get(id);
      if (pending) {
        // A forced load that the partial load in flight does not cover runs again once it is done.
        const p = inFlightPlan.current.get(id);
        const covered =
          !p ||
          (!!plan &&
            plan.groups.every((g) => p.groups.includes(g)) &&
            (!plan.solutions || p.solutions) &&
            (!plan.runs || p.runs) &&
            (!plan.customFlags || p.customFlags));
        if (force && !covered) return pending.catch(() => undefined).then(() => load(id, force, plan));
        return pending;
      }
      const env = dataRef.current.environments.find((e) => e.id === id);
      const current = loadsRef.current[id];
      if (!env || (!force && current && current.state !== 'error' && !current.cachedOnly)) return Promise.resolve(false);

      // Show the cached inventory immediately, then refresh it live.
      let cachedAt = current?.fetchedAt;
      if (!current) {
        const cached = readCachedResources(id);
        if (cached) {
          replaceGroups(id, cached.resources, LIVE_GROUPS);
          cachedAt = cached.savedAt;
        }
      }
      setLoad(id, cachedAt ? { state: 'ready', fetchedAt: cachedAt, refreshing: true } : { state: 'loading' });

      const run = (async () => {
        try {
          const res = await refreshEnvironmentResources(env, plan);
          if (res === null) {
            setLoad(id, undefined); // demo mode: keep the demo resources
            return false;
          }
          replaceGroups(id, res.resources, res.loaded);
          const groupErrors = Object.keys(res.errors).length ? res.errors : undefined;
          setLoad(id, { state: 'ready', fetchedAt: new Date().toISOString(), groupErrors });
          // A partial (plan) refresh does not count as a full sync of the environment.
          if (!plan || plan.groups.length === LIVE_GROUPS.length) markSynced(id);
          return true;
        } catch (err) {
          if (err instanceof NoDataverseError) setLoad(id, { state: 'unavailable' });
          else {
            const error = errorText(err, 'Could not load resources');
            setLoad(id, cachedAt ? { state: 'ready', fetchedAt: cachedAt, error } : { state: 'error', error });
          }
          throw err;
        } finally {
          inFlight.current.delete(id);
          inFlightPlan.current.delete(id);
        }
      })();
      inFlight.current.set(id, run);
      inFlightPlan.current.set(id, plan);
      return run;
    },
    [replaceGroups, setLoad, markSynced],
  );

  // The resource cache is read from IndexedDB once; pages re-show cached rows when it is in
  // (showCachedResources changes identity, so their effects run again).
  const [cacheReady, setCacheReady] = useState(false);
  // Ref so callbacks created before the cache was in see it once it is.
  const cacheReadyRef = useRef(false);
  useEffect(() => {
    initResourceCache().finally(() => {
      cacheReadyRef.current = true;
      setCacheReady(true);
    });
  }, []);

  const showCachedResources = useCallback(
    (ids: string[]) => {
      if (!cacheReadyRef.current) return;
      for (const id of ids) {
        if (loadsRef.current[id] || inFlight.current.has(id)) continue;
        const cached = readCachedResources(id);
        if (!cached) continue;
        replaceGroups(id, cached.resources, LIVE_GROUPS);
        setLoad(id, { state: 'ready', fetchedAt: cached.savedAt, cachedOnly: true });
      }
    },
    // cacheReady: new identity once the cache is loaded, so effects using it run again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheReady, replaceGroups, setLoad],
  );

  const syncEnvironment = useCallback(
    async (id: string) => {
      const live = await loadEnvironmentResources(id, true);
      if (!live) markSynced(id); // demo mode
    },
    [loadEnvironmentResources, markSynced],
  );

  const syncAllEnvironments = useCallback(() => reloadEnvironments(), [reloadEnvironments]);

  const [resourceSync, setResourceSync] = useState<{ done: number; total: number } | null>(null);

  const syncMonitoredResources = useCallback(
    async (force = false, only?: string[]): Promise<ResourceSyncResult> => {
      const envs = dataRef.current.environments.filter((e) => e.monitored && (!only || only.includes(e.id)));
      let next = 0;
      let noDataverse = 0;
      const failedNames: string[] = [];
      setResourceSync({ done: 0, total: envs.length });
      // A few environments at a time, so the Dataverse calls don't pile up.
      const worker = async () => {
        while (next < envs.length) {
          const env = envs[next++];
          try {
            const live = await loadEnvironmentResources(env.id, force);
            if (!live && force) markSynced(env.id); // demo mode
          } catch (err) {
            if (err instanceof NoDataverseError) noDataverse++;
            else failedNames.push(env.name);
          } finally {
            setResourceSync((p) => (p ? { ...p, done: p.done + 1 } : p));
          }
        }
      };
      try {
        await Promise.all(Array.from({ length: Math.min(3, envs.length) }, worker));
      } finally {
        setResourceSync(null);
      }
      return { total: envs.length, failed: failedNames.length, noDataverse, failedNames };
    },
    [loadEnvironmentResources, markSynced],
  );

  const syncResourcesForPlan = useCallback(
    async (envIds: string[], plan: FetchPlan, maxAgeMs: number, onProgress?: (done: number) => void) => {
      await initResourceCache(); // staleGroups reads the cache
      cacheReadyRef.current = true;
      let next = 0;
      let done = 0;
      let failed = 0;
      let refreshed = 0;
      const worker = async () => {
        while (next < envIds.length) {
          const id = envIds[next++];
          try {
            // A load already running (e.g. the background sync at start-up) may cover what the plan needs.
            await inFlight.current.get(id)?.catch(() => undefined);
            const groups = staleGroups(id, plan, maxAgeMs);
            if (!groups.length) showCachedResources([id]);
            else {
              refreshed++;
              const live = await loadEnvironmentResources(id, true, { ...plan, groups });
              if (!live) markSynced(id); // demo mode
            }
          } catch (err) {
            if (!(err instanceof NoDataverseError)) failed++;
          } finally {
            onProgress?.(++done);
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(4, envIds.length) }, worker));
      return { total: envIds.length, failed, refreshed };
    },
    [loadEnvironmentResources, showCachedResources, markSynced],
  );

  const removeResource = useCallback((envId: string, id: string) => {
    const key = id.toLowerCase();
    setData((d) => ({ ...d, resources: d.resources.filter((r) => !(r.envId === envId && r.id.toLowerCase() === key)) }));
    removeCachedResources(envId, [id]);
  }, []);

  /** Updates the tag definitions and remembers them in this browser. */
  const updateTags = useCallback((change: (tags: Tag[]) => Tag[]) => {
    setData((d) => {
      const tags = change(d.tags);
      writeStoredTags(tags);
      return { ...d, tags };
    });
  }, []);

  const createTag = useCallback(
    (tag: Omit<Tag, 'id' | 'resources' | 'active'>) => updateTags((tags) => [...tags, { ...tag, id: `t-${Date.now()}`, resources: 0, active: true }]),
    [updateTags],
  );

  const toggleTag = useCallback((id: string) => updateTags((tags) => tags.map((t) => (t.id === id ? { ...t, active: !t.active } : t))), [updateTags]);

  const updateTag = useCallback(
    (id: string, change: Partial<Omit<Tag, 'id'>>) => updateTags((tags) => tags.map((t) => (t.id === id ? { ...t, ...change } : t))),
    [updateTags],
  );

  const deleteTag = useCallback((id: string) => updateTags((tags) => tags.filter((t) => t.id !== id)), [updateTags]);

  const importSettings = useCallback(
    (file: SettingsFile): ImportSummary => {
      const current = dataRef.current.tags;
      const merged = mergeTags(current, file.tags);
      const tagsAdded = merged.length - current.length;
      const tagsUpdated = file.tags.length - tagsAdded;
      updateTags(() => merged);
      // Imported environment settings win; lastSynced stays device-specific.
      const envIds = Object.keys(file.environments);
      for (const id of envIds) {
        const { monitored, flags, name } = file.environments[id];
        saveEnvMeta(id, {
          ...(monitored !== undefined && { monitored }),
          ...(flags && { flags }),
          ...(name && { name }),
        });
      }
      setData((d) => ({ ...d, environments: applyEnvMeta(d.environments) }));
      setHideSystem(file.hideSystem);
      const known = new Set(dataRef.current.environments.map((e) => e.id));
      return { tagsAdded, tagsUpdated, environments: envIds.length, unknownEnvironments: envIds.filter((id) => !known.has(id)).length };
    },
    [updateTags],
  );

  // Demo resources only belong to demo environments; live environments only have
  // the resources loaded through loadEnvironmentResources. Rule-based tags are
  // evaluated here, so every table and filter sees them as regular tags.
  const resources = useMemo(() => {
    const ids = new Set(data.environments.map((e) => e.id));
    return applyRuleTags(
      data.resources.filter((r) => ids.has(r.envId)),
      data.tags,
    );
  }, [data.environments, data.resources, data.tags]);

  const value = useMemo<Store>(
    () => ({
      ...data,
      resources,
      loading,
      user,
      envSource,
      envFetchedAt,
      envError,
      monitorEnvironment,
      setEnvironmentFlags,
      unmonitorEnvironment,
      resourceLoads,
      loadEnvironmentResources,
      showCachedResources,
      syncEnvironment,
      syncAllEnvironments,
      syncMonitoredResources,
      resourceSync,
      syncResourcesForPlan,
      removeResource,
      createTag,
      toggleTag,
      updateTag,
      deleteTag,
      importSettings,
    }),
    [
      data,
      resources,
      loading,
      user,
      envSource,
      envFetchedAt,
      envError,
      monitorEnvironment,
      setEnvironmentFlags,
      unmonitorEnvironment,
      resourceLoads,
      loadEnvironmentResources,
      showCachedResources,
      syncEnvironment,
      syncAllEnvironments,
      syncMonitoredResources,
      resourceSync,
      syncResourcesForPlan,
      removeResource,
      createTag,
      toggleTag,
      updateTag,
      deleteTag,
      importSettings,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}
