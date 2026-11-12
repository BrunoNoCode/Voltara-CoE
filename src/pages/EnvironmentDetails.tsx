import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, AppWindow, Bot, BrainCircuit, ChevronRight, Database, ExternalLink, EyeOff, Globe, Info, Layers, MoreHorizontal, RefreshCw, Server, Workflow } from 'lucide-react';
import { useStore, type ResourceLoad } from '../state/AppStore';
import { FlagChips, ManagedPill, StatusDot, Tabs, Toast, Toggle } from '../components/ui';
import { ResourceTable } from '../components/ResourceTable';
import { DonutChart } from '../components/DonutChart';
import { TYPE_GROUPS, flagColor, fmtAgo, fmtDate, fmtDateTime, fmtNumber, fmtRegion, groupOf } from '../lib/format';
import { isSystemOwned, useHideSystem } from '../lib/hideSystem';
import { hasAiResources, setAiHubOverride, useAiHubOverrides } from '../lib/aiHubEnvs';
import type { Resource } from '../data/types';
import { fetchEnvironmentGroupName, ppacEnvironmentGroupUrl, ppacEnvironmentUrl } from '../data/liveEnvironments';
import { fetchGroupDisplayName } from '../data/liveGroups';

type TabKey = 'overview' | 'flows' | 'apps' | 'copilot' | 'ai' | 'dataverse' | 'other' | 'settings';

const GROUP_ICON: Record<string, typeof Workflow> = {
  flows: Workflow,
  apps: AppWindow,
  dataverse: Database,
  copilot: Bot,
  ai: BrainCircuit,
  other: MoreHorizontal,
};

// Per-tab KPI box: label + predicate (count), or a custom value; optional sub-label under the label.
// A `render` entry draws the whole box content itself.
type MiniStat =
  | [string, (r: Resource) => boolean]
  | { label: string; value: (rows: Resource[]) => string; sub?: (rows: Resource[]) => string | undefined }
  | { label: string; render: (rows: Resource[]) => ReactNode };

const countOf = (rows: Resource[], pred: (r: Resource) => boolean) => rows.filter(pred).length;

/** Turned on vs off: on count + share, a split bar and a legend. */
function FlowStateStat({ rows }: { rows: Resource[] }) {
  const on = countOf(rows, (r) => r.status === 'On');
  const off = countOf(rows, (r) => r.status === 'Off');
  const total = on + off;
  const pct = total ? Math.round((on / total) * 100) : 0;
  return (
    <>
      <div className="v">
        {fmtNumber(on)} <span className="v-unit">on · {pct}%</span>
      </div>
      <div className="state-bar" title={`${fmtNumber(on)} turned on, ${fmtNumber(off)} turned off`}>
        {total > 0 && <span className="state-bar-on" style={{ width: `${(on / total) * 100}%` }} />}
      </div>
      <div className="state-legend">
        <span><i className="dot dot-on" />On {fmtNumber(on)}</span>
        <span><i className="dot dot-off" />Off {fmtNumber(off)}</span>
      </div>
    </>
  );
}

const MINI_STATS: Record<string, MiniStat[]> = {
  flows: [
    ['Total Flows', () => true],
    ['Agent Flows', (r) => r.type === 'Agent Flow'],
    // Cloud Flows includes scheduled flows.
    ['Cloud Flows', (r) => r.type === 'Cloud Flow' || r.type === 'Scheduled Flow'],
    ['Desktop Flows', (r) => r.type === 'Desktop Flow'],
    ['Premium', (r) => r.license === 'Premium'],
    ['Suspended', (r) => r.status === 'Suspended'],
    { label: 'Flow State', render: (rows) => <FlowStateStat rows={rows} /> },
  ],
  apps: [
    ['Total Apps', () => true],
    ['Canvas Apps', (r) => r.type === 'Canvas App'],
    ['Model-driven Apps', (r) => r.type === 'Model-driven App'],
    ['Code Apps', (r) => r.type === 'Code App'],
    ['Published', (r) => r.status === 'Published'],
  ],
  copilot: [
    {
      label: 'Agents',
      value: (rows) => fmtNumber(rows.length),
      sub: (rows) =>
        `${fmtNumber(countOf(rows, (r) => r.poweredBy === 'Standard'))} Standard · ${fmtNumber(countOf(rows, (r) => r.poweredBy === 'MSFT Copilot'))} MSFT Copilot`,
    },
    ['Published', (r) => r.status === 'Published'],
    ['Draft', (r) => r.status === 'Draft'],
  ],
  ai: [
    ['AI Models', () => true],
    ['Active', (r) => r.status === 'Active'],
    ['Inactive', (r) => r.status === 'Inactive'],
  ],
  dataverse: [
    ['Tables', () => true],
    {
      label: 'Custom Tables',
      // "—" when the EntityDefinitions lookup failed (no table has the flag).
      value: (rows) => (rows.some((r) => r.customTable !== undefined) ? fmtNumber(countOf(rows, (r) => r.customTable === true)) : '—'),
    },
    ['Published', (r) => r.status === 'Published'],
    ['Unpublished', (r) => r.status === 'Draft'],
  ],
  other: [
    ['Total', () => true],
    ['Workflows', (r) => r.type === 'Classic Workflow'],
    ['Business Rules', (r) => r.type === 'Business Rule'],
    ['Custom Actions', (r) => r.type === 'Custom Action'],
    ['Process Flows', (r) => r.type === 'Business Process Flow'],
    ['Active', (r) => r.status === 'Active'],
  ],
};

// What each resource tab calls its rows in the load notice.
const GROUP_NOUN: Record<string, string> = {
  flows: 'flows',
  apps: 'apps',
  copilot: 'agents',
  ai: 'AI models',
  dataverse: 'tables',
  other: 'processes',
};

// Where each resource tab actually reads its rows from (see GROUP_FETCH in liveResources.ts).
const GROUP_SOURCE: Record<string, string> = {
  flows: 'the Power Platform for Admins V2 connector (cloud flows) and Dataverse FetchXML (desktop flows)',
  apps: 'the Power Apps for Admins connector (canvas and code apps) and Dataverse FetchXML (model-driven apps)',
  copilot: 'Dataverse FetchXML (bot table)',
  ai: 'Dataverse FetchXML (msdyn_aimodel table)',
  dataverse: 'Dataverse FetchXML (entity table)',
  other: 'Dataverse FetchXML (workflow table)',
};

/** Status line above a tab's live resource inventory. */
function ResourceLoadNotice({ load, group }: { load: ResourceLoad; group: string }) {
  const noun = GROUP_NOUN[group] ?? 'resources';
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const source = GROUP_SOURCE[group] ?? 'Dataverse FetchXML';
  if (load.state === 'loading')
    return (
      <div className="notice" style={{ marginBottom: 14 }}>
        <RefreshCw size={16} className="spin" /> Loading {noun} from {source}…
      </div>
    );
  if (load.state === 'unavailable')
    return (
      <div className="notice" style={{ marginBottom: 14 }}>
        <Info size={16} /> This environment has no Dataverse database, so its {noun} cannot be listed.
      </div>
    );
  if (load.state === 'error')
    return (
      <div className="notice notice-bad" style={{ marginBottom: 14 }}>
        <AlertTriangle size={16} /> Could not load {noun}: {load.error}
      </div>
    );
  const error = load.groupErrors?.[group as keyof typeof load.groupErrors] ?? load.error;
  return (
    <div className={`notice${error ? ' notice-bad' : ''}`} style={{ marginBottom: 14 }}>
      {load.refreshing ? <RefreshCw size={16} className="spin" /> : error ? <AlertTriangle size={16} /> : <Info size={16} />}
      <span>
        {Noun} from {source}{load.fetchedAt ? `, fetched ${fmtAgo(load.fetchedAt)}` : ''}.
        {load.refreshing && ' Refreshing…'}
        {error && ` Refresh failed: ${error}`}
      </span>
    </div>
  );
}

export function EnvironmentDetails() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { environments, resources, tags, resourceLoads, showCachedResources, syncEnvironment, setEnvironmentFlags, unmonitorEnvironment } = useStore();
  const navigate = useNavigate();
  const [confirmStop, setConfirmStop] = useState(false);
  const [toast, setToast] = useState('');
  const [syncing, setSyncing] = useState(false);

  const env = environments.find((e) => e.id === id);
  const envFound = !!env;
  const load = id ? resourceLoads[id] : undefined;

  // Resolve the security group's display name (the environment API only returns its object ID).
  const sgId = env?.securityGroup?.id;
  const [sgResult, setSgResult] = useState<{ id: string; name: string | null; error?: string } | null>(null);
  const sg: { name: string | null; error?: string } = sgResult && sgResult.id === sgId ? sgResult : { name: null };
  useEffect(() => {
    if (!sgId) return;
    let alive = true;
    fetchGroupDisplayName(sgId).then((r) => alive && setSgResult({ id: sgId, ...r }));
    return () => {
      alive = false;
    };
  }, [sgId]);

  // Same for the environment group when the environment list could not resolve it.
  const groupId = env?.groupId;
  const groupResolved = !!env?.group && env.group.toLowerCase() !== groupId?.toLowerCase();
  const [groupResult, setGroupResult] = useState<{ id: string; name: string | null; error?: string } | null>(null);
  const envGroup: { name: string | null; error?: string } =
    !groupResolved && groupResult && groupResult.id === groupId ? groupResult : { name: null };
  useEffect(() => {
    if (!groupId || groupResolved) return;
    let alive = true;
    fetchEnvironmentGroupName(groupId).then((r) => alive && setGroupResult({ id: groupId, ...r }));
    return () => {
      alive = false;
    };
  }, [groupId, groupResolved]);

  // Nothing syncs automatically: show the cached rows; "Sync now" loads them live.
  useEffect(() => {
    if (id && envFound) showCachedResources([id]);
  }, [id, envFound, showCachedResources]);
  const [hideSystem] = useHideSystem();
  const allEnvResources = useMemo(() => resources.filter((r) => r.envId === id), [resources, id]);
  const aiHubOverrides = useAiHubOverrides();
  const aiDefault = hasAiResources(id ?? '', allEnvResources);
  const inAiHub = aiHubOverrides[id ?? ''] ?? aiDefault;
  const [aiInfoOpen, setAiInfoOpen] = useState(false);
  // Counts, stats and charts follow the "Hide SYSTEM-owned" checkbox; the table filters itself.
  const envResources = useMemo(() => (hideSystem ? allEnvResources.filter((r) => !isSystemOwned(r)) : allEnvResources), [allEnvResources, hideSystem]);
  const groupRows = (list: Resource[]) => {
    const m: Record<string, Resource[]> = Object.fromEntries(TYPE_GROUPS.map((g) => [g.key, []]));
    for (const r of list) m[groupOf(r.type).key].push(r);
    return m;
  };
  const byGroup = useMemo(() => groupRows(envResources), [envResources]);
  const byGroupAll = useMemo(() => groupRows(allEnvResources), [allEnvResources]);
  // First live fetch with nothing cached yet: show placeholders instead of zeros.
  const loadingData = (!load || load.state === 'loading') && allEnvResources.length === 0;
  const tabCount = (n: number) => (loadingData ? undefined : n);

  const tab = (params.get('tab') as TabKey) || 'overview';
  const setTab = (t: TabKey) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true });

  if (!env) {
    return (
      <div className="card placeholder">
        <h2>Environment not found</h2>
        <p className="muted">
          It may have been removed or you no longer have access. <Link to="/environments">Back to Environments</Link>
        </p>
      </div>
    );
  }

  const flagTags = tags.filter((t) => t.kind === 'flag');
  const sync = async () => {
    setSyncing(true);
    try {
      await syncEnvironment(env.id);
      setToast('Sync completed');
    } catch {
      setToast('Sync failed');
    } finally {
      setSyncing(false);
    }
  };
  const toggleFlag = (f: string) => setEnvironmentFlags(env.id, env.flags.includes(f) ? env.flags.filter((x) => x !== f) : [...env.flags, f]);

  return (
    <>
      <div className="breadcrumb">
        <Link to="/environments">Environments</Link>
        <ChevronRight size={14} /> {env.name}
      </div>

      <div className="card env-head">
        <div className="env-icon">
          <Server size={26} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="row">
            <h1>{env.name}</h1>
            <FlagChips flags={env.flags} />
          </div>
          <div className="env-meta">
            <span>
              <Layers size={14} /> {env.type}
            </span>
            <span>
              <Globe size={14} /> {fmtRegion(env.region)}
            </span>
            <StatusDot status={env.status} />
            <span>Last synced {fmtAgo(env.lastSynced)}</span>
          </div>
        </div>
        <div className="actions row" style={{ marginLeft: 'auto' }}>
          <a className="btn" href={`https://make.powerapps.com/environments/${env.id}/home`} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Open in Maker
          </a>
          <a className="btn" href={ppacEnvironmentUrl(env.id)} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Open in PPAC
          </a>
          <button className="btn btn-primary" onClick={sync} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? 'spin' : undefined} /> {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'flows', label: 'Power Automate', count: tabCount(byGroup.flows.length) },
          { key: 'apps', label: 'Power Apps', count: tabCount(byGroup.apps.length) },
          { key: 'copilot', label: 'Copilot Studio', count: tabCount(byGroup.copilot.length) },
          { key: 'ai', label: 'AI Models', count: tabCount(byGroup.ai.length) },
          { key: 'dataverse', label: 'Dataverse', count: tabCount(byGroup.dataverse.length) },
          { key: 'other', label: 'Other', count: tabCount(byGroup.other.length) },
          { key: 'settings', label: 'Settings' },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)' }}>
          <div className="card card-pad">
            <div className="card-title">Environment Information</div>
            <dl className="kv">
              <dt>Environment ID</dt>
              <dd>{env.id}</dd>
              <dt>Type</dt>
              <dd>{env.type}</dd>
              <dt>Region</dt>
              <dd>{fmtRegion(env.region)}</dd>
              <dt>Dataverse</dt>
              <dd>
                <ManagedPill managed={!!env.url} />
              </dd>
              <dt>Environment URL</dt>
              <dd>
                {env.url ? (
                  <a href={env.url} target="_blank" rel="noreferrer">
                    {env.url}
                  </a>
                ) : (
                  <span className="muted">—</span>
                )}
              </dd>
              <dt>Organization ID</dt>
              <dd>{env.organizationId}</dd>
              <dt>Security Group</dt>
              <dd>
                {env.securityGroup ? (
                  <a href={`https://entra.microsoft.com/#view/Microsoft_AAD_IAM/GroupDetailsMenuBlade/~/Overview/groupId/${env.securityGroup.id}`} target="_blank" rel="noreferrer" title={sg.error ? `Name lookup failed: ${sg.error}` : `Open in Entra (${env.securityGroup.id})`}>
                    {sg.name ?? env.securityGroup.name} <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="muted">None</span>
                )}
              </dd>
              <dt>Managed</dt>
              <dd>
                <ManagedPill managed={env.managed} />
              </dd>
              <dt>Environment group</dt>
              <dd>
                {env.groupId ? (
                  <a href={ppacEnvironmentGroupUrl(env.groupId)} target="_blank" rel="noreferrer" title={envGroup.error ? `Name lookup failed: ${envGroup.error}` : 'Open environment group in PPAC'}>
                    {(groupResolved ? env.group : envGroup.name) || env.groupId} <ExternalLink size={12} />
                  </a>
                ) : (
                  env.group || <span className="muted">—</span>
                )}
              </dd>
              <dt>Environment group ID</dt>
              <dd>{env.groupId || <span className="muted">—</span>}</dd>
              <dt>Created</dt>
              <dd>{fmtDate(env.created)}</dd>
              <dt>Last activity</dt>
              <dd>{fmtDateTime(env.lastActivity)}</dd>
              <dt>Last synced</dt>
              <dd>{fmtDateTime(env.lastSynced)}</dd>
            </dl>
          </div>
          <div className="grid">
            <div className="card card-pad">
              <div className="card-title">Resource Summary</div>
              <div className="summary-tiles">
                {TYPE_GROUPS.map((g) => {
                  const Icon = GROUP_ICON[g.key];
                  return (
                    <button key={g.key} className="summary-tile" onClick={() => setTab(g.key as TabKey)}>
                      <span className="kpi-icon" style={{ width: 36, height: 36, background: `${g.color}1a`, color: g.color }}>
                        <Icon size={18} />
                      </span>
                      <span>
                        <div className="v">{loadingData ? <span className="skel skel-num" /> : fmtNumber(byGroup[g.key].length)}</div>
                        <div className="l">{g.label}</div>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="card card-pad">
              <div className="card-title">
                Resources by Type
              </div>
              {loadingData ? (
                <div className="loading-block">
                  <RefreshCw size={18} className="spin" /> Loading resources…
                </div>
              ) : (
                <DonutChart size={140} data={TYPE_GROUPS.map((g) => ({ label: g.label, value: byGroup[g.key].length, color: g.color }))} centerLabel="Resources" />
              )}
            </div>
            <div className="card card-pad">
              <div className="card-title">
                Custom Flags
                <button className="link btn btn-ghost btn-sm" onClick={() => setTab('settings')}>
                  Edit
                </button>
              </div>
              <FlagChips flags={env.flags} />
            </div>
          </div>
        </div>
      )}

      {tab !== 'overview' && tab !== 'settings' && MINI_STATS[tab] && (
        <>
          {load && <ResourceLoadNotice load={load} group={tab} />}
          <div className="mini-stats">
            {MINI_STATS[tab].map((stat) => {
              const rows = byGroup[tab];
              const label = Array.isArray(stat) ? stat[0] : stat.label;
              if (loadingData) {
                return (
                  <div key={label} className="card mini-stat">
                    <div className="v">
                      <span className="skel skel-num" />
                    </div>
                    <div className="l">{label}</div>
                  </div>
                );
              }
              if (!Array.isArray(stat) && 'render' in stat) {
                return (
                  <div key={label} className="card mini-stat">
                    {stat.render(rows)}
                  </div>
                );
              }
              const value = Array.isArray(stat) ? fmtNumber(countOf(rows, stat[1])) : stat.value(rows);
              const sub = Array.isArray(stat) ? undefined : stat.sub?.(rows);
              return (
                <div key={label} className="card mini-stat">
                  <div className="v">{value}</div>
                  <div className="l">{label}</div>
                  {sub && <div className="s">{sub}</div>}
                </div>
              );
            })}
          </div>
          <ResourceTable key={tab} rows={byGroupAll[tab]} exportName={`${env.name}-${tab}`} showLicense={tab === 'flows'} pageSize={50} />
        </>
      )}

      {tab === 'settings' && (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
          <div className="card card-pad">
            <div className="card-title">Custom Flags</div>
            <p className="muted small" style={{ marginTop: -6 }}>
              Flags are used to group and filter environments across the monitor.
            </p>
            <div className="grid" style={{ gap: 8 }}>
              {flagTags.map((t) => {
                const on = env.flags.includes(t.name);
                const c = flagColor(t.name);
                return (
                  <div key={t.id} className={`flag-option${on ? ' on' : ''}`} style={{ cursor: 'default' }}>
                    <span className="chip" style={{ background: c.bg, color: c.fg }}>
                      {t.name}
                    </span>
                    <span className="muted small">{t.description}</span>
                    <span className="spacer" />
                    <Toggle on={on} onChange={() => toggleFlag(t.name)} label={`Flag ${t.name}`} />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card card-pad">
            <div className="card-title">Monitoring</div>
            <dl className="kv">
              <dt>Status</dt>
              <dd>Monitored</dd>
              <dt>Sync schedule</dt>
              <dd>Every 6 hours</dd>
              <dt>Last synced</dt>
              <dd>{fmtDateTime(env.lastSynced)}</dd>
              <dt>Resources tracked</dt>
              <dd>{fmtNumber(envResources.length)}</dd>
            </dl>
            <div className={`flag-option${inAiHub ? ' on' : ''}`} style={{ cursor: 'default', marginTop: 18, position: 'relative' }}>
              <BrainCircuit size={16} />
              <span style={{ fontWeight: 500 }}>Include in AI Hub</span>
              <button
                className="icon-btn"
                style={{ width: 24, height: 24 }}
                onClick={() => setAiInfoOpen((o) => !o)}
                aria-label="What is this?"
                aria-expanded={aiInfoOpen}
                title="What is this?"
              >
                <Info size={14} />
              </button>
              <span className="spacer" />
              {aiHubOverrides[env.id] !== undefined && (
                <button className="link-btn small" onClick={() => setAiHubOverride(env.id, undefined)} title={`Default: ${aiDefault ? 'on' : 'off'}`}>
                  Reset to default
                </button>
              )}
              <Toggle on={inAiHub} onChange={() => setAiHubOverride(env.id, !inAiHub)} label="Include in AI Hub" />
              {aiInfoOpen && (
                <div className="info-pop" role="note" onClick={() => setAiInfoOpen(false)}>
                  When enabled, this environment is considered in the AI Hub (Copilot Credits, agents, agent flows and AI models).
                  It is enabled by default when the environment contains AI Models, Copilot Studio agents or agent flows, and
                  disabled otherwise.
                </div>
              )}
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn" onClick={sync}>
                <RefreshCw size={16} /> Sync now
              </button>
              {confirmStop ? (
                <span className="send-confirm">
                  <strong>Stop monitoring {env.name}?</strong>
                  <button className="btn" onClick={() => setConfirmStop(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      unmonitorEnvironment(env.id);
                      navigate('/environments');
                    }}
                  >
                    Stop monitoring
                  </button>
                </span>
              ) : (
                <button className="btn btn-danger" onClick={() => setConfirmStop(true)}>
                  <EyeOff size={16} /> Stop monitoring
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
