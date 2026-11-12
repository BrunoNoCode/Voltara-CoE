// Agent sessions over the last 30 days, read with one FetchXML aggregate on the
// environment's conversationtranscript table (one transcript per agent session),
// grouped by agent. Read-only. Cached per environment in localStorage.
import { readJson, writeJson } from './liveEnvironments';
import { runFetch, str } from './liveFlows';
import { RUN_WINDOW_DAYS } from './liveResources';
import type { Environment, Resource } from './types';

const cacheKey = (envId: string) => `ppm.aiUsage.${envId}.v1`;

export interface AgentUsage {
  savedAt: string;
  /** Sessions per agent (lowercase botid). */
  sessions: Record<string, number>;
  /** Set when the query failed (e.g. transcripts disabled or too many rows to aggregate). */
  error?: string;
}

export function cachedAgentUsage(envId: string): AgentUsage | null {
  return readJson<AgentUsage>(cacheKey(envId));
}

export async function fetchAgentUsage(env: Environment): Promise<AgentUsage> {
  if (!env.url) return { savedAt: new Date().toISOString(), sessions: {}, error: 'No Dataverse database' };
  let usage: AgentUsage;
  try {
    const { rows } = await runFetch(
      env.url,
      'conversationtranscripts',
      `<fetch version="1.0" mapping="logical" aggregate="true">
  <entity name="conversationtranscript">
    <attribute name="bot_conversationtranscriptid" alias="bot" groupby="true" />
    <attribute name="conversationtranscriptid" alias="sessions" aggregate="count" />
    <filter>
      <condition attribute="conversationstarttime" operator="last-x-days" value="${RUN_WINDOW_DAYS}" />
    </filter>
  </entity>
</fetch>`,
    );
    const sessions: Record<string, number> = {};
    for (const row of rows) {
      const id = str(row.bot).toLowerCase();
      if (id) sessions[id] = (sessions[id] ?? 0) + (Number(row.sessions) || 0);
    }
    usage = { savedAt: new Date().toISOString(), sessions };
  } catch (err) {
    usage = { savedAt: new Date().toISOString(), sessions: {}, error: err instanceof Error ? err.message : 'Query failed' };
  }
  writeJson(cacheKey(env.id), usage);
  return usage;
}

/** Local preview (not hosted): stable pseudo-random session counts per agent. */
export function mockAgentUsage(agents: Resource[]): AgentUsage {
  const sessions: Record<string, number> = {};
  for (const a of agents) {
    let h = 0;
    for (const c of a.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    sessions[a.id.toLowerCase()] = h % 5 === 0 ? 0 : 20 + (h % 900);
  }
  return { savedAt: new Date().toISOString(), sessions };
}
