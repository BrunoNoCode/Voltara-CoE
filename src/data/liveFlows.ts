// Live flow inventory for one environment. Cloud, scheduled and agent flows come
// from the Power Platform for Admins V2 connector; desktop flows and owner names
// are read with FetchXML through the Microsoft Dataverse connector. Read-only:
// nothing is written to Dataverse.
// Also holds the shared FetchXML helpers used by liveResources.ts.
import { MicrosoftDataverseService } from '../generated/services/MicrosoftDataverseService';
import { PowerPlatformforAdminsV2Service } from '../generated/services/PowerPlatformforAdminsV2Service';
import type { CloudFlow } from '../generated/models/PowerPlatformforAdminsV2Model';
import { withTimeout } from './liveEnvironments';
import type { Resource, ResourceStatus, ResourceType } from './types';

export const PAGE_SIZE = 1000;
const MAX_PAGES = 50;
const CALL_TIMEOUT_MS = 60_000;
const PREFER = 'odata.include-annotations=*';

const CATEGORY_DESKTOP = 6;

/** Thrown when the environment has no Dataverse database, so there is nothing to query. */
export class NoDataverseError extends Error {
  constructor() {
    super('This environment has no Dataverse database');
    this.name = 'NoDataverseError';
  }
}

// Connectors that make a flow Premium. Built-in HTTP actions are detected separately.
// Not exhaustive: unknown or custom connectors are reported as Standard.
const PREMIUM_CONNECTORS = new Set([
  'commondataserviceforapps', 'commondataservice', 'dynamicscrmonline', 'dynamicsax', 'dynamicssmbsaas',
  'sql', 'azureblob', 'azuretables', 'azurequeues', 'azurefile', 'servicebus', 'eventhubs', 'azureeventgrid',
  'keyvault', 'azuread', 'azureautomation', 'azuredatafactory', 'azuredatalake', 'documentdb', 'kusto',
  'azurefunctions', 'azurelogicapps', 'cognitiveservicestextanalytics', 'cognitiveservicescomputervision',
  'uiflow', 'webcontents', 'webcontentsv2', 'smtp', 'sftpwithssh', 'filesystem', 'oracle', 'db2', 'mysql',
  'postgresql', 'teradata', 'informix', 'mq', 'sapodata', 'saperp', 'salesforce', 'servicenow', 'zendesk',
  'docusign', 'adobesign', 'jira', 'workday', 'successfactors', 'snowflake', 'databricks', 'openai',
  'azureopenai', 'aibuilder', 'dataverseforteams',
]);

export const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Opening <fetch> tag for one page of a paged query. */
export const fetchOpen = (page: number, cookie?: string) =>
  `<fetch version="1.0" mapping="logical" count="${PAGE_SIZE}" page="${page}"${cookie ? ` paging-cookie="${xmlEscape(cookie)}"` : ''}>`;

/** Desktop flows (category 6): the admin connector does not list them, so they still come from Dataverse. */
function desktopFlowListFetch(page: number, cookie?: string) {
  return `${fetchOpen(page, cookie)}
  <entity name="workflow">
    <attribute name="workflowid" />
    <attribute name="name" />
    <attribute name="category" />
    <attribute name="statecode" />
    <attribute name="statuscode" />
    <attribute name="createdon" />
    <attribute name="modifiedon" />
    <filter type="and">
      <condition attribute="category" operator="eq" value="${CATEGORY_DESKTOP}" />
      <condition attribute="type" operator="eq" value="1" />
    </filter>
    ${OWNER_LINK}
    <order attribute="modifiedon" descending="true" />
  </entity>
</fetch>`;
}

export type Row = Record<string, unknown>;

interface Page {
  rows: Row[];
  more: boolean;
  cookie?: string;
}

/** Runs one FetchXML query against a table (by its entity set name) of the given environment. */
export async function runFetch(orgUrl: string, entitySet: string, fetchXml: string): Promise<Page> {
  const result = await withTimeout(
    MicrosoftDataverseService.ListRecordsWithOrganization(orgUrl, entitySet, PREFER, undefined, undefined, undefined, undefined, undefined, undefined, undefined, fetchXml),
    CALL_TIMEOUT_MS,
  );
  if (!result.success) throw result.error ?? new Error('Dataverse query failed');
  const data = (result.data ?? {}) as Row;
  const rows = Array.isArray(data.value) ? (data.value as Row[]) : [];
  const moreFlag = data['@Microsoft.Dynamics.CRM.morerecords'];
  return {
    rows,
    // Fall back to "a full page means there may be more" if the annotation is not passed through.
    more: typeof moreFlag === 'boolean' ? moreFlag : rows.length >= PAGE_SIZE,
    cookie: pagingCookieOf(data['@Microsoft.Dynamics.CRM.fetchxmlpagingcookie']),
  };
}

/** Extracts the inner paging cookie from the fetchxmlpagingcookie annotation. */
function pagingCookieOf(annotation: unknown): string | undefined {
  if (typeof annotation !== 'string') return undefined;
  const m = /pagingcookie="([^"]*)"/.exec(annotation);
  if (!m) return undefined;
  try {
    return decodeURIComponent(decodeURIComponent(m[1]));
  } catch {
    return undefined;
  }
}

/** Runs a paged query (build(page, cookie) returns the FetchXML of one page) and returns all rows. */
export async function fetchAllRows(orgUrl: string, entitySet: string, build: (page: number, cookie?: string) => string): Promise<Row[]> {
  const rows: Row[] = [];
  let cookie: string | undefined;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await runFetch(orgUrl, entitySet, build(page, cookie));
    rows.push(...res.rows);
    if (!res.more) break;
    cookie = res.cookie;
  }
  return rows;
}

export const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

/** Owner display name from an outer link to systemuser aliased "owner", else the lookup's formatted value. */
export const ownerOf = (row: Row) =>
  str(row['owner.fullname']) || str(row['owner.internalemailaddress']) || str(row['_ownerid_value@OData.Community.Display.V1.FormattedValue']);

/** Owner name plus e-mail / UPN (used to match Azure group members in tag rules). */
export function ownerFields(row: Row): Pick<Resource, 'owner' | 'ownerEmail' | 'ownerUpn'> {
  const email = str(row['owner.internalemailaddress']);
  const upn = str(row['owner.domainname']);
  return { owner: ownerOf(row), ...(email ? { ownerEmail: email } : {}), ...(upn ? { ownerUpn: upn } : {}) };
}

/** Shared <link-entity> that brings in the owner's name, e-mail and UPN (alias "owner"). */
export const OWNER_LINK = `<link-entity name="systemuser" from="systemuserid" to="ownerid" link-type="outer" alias="owner">
      <attribute name="fullname" />
      <attribute name="internalemailaddress" />
      <attribute name="domainname" />
    </link-entity>`;

/** workflow.statecode: 0 Draft/Off, 1 On (activated), 2 Suspended. */
export function statusOf(statecode: unknown): ResourceStatus {
  const s = Number(statecode);
  return s === 1 ? 'On' : s === 2 ? 'Suspended' : 'Off';
}

interface FlowDetails {
  type: ResourceType;
  connectors: string[];
  premium: boolean;
}

function parseClientData(raw: string): FlowDetails | null {
  if (!raw) return null;
  try {
    const cd = JSON.parse(raw) as {
      properties?: {
        connectionReferences?: Record<string, { api?: { name?: string }; apiName?: string; id?: string }>;
        definition?: { triggers?: Record<string, { type?: string; kind?: string }> };
      };
    };
    const props = cd.properties ?? {};
    const trigger = Object.values(props.definition?.triggers ?? {})[0];
    const type: ResourceType = trigger?.type?.toLowerCase() === 'recurrence' ? 'Scheduled Flow' : 'Cloud Flow';
    const connectors = [
      ...new Set(
        Object.entries(props.connectionReferences ?? {}).map(([key, ref]) =>
          (ref.api?.name ?? ref.apiName ?? ref.id?.split('/').pop() ?? key).replace(/^shared_/, '').toLowerCase(),
        ),
      ),
    ].sort();
    const usesHttp = /"type"\s*:\s*"(http|httpwebhook)"/i.test(raw);
    const premium = usesHttp || connectors.some((c) => PREMIUM_CONNECTORS.has(c));
    return { type, connectors: usesHttp ? [...connectors, 'http'] : connectors, premium };
  } catch {
    return null;
  }
}

function mapDesktopFlow(row: Row, envId: string): Resource | null {
  const id = str(row.workflowid).toLowerCase();
  if (!id) return null;
  return {
    id,
    name: str(row.name) || '(unnamed flow)',
    type: 'Desktop Flow',
    envId,
    ...ownerFields(row),
    tags: [],
    status: statusOf(row.statecode),
    // Desktop flows always need Power Automate Premium.
    license: 'Premium',
    modified: str(row.modifiedon),
  };
}

// ---------- Cloud, scheduled and agent flows: Power Platform for Admins V2 connector ----------

/** ListCloudFlows returns at most one page and the generated client cannot follow nextLink. */
const CLOUD_FLOWS_PAGE = 250;
const CLOUD_FLOWS_API_VERSION = '2024-10-01';
const FIRST_FLOW_DAY = '2016-01-01';
const DAY_MS = 86_400_000;
const OWNER_BATCH = 100;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

async function listCloudFlows(envId: string, from?: string, to?: string): Promise<CloudFlow[]> {
  const result = await withTimeout(
    PowerPlatformforAdminsV2Service.ListCloudFlows(envId, CLOUD_FLOWS_API_VERSION, undefined, undefined, undefined, undefined, from, to),
    CALL_TIMEOUT_MS,
  );
  if (!result.success) throw result.error ?? new Error('ListCloudFlows failed');
  return result.data?.value ?? [];
}

/**
 * Every cloud flow of the environment. A full page means rows were cut off, so the
 * created-on window is split in halves until each part fits (a single day cannot be split).
 */
async function fetchConnectorCloudFlows(envId: string): Promise<CloudFlow[]> {
  const all = await listCloudFlows(envId);
  if (all.length < CLOUD_FLOWS_PAGE) return all;

  const out = [...all];
  const fetchWindow = async (startMs: number, endMs: number): Promise<void> => {
    const rows = await listCloudFlows(envId, isoDay(startMs), isoDay(endMs));
    if (rows.length < CLOUD_FLOWS_PAGE || endMs - startMs < DAY_MS) {
      out.push(...rows);
      return;
    }
    const mid = startMs + Math.floor((endMs - startMs) / 2 / DAY_MS) * DAY_MS;
    await Promise.all([fetchWindow(startMs, mid), fetchWindow(mid + DAY_MS, endMs)]);
  };
  await fetchWindow(Date.parse(FIRST_FLOW_DAY), Date.now() + DAY_MS);
  return out;
}

/**
 * ListCloudFlows stateCode enum (connector schema): Draft (off), Published (on), Suspended.
 * Numeric codes (0 / 1 / 2) are accepted too. statusCode CompanyDLPViolation / Quarantined also means suspended.
 */
function cloudFlowStatus(stateCode: string | undefined, statusCode: string | undefined): ResourceStatus {
  const s = str(stateCode).toLowerCase();
  const st = str(statusCode).toLowerCase();
  if (s === '2' || s === 'suspended' || st === 'companydlpviolation' || st === 'quarantined') return 'Suspended';
  if (s === '1' || s === 'published' || s === 'activated' || s === 'on' || s === 'started') return 'On';
  return 'Off';
}

/** modernFlowType 1 (Copilot Studio flow) is an agent flow; 0 is a regular Power Automate flow. */
const isAgentFlow = (modernFlowType: string | undefined) => {
  const t = str(modernFlowType);
  return t === '1' || /copilot|agent/i.test(t);
};

interface Owner {
  owner: string;
  ownerEmail?: string;
  ownerUpn?: string;
}

/** Owner names for Dataverse owner ids: systemuser first, then team for ids no user matched. */
async function fetchOwners(orgUrl: string, ownerIds: string[]): Promise<Map<string, Owner>> {
  const out = new Map<string, Owner>();
  const byIds = async (entity: string, entitySet: string, attrs: string[], ids: string[], map: (row: Row) => Owner) => {
    for (let i = 0; i < ids.length; i += OWNER_BATCH) {
      const batch = ids.slice(i, i + OWNER_BATCH);
      const { rows } = await runFetch(
        orgUrl,
        entitySet,
        `<fetch version="1.0" mapping="logical">
  <entity name="${entity}">
    <attribute name="${entity}id" />
    ${attrs.map((a) => `<attribute name="${a}" />`).join('')}
    <filter>
      <condition attribute="${entity}id" operator="in">${batch.map((id) => `<value>${xmlEscape(id)}</value>`).join('')}</condition>
    </filter>
  </entity>
</fetch>`,
      );
      for (const row of rows) out.set(str(row[`${entity}id`]).toLowerCase(), map(row));
    }
  };
  // One failing lookup must not wipe the owners already found.
  const tryByIds = (...args: Parameters<typeof byIds>) => byIds(...args).catch(() => undefined);
  const unique = [...new Set(ownerIds.filter(Boolean).map((id) => id.toLowerCase()))];
  await tryByIds('systemuser', 'systemusers', ['fullname', 'internalemailaddress', 'domainname'], unique, (row) => {
    const email = str(row.internalemailaddress);
    const upn = str(row.domainname);
    return { owner: str(row.fullname) || email || upn, ...(email ? { ownerEmail: email } : {}), ...(upn ? { ownerUpn: upn } : {}) };
  });
  const teams = unique.filter((id) => !out.has(id));
  if (teams.length) await tryByIds('team', 'teams', ['name'], teams, (row) => ({ owner: str(row.name) }));
  return out;
}

/** Owner id of a flow; empty strings fall through to the next field. */
const flowOwnerId = (flow: CloudFlow) => str(flow.ownerId || flow.owningUser || flow.owningTeam).toLowerCase();

function mapCloudFlow(flow: CloudFlow, envId: string, owners: Map<string, Owner>): Resource | null {
  const id = str(flow.workflowId).toLowerCase();
  if (!id) return null;
  const details = parseClientData(str(flow.definition));
  const type: ResourceType = isAgentFlow(flow.modernFlowType) ? 'Agent Flow' : details?.type ?? 'Cloud Flow';
  const owner = owners.get(flowOwnerId(flow));
  return {
    id,
    name: str(flow.name) || '(unnamed flow)',
    type,
    envId,
    owner: owner?.owner ?? '',
    ...(owner?.ownerEmail ? { ownerEmail: owner.ownerEmail } : {}),
    ...(owner?.ownerUpn ? { ownerUpn: owner.ownerUpn } : {}),
    tags: [],
    status: cloudFlowStatus(flow.stateCode, flow.statusCode),
    ...(details ? { connectors: details.connectors, license: details.premium ? 'Premium' : 'Standard' } : {}),
    modified: str(flow.modifiedOn || flow.createdOn),
  };
}

/**
 * All flows of an environment, one row per workflow id:
 * - cloud, scheduled and agent flows from the Power Platform for Admins V2 connector (ListCloudFlows),
 * - desktop flows from Dataverse (read-only FetchXML), since no admin connector lists them.
 */
export async function fetchFlows(orgUrl: string, envId: string): Promise<Resource[]> {
  const [cloud, desktopRows] = await Promise.all([
    fetchConnectorCloudFlows(envId),
    fetchAllRows(orgUrl, 'workflows', desktopFlowListFetch).catch(() => [] as Row[]),
  ]);

  const desktop = desktopRows.map((row) => mapDesktopFlow(row, envId)).filter((f): f is Resource => f !== null);
  const seen = new Set(desktop.map((f) => f.id));
  const owners = await fetchOwners(
    orgUrl,
    cloud.map(flowOwnerId),
  ).catch(() => new Map<string, Owner>());

  const out = [...desktop];
  for (const flow of cloud) {
    // Activation copies point at their definition through parentWorkflowId: list the definition only.
    const parent = str(flow.parentWorkflowId).toLowerCase();
    if (parent && parent !== str(flow.workflowId).toLowerCase()) continue;
    const f = mapCloudFlow(flow, envId, owners);
    if (!f || seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
  }
  return out;
}
