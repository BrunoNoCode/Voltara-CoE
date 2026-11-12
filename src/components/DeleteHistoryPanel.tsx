import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { SidePanel } from './ui';
import { fmtAgo, fmtDateTime } from '../lib/format';
import { deleteProgress, retryDeleteJob, retryableItems, type DeleteItem, type DeleteJob, type DeleteJobState } from '../lib/deleteJobs';

const STATE_PILL: Record<DeleteJobState, { cls: string; label: string }> = {
  running: { cls: 'pill-yes', label: 'Deleting' },
  paused: { cls: 'pill-no', label: 'Paused' },
  completed: { cls: 'pill-yes', label: 'Completed' },
  cancelled: { cls: 'pill-no', label: 'Cancelled' },
};

/** Outcome of one resource, as far as this run is concerned. */
function itemStatus(job: DeleteJob, i: DeleteItem): { cls: string; label: string } {
  if (i.status === 'deleted') return { cls: 'pill-yes', label: i.note ?? 'Deleted' };
  if (i.status === 'failed') return { cls: 'pill-bad', label: i.retriedIn ? 'Failed · retried' : 'Failed' };
  if (job.state === 'cancelled') return { cls: 'pill-no', label: 'Not deleted' };
  return i.attempts ? { cls: 'pill-no', label: `Retrying (${i.attempts})` } : { cls: 'pill-no', label: 'Queued' };
}

function JobCard({
  job,
  showRule,
  byId,
  onRetry,
}: {
  job: DeleteJob;
  showRule: boolean;
  byId: Map<string, DeleteJob>;
  onRetry: (job: DeleteJob, itemIds?: string[]) => void;
}) {
  const retryable = retryableItems(job);
  const [open, setOpen] = useState(retryable.length > 0);
  const p = deleteProgress(job);
  const pill = STATE_PILL[job.state];
  const origin = job.retryOf ? byId.get(job.retryOf) : undefined;
  const retries = (job.retriedAs ?? []).map((id) => byId.get(id)).filter((j): j is DeleteJob => !!j);

  return (
    <div className="history-job">
      <div className="history-job-head">
        <span className={`pill ${pill.cls}`}>
          {pill.label}
          {job.state === 'running' ? ` · ${p.pct}%` : ''}
        </span>
        {showRule && <strong className="history-rule">{job.ruleName}</strong>}
        <span className="small muted" title={fmtDateTime(job.createdAt)}>
          Started {fmtAgo(job.createdAt)}
          {job.createdBy ? ` by ${job.createdBy}` : ''}
          {job.finishedAt ? ` · finished ${fmtAgo(job.finishedAt)}` : ''}
        </span>
      </div>
      <div className="history-job-stats small">
        <span>
          <strong>{p.deleted}</strong> of {p.total} deleted
        </span>
        {p.failed > 0 && <span className="bad-text">{p.failed} failed</span>}
        {p.pending > 0 && <span className="muted">{p.pending} {job.state === 'cancelled' ? 'not deleted' : 'queued'}</span>}
        {origin && <span className="muted">Retry of the run from {fmtDateTime(origin.createdAt)}</span>}
        {job.retryOf && !origin && <span className="muted">Retry of an earlier run</span>}
        {retries.length > 0 && (
          <span className="muted">
            {retries.reduce((n, j) => n + j.items.length, 0)} resource(s) retried in {retries.length} later run{retries.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <div className="history-job-actions">
        <button className="link-btn small" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} {open ? 'Hide' : 'Show'} resources ({job.items.length})
        </button>
        {retryable.length > 0 && (
          <button className="btn btn-sm" onClick={() => onRetry(job)} title="Try to delete the failed resources again, as a new run">
            <RotateCcw size={13} /> Retry failed ({retryable.length})
          </button>
        )}
      </div>
      {open && (
        <div className="table-wrap">
          <table className="table history-items">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Status</th>
                <th>Deleted / error</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {job.items.map((i) => {
                const s = itemStatus(job, i);
                return (
                  <tr key={i.id}>
                    <td className="wrap">
                      <div>{i.name}</div>
                      <div className="small muted">
                        {i.type} · {i.envName}
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${s.cls}`}>{s.label}</span>
                      {i.attempts > 1 && i.status !== 'pending' && (
                        <div className="small muted">
                          {i.attempts} attempt{i.attempts === 1 ? '' : 's'}
                        </div>
                      )}
                    </td>
                    <td className="wrap">
                      {i.status === 'deleted' && i.finishedAt ? (
                        <span className="small">{fmtDateTime(i.finishedAt)}</span>
                      ) : i.lastError ? (
                        <span className="err small">{i.lastError}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {i.status === 'failed' && !i.retriedIn && (
                        <button className="btn btn-sm" onClick={() => onRetry(job, [i.id])} title="Try to delete this resource again, as a new run">
                          <RotateCcw size={13} /> Retry
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Execution history of delete jobs — for one rule, or for all rules — with retry of the resources that failed. */
export function DeleteHistoryPanel({
  jobs,
  ruleId,
  ruleName,
  user,
  onClose,
  onRetried,
}: {
  jobs: DeleteJob[];
  /** Only this rule's runs; all runs when omitted. */
  ruleId?: string;
  ruleName?: string;
  user?: string;
  onClose: () => void;
  onRetried: (message: string) => void;
}) {
  const [state, setState] = useState<'' | 'problems' | DeleteJobState>('');
  const byId = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const runs = useMemo(
    () =>
      jobs
        .filter((j) => !ruleId || j.ruleId === ruleId)
        .filter((j) => !state || (state === 'problems' ? retryableItems(j).length > 0 : j.state === state))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [jobs, ruleId, state],
  );

  const retry = (job: DeleteJob, itemIds?: string[]) => {
    const created = retryDeleteJob(job.id, user, itemIds);
    if (created) onRetried(`Retrying ${created.items.length} resource${created.items.length === 1 ? '' : 's'} of "${job.ruleName}" — keep the app open until it completes`);
  };

  return (
    <SidePanel title={ruleId ? `Delete history — ${ruleName ?? 'rule'}` : 'Delete history — all rules'} wide onClose={onClose}>
      <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <select className="select" value={state} onChange={(e) => setState(e.target.value as typeof state)} aria-label="Run status">
          <option value="">Status: All</option>
          <option value="problems">With failed resources</option>
          {(Object.keys(STATE_PILL) as DeleteJobState[]).map((s) => (
            <option key={s} value={s}>
              {STATE_PILL[s].label}
            </option>
          ))}
        </select>
        <span className="small muted">
          {runs.length} run{runs.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="small muted" style={{ marginTop: 0 }}>
        Runs are kept in this browser (the latest 50). Retrying tries to delete the failed resources again, as a new run. Resources already deleted are never
        touched again.
      </p>
      {runs.map((j) => (
        <JobCard key={j.id} job={j} showRule={!ruleId} byId={byId} onRetry={retry} />
      ))}
      {runs.length === 0 && <div className="empty muted">{state ? 'No runs with this status.' : 'Nothing has been deleted yet.'}</div>}
    </SidePanel>
  );
}
