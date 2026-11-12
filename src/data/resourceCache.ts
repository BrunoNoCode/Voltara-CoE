// Per-environment resource cache, kept in the browser's IndexedDB (localStorage only holds about
// 5M characters, which a few large environments fill up). Reads are synchronous from an in-memory
// copy that is loaded once at start-up; writes update the copy and are saved in the background.
// Nothing leaves the browser.
import { STORAGE_FULL_EVENT } from './liveEnvironments';
import type { CachedResources } from './liveResources';

const DB_NAME = 'ppm';
const STORE = 'resources';
/** Resource caches of all versions that older app versions kept in localStorage. */
const LEGACY_KEY = /^ppm\.resources\.(.+)\.v(\d+)$/;
const CURRENT_LEGACY_VERSION = 9;

const mem = new Map<string, CachedResources>();
let dbPromise: Promise<IDBDatabase | null> | null = null;
let initPromise: Promise<void> | null = null;

const reqDone = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

function openDb(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function warnNotSaved(envId: string, err: unknown) {
  console.warn(`Could not cache the resources of ${envId} in the browser`, err);
  window.dispatchEvent(new CustomEvent(STORAGE_FULL_EVENT, { detail: envId }));
}

async function save(envId: string, value: CachedResources | null) {
  const db = await openDb();
  if (!db) return warnNotSaved(envId, 'IndexedDB is not available');
  try {
    const tx = db.transaction(STORE, 'readwrite');
    if (value) tx.objectStore(STORE).put(value, envId);
    else tx.objectStore(STORE).delete(envId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    warnNotSaved(envId, err);
  }
}

/** Caches saved before the rename hold the Microsoft Copilot harness under its old name, "GitHub Copilot". */
function renameHarness(value: CachedResources): CachedResources {
  for (const r of value?.resources ?? []) {
    if ((r.poweredBy as string | undefined) === 'GitHub Copilot') r.poweredBy = 'MSFT Copilot';
  }
  return value;
}

/**
 * Loads the cache into memory (once). The current localStorage cache of older app versions is moved
 * over, and every legacy copy is removed from localStorage to free its space.
 */
export function initResourceCache(): Promise<void> {
  initPromise ??= (async () => {
    const db = await openDb();
    if (db) {
      try {
        const store = db.transaction(STORE, 'readonly').objectStore(STORE);
        const [keys, values] = await Promise.all([reqDone(store.getAllKeys()), reqDone(store.getAll())]);
        keys.forEach((k, i) => mem.set(String(k), renameHarness(values[i] as CachedResources)));
      } catch (err) {
        console.warn('Could not read the resource cache', err);
      }
    }

    const legacy: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && LEGACY_KEY.test(key)) legacy.push(key);
    }
    for (const key of legacy) {
      const [, envId, version] = LEGACY_KEY.exec(key)!;
      if (Number(version) === CURRENT_LEGACY_VERSION) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as CachedResources | null;
          const value = parsed && renameHarness(parsed);
          const have = mem.get(envId);
          if (value && (!have || have.savedAt < value.savedAt)) {
            mem.set(envId, value);
            await save(envId, value);
          }
        } catch {
          // unreadable: dropped
        }
      }
      localStorage.removeItem(key);
    }

    // Ask the browser not to evict the cache under storage pressure (it may decline).
    void navigator.storage?.persist?.().catch(() => undefined);
  })();
  return initPromise;
}

export function getCachedResources(envId: string): CachedResources | null {
  return mem.get(envId) ?? null;
}

export function putCachedResources(envId: string, value: CachedResources) {
  mem.set(envId, value);
  void save(envId, value);
}

/** Approximate size (characters of JSON) of each environment's cache, biggest first. */
export function cachedResourceSizes(): { envId: string; size: number; rows: number }[] {
  return [...mem.entries()].map(([envId, v]) => ({ envId, size: JSON.stringify(v).length, rows: v.resources.length })).sort((a, b) => b.size - a.size);
}
