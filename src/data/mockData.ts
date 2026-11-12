import type { Activity, Environment, EnvType, HealthStatus, Resource, ResourceStatus, ResourceType, Tag } from './types';

// Deterministic PRNG so the dummy data is stable between reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20250428);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

export const OWNERS = [
  'Anna Keller', 'Lukas Weber', 'Michael Braun', 'Sofia Almeida', 'Thomas Fischer',
  'Julia Neumann', 'Marco Silva', 'Elena Rossi', 'Alex Silva', 'Bruno Ricardo',
];

/** Demo e-mail for a seed owner, e.g. "Anna Keller" → anna.keller@contoso.com. */
export const demoEmail = (name: string) => `${name.toLowerCase().replace(/\s+/g, '.')}@contoso.com`;

export const FLAGS = ['AI', 'HR Department', 'Managed', 'Premium'] as const;

const guid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(rand() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

type EnvSeed = [name: string, type: EnvType, region: string, flags: string[], owner: string, status: HealthStatus, monitored: boolean];

const ENV_SEEDS: EnvSeed[] = [
  ['Contoso R&D Innovation', 'Sandbox', 'Europe', ['AI', 'Premium'], 'Lukas Weber', 'Healthy', true],
  ['Contoso IT Automation', 'Production', 'Europe', ['Managed', 'Premium'], 'Michael Braun', 'Healthy', true],
  ['Contoso Sales', 'Production', 'Europe', ['Managed'], 'Sofia Almeida', 'Warning', true],
  ['Contoso Finance', 'Production', 'Europe', ['Managed', 'Premium'], 'Thomas Fischer', 'Healthy', true],
  ['Contoso HR', 'Sandbox', 'Europe', ['HR Department'], 'Julia Neumann', 'Healthy', true],
  ['Contoso Customer Solutions', 'Production', 'Europe', ['AI', 'Managed', 'Premium'], 'Elena Rossi', 'Healthy', true],
  ['Contoso Test Lab', 'Sandbox', 'Europe', ['AI'], 'Marco Silva', 'Warning', true],
  ['Contoso Marketing', 'Production', 'Europe', ['Managed'], 'Anna Keller', 'Healthy', true],
  ['Contoso Operations', 'Production', 'Europe', ['Managed'], 'Michael Braun', 'Healthy', true],
  ['Contoso Production', 'Production', 'Europe', ['AI', 'Managed', 'Premium'], 'Anna Keller', 'Healthy', true],
  ['Contoso Supply Chain', 'Production', 'Europe', ['Managed', 'Premium'], 'Thomas Fischer', 'Healthy', true],
  ['Contoso Procurement', 'Production', 'Europe', ['Premium'], 'Julia Neumann', 'Attention', true],
  ['Contoso Quality', 'Production', 'Europe', ['Managed'], 'Elena Rossi', 'Healthy', true],
  ['Contoso Analytics', 'Sandbox', 'Europe', ['AI', 'Premium'], 'Marco Silva', 'Healthy', true],
  ['Contoso Service Desk', 'Production', 'Europe', ['AI', 'Managed'], 'Sofia Almeida', 'Healthy', true],
  ['Contoso Legal', 'Production', 'Europe', ['Managed'], 'Lukas Weber', 'Healthy', true],
  ['Contoso NAM Sales', 'Production', 'North America', ['Managed', 'Premium'], 'Alex Silva', 'Healthy', true],
  ['Contoso NAM Engineering', 'Sandbox', 'North America', ['AI'], 'Alex Silva', 'Warning', true],
  ['Contoso Canada', 'Production', 'Canada', ['Managed'], 'Bruno Ricardo', 'Healthy', true],
  ['Contoso APAC Field Service', 'Production', 'Asia Pacific', ['Premium'], 'Marco Silva', 'Attention', true],
  ['Contoso Copilot Lab', 'Developer', 'Europe', ['AI'], 'Bruno Ricardo', 'Healthy', true],
  ['Contoso Data Validation', 'Sandbox', 'Europe', ['Premium'], 'Bruno Ricardo', 'Healthy', true],
  ['Contoso (default)', 'Default', 'Europe', [], 'Anna Keller', 'Warning', true],
  ['Contoso HR Training', 'Developer', 'Europe', ['HR Department'], 'Julia Neumann', 'Healthy', true],
  ['Contoso Marketing Sandbox', 'Sandbox', 'Europe', [], 'Anna Keller', 'Healthy', false],
  ['Contoso Demo', 'Sandbox', 'Europe', [], 'Lukas Weber', 'Warning', false],
  ['Contoso Partner Portal', 'Production', 'Europe', [], 'Sofia Almeida', 'Healthy', false],
  ['Contoso Sandbox', 'Developer', 'North America', [], 'Alex Silva', 'Healthy', false],
];

const slug = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const day = (offsetDays: number, hour = between(7, 22), minute = between(0, 59)) => {
  const d = new Date(Date.UTC(2025, 3, 28, hour, minute));
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString();
};

const GROUPS = ['Contoso Digital', 'Contoso Software', 'Corporate IT', 'Shared Services', 'Innovation'];
// Fixed demo IDs so they do not shift the seeded random sequence.
const GROUP_IDS: Record<string, string> = Object.fromEntries(GROUPS.map((g, i) => [g, `7c1e0a5${i}-3f2b-4d8e-9a61-${String(i + 1).padStart(12, '0')}`]));

export const environments: Environment[] = ENV_SEEDS.map(([name, type, region, flags, , status, monitored], i) => {
  const host = region === 'North America' ? 'crm' : region === 'Canada' ? 'crm3' : region === 'Asia Pacific' ? 'crm5' : 'crm4';
  return {
    id: guid(),
    name,
    type,
    region,
    flags,
    managed: type === 'Production' ? rand() < 0.85 : rand() < 0.3,
    ...(() => {
      const group = type === 'Default' ? '' : pick(GROUPS);
      return { group, groupId: GROUP_IDS[group] };
    })(),
    status,
    monitored,
    created: day(between(90, 700)),
    lastSynced: day(i < 8 ? 0 : Math.min(i - 7, 3)),
    lastActivity: day(between(0, 2)),
    url: `https://${slug(name)}.${host}.dynamics.com/`,
    organizationId: guid(),
    // The Default environment cannot be restricted to a security group.
    securityGroup: type === 'Default' ? undefined : { id: guid(), name: `SG-PP-${slug(name).toUpperCase()}` },
    description: `${name} environment.`,
  };
});

// Seed owners only drive the dummy resource owners now that environments no longer expose an owner.
const envOwner = new Map(environments.map((e, i) => [e.id, ENV_SEEDS[i][4]]));

const NAME_PARTS: Record<ResourceType, string[]> = {
  'Canvas App': ['Sales Hub', 'Field Service', 'HR Requests', 'Expense Tracker', 'Visitor Check-in', 'Asset Scanner', 'Shift Planner', 'Safety Inspection', 'Travel Requests', 'Room Booking'],
  'Model-driven App': ['Customer Insights', 'Product Catalog', 'Case Management', 'Supplier Portal', 'Contract Manager', 'Project Tracker', 'Partner Management'],
  'Code App': ['Innovation Portal', 'Ops Dashboard', 'KPI Cockpit', 'Release Notes', 'Lab Booking'],
  'Cloud Flow': ['Expense Approval', 'Invoice Processing', 'HR Onboarding', 'Lead Routing', 'Contract Reminder', 'Teams Notification', 'Document Archiving', 'PO Approval'],
  'Scheduled Flow': ['Data Sync - SAP', 'Nightly Backup', 'Weekly Report', 'License Cleanup', 'KPI Refresh'],
  'Desktop Flow': ['Desktop Flow - RPA', 'Legacy ERP Entry', 'Excel Consolidation', 'Invoice Scraper'],
  'Copilot Studio': ['Customer Agent', 'IT Helpdesk Agent', 'HR Policy Bot', 'Sales Assistant', 'Onboarding Buddy'],
  'AI Model': ['Sentiment Model', 'Invoice Extraction', 'Customer Sentiment Model', 'Defect Classifier', 'Demand Forecast'],
  'Dataverse Table': ['Account', 'Contact', 'Opportunity', 'Asset', 'Work Order', 'Inspection', 'Request', 'Project'],
  // Live-only types (not generated in demo data).
  'Agent Flow': ['Agent Flow'],
  'Classic Workflow': ['Workflow'],
  'Business Rule': ['Business Rule'],
  'Custom Action': ['Action'],
  'Business Process Flow': ['Process'],
  'Other': ['Custom Connector', 'Power Pages Site', 'PCF Control', 'Environment Variable', 'Connection Reference'],
};

// Weights roughly match the mockup's "Resources by Type" distribution.
const TYPE_WEIGHTS: [ResourceType, number][] = [
  ['Canvas App', 14], ['Model-driven App', 7], ['Code App', 4], ['Cloud Flow', 36], ['Scheduled Flow', 8],
  ['Desktop Flow', 4], ['Copilot Studio', 3], ['AI Model', 2], ['Dataverse Table', 16],
  ['Classic Workflow', 2], ['Business Rule', 2], ['Custom Action', 1], ['Business Process Flow', 1],
];
const totalWeight = TYPE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
const weightedType = (): ResourceType => {
  let r = rand() * totalWeight;
  for (const [t, w] of TYPE_WEIGHTS) {
    if ((r -= w) < 0) return t;
  }
  return 'Other';
};

const isFlow = (t: ResourceType) => t === 'Cloud Flow' || t === 'Scheduled Flow' || t === 'Desktop Flow';
const isProcess = (t: ResourceType) =>
  t === 'Classic Workflow' || t === 'Business Rule' || t === 'Custom Action' || t === 'Business Process Flow';

// Runs (30d) for flows with run history: like live data, only solution-aware flows have runs.
const demoRuns = (type: ResourceType, envIdx: number, i: number): Pick<Resource, 'runs30d' | 'failedRuns30d' | 'lastRun'> => {
  if (type !== 'Cloud Flow' && type !== 'Scheduled Flow' && type !== 'Agent Flow') return {};
  if (!demoSolutions(envIdx, i).length) return { runs30d: 0, failedRuns30d: 0 };
  const runs = type === 'Scheduled Flow' ? 30 * (1 + ((envIdx + i) % 24)) : ((envIdx * 13 + i * 29) % 400) * ((i % 3) + 1);
  return {
    runs30d: runs,
    failedRuns30d: runs && (envIdx + i) % 4 === 0 ? Math.max(1, Math.round(runs * 0.04)) : 0,
    // Explicit hour/minute so no random draw is consumed (keeps the seeded data stable).
    ...(runs ? { lastRun: day(type === 'Scheduled Flow' ? 0 : (envIdx + i) % 20, 6 + ((envIdx + i) % 12), (i * 7) % 60) } : {}),
  };
};

const DEMO_SOLUTIONS = ['Sales Automation', 'Finance Core', 'Customer Experience', 'HR Onboarding', 'Shared Components'];
// Deterministic (no rand() draw, so the seeded data stays stable): ~40% outside any solution, some in two.
const demoSolutions = (envIdx: number, i: number): string[] => {
  const k = (envIdx * 7 + i * 3) % 10;
  if (k < 4) return [];
  const first = DEMO_SOLUTIONS[(envIdx + i) % DEMO_SOLUTIONS.length];
  return k === 9 ? [first, DEMO_SOLUTIONS[(envIdx + i + 2) % DEMO_SOLUTIONS.length]] : [first];
};

const PROJECT_TAGS = ['Project: Sales', 'Project: Finance', 'Project: CX', 'Project: HR', 'Project: R&D', 'Project: Ops'];

export const resources: Resource[] = environments.flatMap((env, envIdx) => {
  const count = env.monitored ? between(20, 110) : between(5, 25);
  return Array.from({ length: count }, (_, i): Resource => {
    const type = weightedType();
    const base = pick(NAME_PARTS[type]);
    const live = isFlow(type) ? rand() < 0.85 : rand() < 0.88;
    // Same vocabulary as the live inventory: flows On/Off, AI models and processes Active/Inactive|Draft.
    const status: ResourceStatus = isFlow(type) || type === 'Agent Flow'
      ? (live ? 'On' : 'Off')
      : type === 'AI Model'
        ? (live ? 'Active' : 'Inactive')
        : isProcess(type)
          ? (live ? 'Active' : 'Draft')
          : live ? 'Published' : 'Draft';
    const tags: string[] = [];
    if (rand() < 0.7) tags.push(pick(PROJECT_TAGS));
    if (type === 'AI Model' || type === 'Copilot Studio') tags.push('AI');
    if (rand() < 0.12) tags.push('Critical');
    if (rand() < 0.15) tags.push('Integration');
    if (rand() < 0.1) tags.push('Dept: Sales');
    const name = i < 3 ? base : `${base}${rand() < 0.5 ? '' : ` ${between(2, 9)}`}`;
    const owner = rand() < 0.5 ? envOwner.get(env.id)! : pick(OWNERS);
    return {
      id: `${env.id}-${i}`,
      name,
      type,
      envId: env.id,
      // Every 7th row is SYSTEM-owned (no extra rand() draw, so the seeded data stays stable).
      owner: i % 7 === 6 ? 'SYSTEM' : owner,
      ...(i % 7 === 6 ? {} : { ownerEmail: demoEmail(owner) }),
      tags,
      status,
      license: isFlow(type) ? (type === 'Desktop Flow' || rand() < 0.35 ? 'Premium' : 'Standard') : undefined,
      // Every 3rd demo agent runs on the Microsoft Copilot harness (no rand() draw, keeps the seeded data stable).
      poweredBy: type === 'Copilot Studio' ? (i % 3 === 1 ? 'MSFT Copilot' : 'Standard') : undefined,
      solutions: demoSolutions(envIdx, i),
      ...demoRuns(type, envIdx, i),
      modified: day(between(0, 60)),
    };
  });
});

export const tags: Tag[] = [
  { id: 't1', name: 'Project', description: 'Identifies project based on owner', rule: 'Owner', appliesTo: 'All resources', resources: 642, active: true, kind: 'resource' },
  { id: 't2', name: 'Department', description: "Department from owner's AAD group", rule: 'Owner (AAD Group)', appliesTo: 'All resources', resources: 1482, active: true, kind: 'resource' },
  { id: 't3', name: 'Business Unit', description: 'Business unit from environment', rule: 'Environment', appliesTo: 'All resources', resources: 1482, active: true, kind: 'resource' },
  { id: 't4', name: 'Critical', description: 'Critical business resources', rule: 'Manual', appliesTo: 'Selected types', resources: 120, active: true, kind: 'resource' },
  { id: 't5', name: 'AI', description: 'AI related resources', rule: 'Resource Type', appliesTo: 'All resources', resources: 102, active: true, kind: 'resource' },
  { id: 't6', name: 'Integration', description: 'Integration related resources', rule: 'Resource Type', appliesTo: 'All resources', resources: 274, active: true, kind: 'resource' },
  { id: 't7', name: 'External', description: 'Uses external connectors', rule: 'Connection', appliesTo: 'Cloud Flows, Apps', resources: 310, active: false, kind: 'resource' },
  { id: 'f1', name: 'AI', description: 'AI enabled environment', rule: 'Manual', appliesTo: 'Environments', resources: 9, active: true, kind: 'flag' },
  { id: 'f2', name: 'HR Department', description: 'Environment owned by the HR department', rule: 'Manual', appliesTo: 'Environments', resources: 2, active: true, kind: 'flag' },
  { id: 'f3', name: 'Managed', description: 'Managed environment', rule: 'Manual', appliesTo: 'Environments', resources: 14, active: true, kind: 'flag' },
  { id: 'f4', name: 'Premium', description: 'Uses premium capabilities', rule: 'Manual', appliesTo: 'Environments', resources: 11, active: true, kind: 'flag' },
];

export const activity: Activity[] = [
  { id: 'a1', title: 'New app created', subtitle: 'Sales Hub (Canvas App)', kind: 'app', minutesAgo: 10 },
  { id: 'a2', title: 'Flow modified', subtitle: 'Invoice Processing', kind: 'flow', minutesAgo: 32 },
  { id: 'a3', title: 'Environment added', subtitle: 'Contoso R&D Innovation', kind: 'env', minutesAgo: 60 },
  { id: 'a4', title: 'AI model published', subtitle: 'Customer Sentiment Model', kind: 'ai', minutesAgo: 120 },
  { id: 'a5', title: 'Flow turned off', subtitle: 'License Cleanup', kind: 'flow', minutesAgo: 240 },
];
