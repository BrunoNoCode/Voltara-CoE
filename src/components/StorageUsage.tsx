import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { cachedResourceSizes, initResourceCache } from '../data/resourceCache';

// localStorage holds about 5M characters (keys + values) per site.
const LOCAL_LIMIT = 5 * 1024 * 1024;

const fmtSize = (n: number) =>
  n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GB` : n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

function localUsage() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) total += key.length + (localStorage.getItem(key)?.length ?? 0);
  }
  return total;
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="storage-bar">
      <div className={pct > 90 ? 'bad' : pct > 70 ? 'warn' : ''} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

/** How much browser storage the app uses: the resource cache (IndexedDB) and the settings (localStorage). */
export function StorageUsage() {
  const { environments } = useStore();
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const [estimate, setEstimate] = useState<{ usage?: number; quota?: number }>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    initResourceCache().finally(() => setReady(true));
    navigator.storage
      ?.estimate?.()
      .then((e) => setEstimate({ usage: e.usage, quota: e.quota }))
      .catch(() => undefined);
  }, [version]);

  const caches = useMemo(() => {
    const names = new Map(environments.map((e) => [e.id, e.name]));
    return ready ? cachedResourceSizes().map((c) => ({ ...c, name: names.get(c.envId) ?? c.envId })) : [];
    // version re-measures on demand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environments, ready, version]);
  const cacheTotal = caches.reduce((n, c) => n + c.size, 0);
  // version re-measures on demand
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const local = useMemo(() => localUsage(), [version]);
  const shown = showAll ? caches : caches.slice(0, 8);

  return (
    <div className="card card-pad settings-card" style={{ marginTop: 16 }}>
      <div className="row">
        <div className="card-title">Browser storage</div>
        <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setVersion((v) => v + 1)} title="Measure again">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Synced resources and your settings are kept in this browser so they survive a refresh. Nothing is stored outside the browser.
      </p>

      <div className="card-title" style={{ fontSize: 14, marginTop: 8 }}>
        Resource cache (IndexedDB)
      </div>
      {estimate.quota ? (
        <>
          <Bar pct={((estimate.usage ?? 0) / estimate.quota) * 100} />
          <p className="small" style={{ margin: '6px 0 12px' }}>
            <strong>{fmtSize(estimate.usage ?? 0)}</strong> of {fmtSize(estimate.quota)} available to this site used · cached resources ≈ {fmtSize(cacheTotal)} in{' '}
            {caches.length} environment{caches.length === 1 ? '' : 's'}
          </p>
        </>
      ) : (
        <p className="small" style={{ margin: '6px 0 12px' }}>
          Cached resources ≈ <strong>{fmtSize(cacheTotal)}</strong> in {caches.length} environment{caches.length === 1 ? '' : 's'}
        </p>
      )}
      {caches.length > 0 && (
        <dl className="kv">
          {shown.map((c) => (
            <span key={c.envId} style={{ display: 'contents' }}>
              <dt>{c.name}</dt>
              <dd>
                {fmtSize(c.size)} · {c.rows.toLocaleString()} rows
              </dd>
            </span>
          ))}
        </dl>
      )}
      {caches.length > 8 && (
        <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setShowAll((s) => !s)}>
          {showAll ? 'Show fewer' : `Show all (${caches.length})`}
        </button>
      )}

      <div className="card-title" style={{ fontSize: 14, marginTop: 18 }}>
        Settings, tags and rules (localStorage)
      </div>
      <Bar pct={(local / LOCAL_LIMIT) * 100} />
      <p className="small" style={{ margin: '6px 0 0' }}>
        <strong>{fmtSize(local)}</strong> of about {fmtSize(LOCAL_LIMIT)} used ({((local / LOCAL_LIMIT) * 100).toFixed(0)}%)
      </p>
    </div>
  );
}
