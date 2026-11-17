// AI Builder credits consumed by cloud flows (AI prompts / AI Builder actions in Power Automate) this month, read with
// FetchXML from the msdyn_aievent table of each environment. Only events with consumptionSource "PowerAutomate" and
// partnerSource "AIBuilder" are counted: agents and agent flows are already covered by the billing summary API.
// Consumption is eventData.messageConsumption.consumption (msdyn_creditconsumed is always 0). The event payload columns
// (msdyn_datainfo, msdyn_output) are never read. Read-only; cached per environment in localStorage.
import { errorText } from './liveResourceConsumption';
import { monthKey, monthPeriod, readMonth, writeMonth } from './aiMonths';
import { fetchAllRows, fetchOpen, OWNER_LINK, ownerFields, str, xmlEscape, type Row } from './liveFlows';
import type { Environment, Resource } from './types';

const CACHE = 'ppm.flowAiConsumption';
const CONCURRENCY = 3;
const ID_BATCH = 100;
const FV = '@OData.Community.Display.V1.FormattedValue';
export const FLOW_AI_SOURCE = 'AI Builder events (msdyn_aievents)';

export interface FlowAiModel {
  credits: number;
  events: number;
}

export interface FlowAiEntry {
  /** Lowercase workflow id (the resource id of synced flows), or the event's resourceName when it did not resolve. */
  id: string;
  name: string;
  owner: string;
  ownerEmail?: string;
  /** Workflow found in Dataverse. */
  resolved: boolean;
  consumed: number;
  events: number;
  /** AI model name → credits / events. */
  models: Record<string, FlowAiModel>;
  llms: string[];
  /** Users the events ran as (event owner). */
  callers: string[];
  lastEvent?: string;
}

export interface FlowAiConsumption {
  savedAt: string;
  from: string;
  to: string;
  byFlow: Record<string, FlowAiEntry>;
}

/** Cached consumption of the month (default: current month). */
export function cachedFlowAiConsumption(envId: string, month = monthKey()): FlowAiConsumption | null {
  return readMonth<FlowAiConsumption>(CACHE, envId, month);
}

const eventsFetch = (since: string, until: string) => (page: number, cookie?: string) => `${fetchOpen(page, cookie)}
  <entity name="msdyn_aievent">
    <attribute name="msdyn_aieventid" />
    <attribute name="msdyn_processingdate" />
    <attribute name="msdyn_eventdata" />
    <attribute name="msdyn_quicktest" />
    <attribute name="ownerid" />
    <link-entity name="msdyn_aimodel" from="msdyn_aimodelid" to="msdyn_aimodelid" link-type="outer" alias="model">
      <attribute name="msdyn_name" />
    </link-entity>
    <filter type="and">
      <condition attribute="msdyn_processingdate" operator="ge" value="${xmlEscape(since)}" />
      <condition attribute="msdyn_processingdate" operator="le" value="${xmlEscape(until)}" />
    </filter>
    <order attribute="msdyn_aieventid" />
  </entity>
</fetch>`;

/** Workflows whose workflowid, resourceid or workflowidunique is one of the ids (the event's resourceName may be any of them). */
const workflowsFetch = (ids: string[]) => (page: number, cookie?: string) => {
  const values = ids.map((id) => `<value>${xmlEscape(id)}</value>`).join('');
  return `${fetchOpen(page, cookie)}
  <entity name="workflow">
    <attribute name="workflowid" />
    <attribute name="resourceid" />
    <attribute name="workflowidunique" />
    <attribute name="name" />
    <attribute name="category" />
    <attribute name="modernflowtype" />
    <filter type="or">
      <condition attribute="workflowid" operator="in">${values}</condition>
      <condition attribute="resourceid" operator="in">${values}</condition>
      <condition attribute="workflowidunique" operator="in">${values}</condition>
    </filter>
    ${OWNER_LINK}
  </entity>
</fetch>`;
};

interface EventData {
  consumptionSource?: string;
  partnerSource?: string;
  resourceName?: string;
  llmModelName?: string;
  messageConsumption?: { consumption?: number | string };
}

function parseEventData(v: unknown): EventData | null {
  if (typeof v !== 'string' || !v) return null;
  try {
    const d = JSON.parse(v) as unknown;
    return d && typeof d === 'object' ? (d as EventData) : null;
  } catch {
    return null;
  }
}

const isGuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

async function loadEnvironment(env: Environment, period: { start: string; end: string }, log: (line: string) => void): Promise<FlowAiConsumption> {
  const rows = await fetchAllRows(env.url, 'msdyn_aievents', eventsFetch(period.start, period.end));
  const byRes = new Map<string, FlowAiEntry>();
  let skipped = 0;
  for (const row of rows) {
    const e = parseEventData(row.msdyn_eventdata);
    const res = str(e?.resourceName).trim().toLowerCase();
    if (!e || e.consumptionSource !== 'PowerAutomate' || e.partnerSource !== 'AIBuilder' || !res) {
      skipped++;
      continue;
    }
    const credits = Number(e.messageConsumption?.consumption ?? 0) || 0;
    const a = byRes.get(res) ?? { id: res, name: res, owner: '', resolved: false, consumed: 0, events: 0, models: {}, llms: [], callers: [] };
    a.consumed += credits;
    a.events++;
    const model = str(row['model.msdyn_name']) || 'Unknown AI model';
    const m = (a.models[model] ??= { credits: 0, events: 0 });
    m.credits += credits;
    m.events++;
    const llm = str(e.llmModelName);
    if (llm && !a.llms.includes(llm)) a.llms.push(llm);
    const caller = str(row[`_ownerid_value${FV}`]);
    if (caller && !a.callers.includes(caller)) a.callers.push(caller);
    const at = str(row.msdyn_processingdate);
    if (at && (!a.lastEvent || at > a.lastEvent)) a.lastEvent = at;
    byRes.set(res, a);
  }

  // Resolve the flows: workflow id, name and owner.
  const ids = [...byRes.keys()].filter(isGuid);
  const wf = new Map<string, Row>();
  for (let i = 0; i < ids.length; i += ID_BATCH) {
    for (const w of await fetchAllRows(env.url, 'workflows', workflowsFetch(ids.slice(i, i + ID_BATCH)))) {
      for (const k of ['workflowid', 'resourceid', 'workflowidunique']) {
        const v = str(w[k]).toLowerCase();
        if (v && !wf.has(v)) wf.set(v, w);
      }
    }
  }

  const byFlow: Record<string, FlowAiEntry> = {};
  let agentFlows = 0;
  for (const [res, a] of byRes) {
    const w = wf.get(res);
    if (w && Number(w.modernflowtype) === 1) {
      agentFlows++; // agent flow: covered by the billing summary API
      continue;
    }
    const id = w ? str(w.workflowid).toLowerCase() || res : res;
    const entry: FlowAiEntry = w ? { ...a, id, name: str(w.name) || res, resolved: true, ...ownerFields(w) } : a;
    const cur = byFlow[id];
    if (cur) {
      // Several keys of the same workflow: merge.
      cur.consumed += entry.consumed;
      cur.events += entry.events;
      for (const [k, m] of Object.entries(entry.models)) {
        const t = (cur.models[k] ??= { credits: 0, events: 0 });
        t.credits += m.credits;
        t.events += m.events;
      }
      entry.llms.forEach((l) => !cur.llms.includes(l) && cur.llms.push(l));
      entry.callers.forEach((c) => !cur.callers.includes(c) && cur.callers.push(c));
      if (entry.lastEvent && (!cur.lastEvent || entry.lastEvent > cur.lastEvent)) cur.lastEvent = entry.lastEvent;
    } else byFlow[id] = entry;
  }

  const flows = Object.values(byFlow).sort((x, y) => y.consumed - x.consumed);
  const total = flows.reduce((n, f) => n + f.consumed, 0);
  log(
    `   ${env.name}: ${rows.length} AI events in ${period.start.slice(0, 7)},${rows.length - skipped} from cloud flows (PowerAutomate/AIBuilder), ` +
      `${flows.length} flows, ${total.toFixed(2)} credits${agentFlows ? ` (${agentFlows} agent flows skipped)` : ''}`,
  );
  flows.forEach((f) =>
    log(
      `      ${f.resolved ? '' : '[not found in workflows] '}${f.name} (${f.id})${f.owner ? `, owner ${f.owner}` : ''}: ${f.events} events, ${f.consumed.toFixed(2)} credits · ` +
        Object.entries(f.models)
          .sort((x, y) => y[1].credits - x[1].credits)
          .map(([k, m]) => `${k} ${m.credits.toFixed(2)}`)
          .join(', '),
    ),
  );
  return { savedAt: new Date().toISOString(), from: period.start.slice(0, 10), to: period.end.slice(0, 10), byFlow };
}

const isMissingTable = (msg: string) => /msdyn_aievent|Resource not found for the segment|does not exist|0x80060888|0x80040217/i.test(msg);

/**
 * AI Builder credits per cloud flow in the month (yyyy-mm, default: current month) in the given environments (those
 * with a Dataverse database). Environments without the AI event table are skipped; failures keep the cached data and are logged.
 */
export async function fetchFlowAiConsumption(
  environments: Environment[],
  log: (line: string) => void = () => {},
  month = monthKey(),
): Promise<Record<string, FlowAiConsumption>> {
  const period = monthPeriod(month);
  const targets = environments.filter((e) => e.url);
  const out: Record<string, FlowAiConsumption> = {};
  log(`FetchXML msdyn_aievents (PowerAutomate/AIBuilder) in ${targets.length} environments, ${period.start.slice(0, 10)} → ${period.end.slice(0, 10)}`);
  const queue = [...targets];
  const worker = async () => {
    for (let env = queue.shift(); env; env = queue.shift()) {
      try {
        const c = await loadEnvironment(env, period, log);
        out[env.id] = c;
        writeMonth(CACHE, env.id, month, c);
      } catch (err) {
        const msg = err instanceof Error ? err.message : errorText(err);
        log(`   ${env.name}: ${isMissingTable(msg) ? 'no AI events table (skipped)' : `failed: ${msg.slice(0, 300)}`}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
  return out;
}

/** A Resource row for a flow with AI consumption that is not in the synced inventory. */
export function flowAiResource(envId: string, f: FlowAiEntry): Resource {
  return {
    id: f.id,
    name: f.name,
    type: 'Cloud Flow',
    envId,
    owner: f.owner,
    ...(f.ownerEmail ? { ownerEmail: f.ownerEmail } : {}),
    tags: [],
    status: 'On',
    modified: f.lastEvent ?? '',
  };
}
