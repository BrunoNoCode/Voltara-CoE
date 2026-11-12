import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ExternalLink, Eye, Layers, Plus, RefreshCw, Search, ShieldCheck, Tags } from 'lucide-react';
import { cachedEnvGroupName, envGroupLookupError, ppacEnvironmentGroupUrl, ppacEnvironmentUrl } from '../data/liveEnvironments';
import { useStore } from '../state/AppStore';
import { FilterSelect, FlagChips, KpiCard, ManagedPill, Pagination, RowMenu, SortTh, StatusDot, Tabs, Toast } from '../components/ui';
import { SyncInfo } from '../components/SyncInfo';
import { DonutChart } from '../components/DonutChart';
import { useTable } from '../lib/useTable';
import { fmtNumber, fmtRegion } from '../lib/format';
import { clickableRow } from '../lib/clickableRow';
import type { EnvType, Environment } from '../data/types';

type TabKey = 'mine' | 'all' | 'unmonitored';

const ENV_TYPE_COLOR: Record<EnvType, string> = {
  Production: '#007a7a',
  Sandbox: '#0f62a8',
  Developer: '#6a3fd1',
  Default: '#b6c2ca',
};

const openInPpac = (id: string) => ({
  label: 'Open in PPAC',
  icon: <ExternalLink size={15} />,
  onClick: () => window.open(ppacEnvironmentUrl(id), '_blank', 'noopener'),
});

const pct = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}% of all environments` : '');

export function Environments() {
  const { environments, tags, loading, envSource, envFetchedAt, envError, syncEnvironment, syncAllEnvironments } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('mine');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [managed, setManaged] = useState('');
  const [status, setStatus] = useState('');
  const [flag, setFlag] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState('');

  const byTab = useMemo(
    () => environments.filter((e) => (tab === 'mine' ? e.monitored : tab === 'unmonitored' ? !e.monitored : true)),
    [environments, tab],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return byTab.filter(
      (e) =>
        (!needle || e.name.toLowerCase().includes(needle) || e.group.toLowerCase().includes(needle)) &&
        (!type || e.type === type) &&
        (!region || fmtRegion(e.region) === region) &&
        (!managed || e.managed === (managed === 'Yes')) &&
        (!status || e.status === status) &&
        (!flag || e.flags.includes(flag)),
    );
  }, [byTab, q, type, region, managed, status, flag]);

  const table = useTable<Environment>(
    rows,
    {
      name: (e) => e.name,
      type: (e) => e.type,
      region: (e) => e.region,
      managed: (e) => (e.managed ? 1 : 0),
      group: (e) => e.group,
      status: (e) => e.status,
    },
    'name',
    50,
  );

  // Charts and tiles cover every accessible environment, not only the monitored ones.
  const overview = useMemo(() => {
    const byType: Record<EnvType, number> = { Production: 0, Sandbox: 0, Developer: 0, Default: 0 };
    const byRegion = new Map<string, number>();
    for (const e of environments) {
      byType[e.type] = (byType[e.type] ?? 0) + 1;
      const r = fmtRegion(e.region);
      byRegion.set(r, (byRegion.get(r) ?? 0) + 1);
    }
    return {
      byType,
      regions: [...byRegion.entries()].sort((a, b) => b[1] - a[1]),
      managed: environments.filter((e) => e.managed).length,
      dataverse: environments.filter((e) => !!e.url).length,
    };
  }, [environments]);
  const maxRegion = overview.regions[0]?.[1] ?? 0;

  const regions = [...new Set(environments.map((e) => fmtRegion(e.region)))].sort();
  const flagNames = tags.filter((t) => t.kind === 'flag').map((t) => t.name);
  const sortProps = { sortKey: table.sortKey, sortDir: table.sortDir, onSort: table.toggleSort };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const n = await syncAllEnvironments();
      setToast(`${n} environments loaded`);
    } catch {
      setToast('Sync failed. Showing the last cached list');
    } finally {
      setSyncing(false);
    }
  };

  // The list is not refreshed automatically: the cached list shows until "Sync all" is clicked.

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Environments</h1>
          <p>View and manage the Power Platform environments you have access to.</p>
          <p className="source-line small">
            {loading
              ? 'Loading environments from Power Platform…'
              : envSource === 'demo'
                ? 'Demo data: live environments load when the app runs in Power Apps.'
                : `${envSource === 'live' ? 'Live' : 'Cached'} from Power Platform for Admins`}
            {envError && <span className="source-error"> · Refresh failed: {envError}</span>}
          </p>
        </div>
        <div className="actions row">
          <div className="sync-box">
            <button className="btn" onClick={syncAll} disabled={syncing} title="Re-load the list of environments you can access">
              <RefreshCw size={16} className={syncing ? 'spin' : undefined} /> {syncing ? 'Syncing environment list…' : 'Sync all'}
            </button>
            {envSource !== 'demo' && <SyncInfo at={envFetchedAt} />}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/environments/new')}>
            <Plus size={16} /> Add Environment
          </button>
        </div>
      </div>

      <div className="kpis kpis-3">
        <KpiCard icon={<Layers size={22} />} color="#009999" label="Total environments" value={fmtNumber(environments.length)} sub="All environments you can access" />
        <KpiCard
          icon={<ShieldCheck size={22} />}
          color="#0f62a8"
          label="Managed"
          value={fmtNumber(overview.managed)}
          sub={pct(overview.managed, environments.length)}
        />
        <KpiCard
          icon={<Database size={22} />}
          color="#6a3fd1"
          label="With Dataverse"
          value={fmtNumber(overview.dataverse)}
          sub={pct(overview.dataverse, environments.length)}
        />
      </div>

      {/* Clicking a type or region filters the table below; the filter dropdowns highlight the charts. */}
      <div className="env-charts">
        <div className="card card-pad">
          <div className="card-title">Environments by Type</div>
          <DonutChart
            centerLabel="Environments"
            data={(Object.keys(ENV_TYPE_COLOR) as EnvType[]).map((t) => ({ label: t, value: overview.byType[t], color: ENV_TYPE_COLOR[t] }))}
            onSelect={(t) => setType(type === t ? '' : t)}
            active={type}
          />
        </div>
        <div className="card card-pad">
          <div className="card-title">Environments by Region</div>
          {overview.regions.length === 0 ? (
            <div className="muted small">{loading ? 'Loading environments…' : 'No environments.'}</div>
          ) : (
            <ul className={`hbars hbars-click${region ? ' has-active' : ''}`}>
              {overview.regions.map(([name, count]) => (
                <li
                  key={name}
                  className={region === name ? 'active' : undefined}
                  role="button"
                  tabIndex={0}
                  title={region === name ? 'Clear region filter' : `Show only ${name}`}
                  onClick={() => setRegion(region === name ? '' : name)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      setRegion(region === name ? '' : name);
                    }
                  }}
                >
                  <span className="lbl">{name}</span>
                  <span className="track">
                    <span className="bar" style={{ width: `${maxRegion ? (count / maxRegion) * 100 : 0}%` }} />
                  </span>
                  <span className="num">{fmtNumber(count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'mine', label: 'My Environments', count: environments.filter((e) => e.monitored).length },
          { key: 'all', label: 'All Accessible', count: environments.length },
          { key: 'unmonitored', label: 'Not Monitored', count: environments.filter((e) => !e.monitored).length },
        ]}
      />

      <div className="card">
        <div className="toolbar">
          <div className="search search-wide">
            <Search size={16} />
            <input placeholder="Search by name or group..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <FilterSelect label="Type" value={type} onChange={setType} options={['Production', 'Sandbox', 'Developer', 'Default']} />
          <FilterSelect label="Region" value={region} onChange={setRegion} options={regions} />
          <FilterSelect label="Managed" value={managed} onChange={setManaged} options={['Yes', 'No']} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={['Healthy', 'Warning', 'Attention']} />
          <FilterSelect label="Custom Flag" value={flag} onChange={setFlag} options={flagNames} />
        </div>
        <div className="table-wrap tall">
          <table className="table">
            <thead>
              <tr>
                <SortTh k="name" label="Environment Name" {...sortProps} />
                <SortTh k="type" label="Type" {...sortProps} />
                <SortTh k="region" label="Region" {...sortProps} />
                <SortTh k="managed" label="Managed" {...sortProps} />
                <SortTh k="group" label="Environment Group" {...sortProps} />
                <th>Custom Flags</th>
                <SortTh k="status" label="Status" {...sortProps} />
                <th />
              </tr>
            </thead>
            <tbody>
              {table.pageRows.map((e) => (
                <tr key={e.id} className="clickable" {...clickableRow(() => navigate(e.monitored ? `/environments/${e.id}` : `/environments/new?env=${e.id}`))}>
                  <td className="name">{e.name}</td>
                  <td>{e.type}</td>
                  <td>{fmtRegion(e.region)}</td>
                  <td>
                    <ManagedPill managed={e.managed} />
                  </td>
                  <td>
                    {e.groupId ? (
                      <a
                        href={ppacEnvironmentGroupUrl(e.groupId)}
                        target="_blank"
                        rel="noreferrer"
                        title={(cachedEnvGroupName(e.groupId) || e.group.toLowerCase() !== e.groupId.toLowerCase()) ? `Open environment group in PPAC (${e.groupId})` : `Name lookup failed: ${envGroupLookupError() ?? 'not resolved yet'}`}
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        {cachedEnvGroupName(e.groupId) || e.group || e.groupId}
                      </a>
                    ) : (
                      e.group || <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <FlagChips flags={e.flags} />
                  </td>
                  <td>{e.monitored ? <StatusDot status={e.status} /> : <span className="muted">Not monitored</span>}</td>
                  <td style={{ width: 48 }}>
                    <RowMenu
                      items={
                        e.monitored
                          ? [
                              { label: 'View details', icon: <Eye size={15} />, onClick: () => navigate(`/environments/${e.id}`) },
                              {
                                label: 'Sync now',
                                icon: <RefreshCw size={15} />,
                                onClick: () => {
                                  setToast(`Syncing ${e.name}…`);
                                  syncEnvironment(e.id).then(
                                    () => setToast(`${e.name} synced`),
                                    () => setToast(`${e.name} sync failed`),
                                  );
                                },
                              },
                              { label: 'Edit flags', icon: <Tags size={15} />, onClick: () => navigate(`/environments/${e.id}?tab=settings`) },
                              openInPpac(e.id),
                            ]
                          : [{ label: 'Add to monitoring', icon: <Plus size={15} />, onClick: () => navigate(`/environments/new?env=${e.id}`) }, openInPpac(e.id)]
                      }
                    />
                  </td>
                </tr>
              ))}
              {table.total === 0 && (
                <tr>
                  <td className="empty" colSpan={8}>
                    {loading ? 'Loading environments…' : 'No environments match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPage={table.setPage} />
      </div>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
