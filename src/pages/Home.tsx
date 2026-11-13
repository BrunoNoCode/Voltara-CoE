import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppWindow, Bot, Boxes, Database, Layers, Play, RefreshCw, Workflow } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { HeroArt } from '../components/HeroArt';
import { KpiCard, Pagination, StatusDot, Toast } from '../components/ui';
import { SyncInfo } from '../components/SyncInfo';
import { resourceSyncSummary } from '../lib/syncInfo';
import { useTable } from '../lib/useTable';
import { DonutChart } from '../components/DonutChart';
import { TYPE_GROUPS, fmtMinutesAgo, fmtNumber, groupOf } from '../lib/format';
import { isSystemOwned, useHideSystem } from '../lib/hideSystem';
import { syncAiHub } from '../lib/aiHubSync';
import { isHosted } from '../data/api';
import type { HealthStatus, Resource } from '../data/types';

const DAY_MS = 24 * 60 * 60 * 1000;

const ENV_STATUS_COLOR: Record<HealthStatus, string> = { Healthy: '#1aa260', Warning: '#f2a900', Attention: '#d9363e' };

const GROUP_STYLE: Record<string, { icon: typeof AppWindow; color: string }> = {
  apps: { icon: AppWindow, color: '#009999' },
  flows: { icon: Workflow, color: '#0f62a8' },
  copilot: { icon: Bot, color: '#6a3fd1' },
  dataverse: { icon: Database, color: '#3aa6a6' },
  ai: { icon: Bot, color: '#e05a9c' },
  other: { icon: Boxes, color: '#7d8e99' },
};

interface ActivityRow {
  key: string;
  resource: Resource;
  action: 'modified' | 'ran';
  at: number;
  envName: string;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Home() {
  const { environments, resources, resourceLoads, resourceSync, user, showCachedResources, syncAllEnvironments, syncMonitoredResources } = useStore();
  const [hideSystem] = useHideSystem();
  const navigate = useNavigate();
  /** Current "Sync all" step ('' when idle). */
  const [step, setStep] = useState('');
  const [toast, setToast] = useState('');
  // Clock for the "last 24 hours" activity list, ticking every minute.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Nothing syncs automatically: show the cached resources of the monitored environments.
  const monitoredIds = useMemo(() => environments.filter((e) => e.monitored).map((e) => e.id), [environments]);
  useEffect(() => showCachedResources(monitoredIds), [monitoredIds, showCachedResources]);

  // Latest lists, read by "Sync all" after each step re-rendered the page (its closure has the old ones).
  const latest = useRef({ environments, resources });
  useLayoutEffect(() => {
    latest.current = { environments, resources };
  }, [environments, resources]);

  const syncAll = async () => {
    setStep('Environment list');
    try {
      await syncAllEnvironments();
      setStep('Resources of the monitored environments');
      const { total, failed } = await syncMonitoredResources(true);
      const parts = [failed ? `${total - failed} of ${total} environments synced (${failed} failed)` : `${total} environment${total === 1 ? '' : 's'} synced`];
      if (await isHosted()) {
        // Environments included in the AI Hub are known once the synced resources are rendered: wait for that commit.
        await new Promise((r) => setTimeout(r, 0));
        const hub = await syncAiHub(latest.current.environments, latest.current.resources, setStep);
        parts.push(`AI Hub refreshed (${hub} environment${hub === 1 ? '' : 's'})`);
      }
      setToast(parts.join(' · '));
    } catch (err) {
      setToast(`Sync failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setStep('');
    }
  };

  const stats = useMemo(() => {
    const monitored = environments.filter((e) => e.monitored);
    const envName = new Map(monitored.map((e) => [e.id, e.name]));
    const res = resources.filter((r) => envName.has(r.envId) && !(hideSystem && isSystemOwned(r)));

    const counts = { apps: 0, flows: 0, copilot: 0, other: 0 };
    const perEnv = new Map<string, { apps: number; flows: number; copilot: number; workflows: number }>();
    for (const e of monitored) perEnv.set(e.id, { apps: 0, flows: 0, copilot: 0, workflows: 0 });
    const byGroup: Record<string, number> = {};
    const byStatus: Record<HealthStatus, number> = { Healthy: 0, Warning: 0, Attention: 0 };
    for (const e of monitored) byStatus[e.status]++;
    for (const r of res) {
      const g = groupOf(r.type).key;
      byGroup[g] = (byGroup[g] ?? 0) + 1;
      if (g === 'apps' || g === 'flows' || g === 'copilot') counts[g]++;
      else counts.other++;
      const row = perEnv.get(r.envId)!;
      if (g === 'apps' || g === 'flows' || g === 'copilot') row[g]++;
      else if (r.type === 'Classic Workflow') row.workflows++;
    }

    // Actions on resources in the last 24 hours: modifications and flow runs.
    const since = now - DAY_MS;
    const acts: ActivityRow[] = [];
    for (const r of res) {
      const m = r.modified ? new Date(r.modified).getTime() : 0;
      if (m >= since) acts.push({ key: `${r.id}-m`, resource: r, action: 'modified', at: m, envName: envName.get(r.envId)! });
      const run = r.lastRun ? new Date(r.lastRun).getTime() : 0;
      if (run >= since) acts.push({ key: `${r.id}-r`, resource: r, action: 'ran', at: run, envName: envName.get(r.envId)! });
    }
    acts.sort((a, b) => b.at - a.at);

    return { monitored, total: res.length, counts, perEnv, acts, byGroup, byStatus };
  }, [environments, resources, hideSystem, now]);

  const envTable = useTable(stats.monitored, { name: (e) => e.name }, 'name', 50);

  const firstName = (user.fullName || '').split(' ')[0];
  const anyLoading = stats.monitored.some((e) => resourceLoads[e.id]?.state === 'loading' || resourceLoads[e.id]?.refreshing);
  const summary = resourceSyncSummary(stats.monitored, resourceLoads);
  const busy = !!step || !!resourceSync;
  const progress = step
    ? `Syncing: ${step}${resourceSync ? ` (${resourceSync.total - resourceSync.done} of ${resourceSync.total} environments left)` : ''}…`
    : resourceSync
      ? `Syncing resources (${resourceSync.total - resourceSync.done} of ${resourceSync.total} environments left)…`
      : 'Re-load the environment list, the resources of all monitored environments, and the AI Hub list and consumption (Azure groups are not synced).';

  return (
    <>
      <section className="hero">
        <HeroArt />
        <div className="hero-text">
          <h2>
            Drive transparency.
            <br />
            <span>Enable innovation.</span>
          </h2>
          <p>Get full visibility of your Power Platform environments, apps, flows, agents and AI models — all in one place.</p>
        </div>
      </section>

      <div className="greeting row">
        <div>
          <h1>
            {greeting()}
            {firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p>Here's what's happening across your monitored Power Platform environments.</p>
        </div>
        <div className="spacer" />
        <div className="sync-box">
          {/* The title shows on hover even while the button is disabled: it carries the step details. */}
          <span title={`${progress}\n${summary.title}`}>
            <button className="btn" onClick={syncAll} disabled={busy}>
              <RefreshCw size={15} className={busy ? 'spin' : ''} />
              {busy ? 'Syncing…' : 'Sync all'}
            </button>
          </span>
          <SyncInfo at={summary.latest} oldest={summary.oldest} missing={summary.missing} title={summary.title} />
        </div>
      </div>

      <div className="kpis">
        <KpiCard
          icon={<Layers size={22} />}
          color="#009999"
          label="Environments"
          value={fmtNumber(stats.monitored.length)}
          sub={`${fmtNumber(stats.monitored.length)} out of ${fmtNumber(environments.length)} monitored`}
        />
        <KpiCard
          icon={<Boxes size={22} />}
          color="#0f62a8"
          label="Total resources"
          value={fmtNumber(stats.total)}
        />
        {[1, 2, 3].map((i) => (
          <div key={i} className="card kpi kpi-placeholder" aria-hidden="true">
            Coming soon
          </div>
        ))}
      </div>

      <div className="home-row">
        <div className="card card-pad home-chart">
          <div className="card-title">Resources by Type</div>
          <div className="home-chart-body">
            <DonutChart size={150} centerLabel="Resources" data={TYPE_GROUPS.map((g) => ({ label: g.label, value: stats.byGroup[g.key] ?? 0, color: g.color }))} />
          </div>
        </div>

        <div className="card card-pad home-chart">
          <div className="card-title">Environments by Status</div>
          <div className="home-chart-body">
            <DonutChart
              size={150}
              centerLabel="Environments"
              data={(Object.keys(ENV_STATUS_COLOR) as HealthStatus[]).map((s) => ({ label: s, value: stats.byStatus[s], color: ENV_STATUS_COLOR[s] }))}
            />
          </div>
        </div>

        <div className="card card-pad home-activity">
          <div className="card-title">
            Recent Activity <span className="small muted" style={{ fontWeight: 400 }}>· last 24 hours</span>
          </div>
          {/* The list scrolls inside the card so the card's height follows the charts card. */}
          <div className="home-activity-body">
            {stats.acts.length === 0 ? (
              <div className="muted small">{anyLoading ? 'Loading resources…' : 'No changes in the last 24 hours.'}</div>
            ) : (
              <ul className="activity">
                {stats.acts.slice(0, 30).map((a) => {
                  const g = groupOf(a.resource.type).key;
                  const { icon: Icon, color } = a.action === 'ran' ? { icon: Play, color: '#1aa260' } : GROUP_STYLE[g];
                  return (
                    <li key={a.key}>
                      <span className="ic" style={{ background: `${color}1a`, color }}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <div className="t">{a.resource.name}</div>
                        <div className="s">
                          {a.resource.type} {a.action} · {a.envName}
                        </div>
                      </div>
                      <span className="when">{fmtMinutesAgo(Math.max(0, Math.round((now - a.at) / 60000)))}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title card-pad" style={{ paddingBottom: 0 }}>
          Resources by Environment
          <button className="btn btn-soft" style={{ marginLeft: 'auto' }} onClick={() => navigate('/resources')}>
            Open Resources
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Environment</th>
                <th>Type</th>
                <th className="num-cell">Power Apps</th>
                <th className="num-cell">Power Automate</th>
                <th className="num-cell">Agents</th>
                <th className="num-cell">Workflows</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.monitored.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No monitored environments yet. <Link to="/environments/new">Add one</Link>
                  </td>
                </tr>
              )}
              {envTable.pageRows.map((e) => {
                const c = stats.perEnv.get(e.id)!;
                const load = resourceLoads[e.id];
                const pending = !load || (load.state === 'loading' && !load.fetchedAt);
                const cell = (n: number) => (load?.state === 'unavailable' ? '—' : pending ? '…' : fmtNumber(n));
                return (
                  <tr key={e.id}>
                    <td>
                      <Link to={`/environments/${e.id}`}>{e.name}</Link>
                    </td>
                    <td>
                      <span className="type-pill">{e.type}</span>
                    </td>
                    <td className="num-cell">{cell(c.apps)}</td>
                    <td className="num-cell">{cell(c.flows)}</td>
                    <td className="num-cell">{cell(c.copilot)}</td>
                    <td className="num-cell">{cell(c.workflows)}</td>
                    <td>
                      <StatusDot status={e.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={envTable.page} pageSize={envTable.pageSize} total={envTable.total} onPage={envTable.setPage} />
      </div>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
