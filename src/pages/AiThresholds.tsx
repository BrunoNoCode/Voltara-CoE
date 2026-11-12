// Copilot Credit limits (resource thresholds) of agents: default settings, bulk apply and the agent detail panel.
// Limits apply to agents (Copilot Studio) only, never to agent flows.
import { useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck, X } from 'lucide-react';
import type { Environment, Resource } from '../data/types';
import { PoweredByPill, SidePanel } from '../components/ui';
import { fmtAgo, fmtDate, fmtNumber, TYPE_COLOR } from '../lib/format';
import { fetchBasicDetails, makerUrl, type ResourceDetails } from '../data/resourceDetails';
import type { FlowAiEntry } from '../data/liveFlowAiConsumption';
import {
  DEFAULT_THRESHOLD,
  isThresholdDefined,
  setResourceThreshold,
  thresholdDefaults,
  thresholdErrorText,
  type ResourceThreshold,
  type ThresholdSettings,
} from '../data/liveThresholds';
import {
  cancelThresholdJob,
  clearThresholdJobs,
  isActiveThresholdJob,
  latestThresholdJob,
  startThresholdJob,
  thresholdJobProgress,
  useThresholdJobs,
  type ThresholdItem,
  type ThresholdJob,
} from '../lib/thresholdJobs';
import { isAgent } from '../lib/aiThresholds';

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

/** Whole-number input that keeps the typed text: empty or out-of-range text is flagged (and reverted on blur) instead of becoming 0. */
function IntInput({ id, value, min, max, onChange }: { id: string; value: number; min: number; max?: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  const [shown, setShown] = useState(value);
  // Value changed from outside (e.g. "Reset to defaults"): show it.
  if (value !== shown) {
    setShown(value);
    setText(String(value));
  }
  const parse = (t: string) => {
    const n = Number(t);
    return t.trim() !== '' && Number.isInteger(n) && n >= min && (max === undefined || n <= max) ? n : undefined;
  };
  return (
    <input
      id={id}
      className="input"
      type="number"
      min={min}
      max={max}
      step="1"
      value={text}
      aria-invalid={parse(text) === undefined}
      onChange={(e) => {
        setText(e.target.value);
        const n = parse(e.target.value);
        if (n !== undefined) {
          setShown(n);
          onChange(n);
        }
      }}
      onBlur={() => parse(text) === undefined && setText(String(value))}
    />
  );
}

/** The 5 threshold fields. */
function ThresholdForm({ value, onChange, idPrefix }: { value: ThresholdSettings; onChange: (v: ThresholdSettings) => void; idPrefix: string }) {
  const check = (key: 'notifyIfOverCapacity' | 'stopIfOverCapacity' | 'stopResource', label: string, hint: string) => (
    <label className="row small" style={{ gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
      <input type="checkbox" checked={value[key]} onChange={(e) => onChange({ ...value, [key]: e.target.checked })} style={{ marginTop: 2 }} />
      <span>
        <strong>{label}</strong>
        <div className="muted">{hint}</div>
      </span>
    </label>
  );
  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-limit`}>Limit (Copilot Credits)</label>
        <IntInput id={`${idPrefix}-limit`} min={0} value={value.limit} onChange={(limit) => onChange({ ...value, limit })} />
        <div className="small muted">Credits the agent can use. 0 = no limit.</div>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-notify`}>Notification threshold (%)</label>
        <IntInput
          id={`${idPrefix}-notify`}
          min={0}
          max={100}
          value={value.notificationThreshold}
          onChange={(notificationThreshold) => onChange({ ...value, notificationThreshold })}
        />
        <div className="small muted">Notify when this percentage of the limit is used.</div>
      </div>
      {check('notifyIfOverCapacity', 'Notify if over capacity', 'Send a notification when the agent goes over its limit.')}
      {check('stopIfOverCapacity', 'Stop if over capacity', 'Stop the agent when it goes over its limit.')}
      {check('stopResource', 'Stop resource', 'Turns the agent off now.')}
    </>
  );
}

/** Default limit settings, used to prefill the bulk apply and the agent form. Saved in this browser only. */
export function ThresholdDefaultsPanel({ onClose, onSave }: { onClose: () => void; onSave: (s: ThresholdSettings) => void }) {
  const [draft, setDraft] = useState<ThresholdSettings>(() => thresholdDefaults());
  return (
    <SidePanel
      title="Default agent limits"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={() => setDraft(DEFAULT_THRESHOLD)}>
            Reset to defaults
          </button>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => onSave(draft)}>
            Save
          </button>
        </>
      }
    >
      <p className="small muted" style={{ marginTop: 0 }}>
        Default Copilot Credit limit settings for agents (not agent flows). They prefill "Set limits" and the agent form; nothing is applied until you confirm there.
        Saved in this browser only.
      </p>
      <ThresholdForm value={draft} onChange={setDraft} idPrefix="thr-def" />
    </SidePanel>
  );
}

/** Re-renders every second (countdowns). */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

/** Short status of a running job: paused after a 429, or the service answering slowly. */
function throttleLabel(job: ThresholdJob | undefined, now: number): string {
  if (!isActiveThresholdJob(job)) return '';
  if (job!.throttledUntil) {
    const s = Math.max(0, Math.ceil((Date.parse(job!.throttledUntil) - now) / 1000));
    return `⏸ Paused: too many requests (429). Retrying automatically in ${s}s…`;
  }
  if (job!.busySince && now - Date.parse(job!.busySince) > 20_000) return '⏳ The service is slow to answer (likely throttling). Still working…';
  return '';
}

/**
 * Applies the same limit settings to all the filtered agents (agent flows are excluded).
 * Runs as a background job: the panel can be closed and reopened to check the progress.
 */
export function BulkThresholdPanel({
  resources,
  envName,
  onClose,
  onApplied,
}: {
  resources: Resource[];
  envName: (envId: string) => string;
  onClose: () => void;
  onApplied: (message: string) => void;
}) {
  const agents = resources.filter(isAgent);
  const [draft, setDraft] = useState<ThresholdSettings>(() => thresholdDefaults());
  const [confirmed, setConfirmed] = useState(false);
  const job = latestThresholdJob(useThresholdJobs());
  const running = isActiveThresholdJob(job);
  const now = useNow(running);
  const p = job ? thresholdJobProgress(job) : undefined;
  const label = throttleLabel(job, now);
  const failedItems = job?.items.filter((i) => i.status === 'failed') ?? [];

  const apply = () => {
    startThresholdJob(agents, draft, envName);
    setConfirmed(false);
    onApplied(`Setting limits on ${agents.length} agent${agents.length === 1 ? '' : 's'} in the background. You can close this panel.`);
  };

  const itemStatus = (i: ThresholdItem) =>
    i.status === 'ok' ? (
      <span style={{ color: 'var(--ok)' }}>Done</span>
    ) : i.status === 'failed' ? (
      <span className="ai-err" title={i.error}>
        Failed
      </span>
    ) : job?.state !== 'running' ? (
      <span className="muted">Not applied</span>
    ) : i.throttles || i.attempts ? (
      <span className="muted" title={i.error}>
        Retrying
      </span>
    ) : (
      <span className="muted">Waiting</span>
    );

  return (
    <SidePanel
      title={running ? `Setting limits (${p!.total} agent${p!.total === 1 ? '' : 's'})` : `Set limits (${agents.length} agent${agents.length === 1 ? '' : 's'})`}
      onClose={onClose}
      wide
      footer={
        <>
          <span className="small muted">
            {p ? `${p.done} of ${p.total} done${p.failed ? ` · ${p.failed} failed` : ''}${job!.state === 'cancelled' ? ' · stopped' : ''}` : ''}
            {label && (
              <span style={{ color: 'var(--warn)', marginLeft: 8 }} title="The Power Platform API limits how many requests can be sent. The job waits and continues on its own.">
                {label}
              </span>
            )}
          </span>
          <span className="spacer" />
          {running && (
            <button className="btn" onClick={() => cancelThresholdJob(job!.id)}>
              Stop
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Close
          </button>
          {!running && (
            <button className="btn btn-primary" disabled={!confirmed || !agents.length} onClick={apply}>
              <ShieldCheck size={14} /> Apply to {agents.length} agent{agents.length === 1 ? '' : 's'}
            </button>
          )}
        </>
      }
    >
      {running ? (
        <p className="small muted" style={{ marginTop: 0 }}>
          Running in the background: you can close this panel or open other pages and come back later. If the app is closed, it continues when the app is opened
          again.
        </p>
      ) : (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>
            Applies to the agents matching the current search and filters (environment, owner, name). <strong>Agent flows are never included.</strong> Settings
            are prefilled from the default limits. Runs in the background: you can close this panel while it runs.
          </p>
          <ThresholdForm value={draft} onChange={setDraft} idPrefix="thr-bulk" />
          {draft.stopResource && <p className="small ai-err">Stop resource is on: all {agents.length} agents below will be turned off.</p>}
          <label className="row small" style={{ gap: 8, margin: '8px 0 14px' }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>
              I confirm: set these limits on the <strong>{agents.length}</strong> agent{agents.length === 1 ? '' : 's'} listed below.
            </span>
          </label>
        </>
      )}

      {job && (
        <>
          <h4 className="ai-section">
            {running ? 'Progress' : 'Last run'} <span className="muted small">· started {fmtAgo(job.createdAt)}</span>
            {!running && (
              <button className="btn btn-sm" style={{ marginLeft: 8 }} onClick={clearThresholdJobs}>
                Clear
              </button>
            )}
          </h4>
          <p className="small muted" style={{ marginTop: 0 }}>
            Limit {job.settings.limit > 0 ? fmtNumber(job.settings.limit) : 'none'} · notify at {job.settings.notificationThreshold}%
            {job.settings.stopIfOverCapacity ? ' · stop if over capacity' : ''}
            {job.settings.stopResource ? ' · stop resource' : ''}
          </p>
          <table className="rd-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Environment</th>
                <th>Owner</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {job.items.map((i) => (
                <tr key={`${i.envId}:${i.resourceId}`}>
                  <td>{i.name}</td>
                  <td>{i.envName}</td>
                  <td>{i.owner}</td>
                  <td>{itemStatus(i)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {failedItems.length > 0 && <pre className="ai-log">{failedItems.map((i) => `${i.name}: ${i.error}`).join('\n')}</pre>}
        </>
      )}

      {!running && (
        <>
          <h4 className="ai-section">Agents to update</h4>
          {agents.length ? (
            <table className="rd-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Environment</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((r) => (
                  <tr key={`${r.envId}:${r.id}`}>
                    <td>{r.name}</td>
                    <td>{envName(r.envId)}</td>
                    <td>{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="small muted">No agents match the current filters.</p>
          )}
        </>
      )}
    </SidePanel>
  );
}

/** Minimal agent panel: overview, solution link and its Copilot Credit limit (view and edit). */
export function AgentDetailPanel({
  resource: r,
  env,
  threshold,
  consumed: consumedIn,
  consumedSource,
  flowAi,
  onClose,
  onSaved,
}: {
  resource: Resource;
  env?: Environment;
  threshold?: ResourceThreshold;
  /** Credits consumed this month as shown in the table (billing summary API / AI Builder events); falls back to the limit row. */
  consumed?: number;
  /** Where `consumed` comes from (shown under the value). */
  consumedSource?: string;
  /** AI Builder consumption of a cloud flow: models, LLMs, callers. */
  flowAi?: FlowAiEntry;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  // Tagged with the agent it belongs to, so a previous agent's result is never shown.
  const key = `${r.envId}/${r.id}`;
  const [result, setResult] = useState<{
    key: string;
    details: Pick<ResourceDetails, 'created' | 'modified' | 'solutions' | 'solutionsError'> | null;
    error: string;
  } | null>(null);
  const current = result?.key === key ? result : null;
  const details = current?.details ?? null;
  const error = !env ? 'Environment not found' : (current?.error ?? '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ThresholdSettings>(() => (isThresholdDefined(threshold) ? { ...threshold! } : thresholdDefaults()));
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let alive = true;
    if (!env) return;
    fetchBasicDetails(env, r).then(
      (d) => alive && setResult({ key, details: d, error: '' }),
      (e: unknown) => alive && setResult({ key, details: null, error: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      alive = false;
    };
    // Reload only when another agent is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.id, r.envId]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const loading = !details && !error;
  const solutions = details?.solutions ?? [];
  const agent = isAgent(r);
  const kind = agent ? 'Agent' : r.type === 'Agent Flow' ? 'Agent flow' : 'Cloud flow';
  const link = env ? makerUrl(env, r) : undefined;
  const defined = isThresholdDefined(threshold);
  const used = consumedIn ?? threshold?.consumption;
  const credits = (n: number) => `${fmtNumber(Math.round(n * 100) / 100)} credits`;

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await setResourceThreshold(r.envId, threshold?.resourceId || r.id, draft);
      setEditing(false);
      setConfirmed(false);
      onSaved(`Limit saved for ${r.name}`);
    } catch (err) {
      setSaveError(thresholdErrorText(err));
    } finally {
      setSaving(false);
    }
  };

  const yes = (v: boolean) => (v ? 'Yes' : 'No');

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="panel rd-panel" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label={`${r.name} details`}>
        <div className="panel-head rd-head">
          <div style={{ minWidth: 0 }}>
            <div className="rd-kind" style={{ color: TYPE_COLOR[r.type] }}>
              {kind}
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
              <dd>{kind}</dd>
              {agent && (
                <>
                  <dt>Type</dt>
                  <dd>{r.poweredBy ? <PoweredByPill value={r.poweredBy} /> : <span className="muted">—</span>}</dd>
                </>
              )}
              <dt>Environment</dt>
              <dd>{env?.name ?? <span className="muted">Unknown</span>}</dd>
              <dt>Environment ID</dt>
              <dd className="mono">{env?.id ?? r.envId}</dd>
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
              <dt>Created</dt>
              <dd>{loading ? <span className="muted">Loading…</span> : dateWithAgo(details?.created)}</dd>
              <dt>Modified</dt>
              <dd>{dateWithAgo(details?.modified ?? r.modified)}</dd>
              <dt>Copilot Credits consumed</dt>
              <dd>
                {used !== undefined ? credits(used) : <span className="muted">Not available</span>}
                {used !== undefined && consumedSource && <div className="small muted">{consumedSource}</div>}
              </dd>
              {flowAi && (
                <>
                  <dt>AI Builder events</dt>
                  <dd>
                    {fmtNumber(flowAi.events)}
                    {flowAi.lastEvent && <span className="muted"> · last {dateWithAgo(flowAi.lastEvent)}</span>}
                  </dd>
                  <dt>AI models</dt>
                  <dd>
                    {Object.entries(flowAi.models)
                      .sort((a, b) => b[1].credits - a[1].credits)
                      .map(([name, m]) => (
                        <div key={name}>
                          {name} <span className="muted">· {credits(m.credits)} · {fmtNumber(m.events)} event{m.events === 1 ? '' : 's'}</span>
                        </div>
                      ))}
                  </dd>
                  {flowAi.llms.length > 0 && (
                    <>
                      <dt>LLM</dt>
                      <dd>{flowAi.llms.join(', ')}</dd>
                    </>
                  )}
                  {flowAi.callers.length > 0 && (
                    <>
                      <dt>Run as</dt>
                      <dd>{flowAi.callers.join(', ')}</dd>
                    </>
                  )}
                </>
              )}
              <dt>Dataverse ID</dt>
              <dd className="mono">{r.id}</dd>
              {agent && (
                <>
                  <dt>Resource ID</dt>
                  <dd className="mono">{threshold?.resourceId || r.id.toLowerCase()}</dd>
                </>
              )}
            </dl>
            {solutions.length > 0 && (
              <div className="rd-chips" style={{ marginTop: 10 }}>
                {solutions.map((s) =>
                  env && s.id ? (
                    <a
                      key={s.uniqueName}
                      className="rd-sol"
                      href={`https://make.powerapps.com/environments/${env.id}/solutions/${s.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title={`Open the solution ${s.uniqueName}`}
                    >
                      <strong>{s.name}</strong>
                      <span className={`rd-tag ${s.managed ? 'managed' : 'unmanaged'}`}>{s.managed ? 'Managed' : 'Unmanaged'}</span>
                    </a>
                  ) : (
                    <span key={s.uniqueName} className="rd-sol">
                      <strong>{s.name}</strong>
                    </span>
                  ),
                )}
              </div>
            )}
            {!loading && !solutions.length && (
              <div className="muted small" style={{ marginTop: 10 }}>
                {details?.solutionsError ? `Solutions unavailable: ${details.solutionsError}` : 'Not in a solution (only in the Default solution).'}
              </div>
            )}
            {link && (
              <a className="btn btn-soft rd-open" href={link} target="_blank" rel="noreferrer">
                Open in {agent ? 'Copilot Studio' : 'Power Automate'} <ExternalLink size={14} />
              </a>
            )}
          </section>

          {!agent && (
            <section className="rd-section">
              <div className="rd-section-title">Copilot Credit limit</div>
              <div className="muted small">Not available: Copilot Credit limits apply to agents only.</div>
            </section>
          )}
          {agent && (
          <section className="rd-section">
            <div className="rd-section-title">Copilot Credit limit</div>
            {!editing ? (
              <>
                {defined ? (
                  <dl className="kv rd-kv">
                    <dt>Limit</dt>
                    <dd>{threshold!.limit > 0 ? `${fmtNumber(threshold!.limit)} credits` : 'No limit'}</dd>
                    <dt>Consumption</dt>
                    <dd>
                      {credits(used ?? 0)}
                      {threshold!.limit > 0 && <span className="muted"> ({Math.round(((used ?? 0) / threshold!.limit) * 100)}%)</span>}
                    </dd>
                    <dt>Notification threshold</dt>
                    <dd>{threshold!.notificationThreshold}%</dd>
                    <dt>Notify if over capacity</dt>
                    <dd>{yes(threshold!.notifyIfOverCapacity)}</dd>
                    <dt>Stop if over capacity</dt>
                    <dd>{yes(threshold!.stopIfOverCapacity)}</dd>
                    <dt>Stop resource</dt>
                    <dd className={threshold!.stopResource ? 'ai-err' : undefined}>{yes(threshold!.stopResource)}</dd>
                  </dl>
                ) : (
                  <div className="muted small">
                    No limit defined{used !== undefined ? ` · ${credits(used)} used` : ''}.
                  </div>
                )}
                <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setEditing(true)}>
                  <ShieldCheck size={14} /> {defined ? 'Change limit' : 'Set a limit'}
                </button>
              </>
            ) : (
              <>
                <ThresholdForm value={draft} onChange={setDraft} idPrefix="thr-agent" />
                {draft.stopResource && <p className="small ai-err">Stop resource is on: this agent will be turned off.</p>}
                <label className="row small" style={{ gap: 8, margin: '8px 0 12px' }}>
                  <input type="checkbox" checked={confirmed} disabled={saving} onChange={(e) => setConfirmed(e.target.checked)} />
                  <span>I confirm: apply these settings to {r.name}.</span>
                </label>
                {saveError && <p className="small ai-err">{saveError}</p>}
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-sm" disabled={saving} onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-sm btn-primary" disabled={!confirmed || saving} onClick={save}>
                    {saving ? 'Saving…' : 'Save limit'}
                  </button>
                </div>
              </>
            )}
          </section>
          )}
        </div>
      </aside>
    </div>
  );
}
