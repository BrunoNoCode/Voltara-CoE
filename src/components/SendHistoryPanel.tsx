import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { SidePanel } from './ui';
import { fmtAgo, fmtDateTime } from '../lib/format';
import { MAX_FAILURES, jobProgress, resubmitJob, unsentItems, type JobState, type SendItem, type SendJob } from '../lib/sendJobs';

const STATE_PILL: Record<JobState, { cls: string; label: string }> = {
  running: { cls: 'pill-yes', label: 'Sending' },
  paused: { cls: 'pill-no', label: 'Paused' },
  failed: { cls: 'pill-bad', label: 'Failed — paused' },
  completed: { cls: 'pill-yes', label: 'Completed' },
  cancelled: { cls: 'pill-no', label: 'Cancelled' },
};

/** Outcome of one e-mail, as far as this run is concerned. */
function itemStatus(job: SendJob, i: SendItem): { cls: string; label: string } {
  if (i.status === 'sent') return { cls: 'pill-yes', label: 'Sent' };
  if (job.state === 'running') return i.attempts ? { cls: 'pill-no', label: `Retrying (${i.attempts})` } : { cls: 'pill-no', label: 'Queued' };
  if (i.lastError) return { cls: 'pill-bad', label: 'Failed' };
  return { cls: 'pill-no', label: 'Not sent' };
}

function JobCard({
  job,
  showRule,
  byId,
  onResubmit,
}: {
  job: SendJob;
  showRule: boolean;
  byId: Map<string, SendJob>;
  onResubmit: (job: SendJob, itemIds?: string[]) => void;
}) {
  const [open, setOpen] = useState(job.state === 'failed');
  const p = jobProgress(job);
  const unsent = unsentItems(job);
  const failed = unsent.filter((i) => i.lastError).length;
  const pill = STATE_PILL[job.state];
  const origin = job.resubmitOf ? byId.get(job.resubmitOf) : undefined;
  const resubmits = (job.resubmittedAs ?? []).map((id) => byId.get(id)).filter((j): j is SendJob => !!j);

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
          <strong>{p.sent}</strong> of {p.total} sent
        </span>
        {failed > 0 && <span className="bad-text">{failed} failed</span>}
        {unsent.length - failed > 0 && <span className="muted">{unsent.length - failed} not sent</span>}
        {origin && <span className="muted">Resubmission of the run from {fmtDateTime(origin.createdAt)}</span>}
        {job.resubmitOf && !origin && <span className="muted">Resubmission of an earlier run</span>}
        {resubmits.length > 0 && (
          <span className="muted">
            {resubmits.reduce((n, j) => n + j.items.length, 0)} e-mail(s) resubmitted in {resubmits.length} later run{resubmits.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
      {job.lastError && job.state !== 'completed' && <div className="err small">{job.lastError}</div>}
      <div className="history-job-actions">
        <button className="link-btn small" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} {open ? 'Hide' : 'Show'} e-mails ({job.items.length})
        </button>
        {unsent.length > 0 && (
          <button className="btn btn-sm" onClick={() => onResubmit(job)} title="Send the e-mails that were not sent again, as a new run">
            <RotateCcw size={13} /> Resubmit {failed === unsent.length ? 'failed' : 'unsent'} ({unsent.length})
          </button>
        )}
      </div>
      {open && (
        <div className="table-wrap">
          <table className="table history-items">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Status</th>
                <th>Sent / last error</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {job.items.map((i) => {
                const s = itemStatus(job, i);
                const canResubmit = unsent.some((u) => u.id === i.id);
                return (
                  <tr key={i.id}>
                    <td className="wrap">
                      <div>{i.recipientName}</div>
                      <div className="small muted">{i.to.join(', ')}</div>
                      <div className="small muted">
                        {i.resourceCount} resource{i.resourceCount === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${s.cls}`}>{s.label}</span>
                      {i.status === 'pending' && i.attempts > 0 && job.state !== 'running' && (
                        <div className="small muted">
                          {i.attempts} attempt{i.attempts === 1 ? '' : 's'}
                          {i.attempts > MAX_FAILURES ? ' (gave up)' : ''}
                        </div>
                      )}
                    </td>
                    <td className="wrap">
                      {i.sentAt ? (
                        <span className="small" title={fmtDateTime(i.sentAt)}>
                          {fmtDateTime(i.sentAt)}
                        </span>
                      ) : i.lastError ? (
                        <span className="err small">{i.lastError}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {canResubmit && (
                        <button className="btn btn-sm" onClick={() => onResubmit(job, [i.id])} title="Send this e-mail again, as a new run">
                          <RotateCcw size={13} /> Resubmit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {job.items.length === 0 && (
                <tr>
                  <td className="empty" colSpan={4}>
                    All e-mails of this run were resubmitted in a later run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Execution history of send jobs — for one rule, or for all rules — with resubmission of e-mails that were not sent. */
export function SendHistoryPanel({
  jobs,
  ruleId,
  ruleName,
  user,
  onClose,
  onResubmitted,
}: {
  jobs: SendJob[];
  /** Only this rule's runs; all runs when omitted. */
  ruleId?: string;
  ruleName?: string;
  user?: string;
  onClose: () => void;
  onResubmitted: (message: string) => void;
}) {
  const [state, setState] = useState<'' | 'problems' | JobState>('');
  const byId = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const runs = useMemo(
    () =>
      jobs
        .filter((j) => !ruleId || j.ruleId === ruleId)
        .filter((j) => !state || (state === 'problems' ? unsentItems(j).length > 0 : j.state === state))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [jobs, ruleId, state],
  );

  const resubmit = (job: SendJob, itemIds?: string[]) => {
    const created = resubmitJob(job.id, user, itemIds);
    if (created) onResubmitted(`${created.items.length} e-mail${created.items.length === 1 ? '' : 's'} of "${job.ruleName}" resubmitted — sending now`);
  };

  return (
    <SidePanel title={ruleId ? `Send history — ${ruleName ?? 'rule'}` : 'Send history — all rules'} wide onClose={onClose}>
      <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <select className="select" value={state} onChange={(e) => setState(e.target.value as typeof state)} aria-label="Run status">
          <option value="">Status: All</option>
          <option value="problems">With unsent e-mails</option>
          {(Object.keys(STATE_PILL) as JobState[]).map((s) => (
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
        Runs are kept in this browser (the latest 50). Resubmitting sends the e-mails that were not sent again, as a new run — e-mails already sent are never sent
        twice.
      </p>
      {runs.map((j) => (
        <JobCard key={j.id} job={j} showRule={!ruleId} byId={byId} onResubmit={resubmit} />
      ))}
      {runs.length === 0 && <div className="empty muted">{state ? 'No runs with this status.' : 'Nothing has been sent yet.'}</div>}
    </SidePanel>
  );
}
