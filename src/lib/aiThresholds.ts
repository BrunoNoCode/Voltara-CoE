// Helpers for Copilot Credit limits (resource thresholds), shared by the AI hub and the threshold panels.
import type { Resource } from '../data/types';
import { fmtNumber } from './format';
import { isThresholdDefined, type ResourceThreshold } from '../data/liveThresholds';

export const isAgent = (r: Resource) => r.type === 'Copilot Studio';

/** Short text of a threshold: "Limit 1,000 · 120 used (12%)", "Stopped" or "None". */
export function thresholdText(t?: ResourceThreshold): string {
  if (!isThresholdDefined(t)) return 'None';
  if (t!.stopResource) return 'Stopped';
  const pct = t!.limit > 0 ? Math.round((t!.consumption / t!.limit) * 100) : 0;
  return `Limit ${fmtNumber(t!.limit)} · ${fmtNumber(Math.round(t!.consumption))} used (${pct}%)`;
}
