// Copilot Credits billed per agent this month, from the Copilot Studio analytics billing API
// (POST powerva.microsoft.com/api/botmanagement/v1/analytics/environments/{env}/agent-ops/billing), called through the
// built-in "HTTP with Microsoft Entra ID (preauthorized)" connector (webcontents data source). Only Standard agents
// (Copilot Studio, not Microsoft Copilot powered) are queried. Cached per environment in localStorage.
import { HTTPwithMicrosoftEntraID_preauthorized_Service } from '../generated/services/HTTPwithMicrosoftEntraID_preauthorized_Service';
import { readJson, writeJson } from './liveEnvironments';
import { errorText, type ResourceConsumption } from './liveResourceConsumption';
import type { Environment, Resource } from './types';

const cacheKey = (envId: string) => `ppm.agentBilling.${envId}.v1`;
const BATCH = 50;
const CONCURRENCY = 3;
export const BILLING_SOURCE = 'Copilot Studio billing API';
const FEATURE = 'Copilot Credits (billing)';

export function cachedAgentBilling(envId: string): ResourceConsumption | null {
  return readJson<ResourceConsumption>(cacheKey(envId));
}

/** Standard agents: Copilot Studio agents not powered by Microsoft Copilot. Resource ids of agents are bot ids. */
export const isStandardAgent = (r: Resource) => r.type === 'Copilot Studio' && r.poweredBy !== 'MSFT Copilot';

/** First and last instant of the current UTC month. */
export function billingPeriod(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    start: new Date(Date.UTC(y, m, 1)).toISOString(),
    end: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)).toISOString(),
  };
}

interface BillingEntry {
  cdsBotId?: string;
  target?: { id?: string };
  total?: { value?: number };
}

/** Billing entries of a response: the SDK may return the body as is, wrapped ({ data } / { body }) or as a JSON string. */
function entriesOf(data: unknown): BillingEntry[] | null {
  let d: unknown = data;
  for (let i = 0; i < 4; i++) {
    if (typeof d === 'string') {
      try {
        d = JSON.parse(d);
      } catch {
        return null;
      }
      continue;
    }
    if (!d || typeof d !== 'object') return null;
    const o = d as Record<string, unknown>;
    if (Array.isArray(o.botConsumptionEntries)) return o.botConsumptionEntries as BillingEntry[];
    const inner = ['data', 'body', 'Body'].map((k) => o[k]).find((x) => x !== undefined && x !== null);
    if (inner === undefined) return null;
    d = inner;
  }
  return null;
}

async function fetchBatch(envId: string, ids: string[], period: { start: string; end: string }): Promise<BillingEntry[]> {
  const url =
    `https://powerva.microsoft.com/api/botmanagement/v1/analytics/environments/${envId}/agent-ops/billing` +
    `?utcStartTime=${encodeURIComponent(period.start)}&utcEndTime=${encodeURIComponent(period.end)}`;
  const r = await HTTPwithMicrosoftEntraID_preauthorized_Service.InvokeHttp({
    method: 'POST',
    url,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cdsBotIds: ids, targets: ids.map((id) => ({ id, type: 'Agent' })) }),
  });
  if (!r.success) throw new Error(errorText(r.error, 'Billing request failed'));
  const entries = entriesOf(r.data as unknown);
  if (!entries) throw new Error(`Unexpected billing response: ${JSON.stringify(r.data ?? null).slice(0, 300)}`);
  return entries;
}

export const SUMMARY_SOURCE = 'Copilot Studio billing summary API';

interface SummaryEntry {
  cdsBotId?: string;
  target?: { id?: string };
  resourceName?: string;
  featureName?: string;
  channelId?: string;
  consumed?: { value?: number };
}

/** botConsumptionSummaryEntries of a response (same unwrapping as entriesOf). */
function summaryEntriesOf(data: unknown): SummaryEntry[] | null {
  let d: unknown = data;
  for (let i = 0; i < 4; i++) {
    if (typeof d === 'string') {
      try {
        d = JSON.parse(d);
      } catch {
        return null;
      }
      continue;
    }
    if (!d || typeof d !== 'object') return null;
    const o = d as Record<string, unknown>;
    if (Array.isArray(o.botConsumptionSummaryEntries)) return o.botConsumptionSummaryEntries as SummaryEntry[];
    const inner = ['data', 'body', 'Body'].map((k) => o[k]).find((x) => x !== undefined && x !== null);
    if (inner === undefined) return null;
    d = inner;
  }
  return null;
}

async function fetchSummaryBatch(
  envId: string,
  ids: string[],
  period: { start: string; end: string },
  type: string | number = 'agent',
): Promise<SummaryEntry[]> {
  const url =
    `https://powerva.microsoft.com/api/botmanagement/v1/analytics/environments/${envId}/agent-ops/billing/summary` +
    `?utcStartTime=${encodeURIComponent(period.start)}&utcEndTime=${encodeURIComponent(period.end)}`;
  const r = await HTTPwithMicrosoftEntraID_preauthorized_Service.InvokeHttp({
    method: 'POST',
    url,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cdsBotIds: ids, targets: ids.map((id) => ({ id, type })) }),
  });
  if (!r.success) throw new Error(errorText(r.error, 'Billing summary request failed'));
  const entries = summaryEntriesOf(r.data as unknown);
  if (!entries) throw new Error(`Unexpected billing summary response: ${JSON.stringify(r.data ?? null).slice(0, 300)}`);
  return entries;
}

const summaryCacheKey = (envId: string) => `ppm.agentBillingSummary.${envId}.v1`;

export function cachedAgentBillingSummary(envId: string): ResourceConsumption | null {
  return readJson<ResourceConsumption>(summaryCacheKey(envId));
}

/**
 * Resources whose consumption comes from the billing summary API: all agents, Standard and MSFT Copilot (bot id), and
 * agent flows (workflow id).
 */
export const isAgentFlow = (r: Resource) => r.type === 'Agent Flow';
const isAnyAgent = (r: Resource) => r.type === 'Copilot Studio';
const isMsftAgent = (r: Resource) => isAnyAgent(r) && r.poweredBy === 'MSFT Copilot';
export const isSummaryResource = (r: Resource) => isAnyAgent(r) || isAgentFlow(r);

type Summed = Map<string, { name: string; value: number; parts: string[] }>;

/**
 * Target type values tried for agent flows: the response reports flows as target type 1 ("flow" is rejected by the
 * MakerEvaluationTargetType enum). The first value the API accepts is remembered for the session.
 */
const FLOW_TYPES: (string | number)[] = [1, 'agentFlow', 'workflow'];
let flowType: string | number | undefined;
const isTypeError = (err: unknown) => /MakerEvaluationTargetType|Error converting value/i.test(err instanceof Error ? err.message : String(err));

/** Sums consumed.value per cdsBotId (never by resource name: a renamed resource returns several entries). */
function sumEntries(entries: SummaryEntry[]): Summed {
  const out: Summed = new Map();
  for (const e of entries) {
    const id = (e.cdsBotId ?? e.target?.id ?? '').toLowerCase();
    if (!id) continue;
    const value = Number(e.consumed?.value ?? 0) || 0;
    const a = out.get(id) ?? { name: e.resourceName || id, value: 0, parts: [] };
    a.value += value;
    a.parts.push(`${e.resourceName || '?'} · ${e.featureName || '?'}/${e.channelId || '-'}: ${value.toFixed(2)}`);
    out.set(id, a);
  }
  return out;
}

/**
 * Consumed Copilot Credits of every agent (Standard and MSFT Copilot) and agent flow in the given environments for the
 * current month, from POST .../agent-ops/billing/summary (50 ids per call). Agents are requested with target type 'agent';
 * agent flows in an extra request with the first accepted FLOW_TYPES value (its failure is only logged). Entries are matched on cdsBotId only and
 * summed; across the two requests the larger value per id is kept so an id returned by both is not counted twice.
 * Resources without an entry get 0. Environments whose agent call fails keep their cached data.
 */
export async function fetchAgentBillingSummary(
  environments: Environment[],
  resources: Resource[],
  log: (line: string) => void = () => {},
): Promise<Record<string, ResourceConsumption>> {
  const period = billingPeriod();
  const out: Record<string, ResourceConsumption> = {};
  const idsOf = (envId: string, pick: (r: Resource) => boolean) =>
    [...new Set(resources.filter((r) => r.envId === envId && pick(r)).map((r) => r.id.toLowerCase()))];
  const targets = environments
    .map((env) => ({ env, agents: idsOf(env.id, isAnyAgent), msft: new Set(idsOf(env.id, isMsftAgent)), flows: idsOf(env.id, isAgentFlow) }))
    .filter((t) => t.agents.length || t.flows.length);
  const agentCount = targets.reduce((n, t) => n + t.agents.length, 0);
  const msftCount = targets.reduce((n, t) => n + t.msft.size, 0);
  log(
    `POST billing/summary: ${agentCount} agents (${agentCount - msftCount} Standard, ${msftCount} MSFT Copilot) and ` +
      `${targets.reduce((n, t) => n + t.flows.length, 0)} agent flows in ${targets.length} environments, ` +
      `${period.start.slice(0, 10)} → ${period.end.slice(0, 10)}`,
  );
  const queue = [...targets];
  const worker = async () => {
    for (let t = queue.shift(); t; t = queue.shift()) {
      const { env, agents, msft, flows } = t;
      const kind = new Map<string, string>([
        ...agents.map((id) => [id, msft.has(id) ? 'MSFT Copilot agent' : 'agent'] as const),
        ...flows.map((id) => [id, 'agent flow'] as const),
      ]);
      const merged: Summed = new Map();
      const merge = (s: Summed) =>
        s.forEach((v, id) => {
          const cur = merged.get(id);
          if (!cur || v.value > cur.value) merged.set(id, v);
        });
      const run = async (ids: string[], type: string | number) => {
        let count = 0;
        for (let i = 0; i < ids.length; i += BATCH) {
          const entries = await fetchSummaryBatch(env.id, ids.slice(i, i + BATCH), period, type);
          count += entries.length;
          merge(sumEntries(entries));
        }
        return count;
      };
      try {
        const agentEntries = agents.length ? await run(agents, 'agent') : 0;
        let flowNote = '';
        if (flows.length) {
          const candidates = flowType !== undefined ? [flowType] : FLOW_TYPES;
          for (const type of candidates) {
            try {
              flowNote = `, flow request (type ${JSON.stringify(type)}): ${await run(flows, type)} entries`;
              flowType = type;
              break;
            } catch (err) {
              const msg = err instanceof Error ? err.message : errorText(err);
              flowNote = `, flow request failed (type ${JSON.stringify(type)}): ${isTypeError(err) ? 'type rejected' : msg.slice(0, 300)}`;
              if (!isTypeError(err)) break;
            }
          }
        }
        const c: ResourceConsumption = {
          savedAt: new Date().toISOString(),
          from: period.start.slice(0, 10),
          to: period.end.slice(0, 10),
          fileName: SUMMARY_SOURCE,
          byResource: Object.fromEntries([...kind.keys()].map((id) => [id, { consumed: 0, byFeature: {} }])),
        };
        merged.forEach((v, id) => {
          c.byResource[id] = { consumed: v.value, byFeature: { [FEATURE]: { consumed: v.value } } };
        });
        const total = [...merged.values()].reduce((n, a) => n + a.value, 0);
        const matched = [...merged.keys()].filter((id) => kind.has(id)).length;
        log(
          `   ${env.name}: ${agents.length} agents (${msft.size} MSFT Copilot) + ${flows.length} agent flows queried, agent request: ${agentEntries} entries${flowNote}; ` +
            `${merged.size} ids with data (${matched} matched), ${total.toFixed(2)} credits`,
        );
        [...merged.entries()]
          .sort((a, b) => b[1].value - a[1].value)
          .forEach(([id, a]) => log(`      [${kind.get(id) ?? 'unmatched id ' + id}] ${a.name}: ${a.value.toFixed(2)} (${a.parts.join(', ')})`));
        out[env.id] = c;
        writeJson(summaryCacheKey(env.id), c);
      } catch (err) {
        log(`   ${env.name}: billing summary failed: ${err instanceof Error ? err.message : errorText(err)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
  return out;
}

/**
 * Billed Copilot Credits of every Standard agent in the given environments for the current month, 50 agents per call.
 * Agents without an entry get 0. Environments whose call fails keep their cached data and are reported in the log.
 */
export async function fetchAgentBilling(
  environments: Environment[],
  resources: Resource[],
  log: (line: string) => void = () => {},
): Promise<Record<string, ResourceConsumption>> {
  const period = billingPeriod();
  const out: Record<string, ResourceConsumption> = {};
  const targets = environments
    .map((env) => ({ env, ids: [...new Set(resources.filter((r) => r.envId === env.id && isStandardAgent(r)).map((r) => r.id.toLowerCase()))] }))
    .filter((t) => t.ids.length);
  log(`Billing API: ${targets.reduce((n, t) => n + t.ids.length, 0)} Standard agents in ${targets.length} environments, ${period.start.slice(0, 10)} → ${period.end.slice(0, 10)}`);
  const queue = [...targets];
  const worker = async () => {
    for (let t = queue.shift(); t; t = queue.shift()) {
      const { env, ids } = t;
      const c: ResourceConsumption = {
        savedAt: new Date().toISOString(),
        from: period.start.slice(0, 10),
        to: period.end.slice(0, 10),
        fileName: BILLING_SOURCE,
        byResource: Object.fromEntries(ids.map((id) => [id, { consumed: 0, byFeature: {} }])),
      };
      try {
        for (let i = 0; i < ids.length; i += BATCH) {
          const entries = await fetchBatch(env.id, ids.slice(i, i + BATCH), period);
          for (const e of entries) {
            const id = (e.cdsBotId ?? e.target?.id ?? '').toLowerCase();
            if (!id) continue;
            const value = Number(e.total?.value ?? 0) || 0;
            c.byResource[id] = { consumed: value, byFeature: { [FEATURE]: { consumed: value } } };
          }
        }
        const total = Object.values(c.byResource).reduce((n, x) => n + x.consumed, 0);
        log(`   ${env.name}: ${ids.length} agents, ${total.toFixed(2)} credits`);
        out[env.id] = c;
        writeJson(cacheKey(env.id), c);
      } catch (err) {
        log(`   ${env.name}: billing failed: ${err instanceof Error ? err.message : errorText(err)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
  return out;
}
