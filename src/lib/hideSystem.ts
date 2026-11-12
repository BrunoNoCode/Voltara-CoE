import { useSyncExternalStore } from 'react';
import type { Resource } from '../data/types';

// "Hide resources owned by SYSTEM" preference, shared by every resource view and
// remembered per browser. On by default: the monitor focuses on content made by people.
const KEY = 'ppm.hideSystem.v1';
const listeners = new Set<() => void>();

export const readHideSystem = () => localStorage.getItem(KEY) !== 'false';

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** True when the owner is the Dataverse SYSTEM user (shown as "SYSTEM" or "# SYSTEM"). */
export const isSystemOwned = (r: Resource) => /^#?\s*system$/i.test(r.owner.trim());

export function setHideSystem(on: boolean) {
  localStorage.setItem(KEY, String(on));
  listeners.forEach((l) => l());
}

export function useHideSystem(): [boolean, (on: boolean) => void] {
  return [useSyncExternalStore(subscribe, readHideSystem), setHideSystem];
}
