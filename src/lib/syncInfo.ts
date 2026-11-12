import type { Environment } from '../data/types';
import type { ResourceLoad } from '../state/AppStore';
import { fmtAgo } from './format';

export interface ResourceSyncSummary {
  /** Most recent / oldest resource sync among the environments that have one. */
  latest?: string;
  oldest?: string;
  /** Environments never synced in this browser. */
  missing: number;
  /** Tooltip: when each environment was last synced. */
  title: string;
}

/** When the resources of the given environments were last loaded live (cached rows keep their original time). */
export function resourceSyncSummary(envs: Environment[], loads: Record<string, ResourceLoad>): ResourceSyncSummary {
  const times: string[] = [];
  const lines: string[] = [];
  for (const e of envs) {
    const at = loads[e.id]?.fetchedAt || e.lastSynced;
    if (at) times.push(at);
    if (lines.length < 12) lines.push(`${e.name}: ${at ? fmtAgo(at) : 'not synced yet'}`);
  }
  if (envs.length > 12) lines.push(`…and ${envs.length - 12} more`);
  times.sort();
  return { latest: times[times.length - 1], oldest: times[0], missing: envs.length - times.length, title: lines.join('\n') };
}
