import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { ResourceTable } from '../components/ResourceTable';
import { SyncInfo } from '../components/SyncInfo';
import { Toast } from '../components/ui';
import { resourceSyncSummary } from '../lib/syncInfo';

export function Resources() {
  const { environments, resources, resourceLoads, resourceSync, showCachedResources, syncMonitoredResources } = useStore();
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [envFilter, setEnvFilter] = useState('');
  const [toast, setToast] = useState('');

  const monitored = useMemo(() => environments.filter((e) => e.monitored), [environments]);
  const envOptions = useMemo(() => [...new Set(monitored.map((e) => e.name))].sort((a, b) => a.localeCompare(b)), [monitored]);

  // Nothing syncs automatically: show what this browser cached for every monitored environment (no live calls).
  useEffect(() => {
    showCachedResources(monitored.map((e) => e.id));
  }, [monitored, showCachedResources]);

  const rows = useMemo(() => {
    const ids = new Set(monitored.map((e) => e.id));
    return resources.filter((r) => ids.has(r.envId));
  }, [monitored, resources]);

  // The Sync button follows the table's environment filter.
  const targets = useMemo(() => (envFilter ? monitored.filter((e) => e.name === envFilter) : monitored), [envFilter, monitored]);
  const summary = useMemo(() => resourceSyncSummary(targets, resourceLoads), [targets, resourceLoads]);

  const sync = async () => {
    if (!targets.length || resourceSync) return;
    const { total, failed, noDataverse, failedNames } = await syncMonitoredResources(
      true,
      targets.map((e) => e.id),
    );
    const parts = [`Synced ${total - failed - noDataverse} of ${total} environment${total === 1 ? '' : 's'}`];
    if (noDataverse) parts.push(`${noDataverse} without Dataverse`);
    if (failed) parts.push(`failed: ${failedNames.join(', ')}`);
    setToast(parts.join(' · '));
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Resources</h1>
          <p>All apps, flows, agents, AI models and tables across your monitored environments.</p>
        </div>
        <div className="sync-box">
          <button
            className="btn btn-primary"
            onClick={sync}
            disabled={!!resourceSync || !targets.length}
            title={`${envFilter ? 'Re-load this environment' : 'Re-load all monitored environments'} live (admin connectors + Dataverse FetchXML).\n${summary.title}`}
          >
            <RefreshCw size={16} className={resourceSync ? 'spin' : undefined} />
            {resourceSync
              ? `Syncing resources (${resourceSync.total - resourceSync.done} left)…`
              : envFilter
                ? 'Sync environment'
                : `Sync all (${monitored.length})`}
          </button>
          <SyncInfo at={summary.latest} oldest={summary.oldest} missing={summary.missing} title={summary.title} />
        </div>
      </div>
      {/* key forces a fresh table state when the global search changes */}
      <ResourceTable
        key={q}
        rows={rows}
        showEnvironment
        showCharts
        envOptions={envOptions}
        initialQuery={q}
        exportName="power-platform-resources"
        pageSize={50}
        onEnvChange={setEnvFilter}
      />
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
