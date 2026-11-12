import { useEffect, useState, type ReactNode } from 'react';
import { ExternalLink, Info, X } from 'lucide-react';
import type { Resource } from '../data/types';
import { useStore } from '../state/AppStore';
import { PoweredByPill } from './ui';
import { fmtAgo, fmtDate, groupOf } from '../lib/format';
import { componentTypeName, fetchResourceDetails, makerUrl, type DependencyInfo, type ResourceDetails } from '../data/resourceDetails';

interface Props {
  resource: Resource;
  onClose: () => void;
}

const STATUS_COLOR: Record<Resource['status'], string> = {
  Published: 'var(--ok)',
  On: 'var(--ok)',
  Active: 'var(--ok)',
  Draft: 'var(--warn)',
  Off: 'var(--text-3)',
  Inactive: 'var(--text-3)',
  Suspended: 'var(--bad)',
};

function dateWithAgo(iso?: string) {
  if (!iso) return '—';
  const date = fmtDate(iso);
  const ago = fmtAgo(iso);
  return ago === date ? date : `${date} (${ago})`;
}

function DependencyList({ title, items }: { title: string; items: DependencyInfo[] }) {
  return (
    <div className="rd-deps">
      <div className="rd-sub">
        {title} ({items.length})
      </div>
      {items.length === 0 ? (
        <div className="muted small">None</div>
      ) : (
        <ul>
          {items.map((d) => (
            <li key={`${d.componentType}:${d.objectId}`}>
              <span className="rd-chip">{componentTypeName(d.componentType)}</span>
              <span className="mono rd-id">{d.objectId}</span>
              {d.state && <span className={`rd-state${d.state === 'Deleted' ? ' bad' : ''}`}>{d.state}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Right-side panel with a resource's overview, solutions, solution layers and dependencies. */
export function ResourceDetailsPanel({ resource: r, onClose }: Props) {
  const { environments } = useStore();
  const env = environments.find((e) => e.id === r.envId);
  // Tagged with the resource it belongs to, so a previous resource's result is never shown.
  const key = `${r.envId}/${r.id}`;
  const [result, setResult] = useState<{ key: string; details: ResourceDetails | null; error: string } | null>(null);
  const current = result?.key === key ? result : null;
  const details = current?.details ?? null;
  const error = !env ? 'Environment not found' : (current?.error ?? '');

  useEffect(() => {
    let alive = true;
    if (!env) return;
    fetchResourceDetails(env, r).then(
      (d) => alive && setResult({ key, details: d, error: '' }),
      (e: unknown) => alive && setResult({ key, details: null, error: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      alive = false;
    };
    // Reload only when another resource is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.id, r.envId]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const group = groupOf(r.type);
  const link = env ? makerUrl(env, r) : undefined;
  const loading = !details && !error;
  const pending = (content: ReactNode) => (loading ? <span className="muted">Loading…</span> : content);

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="panel rd-panel" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label={`${r.name} details`}>
        <div className="panel-head rd-head">
          <div style={{ minWidth: 0 }}>
            <div className="rd-kind" style={{ color: group.color }}>
              {r.type}
            </div>
            <h3 className="rd-title">{r.name}</h3>
          </div>
          <button className="icon-btn rd-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="panel-body">
          {error && <div className="rd-info bad">Could not load details: {error}</div>}

          <section className="rd-section">
            <div className="rd-section-title">Overview</div>
            <dl className="kv rd-kv">
              <dt>Kind</dt>
              <dd>{group.label}</dd>
              <dt>Type</dt>
              <dd>
                {r.type !== 'Copilot Studio' ? (
                  r.type
                ) : r.poweredBy ? (
                  <PoweredByPill value={r.poweredBy} />
                ) : (
                  <span className="muted" title="Not loaded yet — use Sync now">—</span>
                )}
              </dd>
              <dt>Owner</dt>
              <dd>
                {r.owner || '—'}
                {r.ownerEmail && (
                  <>
                    {' · '}
                    <a href={`mailto:${r.ownerEmail}`}>{r.ownerEmail}</a>
                  </>
                )}
              </dd>
              <dt>State</dt>
              <dd>
                <span className="status">
                  <span className="dot" style={{ background: STATUS_COLOR[r.status] }} />
                  {r.status}
                </span>
              </dd>
              <dt>Managed</dt>
              <dd>{pending(details?.managed === undefined ? '—' : details.managed ? 'Yes' : 'No')}</dd>
              <dt>Created</dt>
              <dd>{pending(dateWithAgo(details?.created))}</dd>
              <dt>Modified</dt>
              <dd>{dateWithAgo(details?.modified ?? r.modified)}</dd>
              {r.appId && r.appId !== r.id && (
                <>
                  <dt>ID</dt>
                  <dd className="mono">{r.appId}</dd>
                </>
              )}
              <dt>Dataverse ID</dt>
              <dd className="mono">{r.id}</dd>
            </dl>
            {link && (
              <a className="btn btn-soft rd-open" href={link} target="_blank" rel="noreferrer">
                Open in maker portal <ExternalLink size={14} />
              </a>
            )}
          </section>

          <section className="rd-section">
            <div className="rd-section-title">Solutions</div>
            {loading ? (
              <div className="muted small">Loading…</div>
            ) : details?.solutionsError ? (
              <div className="muted small">Solutions unavailable: {details.solutionsError}</div>
            ) : !details?.solutions.length ? (
              <div className="muted small">Not in a solution (only in the Default solution).</div>
            ) : (
              <div className="rd-chips">
                {details.solutions.map((s) => (
                  <span key={s.uniqueName} className="rd-sol" title={s.publisher ? `${s.uniqueName} · ${s.publisher}` : s.uniqueName}>
                    <strong>{s.name}</strong>
                    {s.version && <span className="muted"> v{s.version}</span>}
                    <span className={`rd-tag ${s.managed ? 'managed' : 'unmanaged'}`}>{s.managed ? 'Managed' : 'Unmanaged'}</span>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="rd-section">
            <div className="rd-section-title">Solution layers</div>
            <div className="rd-info">
              <Info size={15} />
              <span>
                The top layer is what runs. An <strong>Unmanaged</strong> (Active) layer on top of managed layers means the resource was customized directly in this
                environment.
              </span>
            </div>
            {loading ? (
              <div className="muted small">Loading…</div>
            ) : details?.layersError ? (
              <div className="muted small">Layers unavailable: {details.layersError}</div>
            ) : !details?.layers.length ? (
              <div className="muted small">No solution layers found.</div>
            ) : (
              <table className="rd-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Solution</th>
                    <th>Publisher</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {details.layers.map((l, i) => (
                    <tr key={`${l.order}-${l.solution}`}>
                      <td className="muted">{i + 1}</td>
                      <td>{l.solution}</td>
                      <td>{l.publisher || '—'}</td>
                      <td className={l.managed ? undefined : 'rd-unmanaged'}>{l.managed ? 'Managed' : 'Unmanaged'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="rd-section">
            <div className="rd-section-title">Dependencies</div>
            {loading ? (
              <div className="muted small">Loading…</div>
            ) : details?.dependenciesError ? (
              <div className="muted small">Dependencies unavailable: {details.dependenciesError}</div>
            ) : (
              <>
                <DependencyList title="Requires" items={details?.requires ?? []} />
                <DependencyList title="Required by" items={details?.requiredBy ?? []} />
              </>
            )}
          </section>
        </div>

        <div className="panel-foot rd-foot">
          <span className="muted small">
            Environment <span className="mono">{env?.id ?? r.envId}</span>
          </span>
        </div>
      </aside>
    </div>
  );
}
