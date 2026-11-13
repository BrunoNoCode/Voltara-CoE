import { useSyncExternalStore } from 'react';
import type { Resource } from '../data/types';

// "Hide MSFT-owned" preference, shared by every resource view and remembered per
// browser. On by default: the monitor focuses on content made by people. Which owners
// count as Microsoft-owned is configurable on the Settings page.
const KEY = 'ppm.hideSystem.v1';
const OWNERS_KEY = 'ppm.hiddenOwners.v1';
const listeners = new Set<() => void>();

export const DEFAULT_HIDDEN_OWNERS = ['SYSTEM', 'Microsoft Corporation', 'Dynamics 365', 'Publisher for Microsoft First Party Solutions', 'Provision Dynamics Provision'];

export const readHideSystem = () => localStorage.getItem(KEY) !== 'false';

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const norm = (s: string) => s.trim().replace(/^#\s*/, '').replace(/\s+/g, ' ').toLowerCase();

let ownersRaw: string | null | undefined;
let ownersList: string[] = DEFAULT_HIDDEN_OWNERS;
let ownersSet = new Set(DEFAULT_HIDDEN_OWNERS.map(norm));

/** Owner names treated as Microsoft-owned (stable reference until the list changes). */
export function readHiddenOwners(): string[] {
  const raw = localStorage.getItem(OWNERS_KEY);
  if (raw !== ownersRaw) {
    ownersRaw = raw;
    let list = DEFAULT_HIDDEN_OWNERS;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) list = parsed.filter((x): x is string => typeof x === 'string' && !!x.trim());
    } catch {
      // keep the defaults
    }
    ownersList = list;
    ownersSet = new Set(list.map(norm));
  }
  return ownersList;
}

export function setHiddenOwners(owners: string[]) {
  const seen = new Set<string>();
  const clean = owners.map((o) => o.trim()).filter((o) => o && !seen.has(norm(o)) && seen.add(norm(o)));
  localStorage.setItem(OWNERS_KEY, JSON.stringify(clean));
  listeners.forEach((l) => l());
}

/** True when the owner is on the hidden-owners list (case-insensitive; a leading "#" is ignored, e.g. "# SYSTEM"). */
export const isSystemOwned = (r: Resource) => {
  readHiddenOwners();
  return ownersSet.has(norm(r.owner));
};

export function setHideSystem(on: boolean) {
  localStorage.setItem(KEY, String(on));
  listeners.forEach((l) => l());
}

export function useHideSystem(): [boolean, (on: boolean) => void] {
  return [useSyncExternalStore(subscribe, readHideSystem), setHideSystem];
}

export function useHiddenOwners(): string[] {
  return useSyncExternalStore(subscribe, readHiddenOwners);
}
