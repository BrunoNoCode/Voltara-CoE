// Live resource inventory for one environment, read with FetchXML through the
// Microsoft Dataverse connector from the environment's own system tables.
// Read-only: nothing is written to Dataverse.
//
// One query group per tab, each run independently so a missing table (e.g. AI
// Builder not installed) only affects its own tab:
//   flows     workflow (category 5/6) → liveFlows.ts; modernflowtype 1 marks agent flows
//   apps      Power Apps for Admins connector (canvas / code apps) + appmodule (model-driven)
//   copilot   bot
//   ai        msdyn_aimodel
//   dataverse entity (all tables) + EntityDefinitions IsCustomEntity (custom flag)
//   other     workflow (category 0 workflow, 2 business rule, 3 action, 4 BPF)
// Everything is shown, whatever the publisher (Microsoft included). Tables get their
// publisher from a solution → publisher lookup. Results are cached per environment in IndexedDB (resourceCache.ts).
import { PowerAppsforAdminsService } from '../generated/services/PowerAppsforAdminsService';
import { MicrosoftDataverseService } from '../generated/services/MicrosoftDataverseService';
import { withTimeout } from './liveEnvironments';
import { getCachedResources, putCachedResources } from './resourceCache';
import { NoDataverseError, OWNER_LINK, fetchAllRows, fetchFlows, fetchOpen, ownerFields, runFetch, str, xmlEscape, type Row } from './liveFlows';
import type { AgentHarness, Environment, Resource, ResourceType } from './types';

export type LiveGroup = 'flows' | 'apps' | 'copilot' | 'ai' | 'dataverse' | 'other';
export const LIVE_GROUPS: LiveGroup[] = ['flows', 'apps', 'copilot', 'ai', 'dataverse', 'other'];

const SOLUTION_BATCH = 100;

/**
 * What to fetch for one environment. A full sync fetches everything; an Action Center
 * evaluation only fetches the groups and lookups its rule needs.
 */
export interface FetchPlan {
  groups: LiveGroup[];
  /** Solution membership (Solution column). */
  solutions: boolean;
  /** Flow run counts (Runs (30d) column). */
  runs: boolean;
  /** EntityDefinitions IsCustomEntity (custom table flag). */
  customFlags: boolean;
}
export const FULL_PLAN: FetchPlan = { groups: LIVE_GROUPS, solutions: true, runs: true, customFlags: true };

/** When a group was last fetched and which optional lookups were included. */
export interface GroupFetch {
  at: string;
  solutions: boolean;
  runs: boolean;
  customFlags: boolean;
}

export interface CachedResources {
  savedAt: string;
  resources: Resource[];
  /** Per group fetch info (missing in caches written before it existed: treated as stale). */
  fetched?: Partial<Record<LiveGroup, GroupFetch>>;
}

export interface ResourceRefresh {
  /** Rows of the groups that loaded (failed groups keep their previously cached rows). */
  resources: Resource[];
  /** Groups whose query succeeded; their rows replace the old ones. */
  loaded: LiveGroup[];
  /** Error message per failed group. */
  errors: Partial<Record<LiveGroup, string>>;
}

const errText = (err: unknown) => (err instanceof Error ? err.message : typeof err === 'string' ? err : 'Query failed');

/** Runs sub-queries of one group in parallel; fails only if all of them fail. */
async function settleAll(parts: Promise<Resource[]>[]): Promise<Resource[]> {
  const res = await Promise.allSettled(parts);
  const ok = res.filter((r): r is PromiseFulfilledResult<Resource[]> => r.status === 'fulfilled');
  if (!ok.length) throw (res[0] as PromiseRejectedResult).reason;
  return ok.flatMap((r) => r.value);
}

// ---------- Solution / publisher lookup ----------

interface SolutionInfo {
  /** Unmanaged customization (lives in the "Active" solution). */
  unmanaged: boolean;
  publisher: string;
}

const solutionIdOf = (row: Row) => str(row.solutionid || row._solutionid_value).toLowerCase();

async function fetchSolutionInfo(orgUrl: string, ids: string[]): Promise<Map<string, SolutionInfo>> {
  const out = new Map<string, SolutionInfo>();
  const unique = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < unique.length; i += SOLUTION_BATCH) {
    const batch = unique.slice(i, i + SOLUTION_BATCH);
    const { rows } = await runFetch(
      orgUrl,
      'solutions',
      `<fetch version="1.0" mapping="logical">
  <entity name="solution">
    <attribute name="solutionid" />
    <attribute name="uniquename" />
    <filter>
      <condition attribute="solutionid" operator="in">${batch.map((id) => `<value>${xmlEscape(id)}</value>`).join('')}</condition>
    </filter>
    <link-entity name="publisher" from="publisherid" to="publisherid" link-type="outer" alias="pub">
      <attribute name="uniquename" />
      <attribute name="friendlyname" />
      <attribute name="customizationprefix" />
    </link-entity>
  </entity>
</fetch>`,
    );
    for (const row of rows) {
      const unmanaged = str(row.uniquename) === 'Active';
      out.set(str(row.solutionid).toLowerCase(), {
        unmanaged,
        publisher: unmanaged ? 'Unmanaged' : str(row['pub.friendlyname']) || str(row['pub.uniquename']),
      });
    }
  }
  return out;
}

/**
 * Attaches the solution / publisher of each row. Every row is kept, whatever the publisher
 * (Microsoft included). If the lookup fails, rows come back without solution info.
 */
async function withSolutionInfo<T>(orgUrl: string, items: { row: Row; value: T }[]): Promise<{ value: T; solution?: SolutionInfo }[]> {
  const info = await fetchSolutionInfo(orgUrl, items.map((i) => solutionIdOf(i.row))).catch(() => new Map<string, SolutionInfo>());
  return items.map((i) => ({ value: i.value, solution: info.get(solutionIdOf(i.row)) }));
}

// ---------- Solution membership (Solution column) ----------

const MEMBERSHIP_BATCH = 100;
const MEMBERSHIP_PARALLEL = 3;
// System solutions every component is part of; not useful to show.
const HIDDEN_SOLUTIONS = ['Default', 'Active', 'Basic'];

/**
 * Display names of the visible solutions containing each component, keyed by the
 * lowercase component id (solutioncomponent.objectid: workflowid, canvasappid, botid,
 * appmoduleid, msdyn_aimodelid, entity MetadataId). Ids of failed batches are left out.
 */
async function fetchSolutionMembership(orgUrl: string, ids: string[]): Promise<Map<string, string[]>> {
  const unique = [...new Set(ids.filter(Boolean).map((id) => id.toLowerCase()))];
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += MEMBERSHIP_BATCH) batches.push(unique.slice(i, i + MEMBERSHIP_BATCH));

  const out = new Map<string, string[]>();
  const runBatch = async (batch: string[]) => {
    const { rows } = await runFetch(
      orgUrl,
      'solutioncomponents',
      `<fetch version="1.0" mapping="logical">
  <entity name="solutioncomponent">
    <attribute name="objectid" />
    <filter>
      <condition attribute="objectid" operator="in">${batch.map((id) => `<value>${xmlEscape(id)}</value>`).join('')}</condition>
    </filter>
    <link-entity name="solution" from="solutionid" to="solutionid" link-type="inner" alias="sol">
      <attribute name="friendlyname" />
      <attribute name="uniquename" />
      <filter>
        <condition attribute="isvisible" operator="eq" value="1" />
        <condition attribute="uniquename" operator="not-in">${HIDDEN_SOLUTIONS.map((n) => `<value>${n}</value>`).join('')}</condition>
      </filter>
    </link-entity>
  </entity>
</fetch>`,
    );
    for (const id of batch) out.set(id, []);
    for (const row of rows) {
      const id = str(row.objectid).toLowerCase();
      const name = str(row['sol.friendlyname']) || str(row['sol.uniquename']);
      const list = out.get(id);
      if (list && name && !list.includes(name)) list.push(name);
    }
  };
  for (let i = 0; i < batches.length; i += MEMBERSHIP_PARALLEL) {
    await Promise.allSettled(batches.slice(i, i + MEMBERSHIP_PARALLEL).map(runBatch));
  }
  for (const list of out.values()) list.sort((a, b) => a.localeCompare(b));
  return out;
}

// ---------- Flow runs (Runs (30d) column) ----------

export const RUN_WINDOW_DAYS = 30;
/** Elastic tables (flowrun) return at most 500 rows per page. */
const RUN_PAGE = 500;
/** Fallback paging cap: 40 × 500 = 20,000 runs. */
const RUN_MAX_PAGES = 40;
/** Flow types whose runs are recorded in the flowrun table (desktop flows use flowsession). */
export const RUN_TYPES = new Set<ResourceType>(['Cloud Flow', 'Scheduled Flow', 'Agent Flow']);

interface RunCount {
  runs: number;
  failed: number;
  /** Latest run start (ISO). */
  last?: string;
}
interface RunCounts {
  counts: Map<string, RunCount>;
  /** True when the fallback hit its page cap, so counts are a lower bound. */
  partial: boolean;
}

const runWindow = `<condition attribute="starttime" operator="last-x-days" value="${RUN_WINDOW_DAYS}" />`;

function addRun(counts: Map<string, RunCount>, id: string, status: string, n: number, start?: string) {
  if (!id) return;
  const c = counts.get(id) ?? { runs: 0, failed: 0 };
  c.runs += n;
  if (status.toLowerCase() === 'failed') c.failed += n;
  const t = start ? Date.parse(start) : NaN;
  if (!Number.isNaN(t) && (!c.last || t > Date.parse(c.last))) c.last = new Date(t).toISOString();
  counts.set(id, c);
}

/**
 * Runs per flow over the last 30 days from the flowrun table, keyed by lowercase
 * workflow id. Tries one aggregate query (count grouped by flow and status) and,
 * if the server refuses it (elastic table / 50,000-record aggregate limit), pages
 * through the runs and counts them here.
 */
async function fetchFlowRunCounts(orgUrl: string): Promise<RunCounts> {
  try {
    const { rows } = await runFetch(
      orgUrl,
      'flowruns',
      `<fetch version="1.0" mapping="logical" aggregate="true">
  <entity name="flowrun">
    <attribute name="workflowid" alias="wf" groupby="true" />
    <attribute name="status" alias="st" groupby="true" />
    <attribute name="flowrunid" alias="runs" aggregate="count" />
    <attribute name="starttime" alias="last" aggregate="max" />
    <filter>${runWindow}</filter>
  </entity>
</fetch>`,
    );
    const counts = new Map<string, RunCount>();
    for (const row of rows) addRun(counts, str(row.wf).toLowerCase(), str(row.st), Number(row.runs) || 0, str(row.last) || undefined);
    return { counts, partial: false };
  } catch {
    const counts = new Map<string, RunCount>();
    let cookie: string | undefined;
    for (let page = 1; page <= RUN_MAX_PAGES; page++) {
      const res = await runFetch(
        orgUrl,
        'flowruns',
        `<fetch version="1.0" mapping="logical" count="${RUN_PAGE}" page="${page}"${cookie ? ` paging-cookie="${xmlEscape(cookie)}"` : ''}>
  <entity name="flowrun">
    <attribute name="flowrunid" />
    <attribute name="workflowid" />
    <attribute name="status" />
    <attribute name="starttime" />
    <filter>${runWindow}</filter>
    <order attribute="flowrunid" />
  </entity>
</fetch>`,
      );
      for (const row of res.rows) addRun(counts, str(row.workflowid).toLowerCase(), str(row.status), 1, str(row.starttime) || undefined);
      if (res.rows.length < RUN_PAGE) return { counts, partial: false };
      cookie = res.cookie;
    }
    return { counts, partial: true };
  }
}

// ---------- Power Apps ----------

export const ADMIN_APPS_API = '2016-11-01';
const ADMIN_APPS_PAGE = 250;
/** Power Apps for Admins appType values listed in the Apps tab; component libraries and custom pages are skipped. */
const ADMIN_APP_TYPES: Record<string, ResourceType> = { ClassicCanvasApp: 'Canvas App', CodeApp: 'Code App' };

// Fields of the admin apps response that the generated model does not declare.
interface AdminAppUser {
  displayName?: string;
  email?: string;
  userPrincipalName?: string;
}
interface AdminApp {
  name?: string;
  appType?: string;
  isAppComponentLibrary?: boolean | null;
  properties?: {
    displayName?: string;
    owner?: AdminAppUser;
    createdBy?: AdminAppUser;
    createdTime?: string;
    lastModifiedTime?: string;
    appVersion?: string;
    appUris?: { codeAppPackageUri?: { value?: string } };
  };
}

/**
 * Every canvas / code app of the environment from the Power Apps for Admins connector.
 * Unlike the canvasapp table, this also lists apps that are not in any solution.
 */
async function fetchAdminApps(envId: string): Promise<AdminApp[]> {
  const out: AdminApp[] = [];
  let skipToken: string | undefined;
  for (let page = 0; page < 40; page++) {
    const result = await withTimeout(PowerAppsforAdminsService.Get_AdminApps(envId, ADMIN_APPS_API, ADMIN_APPS_PAGE, skipToken), 60_000);
    if (!result.success) throw result.error ?? new Error('Get-AdminApps failed');
    const data = result.data as { value?: AdminApp[]; nextLink?: string } | undefined;
    out.push(...(data?.value ?? []));
    try {
      skipToken = data?.nextLink ? new URL(data.nextLink).searchParams.get('$skiptoken') ?? undefined : undefined;
    } catch {
      skipToken = undefined;
    }
    if (!skipToken) break;
  }
  return out;
}

/** Tab type of an admin app, or undefined for types the Apps tab does not list. */
function adminAppType(app: AdminApp): ResourceType | undefined {
  if (app.isAppComponentLibrary) return undefined;
  const type = ADMIN_APP_TYPES[app.appType ?? ''];
  if (type) return type;
  // Older responses carry no appType: code apps are the ones with a code package.
  if (!app.appType) return str(app.properties?.appUris?.codeAppPackageUri?.value) ? 'Code App' : 'Canvas App';
  return undefined;
}

/** Canvas and code apps, from the Power Apps for Admins connector only. Ids are the app GUIDs. */
async function fetchCanvasApps(envId: string): Promise<Resource[]> {
  const seen = new Set<string>();
  const out: Resource[] = [];
  for (const app of await fetchAdminApps(envId)) {
    const appId = str(app.name).toLowerCase();
    const p = app.properties;
    const type = adminAppType(app);
    if (!appId || !p || !type || seen.has(appId)) continue;
    seen.add(appId);
    const owner = p.owner ?? p.createdBy;
    out.push({
      id: appId,
      name: p.displayName || appId,
      type,
      envId,
      owner: owner?.displayName || owner?.email || owner?.userPrincipalName || '',
      ...(owner?.email ? { ownerEmail: owner.email } : {}),
      ...(owner?.userPrincipalName ? { ownerUpn: owner.userPrincipalName } : {}),
      appId,
      tags: [],
      status: p.appVersion ? 'Published' : 'Draft',
      modified: p.lastModifiedTime || p.appVersion || p.createdTime || '',
    });
  }
  return out;
}

/**
 * Dataverse canvasappid by lowercase app GUID (canvasapp.name), for solution membership
 * and the details panel. Apps without a canvasapp record are left out.
 */
export async function canvasAppRecordIds(orgUrl: string, appIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(appIds.filter(Boolean).map((id) => id.toLowerCase()))];
  const out = new Map<string, string>();
  for (let i = 0; i < unique.length; i += SOLUTION_BATCH) {
    const batch = unique.slice(i, i + SOLUTION_BATCH);
    const { rows } = await runFetch(
      orgUrl,
      'canvasapps',
      `<fetch version="1.0" mapping="logical">
  <entity name="canvasapp">
    <attribute name="canvasappid" />
    <attribute name="name" />
    <filter>
      <condition attribute="name" operator="in">${batch.map((id) => `<value>${xmlEscape(id)}</value>`).join('')}</condition>
    </filter>
  </entity>
</fetch>`,
    );
    for (const row of rows) {
      const name = str(row.name).toLowerCase();
      const id = str(row.canvasappid).toLowerCase();
      if (name && id) out.set(name, id);
    }
  }
  return out;
}

async function fetchModelDrivenApps(orgUrl: string, envId: string): Promise<Resource[]> {
  const rows = await fetchAllRows(
    orgUrl,
    'appmodules',
    (page, cookie) => `${fetchOpen(page, cookie)}
  <entity name="appmodule">
    <attribute name="appmoduleid" />
    <attribute name="name" />
    <attribute name="uniquename" />
    <attribute name="publishedon" />
    <attribute name="modifiedon" />
    <attribute name="statecode" />
    <attribute name="solutionid" />
    <link-entity name="systemuser" from="systemuserid" to="createdby" link-type="outer" alias="owner">
      <attribute name="fullname" />
      <attribute name="internalemailaddress" />
      <attribute name="domainname" />
    </link-entity>
  </entity>
</fetch>`,
  );
  const seen = new Set<string>();
  const items = rows.flatMap((row) => {
    const id = str(row.appmoduleid);
    if (!id || seen.has(id)) return [];
    seen.add(id);
    const value: Resource = {
      id,
      name: str(row.name) || str(row.uniquename) || '(unnamed app)',
      type: 'Model-driven App',
      envId,
      ...ownerFields(row),
      tags: [],
      status: Number(row.statecode) === 1 ? 'Inactive' : str(row.publishedon) ? 'Published' : 'Draft',
      modified: str(row.modifiedon),
    };
    return [{ row, value }];
  });
  return items.map((i) => i.value);
}

const fetchApps = (orgUrl: string, envId: string) => settleAll([fetchCanvasApps(envId), fetchModelDrivenApps(orgUrl, envId)]);

// ---------- Copilot Studio ----------

/** Standard vs Microsoft Copilot harness, from the first word of the bot template (e.g. "cliagent-1.0.0" vs "default-2.1.0"). */
function agentHarness(row: Row): AgentHarness {
  return str(row.template).trim().toLowerCase().split('-')[0] === 'cliagent' ? 'MSFT Copilot' : 'Standard';
}

async function fetchAgents(orgUrl: string, envId: string): Promise<Resource[]> {
  const rows = await fetchAllRows(
    orgUrl,
    'bots',
    (page, cookie) => `${fetchOpen(page, cookie)}
  <entity name="bot">
    <attribute name="botid" />
    <attribute name="name" />
    <attribute name="publishedon" />
    <attribute name="modifiedon" />
    <attribute name="statecode" />
    <attribute name="template" />
    ${OWNER_LINK}
  </entity>
</fetch>`,
  );
  return rows.flatMap((row): Resource[] => {
    const id = str(row.botid);
    if (!id) return [];
    return [
      {
        id,
        name: str(row.name) || '(unnamed agent)',
        type: 'Copilot Studio',
        envId,
        ...ownerFields(row),
        poweredBy: agentHarness(row),
        tags: [],
        status: Number(row.statecode) === 1 ? 'Inactive' : str(row.publishedon) ? 'Published' : 'Draft',
        modified: str(row.modifiedon),
      },
    ];
  });
}

const fetchCopilot = fetchAgents;

// ---------- AI Builder ----------

async function fetchAiModels(orgUrl: string, envId: string): Promise<Resource[]> {
  const rows = await fetchAllRows(
    orgUrl,
    'msdyn_aimodels',
    (page, cookie) => `${fetchOpen(page, cookie)}
  <entity name="msdyn_aimodel">
    <attribute name="msdyn_aimodelid" />
    <attribute name="msdyn_name" />
    <attribute name="statecode" />
    <attribute name="modifiedon" />
    ${OWNER_LINK}
  </entity>
</fetch>`,
  );
  return rows.flatMap((row): Resource[] => {
    const id = str(row.msdyn_aimodelid);
    if (!id) return [];
    return [
      {
        id,
        name: str(row.msdyn_name) || '(unnamed model)',
        type: 'AI Model',
        envId,
        ...ownerFields(row),
        tags: [],
        status: Number(row.statecode) === 1 ? 'Active' : 'Inactive',
        modified: str(row.modifiedon),
      },
    ];
  });
}

// ---------- Dataverse tables ----------

/**
 * IsCustomEntity per table logical name, from the EntityDefinitions metadata endpoint
 * (read through the Dataverse connector's List rows; metadata cannot be read with FetchXML).
 */
async function fetchCustomEntityFlags(orgUrl: string): Promise<Map<string, boolean>> {
  const result = await withTimeout(
    MicrosoftDataverseService.ListRecordsWithOrganization(orgUrl, 'EntityDefinitions', undefined, undefined, undefined, undefined, 'LogicalName,IsCustomEntity'),
    60_000,
  );
  if (!result.success) throw result.error ?? new Error('EntityDefinitions query failed');
  const data = (result.data ?? {}) as Row;
  const rows = Array.isArray(data.value) ? (data.value as Row[]) : [];
  const out = new Map<string, boolean>();
  for (const row of rows) {
    const logical = str(row.LogicalName).toLowerCase();
    if (logical && typeof row.IsCustomEntity === 'boolean') out.set(logical, row.IsCustomEntity);
  }
  return out;
}

async function fetchTables(orgUrl: string, envId: string, plan: FetchPlan): Promise<Resource[]> {
  const customFlags = plan.customFlags
    ? fetchCustomEntityFlags(orgUrl).catch((err) => {
        console.warn('EntityDefinitions IsCustomEntity lookup failed', err);
        return new Map<string, boolean>();
      })
    : Promise.resolve(new Map<string, boolean>());
  const rows = await fetchAllRows(
    orgUrl,
    'entities',
    (page, cookie) => `${fetchOpen(page, cookie)}
  <entity name="entity">
    <attribute name="entityid" />
    <attribute name="logicalname" />
    <attribute name="name" />
    <attribute name="originallocalizedname" />
    <attribute name="componentstate" />
    <attribute name="solutionid" />
    <attribute name="overwritetime" />
    <filter type="and">
      <condition attribute="componentstate" operator="in"><value>0</value><value>1</value></condition>
    </filter>
  </entity>
</fetch>`,
  );
  const flags = await customFlags;
  const seen = new Set<string>();
  const items = rows.flatMap((row) => {
    const id = str(row.entityid);
    const logical = str(row.logicalname);
    if (!id || seen.has(id)) return [];
    seen.add(id);
    const display = str(row.originallocalizedname) || str(row.name);
    const overwrite = str(row.overwritetime);
    const value: Resource = {
      id,
      name: display && logical && display.toLowerCase() !== logical ? `${display} (${logical})` : display || logical || '(unnamed table)',
      type: 'Dataverse Table',
      envId,
      owner: '',
      tags: [],
      status: Number(row.componentstate) === 1 ? 'Draft' : 'Published',
      // overwritetime is 1900-01-01 when never set.
      modified: overwrite && !overwrite.startsWith('1900') ? overwrite : '',
      ...(flags.has(logical.toLowerCase()) ? { customTable: flags.get(logical.toLowerCase()) } : {}),
    };
    return [{ row, value }];
  });
  return (await withSolutionInfo(orgUrl, items)).map((i) => ({ ...i.value, owner: i.solution?.publisher ?? '' }));
}

// ---------- Classic processes (Other tab) ----------

const PROCESS_TYPES: Record<number, ResourceType> = { 0: 'Classic Workflow', 2: 'Business Rule', 3: 'Custom Action', 4: 'Business Process Flow' };

async function fetchClassicProcesses(orgUrl: string, envId: string): Promise<Resource[]> {
  const rows = await fetchAllRows(
    orgUrl,
    'workflows',
    (page, cookie) => `${fetchOpen(page, cookie)}
  <entity name="workflow">
    <attribute name="workflowid" />
    <attribute name="name" />
    <attribute name="category" />
    <attribute name="statecode" />
    <attribute name="modifiedon" />
    <attribute name="solutionid" />
    <filter type="and">
      <condition attribute="category" operator="in"><value>0</value><value>2</value><value>3</value><value>4</value></condition>
      <condition attribute="type" operator="eq" value="1" />
    </filter>
    ${OWNER_LINK}
  </entity>
</fetch>`,
  );
  const items = rows.flatMap((row) => {
    const id = str(row.workflowid);
    const type = PROCESS_TYPES[Number(row.category)];
    if (!id || !type) return [];
    const value: Resource = {
      id,
      name: str(row.name) || '(unnamed process)',
      type,
      envId,
      ...ownerFields(row),
      tags: [],
      // Classic processes: 0 Draft, 1 Activated.
      status: Number(row.statecode) === 1 ? 'Active' : 'Draft',
      modified: str(row.modifiedon),
    };
    return [{ row, value }];
  });
  return items.map((i) => i.value);
}

// ---------- Orchestration ----------

const GROUP_FETCH: Record<LiveGroup, (orgUrl: string, envId: string, plan: FetchPlan) => Promise<Resource[]>> = {
  flows: fetchFlows,
  apps: fetchApps,
  copilot: fetchCopilot,
  ai: fetchAiModels,
  dataverse: fetchTables,
  other: fetchClassicProcesses,
};

/**
 * Resources of an environment the signed-in user can read, one independent query group per tab.
 * The plan limits the groups and optional lookups; lookups left out keep their cached values.
 */
export async function fetchEnvironmentResources(env: Environment, plan: FetchPlan = FULL_PLAN): Promise<ResourceRefresh> {
  if (!env.url) throw new NoDataverseError();
  const orgUrl = env.url;
  const groups = plan.groups;
  const settled = await Promise.allSettled(groups.map((g) => GROUP_FETCH[g](orgUrl, env.id, plan)));

  const byGroup = new Map<LiveGroup, Resource[]>();
  const errors: Partial<Record<LiveGroup, string>> = {};
  settled.forEach((res, i) => {
    if (res.status === 'fulfilled') byGroup.set(groups[i], res.value);
    else errors[groups[i]] = errText(res.reason);
  });
  // Nothing loaded at all (e.g. no access to the environment): report it as one failure.
  if (!byGroup.size) throw (settled[0] as PromiseRejectedResult).reason;

  const loaded = [...byGroup.keys()];
  let resources = [...byGroup.values()].flat();
  const cached = readCachedResources(env.id);
  const previous = cached?.resources ?? [];
  const prevById = new Map(previous.map((r) => [r.id.toLowerCase(), r]));
  const runsWanted = plan.runs && byGroup.has('flows');

  // Solution and Runs (30d) columns: optional, rows stay "unknown" if a lookup fails.
  // Canvas / code app rows carry the app GUID; solutions reference the canvasapp record id.
  const isCanvas = (r: Resource) => r.type === 'Canvas App' || r.type === 'Code App';
  const recordIds = plan.solutions
    ? await canvasAppRecordIds(
        orgUrl,
        resources.filter(isCanvas).map((r) => r.appId ?? r.id),
      ).catch(() => new Map<string, string>())
    : new Map<string, string>();
  const objectIdOf = (r: Resource) => (isCanvas(r) ? recordIds.get((r.appId ?? r.id).toLowerCase()) ?? '' : r.id);
  const [membership, runCounts] = await Promise.all([
    plan.solutions ? fetchSolutionMembership(orgUrl, resources.map(objectIdOf)).catch(() => new Map<string, string[]>()) : null,
    runsWanted ? fetchFlowRunCounts(orgUrl).catch(() => null) : null,
  ]);
  resources = resources.map((r) => {
    const prev = prevById.get(r.id.toLowerCase());
    const objectId = membership ? objectIdOf(r) : '';
    const solutions = membership ? (objectId ? membership.get(objectId.toLowerCase()) : undefined) : prev?.solutions;
    const run = runCounts && RUN_TYPES.has(r.type) ? runCounts.counts.get(r.id.toLowerCase()) : undefined;
    // Lookups that were not part of the plan keep their last known values.
    const keptRuns =
      !runsWanted && prev && RUN_TYPES.has(r.type) && prev.runs30d !== undefined
        ? { runs30d: prev.runs30d, failedRuns30d: prev.failedRuns30d, ...(prev.lastRun ? { lastRun: prev.lastRun } : {}), ...(prev.runsPartial ? { runsPartial: true } : {}) }
        : {};
    const keptCustom = !plan.customFlags && r.customTable === undefined && prev?.customTable !== undefined ? { customTable: prev.customTable } : {};
    return {
      ...r,
      ...(solutions ? { solutions } : {}),
      ...keptRuns,
      ...keptCustom,
      ...(runCounts && RUN_TYPES.has(r.type)
        ? { runs30d: run?.runs ?? 0, failedRuns30d: run?.failed ?? 0, ...(run?.last ? { lastRun: run.last } : {}), ...(runCounts.partial ? { runsPartial: true } : {}) }
        : {}),
    };
  });

  // Cache: fresh rows for loaded groups, previous rows for the others.
  const now = new Date().toISOString();
  const loadedSet = new Set<string>(loaded);
  const kept = previous.filter((r) => !loadedSet.has(groupKeyOf(r)));
  const fetched: Partial<Record<LiveGroup, GroupFetch>> = { ...cached?.fetched };
  for (const g of loaded) {
    fetched[g] = {
      at: now,
      solutions: plan.solutions,
      runs: g !== 'flows' || (runsWanted && runCounts !== null),
      customFlags: g !== 'dataverse' || plan.customFlags,
    };
  }
  putCachedResources(env.id, { savedAt: now, resources: [...resources, ...kept], fetched } satisfies CachedResources);

  return { resources, loaded, errors };
}

/**
 * Groups of the plan whose cached rows are older than maxAgeMs or were fetched without
 * a lookup the plan needs. An empty result means the cache can be used as is.
 */
export function staleGroups(envId: string, plan: FetchPlan, maxAgeMs: number): LiveGroup[] {
  const fetched = readCachedResources(envId)?.fetched ?? {};
  const now = Date.now();
  return plan.groups.filter((g) => {
    const f = fetched[g];
    if (!f || !(now - Date.parse(f.at) <= maxAgeMs)) return true;
    return (plan.solutions && !f.solutions) || (plan.runs && !f.runs) || (plan.customFlags && !f.customFlags);
  });
}

export function readCachedResources(envId: string): CachedResources | null {
  return getCachedResources(envId);
}

/** Drops deleted resources from an environment's cache, so a reused cache does not list them again. */
export function removeCachedResources(envId: string, ids: string[]) {
  const cached = readCachedResources(envId);
  if (!cached) return;
  const gone = new Set(ids.map((id) => id.toLowerCase()));
  putCachedResources(envId, { ...cached, resources: cached.resources.filter((r) => !gone.has(r.id.toLowerCase())) } satisfies CachedResources);
}

const TYPE_GROUP: Record<ResourceType, LiveGroup> = {
  'Cloud Flow': 'flows',
  'Scheduled Flow': 'flows',
  'Desktop Flow': 'flows',
  'Canvas App': 'apps',
  'Model-driven App': 'apps',
  'Code App': 'apps',
  'Copilot Studio': 'copilot',
  'Agent Flow': 'flows',
  'AI Model': 'ai',
  'Dataverse Table': 'dataverse',
  'Classic Workflow': 'other',
  'Business Rule': 'other',
  'Custom Action': 'other',
  'Business Process Flow': 'other',
  Other: 'other',
};
/** Which live query group a resource belongs to (matches the TYPE_GROUPS keys). */
export const groupKeyOf = (r: Resource): LiveGroup => TYPE_GROUP[r.type];
export const groupOfType = (t: ResourceType): LiveGroup => TYPE_GROUP[t];
