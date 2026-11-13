import { useSyncExternalStore } from 'react';
import type { Resource, ResourceType } from '../data/types';
import { isSystemOwned } from './hideSystem';

// "Include in AI Hub" setting per environment, remembered per browser. Only explicit choices
// are stored; without one, an environment is included when it contains AI resources.
const KEY = 'ppm.aiHubEnvs.v1';
const listeners = new Set<() => void>();

/** Resource types that make an environment part of the AI Hub by default. */
export const AI_HUB_TYPES = new Set<ResourceType>(['AI Model', 'Copilot Studio', 'Agent Flow']);

let raw: string | null = null;
let parsed: Record<string, boolean> = {};

/** Explicit choices: envId → included. */
export function readAiHubOverrides(): Record<string, boolean> {
  const next = localStorage.getItem(KEY);
  if (next !== raw) {
    raw = next;
    try {
      parsed = next ? (JSON.parse(next) as Record<string, boolean>) : {};
    } catch {
      parsed = {};
    }
  }
  return parsed;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Default when there is no explicit choice: the environment contains AI Models, Copilot Studio agents or agent flows.
 * MSFT-owned resources (see hideSystem.ts) don't count — every Dataverse environment ships prebuilt AI Builder models owned by SYSTEM.
 */
export const hasAiResources = (envId: string, resources: Resource[]) =>
  resources.some((r) => r.envId === envId && AI_HUB_TYPES.has(r.type) && !isSystemOwned(r));

export const isInAiHub = (envId: string, resources: Resource[], overrides: Record<string, boolean>) => overrides[envId] ?? hasAiResources(envId, resources);

/** Sets the choice for an environment; `undefined` goes back to the default. */
export function setAiHubOverride(envId: string, on: boolean | undefined) {
  const next = { ...readAiHubOverrides() };
  if (on === undefined) delete next[envId];
  else next[envId] = on;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useAiHubOverrides() {
  return useSyncExternalStore(subscribe, readAiHubOverrides);
}
