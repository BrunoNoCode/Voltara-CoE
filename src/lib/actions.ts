// Action Center: rules that select resources (trigger) and the action to apply to them.
// E-mail rules can be sent (see sendJobs.ts) and delete rules run (see deleteJobs.ts); other actions are evaluation only. Rules and e-mail templates live in this browser
// (localStorage), like tags; nothing goes to Dataverse.
import { useSyncExternalStore } from 'react';
import { readJson, writeJson } from '../data/liveEnvironments';
import { LIVE_GROUPS, groupOfType, type FetchPlan } from '../data/liveResources';
import type { Environment, Resource, ResourceStatus, ResourceType } from '../data/types';
import { isSystemOwned } from './hideSystem';
import { longDate, renderEmailHtml, type EmailDesign, type EmailRow, type EmailRowGroup } from './emailHtml';

export { designColorsValid, EMAIL_SECTIONS, emailBodyHtml, isHexColor, longDate, sectionColor, sectionLayout } from './emailHtml';
export type { EmailCard, EmailDesign, EmailRow, EmailSectionKey } from './emailHtml';

/* ---------- Conditions ---------- */

export type ActionField = 'Name' | 'Owner' | 'Status' | 'Solution' | 'Tag' | 'License' | 'Connector' | 'Runs (30d)' | 'Failed runs (30d)' | 'Last modified';
export type ActionOperator = 'is' | 'is not' | 'contains' | 'not contains' | 'any of' | 'none of' | '>' | '<' | '=' | 'older than' | 'newer than';
type FieldKind = 'text' | 'choice' | 'number' | 'age';

export const FIELD_DEFS: Record<ActionField, { kind: FieldKind; operators: ActionOperator[]; hint?: string }> = {
  Name: { kind: 'text', operators: ['contains', 'not contains', 'is', 'is not'] },
  Owner: { kind: 'text', operators: ['is', 'is not', 'contains', 'not contains'], hint: 'Matches the owner name, e-mail or UPN.' },
  Status: { kind: 'choice', operators: ['any of', 'none of'] },
  Solution: { kind: 'choice', operators: ['any of', 'none of'], hint: 'Resources whose solution membership is unknown never match.' },
  Tag: { kind: 'choice', operators: ['any of', 'none of'] },
  License: { kind: 'choice', operators: ['any of', 'none of'], hint: 'Only flows have a license designation.' },
  Connector: { kind: 'choice', operators: ['any of', 'none of'], hint: 'Only flows report their connectors.' },
  'Runs (30d)': { kind: 'number', operators: ['=', '<', '>'], hint: 'Only cloud, scheduled and agent flows have run counts.' },
  'Failed runs (30d)': { kind: 'number', operators: ['>', '=', '<'], hint: 'Only cloud, scheduled and agent flows have run counts.' },
  'Last modified': { kind: 'age', operators: ['older than', 'newer than'] },
};
export const ACTION_FIELDS = Object.keys(FIELD_DEFS) as ActionField[];
export const fieldKind = (f: ActionField) => FIELD_DEFS[f].kind;

export const NOT_IN_SOLUTION = '(Not in a solution)';

export interface ActionCondition {
  id: string;
  field: ActionField;
  operator: ActionOperator;
  /** Text / choice fields: values (any of them matches). */
  values: string[];
  /** Number / age fields: the number (days for age). */
  value?: string;
}

export const newId = (prefix = 'c') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const newActionCondition = (field: ActionField = 'Owner'): ActionCondition => ({
  id: newId(),
  field,
  operator: FIELD_DEFS[field].operators[0]!,
  values: [],
  value: fieldKind(field) === 'number' ? '0' : fieldKind(field) === 'age' ? '90' : undefined,
});

export const isConditionComplete = (c: ActionCondition) => {
  const k = fieldKind(c.field);
  return k === 'text' || k === 'choice' ? c.values.length > 0 : c.value !== undefined && c.value.trim() !== '' && !Number.isNaN(Number(c.value));
};

const norm = (s: string) => s.trim().toLowerCase();

/** Values a choice field has for a resource; undefined = unknown (the condition then fails). */
function choiceValues(field: ActionField, r: Resource): string[] | undefined {
  switch (field) {
    case 'Status':
      return [r.status];
    case 'Solution':
      return r.solutions === undefined ? undefined : r.solutions.length ? r.solutions : [NOT_IN_SOLUTION];
    case 'Tag':
      return r.tags;
    case 'License':
      return r.license ? [r.license] : undefined;
    case 'Connector':
      return r.connectors;
    default:
      return undefined;
  }
}

export function conditionMatches(c: ActionCondition, r: Resource): boolean {
  const kind = fieldKind(c.field);
  if (kind === 'text') {
    const fields = (c.field === 'Name' ? [r.name] : [r.owner, r.ownerEmail, r.ownerUpn]).filter((x): x is string => !!x).map(norm);
    const values = c.values.map(norm);
    const contains = values.some((v) => fields.some((f) => f.includes(v)));
    const equals = values.some((v) => fields.includes(v));
    if (c.operator === 'contains') return contains;
    if (c.operator === 'not contains') return !contains;
    if (c.operator === 'is') return equals;
    return !equals;
  }
  if (kind === 'choice') {
    const have = choiceValues(c.field, r);
    if (!have) return false;
    const hit = c.values.some((v) => have.includes(v));
    return c.operator === 'any of' ? hit : !hit;
  }
  const n = Number(c.value);
  if (kind === 'number') {
    const v = c.field === 'Runs (30d)' ? r.runs30d : r.failedRuns30d;
    if (v === undefined) return false;
    return c.operator === '>' ? v > n : c.operator === '<' ? v < n : v === n;
  }
  if (!r.modified) return false;
  const days = (Date.now() - new Date(r.modified).getTime()) / 86_400_000;
  return c.operator === 'older than' ? days > n : days < n;
}

export function describeActionCondition(c: ActionCondition) {
  const kind = fieldKind(c.field);
  if (kind === 'number') return `${c.field} ${c.operator} ${c.value}`;
  if (kind === 'age') return `${c.field} ${c.operator} ${c.value} days`;
  return `${c.field} ${c.operator} ${c.values.join(', ')}`;
}

/* ---------- Actions ---------- */

export type ActionKind = 'email' | 'delete' | 'share' | 'disable' | 'reassign';
export type ShareRole = 'User' | 'Co-owner';

export interface EmailAction {
  templateId?: string;
  subject: string;
  body: string;
  /** owners = one e-mail per resource owner; custom = one e-mail to the listed people. */
  recipients: 'owners' | 'custom';
  to: string[];
  cc: string[];
  /** Branded layout; without it the body is sent as plain formatted text. */
  design?: EmailDesign;
}

export interface RuleAction {
  kind: ActionKind;
  email?: EmailAction;
  share?: { users: string[]; role: ShareRole };
  newOwner?: string;
}

const FLOW_TYPES: ResourceType[] = ['Cloud Flow', 'Scheduled Flow', 'Desktop Flow'];

/** Resource types the delete action can remove: apps, flows and (custom) tables. */
export const DELETABLE_TYPES: ResourceType[] = ['Canvas App', 'Code App', 'Model-driven App', ...FLOW_TYPES, 'Agent Flow', 'Dataverse Table'];

export const ACTION_DEFS: Record<ActionKind, { label: string; description: string; supports: ResourceType[] | 'all' }> = {
  email: { label: 'Send e-mail', description: 'Notify the resource owners or specific people, using a reusable template.', supports: 'all' },
  delete: {
    label: 'Delete resources',
    description: 'Permanently remove matching apps, flows and custom tables from their environments.',
    supports: DELETABLE_TYPES,
  },
  share: {
    label: 'Share with users',
    description: 'Give other users access to apps, flows and agents.',
    supports: ['Canvas App', 'Code App', ...FLOW_TYPES, 'Copilot Studio', 'Agent Flow'],
  },
  disable: {
    label: 'Turn off',
    description: 'Turn off flows, classic processes and AI models without deleting them.',
    supports: [...FLOW_TYPES, 'Agent Flow', 'Classic Workflow', 'Business Rule', 'Business Process Flow', 'AI Model'],
  },
  reassign: {
    label: 'Change owner',
    description: 'Assign the matching resources to a new owner.',
    supports: ['Canvas App', 'Code App', ...FLOW_TYPES, 'Copilot Studio', 'Agent Flow', 'AI Model', 'Classic Workflow', 'Business Rule', 'Custom Action', 'Business Process Flow', 'Other'],
  },
};
export const ACTION_KINDS = Object.keys(ACTION_DEFS) as ActionKind[];
export const supportsAction = (kind: ActionKind, t: ResourceType) => {
  const s = ACTION_DEFS[kind].supports;
  return s === 'all' || s.includes(t);
};

/* ---------- Rules ---------- */

export interface RuleEvaluation {
  at: string;
  matched: number;
  applicable: number;
  by?: string;
}

export interface ActionRule {
  id: string;
  name: string;
  description: string;
  /** Empty = all monitored environments. */
  envIds: string[];
  /** Empty = all resource types. */
  types: ResourceType[];
  conditions: ActionCondition[];
  match: 'all' | 'any';
  excludeSystem: boolean;
  action: RuleAction;
  createdAt: string;
  updatedAt: string;
  /** Most recent evaluations (newest last, max 10). */
  evaluations: RuleEvaluation[];
}

export function ruleMatcher(rule: Pick<ActionRule, 'envIds' | 'types' | 'conditions' | 'match' | 'excludeSystem'>) {
  const envs = new Set(rule.envIds);
  const types = new Set(rule.types);
  const conds = rule.conditions.filter(isConditionComplete);
  return (r: Resource) => {
    if (envs.size && !envs.has(r.envId)) return false;
    if (types.size && !types.has(r.type)) return false;
    if (rule.excludeSystem && isSystemOwned(r)) return false;
    if (!conds.length) return true;
    return rule.match === 'all' ? conds.every((c) => conditionMatches(c, r)) : conds.some((c) => conditionMatches(c, r));
  };
}

const RUN_TYPES: ResourceType[] = ['Cloud Flow', 'Scheduled Flow', 'Agent Flow'];

/**
 * The data an evaluation of the rule needs: only the query groups of its resource types, solution
 * membership only for a Solution condition, run counts only for a run condition or an e-mail that
 * lists flows (its "Last execution" column). Table metadata only for a delete rule that can match tables
 * (only custom tables can be deleted).
 */
export function ruleFetchPlan(rule: Pick<ActionRule, 'types' | 'conditions' | 'action'>): FetchPlan {
  const conds = rule.conditions.filter(isConditionComplete);
  const uses = (f: ActionField) => conds.some((c) => c.field === f);
  const groups = rule.types.length ? LIVE_GROUPS.filter((g) => rule.types.some((t) => groupOfType(t) === g)) : LIVE_GROUPS;
  const listsFlows = rule.action.kind === 'email' && (!rule.types.length || rule.types.some((t) => RUN_TYPES.includes(t)));
  return {
    groups,
    solutions: uses('Solution'),
    runs: uses('Runs (30d)') || uses('Failed runs (30d)') || listsFlows,
    customFlags: rule.action.kind === 'delete' && (!rule.types.length || rule.types.includes('Dataverse Table')),
  };
}

export function describeScope(rule: Pick<ActionRule, 'envIds' | 'types'>, environments: Environment[]) {
  const envName = (id: string) => environments.find((e) => e.id === id)?.name ?? id;
  const envs = !rule.envIds.length ? 'All monitored environments' : rule.envIds.length <= 2 ? rule.envIds.map(envName).join(', ') : `${rule.envIds.length} environments`;
  const types = !rule.types.length ? 'all types' : rule.types.length <= 2 ? rule.types.join(', ') : `${rule.types.length} types`;
  return `${envs} · ${types}`;
}

export function describeConditions(rule: Pick<ActionRule, 'conditions' | 'match'>) {
  const conds = rule.conditions.filter(isConditionComplete);
  if (!conds.length) return 'No extra conditions';
  return conds.map(describeActionCondition).join(rule.match === 'all' ? ' AND ' : ' OR ');
}

export function describeAction(a: RuleAction) {
  switch (a.kind) {
    case 'email':
      return a.email?.recipients === 'custom' ? `E-mail to ${a.email.to.join(', ') || '—'}` : 'E-mail resource owners';
    case 'share':
      return `Share with ${a.share?.users.length ?? 0} user(s) as ${a.share?.role ?? 'User'}`;
    case 'reassign':
      return `Change owner to ${a.newOwner || '—'}`;
    default:
      return ACTION_DEFS[a.kind].label;
  }
}

/* ---------- Evaluation ---------- */

export interface PlannedItem {
  resource: Resource;
  supported: boolean;
  /** What would happen to the resource. */
  result: string;
  /** True when the action would not change anything (already off, already the owner, no e-mail address). */
  noChange?: boolean;
}

export interface PlannedEmail {
  recipientName: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  resources: Resource[];
  /** Design with its texts already filled in. */
  design?: EmailDesign;
  rows?: EmailRow[];
}

export interface RulePlan {
  items: PlannedItem[];
  matched: number;
  applicable: number;
  unsupported: number;
  emails: PlannedEmail[];
  /** Owners without an e-mail address (owner e-mails only). */
  ownersWithoutEmail: string[];
}

const OFF_STATES: ResourceStatus[] = ['Off', 'Inactive', 'Draft', 'Suspended'];
const ownerAddress = (r: Resource) => r.ownerEmail || (r.ownerUpn?.includes('@') ? r.ownerUpn : undefined);

export const PLACEHOLDERS = [
  { key: 'recipientName', label: 'Recipient name' },
  { key: 'resourceCount', label: 'Resource count' },
  { key: 'resourceList', label: 'Resource list' },
  { key: 'resourceTable', label: 'Resource table' },
  { key: 'ruleName', label: 'Rule name' },
  { key: 'environmentList', label: 'Environments' },
  { key: 'deletionDate', label: 'Deletion date' },
  { key: 'today', label: 'Today' },
] as const;

export function renderTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => vars[k] ?? m);
}

/** Direct link to a resource in its maker portal / player. `orgUrl` is the environment's Dataverse URL. */
export function resourceUrl(r: Resource, orgUrl?: string): string {
  const env = encodeURIComponent(r.envId);
  const id = encodeURIComponent(r.id);
  const org = orgUrl?.replace(/\/+$/, '');
  const maker = `https://make.powerapps.com/environments/${env}`;
  switch (r.type) {
    case 'Cloud Flow':
    case 'Scheduled Flow':
      return `https://make.powerautomate.com/environments/${env}/flows/${id}/details`;
    case 'Agent Flow':
      return `https://copilotstudio.preview.microsoft.com/environments/${env}/flows/${id}`;
    case 'Desktop Flow':
      return `https://make.powerautomate.com/environments/${env}/uiflows/${id}/details`;
    case 'Canvas App':
      return r.appId ? `https://apps.powerapps.com/play/e/${env}/a/${encodeURIComponent(r.appId)}` : `${maker}/apps`;
    case 'Code App':
      return r.appId ? `https://apps.powerapps.com/play/e/${env}/app/${encodeURIComponent(r.appId)}` : `${maker}/apps`;
    case 'Model-driven App':
      return org ? `${org}/main.aspx?appid=${id}` : `${maker}/apps`;
    case 'Copilot Studio':
      return `https://copilotstudio.preview.microsoft.com/environments/${env}/${r.poweredBy === 'MSFT Copilot' ? 'agents' : 'bots'}/${id}/overview`;
    case 'AI Model':
      return `${maker}/aibuilder/models/${id}`;
    case 'Dataverse Table':
      return `${maker}/entities/${id}`;
    case 'Classic Workflow':
    case 'Business Rule':
    case 'Custom Action':
    case 'Business Process Flow':
      return org ? `${org}/main.aspx?pagetype=entityrecord&etn=workflow&id=${id}` : `${maker}/home`;
    default:
      return `${maker}/home`;
  }
}

const shortDate = (iso?: string) => {
  const d = iso ? new Date(iso) : undefined;
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
};

/** "Last execution" column: only flows with run history have one. */
function lastExecution(r: Resource) {
  if (r.type !== 'Cloud Flow' && r.type !== 'Scheduled Flow' && r.type !== 'Agent Flow') return 'N/A';
  if (r.lastRun) return shortDate(r.lastRun) || 'Unknown';
  if (r.runs30d === undefined) return 'Unknown';
  return r.runs30d === 0 ? 'No runs in 30 days' : `${r.runs30d} run(s) in 30 days`;
}

const ROW_GROUPS: Partial<Record<ResourceType, EmailRowGroup>> = {
  'Canvas App': 'App',
  'Model-driven App': 'App',
  'Code App': 'App',
  'Cloud Flow': 'Flow',
  'Scheduled Flow': 'Flow',
  'Desktop Flow': 'Flow',
  'Agent Flow': 'Flow',
  'Classic Workflow': 'Flow',
  'Business Process Flow': 'Flow',
  'Dataverse Table': 'Table',
  'Copilot Studio': 'Agent',
};

/** Rows of the branded resource table. */
export function emailRows(resources: Resource[], envOf: (id: string) => Environment | undefined): EmailRow[] {
  return resources.map((r) => {
    const group = ROW_GROUPS[r.type] ?? 'Other';
    return {
      env: envOf(r.envId)?.name ?? r.envId,
      name: r.name,
      type: group === 'Other' ? r.type : group,
      group,
      owner: r.owner || '—',
      lastActivity: shortDate(r.lastRun ?? r.modified) || '—',
      url: resourceUrl(r, envOf(r.envId)?.url),
    };
  });
}

/** Fills the placeholders in every text of a design. */
export function renderDesign(d: EmailDesign, vars: Record<string, string>): EmailDesign {
  const out = { ...d } as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(d)) {
    if (k === 'logo' || k.endsWith('Color') || k === 'deletionDate') continue;
    if (typeof v === 'string') out[k] = renderTemplate(v, vars);
  }
  const card = (c: { icon?: string; title: string; text: string }) => ({ ...c, title: renderTemplate(c.title, vars), text: renderTemplate(c.text, vars) });
  out.criteria = d.criteria.map(card);
  out.steps = d.steps.map(card);
  return out as unknown as EmailDesign;
}

function emailVars(recipientName: string, resources: Resource[], ruleName: string, envOf: (id: string) => Environment | undefined, deletionDate = ''): Record<string, string> {
  const envName = (id: string) => envOf(id)?.name ?? id;
  const envs = [...new Set(resources.map((r) => envName(r.envId)))].sort((a, b) => a.localeCompare(b));
  // Markdown-style links: the e-mail renders each resource name as a link to the resource.
  const label = (r: Resource) => r.name.replace(/[[\]]/g, '');
  // Pipe table cells can't contain "|".
  const cell = (s: string) => s.replace(/\|/g, '/').trim();
  const table = [
    '| Resource | Type | Environment | Last modified | Last execution | Status |',
    '|---|---|---|---|---|---|',
    ...resources.map(
      (r) =>
        `| [${cell(label(r))}](${resourceUrl(r, envOf(r.envId)?.url)}) | ${r.type} | ${cell(envName(r.envId))} | ${shortDate(r.modified) || '—'} | ${lastExecution(r)} | Review required |`,
    ),
  ];
  return {
    recipientName,
    resourceCount: String(resources.length),
    resourceList: resources.map((r) => `- [${label(r)}](${resourceUrl(r, envOf(r.envId)?.url)}) (${r.type}) · ${envName(r.envId)}`).join('\n'),
    resourceTable: table.join('\n'),
    ruleName,
    environmentList: envs.join(', '),
    deletionDate: longDate(deletionDate),
    today: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

/** Sample values for template previews. */
export const SAMPLE_VARS: Record<string, string> = {
  recipientName: 'Jane Doe',
  resourceCount: '2',
  resourceList:
    '- [Invoice Approval](https://make.powerautomate.com/environments/00000000-0000-0000-0000-000000000000/flows/00000000-0000-0000-0000-000000000001/details) (Cloud Flow) · Contoso Production\n' +
    '- [Field Survey](https://apps.powerapps.com/play/e/00000000-0000-0000-0000-000000000000/a/00000000-0000-0000-0000-000000000002) (Canvas App) · Contoso Sandbox',
  resourceTable:
    '| Resource | Type | Environment | Last modified | Last execution | Status |\n|---|---|---|---|---|---|\n' +
    '| [Invoice Approval](https://make.powerautomate.com/environments/00000000-0000-0000-0000-000000000000/flows/00000000-0000-0000-0000-000000000001/details) | Cloud Flow | Contoso Production | Mar 4, 2026 | Apr 12, 2026 | Review required |\n' +
    '| [Field Survey](https://apps.powerapps.com/play/e/00000000-0000-0000-0000-000000000000/a/00000000-0000-0000-0000-000000000002) | Canvas App | Contoso Sandbox | Jan 18, 2026 | N/A | Review required |',
  ruleName: 'Inactive flows cleanup',
  environmentList: 'Contoso Production, Contoso Sandbox',
  deletionDate: longDate('2026-11-30'),
  today: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
};

/** Sample rows for branded template previews. */
export const SAMPLE_ROWS: EmailRow[] = [
  { env: 'Contoso Sandbox', name: 'Field Survey', type: 'App', group: 'App', owner: 'Jane Doe', lastActivity: 'Jan 18, 2026', url: 'https://make.powerapps.com/' },
  { env: 'Contoso Production', name: 'Invoice Approval', type: 'Flow', group: 'Flow', owner: 'Jane Doe', lastActivity: 'Apr 12, 2026', url: 'https://make.powerautomate.com/' },
  { env: 'Contoso Production', name: 'Project Tracker', type: 'Table', group: 'Table', owner: 'Jane Doe', lastActivity: 'Feb 2, 2026', url: 'https://make.powerapps.com/' },
  { env: 'Contoso Sandbox', name: 'HR Helpdesk Bot', type: 'Agent', group: 'Agent', owner: 'Jane Doe', lastActivity: 'Mar 9, 2026', url: 'https://copilotstudio.preview.microsoft.com/' },
];

/** Values for the preview of a design: the sample vars with its own deletion date. */
export const sampleVarsFor = (d?: EmailDesign) => (d ? { ...SAMPLE_VARS, deletionDate: longDate(d.deletionDate) || SAMPLE_VARS.deletionDate } : SAMPLE_VARS);

export function planRule(rule: ActionRule, resources: Resource[], environments: Environment[]): RulePlan {
  const matches = resources.filter(ruleMatcher(rule));
  const a = rule.action;
  const items: PlannedItem[] = matches.map((r) => {
    if (!supportsAction(a.kind, r.type)) return { resource: r, supported: false, result: `Not supported for ${r.type}` };
    switch (a.kind) {
      case 'email': {
        if (a.email?.recipients === 'custom') return { resource: r, supported: true, result: `Listed in e-mail to ${a.email.to.join(', ')}` };
        const addr = ownerAddress(r);
        return addr
          ? { resource: r, supported: true, result: `E-mail to owner ${r.owner} <${addr}>` }
          : { resource: r, supported: true, noChange: true, result: `Owner ${r.owner || '(unknown)'} has no e-mail address — skipped` };
      }
      case 'delete':
        if (r.type === 'Dataverse Table' && r.customTable !== true)
          return {
            resource: r,
            supported: false,
            result: r.customTable === false ? 'Standard table — only custom tables can be deleted' : 'Unknown if custom table — sync the environment again',
          };
        return { resource: r, supported: true, result: r.type === 'Dataverse Table' ? 'Delete table and all its data' : `Delete ${r.type.toLowerCase()}` };
      case 'share':
        return { resource: r, supported: true, result: `Share with ${a.share?.users.join(', ')} as ${a.share?.role}` };
      case 'disable':
        return OFF_STATES.includes(r.status)
          ? { resource: r, supported: true, noChange: true, result: `Already ${r.status.toLowerCase()} — no change` }
          : { resource: r, supported: true, result: `Turn off (currently ${r.status})` };
      case 'reassign': {
        const to = a.newOwner ?? '';
        const same = [r.owner, r.ownerEmail, r.ownerUpn].some((x) => x && norm(x) === norm(to));
        return same
          ? { resource: r, supported: true, noChange: true, result: `Already owned by ${to} — no change` }
          : { resource: r, supported: true, result: `Owner ${r.owner || '(unknown)'} → ${to}` };
      }
    }
  });

  const emails: PlannedEmail[] = [];
  const ownersWithoutEmail = new Set<string>();
  if (a.kind === 'email' && a.email) {
    const e = a.email;
    const applicable = items.filter((i) => i.supported).map((i) => i.resource);
    const build = (recipientName: string, to: string[], list: Resource[]) => {
      const envOf = (id: string) => environments.find((env) => env.id === id);
      const vars = emailVars(recipientName, list, rule.name, envOf, e.design?.deletionDate);
      emails.push({
        recipientName,
        to,
        cc: e.cc,
        subject: renderTemplate(e.subject, vars),
        body: renderTemplate(e.body, vars),
        resources: list,
        ...(e.design ? { design: renderDesign(e.design, vars), rows: emailRows(list, envOf) } : {}),
      });
    };
    if (e.recipients === 'custom') {
      if (applicable.length && e.to.length) build(e.to.join(', '), e.to, applicable);
    } else {
      const byOwner = new Map<string, { name: string; list: Resource[] }>();
      for (const r of applicable) {
        const addr = ownerAddress(r);
        if (!addr) {
          ownersWithoutEmail.add(r.owner || '(unknown)');
          continue;
        }
        const k = norm(addr);
        const entry = byOwner.get(k) ?? { name: r.owner || addr, list: [] };
        entry.list.push(r);
        byOwner.set(k, entry);
      }
      for (const [addr, { name, list }] of [...byOwner].sort((x, y) => x[1].name.localeCompare(y[1].name))) build(name, [addr], list);
    }
  }

  const supported = items.filter((i) => i.supported);
  return {
    items,
    matched: items.length,
    applicable: supported.filter((i) => !i.noChange).length,
    unsupported: items.length - supported.length,
    emails,
    ownersWithoutEmail: [...ownersWithoutEmail].sort((x, y) => x.localeCompare(y)),
  };
}

/* ---------- E-mail templates ---------- */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  /** Branded layout (banner, info boxes, resource table, footer); without it the body is sent as plain formatted text. */
  design?: EmailDesign;
  updatedAt: string;
}

export const DEFAULT_CLEANUP_DESIGN: EmailDesign = {
  headerColor: '#000028',
  footerColor: '#000028',
  accentColor: '#009999',
  logo: '',
  headerTitle: 'Power Platform CoE',
  headerSubtitle: 'Cleaner data. A stronger tomorrow.',
  whyTitle: 'Why is this cleanup taking place?',
  whyText: 'We regularly review Power Platform resources to remove what is no longer used. A resource is selected when it meets one or more of these criteria:',
  criteria: [
    { icon: '⏱', title: 'No activity', text: 'Not used or modified for a long period of time.' },
    { icon: '👥', title: 'No active users', text: 'Nobody has opened or run it recently.' },
    { icon: '🧩', title: 'Not part of a solution', text: 'Not managed through a solution or ALM process.' },
    { icon: '💶', title: 'Optimize costs', text: 'Frees up capacity and reduces licensing costs.' },
  ],
  tableTitle: 'Resources identified for deletion',
  tableSubtitle: 'Resources you own in {{environmentList}} that match the rule "{{ruleName}}".',
  deleteTitle: 'These resources will be permanently deleted',
  deleteText: 'After the deletion date the resources and their data cannot be recovered.',
  deletionDateLabel: 'Deletion date',
  deletionDate: '2026-11-30',
  stepsTitle: 'What you need to do',
  stepsSubtitle: 'Please take action before the deletion date.',
  steps: [
    { title: 'Review', text: 'Check the resources listed above and decide whether you still need them.' },
    { title: 'Take action', text: 'If you need a resource, reply to this e-mail so we can keep it. Otherwise no action is needed.' },
    { title: 'Need help?', text: 'Contact the Power Platform CoE team if you have any questions.' },
  ],
  closing: 'Thank you for helping us keep the Power Platform clean, secure and cost-efficient.',
  signature: 'Kind regards,\nPower Platform CoE team',
  footerBrand: 'CONTOSO',
  footerText: 'Power Platform CoE',
  tableHeaderColor: '#f4f5f7',
  tableHeaderTextColor: '#4a4a5a',
  whyColor: '#e6f5f5',
  deleteColor: '#fdecef',
  stepNumberColor: '#009999',
  stepNumberTextColor: '#ffffff',
};

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-owner-review',
    name: 'Owner review request',
    subject: 'Action required: please review {{resourceCount}} Power Platform resource(s)',
    body:
      'Hello {{recipientName}},\n\nThe Power Platform CoE monitor found {{resourceCount}} resource(s) you own that match the rule "{{ruleName}}":\n\n{{resourceList}}\n\nPlease review them and let us know whether they are still needed.\n\nKind regards,\nPower Platform CoE\n{{today}}',
    updatedAt: '2026-10-16T00:00:00.000Z',
  },
  {
    id: 'tpl-cleanup-notice',
    name: 'Upcoming cleanup notice',
    subject: 'Notice: {{resourceCount}} resource(s) scheduled for cleanup in {{environmentList}}',
    body:
      'Hello {{recipientName}},\n\nAs part of our ongoing effort to keep the Power Platform clean, secure and cost-efficient, we have identified {{resourceCount}} resource(s) you own that meet our cleanup criteria.',
    design: DEFAULT_CLEANUP_DESIGN,
    updatedAt: '2026-10-26T00:00:00.000Z',
  },
];

// Earlier defaults of the cleanup notice; stored copies that were never edited are upgraded to the branded version.
const OLD_CLEANUP_BODIES = [
  'Hello {{recipientName}},\n\nThe following resource(s) are scheduled for cleanup under the governance rule "{{ruleName}}":\n\n{{resourceList}}\n\nIf you still need any of them, reply to this e-mail within 14 days.\n\nThank you,\nPower Platform CoE',
  'Hello {{recipientName}},\n\nThe following resource(s) are scheduled for cleanup under the governance rule "{{ruleName}}":\n\n{{resourceTable}}\n\nIf you still need any of them, reply to this e-mail within 14 days.\n\nThank you,\nPower Platform CoE',
];

/* ---------- Browser storage ---------- */

export function persisted<T>(key: string, fallback: () => T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();
  const read = (): T => (cache ??= readJson<T>(key) ?? fallback());
  const write = (value: T) => {
    cache = value;
    writeJson(key, value);
    listeners.forEach((l) => l());
  };
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  };
  // Pick up changes made in another tab of the app.
  window.addEventListener('storage', (e) => {
    if (e.key !== key) return;
    cache = undefined;
    listeners.forEach((l) => l());
  });
  return { read, write, use: () => useSyncExternalStore(subscribe, read) };
}

const rulesStore = persisted<ActionRule[]>('ppm.actionRules.v1', () => []);
const templatesStore = persisted<EmailTemplate[]>('ppm.emailTemplates.v1', () => DEFAULT_TEMPLATES);
{
  const cleanup = DEFAULT_TEMPLATES.find((t) => t.id === 'tpl-cleanup-notice')!;
  const stored = templatesStore.read();
  const isOld = (t: EmailTemplate) => t.id === cleanup.id && !t.design && OLD_CLEANUP_BODIES.includes(t.body);
  if (stored.some(isOld)) templatesStore.write(stored.map((t) => (isOld(t) ? { ...t, subject: cleanup.subject, body: cleanup.body, design: cleanup.design, updatedAt: cleanup.updatedAt } : t)));
}

/* ---------- Uploaded logos ---------- */

// Uploaded logos are kept apart from the templates (data URLs are large) and referenced as `stored:<id>`.
const logosStore = persisted<Record<string, string>>('ppm.emailLogos.v1', () => ({}));
export const useEmailLogos = logosStore.use;
export const readEmailLogos = logosStore.read;

/** Stores an uploaded logo (data URL) and returns the reference to put in `EmailDesign.logo`. */
export function saveLogo(dataUrl: string) {
  const existing = Object.entries(logosStore.read()).find(([, v]) => v === dataUrl);
  if (existing) return `stored:${existing[0]}`;
  const id = newId('logo');
  logosStore.write({ ...logosStore.read(), [id]: dataUrl });
  return `stored:${id}`;
}

export const importEmailLogos = (logos: Record<string, string> | undefined) => {
  if (logos && Object.keys(logos).length) logosStore.write({ ...logosStore.read(), ...logos });
};

/** The image source for a logo reference ('' when none or the uploaded image is missing). */
export function resolveLogo(logo: string) {
  if (!logo) return '';
  if (logo.startsWith('stored:')) return logosStore.read()[logo.slice(7)] ?? '';
  return /^https?:\/\//i.test(logo) ? logo : '';
}

/** Final e-mail HTML: the branded layout when a design is set, otherwise the formatted body. */
export const emailHtml = (e: { body: string; design?: EmailDesign; rows?: EmailRow[] }) =>
  renderEmailHtml({ ...e, logoSrc: resolveLogo(e.design?.logo ?? '') });

export const useActionRules = rulesStore.use;
export const readActionRules = rulesStore.read;
export const useEmailTemplates = templatesStore.use;
export const readEmailTemplates = templatesStore.read;

const upsert = <T extends { id: string }>(list: T[], item: T) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);

export const saveActionRule = (rule: ActionRule) => rulesStore.write(upsert(rulesStore.read(), rule));
/** Evaluates the rule against the loaded resources and returns it with the result appended to its history (max 10). */
export function withEvaluation(rule: ActionRule, resources: Resource[], environments: Environment[], at: string, by?: string): ActionRule {
  const p = planRule(rule, resources, environments);
  return { ...rule, evaluations: [...rule.evaluations, { at, matched: p.matched, applicable: p.applicable, by }].slice(-10) };
}
export const deleteActionRule = (id: string) => rulesStore.write(rulesStore.read().filter((r) => r.id !== id));
export const saveEmailTemplate = (t: EmailTemplate) => templatesStore.write(upsert(templatesStore.read(), t));
export const deleteEmailTemplate = (id: string) => templatesStore.write(templatesStore.read().filter((t) => t.id !== id));

/** Merges imported rules/templates (matched by name, imported wins and keeps the local id). Returns how many were applied. */
export function importActions(rules: ActionRule[] | undefined, templates: EmailTemplate[] | undefined) {
  let n = 0;
  // Imported template id → local id, so imported rules keep pointing at the right template.
  const tplIds = new Map<string, string>();
  if (templates?.length) {
    let list = templatesStore.read();
    for (const t of templates) {
      const local = list.find((x) => norm(x.name) === norm(t.name));
      const id = local?.id ?? t.id;
      tplIds.set(t.id, id);
      list = upsert(list, { ...t, id });
      n++;
    }
    templatesStore.write(list);
  }
  if (rules?.length) {
    let list = rulesStore.read();
    for (const r of rules) {
      const local = list.find((x) => norm(x.name) === norm(r.name));
      const email = r.action.email;
      const action = email?.templateId && tplIds.has(email.templateId) ? { ...r.action, email: { ...email, templateId: tplIds.get(email.templateId) } } : r.action;
      list = upsert(list, { ...r, action, id: local?.id ?? r.id });
      n++;
    }
    rulesStore.write(list);
  }
  return n;
}
