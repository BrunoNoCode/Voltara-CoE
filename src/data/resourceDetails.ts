// Details of one resource for the side panel: record dates, solutions, solution layers and
// dependencies. All read live with FetchXML through the Dataverse connector, nothing is stored.
import { runFetch, str, xmlEscape, type Row } from './liveFlows';
import { withTimeout } from './liveEnvironments';
import { canvasAppRecordIds } from './liveResources';
import type { Environment, Resource, ResourceType } from './types';

const DETAILS_TIMEOUT_MS = 30_000;

interface TypeInfo {
  entity: string;
  set: string;
  idAttr: string;
  created: string;
  modified: string;
  /** msdyn_solutioncomponentname used by the component layer table. */
  layerName: string;
}

const WORKFLOW: TypeInfo = { entity: 'workflow', set: 'workflows', idAttr: 'workflowid', created: 'createdon', modified: 'modifiedon', layerName: 'Workflow' };

const TYPE_INFO: Partial<Record<ResourceType, TypeInfo>> = {
  'Cloud Flow': WORKFLOW,
  'Scheduled Flow': WORKFLOW,
  'Desktop Flow': WORKFLOW,
  'Agent Flow': WORKFLOW,
  'Classic Workflow': WORKFLOW,
  'Business Rule': WORKFLOW,
  'Custom Action': WORKFLOW,
  'Business Process Flow': WORKFLOW,
  'Canvas App': { entity: 'canvasapp', set: 'canvasapps', idAttr: 'canvasappid', created: 'createdtime', modified: 'lastmodifiedtime', layerName: 'CanvasApp' },
  'Code App': { entity: 'canvasapp', set: 'canvasapps', idAttr: 'canvasappid', created: 'createdtime', modified: 'lastmodifiedtime', layerName: 'CanvasApp' },
  'Model-driven App': { entity: 'appmodule', set: 'appmodules', idAttr: 'appmoduleid', created: 'createdon', modified: 'modifiedon', layerName: 'AppModule' },
  'Copilot Studio': { entity: 'bot', set: 'bots', idAttr: 'botid', created: 'createdon', modified: 'modifiedon', layerName: 'bot' },
  'AI Model': { entity: 'msdyn_aimodel', set: 'msdyn_aimodels', idAttr: 'msdyn_aimodelid', created: 'createdon', modified: 'modifiedon', layerName: 'msdyn_aimodel' },
};

/** solutioncomponent / dependency component type codes. */
const COMPONENT_TYPE: Record<number, string> = {
  1: 'Entity',
  2: 'Attribute',
  3: 'Relationship',
  9: 'Option Set',
  10: 'Relationship',
  20: 'Security Role',
  24: 'Form',
  26: 'View',
  29: 'Workflow',
  59: 'Chart',
  60: 'System Form',
  61: 'Web Resource',
  62: 'Site Map',
  80: 'App Module',
  90: 'Plugin Type',
  91: 'Plugin Assembly',
  92: 'SDK Message Step',
  300: 'Canvas App',
  371: 'Connector',
  372: 'Connection Reference',
  380: 'Env. Variable Definition',
  381: 'Env. Variable Value',
};

export const componentTypeName = (code: number) => COMPONENT_TYPE[code] ?? `Type ${code}`;

export interface SolutionInfo {
  name: string;
  uniqueName: string;
  /** solutionid, for the link to the solution in the maker portal. */
  id?: string;
  version: string;
  managed: boolean;
  publisher: string;
}

export interface LayerInfo {
  order: number;
  solution: string;
  publisher: string;
  managed: boolean;
  overwritten?: string;
}

export interface DependencyInfo {
  componentType: number;
  objectId: string;
  /** Published / Unpublished / Deleted, when the dependency node could be read. */
  state?: string;
}

export interface ResourceDetails {
  created?: string;
  modified?: string;
  managed?: boolean;
  solutions: SolutionInfo[];
  layers: LayerInfo[];
  layersError?: string;
  solutionsError?: string;
  requires: DependencyInfo[];
  requiredBy: DependencyInfo[];
  dependenciesError?: string;
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));
const bool = (v: unknown) => v === true || v === 'true' || v === 1;

async function fetchRecord(orgUrl: string, info: TypeInfo, id: string) {
  const { rows } = await runFetch(
    orgUrl,
    info.set,
    `<fetch version="1.0" mapping="logical" top="1">
  <entity name="${info.entity}">
    <attribute name="${info.idAttr}" />
    <attribute name="${info.created}" />
    <attribute name="${info.modified}" />
    <attribute name="ismanaged" />
    <filter><condition attribute="${info.idAttr}" operator="eq" value="${xmlEscape(id)}" /></filter>
  </entity>
</fetch>`,
  );
  const r = rows[0];
  if (!r) return {};
  return { created: str(r[info.created]) || undefined, modified: str(r[info.modified]) || undefined, managed: r.ismanaged === undefined ? undefined : bool(r.ismanaged) };
}

async function fetchSolutions(orgUrl: string, id: string): Promise<SolutionInfo[]> {
  const { rows } = await runFetch(
    orgUrl,
    'solutioncomponents',
    `<fetch version="1.0" mapping="logical">
  <entity name="solutioncomponent">
    <attribute name="solutioncomponentid" />
    <filter><condition attribute="objectid" operator="eq" value="${xmlEscape(id)}" /></filter>
    <link-entity name="solution" from="solutionid" to="solutionid" link-type="inner" alias="sol">
      <attribute name="solutionid" />
      <attribute name="friendlyname" />
      <attribute name="uniquename" />
      <attribute name="version" />
      <attribute name="ismanaged" />
      <filter>
        <condition attribute="isvisible" operator="eq" value="1" />
        <condition attribute="uniquename" operator="ne" value="Default" />
      </filter>
      <link-entity name="publisher" from="publisherid" to="publisherid" link-type="outer" alias="pub">
        <attribute name="friendlyname" />
      </link-entity>
    </link-entity>
  </entity>
</fetch>`,
  );
  const seen = new Set<string>();
  const out: SolutionInfo[] = [];
  for (const r of rows) {
    const uniqueName = str(r['sol.uniquename']);
    if (!uniqueName || seen.has(uniqueName)) continue;
    seen.add(uniqueName);
    out.push({
      name: str(r['sol.friendlyname']) || uniqueName,
      uniqueName,
      id: str(r['sol.solutionid']) || undefined,
      version: str(r['sol.version']),
      managed: bool(r['sol.ismanaged']),
      publisher: str(r['pub.friendlyname']),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchLayers(orgUrl: string, layerName: string, id: string): Promise<LayerInfo[]> {
  const { rows } = await runFetch(
    orgUrl,
    'msdyn_componentlayers',
    `<fetch version="1.0" mapping="logical">
  <entity name="msdyn_componentlayer">
    <attribute name="msdyn_order" />
    <attribute name="msdyn_solutionname" />
    <attribute name="msdyn_publishername" />
    <attribute name="msdyn_overwritetime" />
    <filter type="and">
      <condition attribute="msdyn_componentid" operator="eq" value="${xmlEscape(id)}" />
      <condition attribute="msdyn_solutioncomponentname" operator="eq" value="${xmlEscape(layerName)}" />
    </filter>
  </entity>
</fetch>`,
  );
  return rows
    .map((r: Row) => {
      const solution = str(r.msdyn_solutionname);
      const overwritten = str(r.msdyn_overwritetime);
      return {
        order: Number(r.msdyn_order) || 0,
        solution,
        publisher: str(r.msdyn_publishername),
        // Unmanaged customizations always live in the "Active" layer.
        managed: solution !== 'Active',
        ...(overwritten && !overwritten.startsWith('1900') ? { overwritten } : {}),
      };
    })
    .sort((a, b) => b.order - a.order);
}

const NODE_STATE: Record<number, string> = { 0: 'Published', 1: 'Unpublished', 2: 'Deleted', 3: 'Deleted' };

function dependencyFetch(side: 'dependent' | 'required', id: string, withNode: boolean) {
  const other = side === 'dependent' ? 'required' : 'dependent';
  return `<fetch version="1.0" mapping="logical">
  <entity name="dependency">
    <attribute name="${other}componentobjectid" />
    <attribute name="${other}componenttype" />
    <filter><condition attribute="${side}componentobjectid" operator="eq" value="${xmlEscape(id)}" /></filter>
    ${
      withNode
        ? `<link-entity name="dependencynode" from="dependencynodeid" to="${other}componentnodeid" link-type="outer" alias="node">
      <attribute name="componentstate" />
    </link-entity>`
        : ''
    }
  </entity>
</fetch>`;
}

/** Requires: components this one depends on. Required by: components that depend on this one. */
async function fetchDependencies(orgUrl: string, side: 'dependent' | 'required', id: string): Promise<DependencyInfo[]> {
  const other = side === 'dependent' ? 'required' : 'dependent';
  let rows: Row[];
  try {
    rows = (await runFetch(orgUrl, 'dependencies', dependencyFetch(side, id, true))).rows;
  } catch {
    rows = (await runFetch(orgUrl, 'dependencies', dependencyFetch(side, id, false))).rows;
  }
  const seen = new Set<string>();
  const out: DependencyInfo[] = [];
  for (const r of rows) {
    const objectId = str(r[`${other}componentobjectid`]);
    const componentType = Number(r[`${other}componenttype`]);
    const key = `${componentType}:${objectId}`;
    if (!objectId || seen.has(key)) continue;
    seen.add(key);
    const state = r['node.componentstate'];
    out.push({ componentType, objectId, ...(state !== undefined && state !== null ? { state: NODE_STATE[Number(state)] } : {}) });
  }
  return out.sort((a, b) => componentTypeName(a.componentType).localeCompare(componentTypeName(b.componentType)) || a.objectId.localeCompare(b.objectId));
}

export async function fetchResourceDetails(env: Environment, resource: Resource): Promise<ResourceDetails> {
  if (!env.url) throw new Error('This environment has no Dataverse database');
  const info = TYPE_INFO[resource.type];
  const layerName = info?.layerName ?? (resource.type === 'Dataverse Table' ? 'Entity' : '');

  const t = <T,>(p: Promise<T>) => withTimeout(p, DETAILS_TIMEOUT_MS);
  // Canvas / code app rows carry the app GUID; Dataverse keys them by canvasappid.
  let objectId = resource.id;
  if (resource.type === 'Canvas App' || resource.type === 'Code App') {
    const appId = resource.appId ?? resource.id;
    const ids = await t(canvasAppRecordIds(env.url, [appId])).catch(() => new Map<string, string>());
    objectId = ids.get(appId.toLowerCase()) ?? resource.id;
  }
  const [record, solutions, layers, requires, requiredBy] = await Promise.allSettled([
    info ? t(fetchRecord(env.url, info, objectId)) : Promise.resolve({} as Awaited<ReturnType<typeof fetchRecord>>),
    t(fetchSolutions(env.url, objectId)),
    layerName ? t(fetchLayers(env.url, layerName, objectId)) : Promise.resolve([] as LayerInfo[]),
    t(fetchDependencies(env.url, 'dependent', objectId)),
    t(fetchDependencies(env.url, 'required', objectId)),
  ]);

  const rec = record.status === 'fulfilled' ? record.value : {};
  const layerList = layers.status === 'fulfilled' ? layers.value : [];
  const depError = requires.status === 'rejected' ? requires.reason : requiredBy.status === 'rejected' ? requiredBy.reason : undefined;
  return {
    created: rec.created,
    modified: rec.modified,
    // Tables have no ismanaged column: managed when no unmanaged (Active) layer exists.
    managed: rec.managed ?? (layerList.length ? !layerList.some((l) => !l.managed) : undefined),
    solutions: solutions.status === 'fulfilled' ? solutions.value : [],
    layers: layerList,
    ...(layers.status === 'rejected' ? { layersError: errText(layers.reason) } : {}),
    ...(solutions.status === 'rejected' ? { solutionsError: errText(solutions.reason) } : {}),
    requires: requires.status === 'fulfilled' ? requires.value : [],
    requiredBy: requiredBy.status === 'fulfilled' ? requiredBy.value : [],
    ...(depError !== undefined ? { dependenciesError: errText(depError) } : {}),
  };
}

/** Created / modified dates and solutions only (no layers or dependencies): used by the AI Hub agent panel. */
export async function fetchBasicDetails(
  env: Environment,
  resource: Resource,
): Promise<Pick<ResourceDetails, 'created' | 'modified' | 'solutions' | 'solutionsError'>> {
  if (!env.url) throw new Error('This environment has no Dataverse database');
  const info = TYPE_INFO[resource.type];
  const t = <T,>(p: Promise<T>) => withTimeout(p, DETAILS_TIMEOUT_MS);
  const [record, solutions] = await Promise.allSettled([
    info ? t(fetchRecord(env.url, info, resource.id)) : Promise.resolve({} as Awaited<ReturnType<typeof fetchRecord>>),
    t(fetchSolutions(env.url, resource.id)),
  ]);
  const rec = record.status === 'fulfilled' ? record.value : {};
  return {
    created: rec.created,
    modified: rec.modified,
    solutions: solutions.status === 'fulfilled' ? solutions.value : [],
    ...(solutions.status === 'rejected' ? { solutionsError: errText(solutions.reason) } : {}),
  };
}

/** Link that opens the resource in its maker portal (or the classic UI for processes). */
export function makerUrl(env: Environment, r: Resource): string | undefined {
  const e = env.id;
  switch (r.type) {
    case 'Cloud Flow':
    case 'Scheduled Flow':
      return `https://make.powerautomate.com/environments/${e}/flows/${r.id}/details`;
    case 'Agent Flow':
      return `https://copilotstudio.preview.microsoft.com/environments/${e}/flows/${r.id}`;
    case 'Desktop Flow':
      return `https://make.powerautomate.com/environments/${e}/uiflows/${r.id}/details`;
    case 'Canvas App':
    case 'Code App':
      return r.appId ? `https://make.powerapps.com/environments/${e}/apps/${r.appId}/details` : `https://make.powerapps.com/environments/${e}/apps`;
    case 'Model-driven App':
      return env.url ? `${env.url.replace(/\/$/, '')}/main.aspx?appid=${r.id}` : undefined;
    case 'Copilot Studio':
      return `https://copilotstudio.preview.microsoft.com/environments/${e}/${r.poweredBy === 'MSFT Copilot' ? 'agents' : 'bots'}/${r.id}/overview`;
    case 'AI Model':
      return `https://make.powerapps.com/environments/${e}/aibuilder/models/${r.id}`;
    case 'Dataverse Table':
      return `https://make.powerapps.com/environments/${e}/entities/${r.id}`;
    case 'Classic Workflow':
    case 'Business Rule':
    case 'Custom Action':
    case 'Business Process Flow':
      return env.url ? `${env.url.replace(/\/$/, '')}/main.aspx?pagetype=entityrecord&etn=workflow&id=${r.id}` : undefined;
    default:
      return undefined;
  }
}
