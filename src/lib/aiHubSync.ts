// AI Hub data refresh used by Home › "Sync all": the same calls as the AI Hub buttons
// (Overview › Refresh, Agents › Sync and Fetch consumption). Every fetch writes its own
// browser cache, which the AI Hub page reads when it opens.
import { fetchAgentUsage } from '../data/liveAiUsage';
import { fetchCopilotCapacity } from '../data/liveCopilotCapacity';
import { fetchResourceThresholds } from '../data/liveResourceConsumption';
import { fetchAgentBillingSummary } from '../data/liveAgentBilling';
import { fetchFlowAiConsumption } from '../data/liveFlowAiConsumption';
import type { Environment, Resource } from '../data/types';
import { AI_TYPES } from './aiCosts';
import { isSystemOwned, readHideSystem } from './hideSystem';
import { isInAiHub, readAiHubOverrides } from './aiHubEnvs';

/** When the AI Hub Agents tab data was last fetched ("synced": limits/sessions, "consumption"). */
export const AGENTS_REFRESHED_KEY = 'ppm.aiHub.agentsRefreshedAt';

export function stampAgentsRefreshed(...parts: ('synced' | 'consumption')[]) {
  try {
    const prev = JSON.parse(localStorage.getItem(AGENTS_REFRESHED_KEY) ?? '{}') as Record<string, string>;
    const at = new Date().toISOString();
    for (const p of parts) prev[p] = at;
    localStorage.setItem(AGENTS_REFRESHED_KEY, JSON.stringify(prev));
  } catch {
    /* storage unavailable */
  }
}

const CONCURRENCY = 3;

async function each(targets: Environment[], load: (env: Environment) => Promise<unknown>) {
  const queue = [...targets];
  const worker = async () => {
    for (let env = queue.shift(); env; env = queue.shift()) await load(env).catch(() => null);
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
}

/** Refreshes the AI Hub list and consumption for the monitored environments included in the AI Hub. */
export async function syncAiHub(environments: Environment[], resources: Resource[], onStep: (step: string) => void) {
  const overrides = readAiHubOverrides();
  const hub = environments.filter((e) => e.monitored && isInAiHub(e.id, resources, overrides));
  const hide = readHideSystem();
  const ai = resources.filter((r) => AI_TYPES.has(r.type) && !(hide && isSystemOwned(r)));
  const agentEnvs = hub.filter((e) => ai.some((r) => r.envId === e.id && r.type === 'Copilot Studio'));
  const aiEnvs = hub.filter((e) => ai.some((r) => r.envId === e.id));

  onStep(`AI Hub: limits and agent sessions (${hub.length} environments)`);
  await Promise.all([fetchResourceThresholds(hub).catch(() => null), each(agentEnvs, fetchAgentUsage)]);
  stampAgentsRefreshed('synced');

  onStep(`AI Hub: Copilot Credits of ${aiEnvs.length} environments and consumption`);
  await Promise.all([
    each(aiEnvs, fetchCopilotCapacity),
    fetchAgentBillingSummary(hub, resources).catch(() => null),
    fetchFlowAiConsumption(hub).catch(() => null),
  ]);
  stampAgentsRefreshed('consumption');
  return hub.length;
}
