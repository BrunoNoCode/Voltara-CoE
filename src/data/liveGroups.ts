// Entra (Azure AD) group lookup for "Azure Group Owner" tag rules, via the Office 365
// Groups connector's "Send an HTTP request" action against Microsoft Graph.
// Outside the Power Apps host a few demo groups built from the demo owners are used.
import { Office365GroupsService } from '../generated/services/Office365GroupsService';
import { isHosted } from './api';
import { errorText, readJson, unwrapData, withTimeout, writeJson } from './liveEnvironments';
import { OWNERS, demoEmail } from './mockData';
import type { GroupMember, GroupSnapshot } from './types';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const TIMEOUT_MS = 30_000;
const MAX_PAGES = 50;
/** Safety cap for the recursive fallback walk. */
const MAX_NESTED_GROUPS = 200;

export interface GroupHit {
  id: string;
  name: string;
  mail?: string;
  description?: string;
}

interface GraphDirectoryObject {
  '@odata.type'?: string;
  id?: string;
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
  description?: string | null;
}

interface GraphPage {
  value?: GraphDirectoryObject[];
  '@odata.nextLink'?: string;
}

async function graphGet(url: string, ...headers: string[]): Promise<GraphPage> {
  const result = await withTimeout(Office365GroupsService.HttpRequestV2(url, 'GET', undefined, undefined, ...headers), TIMEOUT_MS);
  if (!result.success) throw result.error ?? new Error('Graph request failed');
  return (unwrapData(result.data) ?? {}) as GraphPage;
}

/** Follows @odata.nextLink until every page is read. */
async function graphGetAll(url: string): Promise<GraphDirectoryObject[]> {
  const out: GraphDirectoryObject[] = [];
  let next: string | undefined = url;
  for (let page = 0; next && page < MAX_PAGES; page++) {
    const data = await graphGet(next);
    out.push(...(data.value ?? []));
    next = data['@odata.nextLink'];
  }
  return out;
}

const odataString = (s: string) => s.replace(/'/g, "''");

const toHit = (g: GraphDirectoryObject): GroupHit | null =>
  g.id ? { id: g.id, name: g.displayName ?? g.id, mail: g.mail ?? undefined, description: g.description ?? undefined } : null;

const isUser = (o: GraphDirectoryObject) => o['@odata.type'] === '#microsoft.graph.user';
const isGroup = (o: GraphDirectoryObject) => o['@odata.type'] === '#microsoft.graph.group';

const toMember = (o: GraphDirectoryObject): GroupMember => ({
  name: o.displayName ?? o.userPrincipalName ?? o.mail ?? o.id ?? '',
  ...(o.mail ? { mail: o.mail } : {}),
  ...(o.userPrincipalName ? { upn: o.userPrincipalName } : {}),
});

/** Finds Entra groups (security and Microsoft 365) whose name contains / starts with the text. */
export async function searchGroups(query: string): Promise<GroupHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (!(await isHosted())) return demoGroups().filter((g) => g.name.toLowerCase().includes(q.toLowerCase()));

  const select = '$select=id,displayName,mail,description&$top=25';
  const attempts: (() => Promise<GraphDirectoryObject[]>)[] = [
    // "Contains" search on the display name (needs the eventual-consistency header).
    async () => (await graphGet(`${GRAPH}/groups?$search=${encodeURIComponent(`"displayName:${q.replace(/"/g, '')}"`)}&${select}`, 'ConsistencyLevel: eventual')).value ?? [],
    async () => (await graphGet(`${GRAPH}/groups?$filter=${encodeURIComponent(`startswith(displayName,'${odataString(q)}')`)}&${select}`)).value ?? [],
    async () => {
      const r = await withTimeout(Office365GroupsService.ListGroups(false, false, `startswith(displayName,'${odataString(q)}')`, 25), TIMEOUT_MS);
      if (!r.success) throw r.error ?? new Error('ListGroups failed');
      return r.data?.value ?? [];
    },
  ];
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const hits = (await attempt()).map(toHit).filter((h): h is GroupHit => h !== null);
      return hits.sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Group search failed');
}

/** Walks /members recursively — used when /transitiveMembers is not allowed. */
async function walkMembers(groupId: string): Promise<GroupDirectoryResult> {
  const users = new Map<string, GraphDirectoryObject>();
  const seen = new Set<string>([groupId]);
  const queue = [groupId];
  while (queue.length && seen.size <= MAX_NESTED_GROUPS) {
    const id = queue.shift()!;
    const members = await graphGetAll(`${GRAPH}/groups/${id}/members?$select=id,displayName,mail,userPrincipalName&$top=999`);
    for (const m of members) {
      if (isUser(m) && m.id) users.set(m.id, m);
      else if (isGroup(m) && m.id && !seen.has(m.id)) {
        seen.add(m.id);
        queue.push(m.id);
      }
    }
  }
  return { users: [...users.values()] };
}

interface GroupDirectoryResult {
  users: GraphDirectoryObject[];
  directOnly?: boolean;
}

/** Imports every user in the group, including members of nested groups. */
export async function fetchGroupMembers(group: { id: string; name: string }): Promise<GroupSnapshot> {
  let result: GroupDirectoryResult;
  if (!(await isHosted())) {
    result = { users: demoMembers(group.id) };
  } else {
    try {
      const all = await graphGetAll(`${GRAPH}/groups/${group.id}/transitiveMembers?$select=id,displayName,mail,userPrincipalName&$top=999`);
      result = { users: all.filter(isUser) };
    } catch {
      try {
        result = await walkMembers(group.id);
      } catch {
        // Last resort: the connector's own action, which only returns direct members.
        const r = await withTimeout(Office365GroupsService.ListGroupMembers(group.id, 999), TIMEOUT_MS);
        if (!r.success) throw r.error ?? new Error('Could not read the group members');
        result = { users: r.data?.value ?? [], directOnly: true };
      }
    }
  }
  const members = result.users.map(toMember).filter((m) => m.name);
  members.sort((a, b) => a.name.localeCompare(b.name));
  return {
    id: group.id,
    name: group.name,
    members,
    importedAt: new Date().toISOString(),
    ...(result.directOnly ? { directOnly: true } : {}),
  };
}

// ---- Demo groups (local dev outside the Power Apps host) ----

const DEMO_GROUPS: (GroupHit & { owners: string[] })[] = [
  { id: 'demo-grp-makers', name: 'Contoso Makers', mail: 'makers@contoso.com', description: 'Makers of Contoso apps and flows', owners: OWNERS.slice(0, 4) },
  { id: 'demo-grp-automation', name: 'Contoso Automation Team', mail: 'automation@contoso.com', description: 'Nested: includes Contoso Makers', owners: OWNERS.slice(4, 7) },
  { id: 'demo-grp-coe', name: 'Power Platform CoE', mail: 'pp-coe@contoso.com', description: 'Center of Excellence', owners: OWNERS.slice(7) },
];

function demoGroups(): GroupHit[] {
  return DEMO_GROUPS.map(({ id, name, mail, description }) => ({ id, name, mail, description }));
}

function demoMembers(groupId: string): GraphDirectoryObject[] {
  const g = DEMO_GROUPS.find((x) => x.id === groupId);
  // The automation team "contains" the makers group, to show nested members being imported.
  const names = groupId === 'demo-grp-automation' ? [...(g?.owners ?? []), ...DEMO_GROUPS[0].owners] : (g?.owners ?? []);
  return names.map((name) => ({ '@odata.type': '#microsoft.graph.user', id: name, displayName: name, mail: demoEmail(name), userPrincipalName: demoEmail(name) }));
}

const GROUP_NAME_CACHE_KEY = 'ppm.entraGroupNames.v1';

/**
 * Display name of an Entra group by object ID (cached in localStorage; failures are not cached).
 * Tries Graph /groups/{id}, the connector's ListGroups filtered on the id, then /directoryObjects/{id}.
 */
export async function fetchGroupDisplayName(id: string): Promise<{ name: string | null; error?: string }> {
  const key = id.toLowerCase();
  const cached = (readJson<Record<string, string>>(GROUP_NAME_CACHE_KEY) ?? {})[key];
  if (cached) return { name: cached };
  if (!(await isHosted())) return { name: null };
  const enc = encodeURIComponent(id);
  const attempts: [string, () => Promise<GraphDirectoryObject | undefined>][] = [
    ['Graph /groups', async () => (await graphGet(`${GRAPH}/groups/${enc}?$select=id,displayName`)) as GraphDirectoryObject],
    [
      'ListGroups',
      async () => {
        const r = await withTimeout(Office365GroupsService.ListGroups(false, false, `id eq '${odataString(id)}'`, 1), TIMEOUT_MS);
        if (!r.success) throw r.error ?? new Error('ListGroups failed');
        return (unwrapData(r.data) as GraphPage)?.value?.[0];
      },
    ],
    ['Graph /directoryObjects', async () => (await graphGet(`${GRAPH}/directoryObjects/${enc}`)) as GraphDirectoryObject],
  ];
  const errors: string[] = [];
  for (const [label, attempt] of attempts) {
    try {
      const name = (await attempt())?.displayName;
      if (name) {
        writeJson(GROUP_NAME_CACHE_KEY, { ...(readJson<Record<string, string>>(GROUP_NAME_CACHE_KEY) ?? {}), [key]: name });
        return { name };
      }
      errors.push(`${label}: no displayName in the response`);
    } catch (err) {
      errors.push(`${label}: ${errorText(err)}`);
    }
  }
  const error = errors.join(' | ');
  console.warn(`Could not resolve Entra group ${id}: ${error}`);
  return { name: null, error };
}
