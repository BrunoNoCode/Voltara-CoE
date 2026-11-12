import type { HealthStatus, ResourceType } from '../data/types';

export const STATUS_COLOR: Record<HealthStatus, string> = {
  Healthy: 'var(--ok)',
  Warning: 'var(--warn)',
  Attention: 'var(--bad)',
};

export const FLAG_COLOR: Record<string, { bg: string; fg: string }> = {
  AI: { bg: '#ede7fb', fg: '#6a3fd1' },
  SI: { bg: '#e0f4f4', fg: '#007a7a' },
  DI: { bg: '#e3effd', fg: '#1f6fd1' },
  Apps: { bg: '#fdeee0', fg: '#c25e00' },
  'Power Automate': { bg: '#e2f0fb', fg: '#0f62a8' },
};
export const flagColor = (flag: string) => FLAG_COLOR[flag] ?? { bg: '#eef2f5', fg: '#3d4f59' };

// Display groups used in donuts and environment tabs.
export const TYPE_GROUPS: { key: string; label: string; color: string; types: ResourceType[] }[] = [
  { key: 'flows', label: 'Power Automate', color: '#0f62a8', types: ['Cloud Flow', 'Scheduled Flow', 'Agent Flow', 'Desktop Flow'] },
  { key: 'apps', label: 'Power Apps', color: '#009999', types: ['Canvas App', 'Model-driven App', 'Code App'] },
  { key: 'dataverse', label: 'Dataverse', color: '#6fc7c7', types: ['Dataverse Table'] },
  { key: 'copilot', label: 'Copilot Studio', color: '#6a3fd1', types: ['Copilot Studio'] },
  { key: 'ai', label: 'AI Models', color: '#e05a9c', types: ['AI Model'] },
  { key: 'other', label: 'Other', color: '#b6c2ca', types: ['Classic Workflow', 'Business Rule', 'Custom Action', 'Business Process Flow', 'Other'] },
];
export const groupOf = (t: ResourceType) => TYPE_GROUPS.find((g) => g.types.includes(t))!;

/** Per-type colors (shades of the type's group color) for type-level charts. */
export const TYPE_COLOR: Record<ResourceType, string> = {
  'Cloud Flow': '#0f62a8',
  'Scheduled Flow': '#3d8bd6',
  'Agent Flow': '#5f9fdf',
  'Desktop Flow': '#8bb8e8',
  'Canvas App': '#007a7a',
  'Model-driven App': '#00b3b3',
  'Code App': '#66d1c4',
  'Dataverse Table': '#6fc7c7',
  'Copilot Studio': '#6a3fd1',
  'AI Model': '#e05a9c',
  'Classic Workflow': '#7d8e99',
  'Business Rule': '#9aa8b2',
  'Custom Action': '#b6c2ca',
  'Business Process Flow': '#cfd8de',
  Other: '#e1e7eb',
};

export const fmtNumber = (n: number) => n.toLocaleString('en-US');

const REGION_NAMES: Record<string, string> = {
  unitedstates: 'United States',
  unitedkingdom: 'United Kingdom',
  southamerica: 'South America',
  unitedarabemirates: 'United Arab Emirates',
  uae: 'United Arab Emirates',
  southafrica: 'South Africa',
  usgov: 'US Government',
  usgovhigh: 'US Government High',
};

/** Admin API region keys ("unitedstates", "Europe") as display names ("United States", "Europe"). */
export function fmtRegion(region: string) {
  if (!region) return '—';
  const key = region.replace(/\s+/g, '').toLowerCase();
  if (REGION_NAMES[key]) return REGION_NAMES[key];
  return region
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Live environments can lack dates (e.g. never synced), so empty values render as a dash.
export const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export const fmtDateTime = (iso: string) =>
  iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export function fmtAgo(iso: string) {
  if (!iso) return 'never';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'unknown';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  return fmtMinutesAgo(mins);
}

export function fmtMinutesAgo(mins: number) {
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  if (d < 60) return `${d} day${d > 1 ? 's' : ''} ago`;
  return fmtDate(new Date(Date.now() - mins * 60000).toISOString());
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  // Text starting with = + - @ (or tab / CR) would run as a formula in Excel: prefix it with a quote.
  const esc = (v: string | number) => {
    const s = typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  // Revoked later: some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
