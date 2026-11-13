import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Copy, History, Pause, Pencil, Play, Plus, Search, Send, Trash2, XCircle } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { Pagination, RowMenu, SortTh, Tabs, Toast } from '../components/ui';
import { EmailTemplatePanel } from '../components/EmailTemplatePanel';
import { SendHistoryPanel } from '../components/SendHistoryPanel';
import { DeleteHistoryPanel } from '../components/DeleteHistoryPanel';
import { useTable } from '../lib/useTable';
import { fmtAgo, fmtNumber } from '../lib/format';
import { clickableRow } from '../lib/clickableRow';
import {
  ACTION_DEFS,
  deleteActionRule,
  deleteEmailTemplate,
  describeAction,
  describeConditions,
  describeScope,
  newId,
  ruleMatcher,
  ruleFetchPlan,
  saveActionRule,
  useActionRules,
  useEmailTemplates,
  withEvaluation,
  type ActionRule,
  type EmailTemplate,
} from '../lib/actions';
import { LIVE_GROUPS, type FetchPlan } from '../data/liveResources';
import { useEvaluationSync } from '../lib/useEvaluationSync';
import { MAX_FAILURES, cancelJob, isActiveJob, jobProgress, latestJob, pauseJob, resumeJob, unsentItems, useSendJobs, type SendJob } from '../lib/sendJobs';
import {
  cancelDeleteJob,
  deleteProgress,
  isActiveDeleteJob,
  latestDeleteJob,
  pauseDeleteJob,
  resumeDeleteJob,
  useDeleteJobs,
  type DeleteJob,
} from '../lib/deleteJobs';

type Tab = 'rules' | 'templates';

/** Status of the rule's latest send job (e-mail rules) — progress, pause / resume, errors, link to the history. */
function SendStatus({ rule, job, runs, onHistory }: { rule: ActionRule; job?: SendJob; runs: number; onHistory: () => void }) {
  if (!job) return <span className="muted">{rule.action.kind === 'email' ? 'Not sent' : 'Evaluation only'}</span>;
  const p = jobProgress(job);
  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const history = (
    <button className="link-btn" onClick={stop(onHistory)}>
      History ({runs} run{runs === 1 ? '' : 's'})
    </button>
  );
  return (
    <div className="send-status">
      <JobStatus job={job} p={p} stop={stop} />
      {history}
    </div>
  );
}

/** Status of the rule's latest delete job — progress, pause / resume, deleted / failed counts, link to the history. */
function DeleteStatus({ job, runs, onHistory }: { job?: DeleteJob; runs: number; onHistory: () => void }) {
  if (!job) return <span className="muted">Not run</span>;
  const p = deleteProgress(job);
  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const ended = job.state === 'completed' || job.state === 'cancelled';
  return (
    <div className="send-status">
      {job.state === 'running' ? (
        <span className="pill pill-yes">Deleting · {p.pct}%</span>
      ) : job.state === 'paused' ? (
        <span className="pill pill-no">Paused · {p.pct}%</span>
      ) : job.state === 'cancelled' ? (
        <span className="pill pill-no">Cancelled</span>
      ) : p.failed ? (
        <span className="pill pill-bad">Completed with errors</span>
      ) : (
        <span className="pill pill-yes">Deleted</span>
      )}
      {!ended && (
        <div className={`progress ${job.state === 'paused' ? 'paused' : ''}`}>
          <div style={{ width: `${p.pct}%` }} />
        </div>
      )}
      <div className="small muted">
        {p.deleted} of {p.total} deleted
        {p.failed ? <span className="bad-text"> · {p.failed} failed</span> : ''}
        {ended ? ` · ${fmtAgo(job.finishedAt ?? job.updatedAt)}` : ''}
      </div>
      {job.state === 'running' && (
        <button className="btn btn-sm" onClick={stop(() => pauseDeleteJob(job.id))}>
          <Pause size={13} /> Pause
        </button>
      )}
      {job.state === 'paused' && (
        <button className="btn btn-sm" onClick={stop(() => resumeDeleteJob(job.id))}>
          <Play size={13} /> Resume
        </button>
      )}
      <button className="link-btn" onClick={stop(onHistory)}>
        History ({runs} run{runs === 1 ? '' : 's'})
      </button>
    </div>
  );
}

function JobStatus({ job, p, stop }: { job: SendJob; p: ReturnType<typeof jobProgress>; stop: (fn: () => void) => (e: MouseEvent) => void }) {
  const unsent = unsentItems(job).length;
  const bar = (cls = '') => (
    <div className={`progress ${cls}`}>
      <div style={{ width: `${p.pct}%` }} />
    </div>
  );
  switch (job.state) {
    case 'running':
      return (
        <div className="send-status">
          <span className="pill pill-yes">Sending · {p.pct}%</span>
          {bar()}
          <div className="small muted">
            {p.sent} of {p.total} sent{p.retrying ? ` · ${p.retrying} retrying` : ''}
          </div>
          {p.retrying > 0 && job.lastError && <div className="err">{job.lastError}</div>}
          <button className="btn btn-sm" onClick={stop(() => pauseJob(job.id))}>
            <Pause size={13} /> Pause
          </button>
        </div>
      );
    case 'paused':
    case 'failed':
      return (
        <div className="send-status">
          <span className={`pill ${job.state === 'failed' ? 'pill-bad' : 'pill-no'}`}>
            {job.state === 'failed' ? 'Failed — paused' : 'Paused'} · {p.pct}%
          </span>
          {bar(job.state)}
          <div className="small muted">
            {p.sent} of {p.total} sent
          </div>
          {job.lastError && <div className="err">{job.lastError}</div>}
          <button className="btn btn-sm" onClick={stop(() => resumeJob(job.id))}>
            <Play size={13} /> Resume
          </button>
        </div>
      );
    case 'completed':
      return (
        <div className="send-status">
          <span className="pill pill-yes">Sent</span>
          <div className="small muted">
            {p.total} e-mail{p.total === 1 ? '' : 's'} · {fmtAgo(job.finishedAt ?? job.updatedAt)}
          </div>
        </div>
      );
    case 'cancelled':
      return (
        <div className="send-status">
          <span className="pill pill-no">Cancelled</span>
          <div className="small muted">
            {p.sent} of {p.total} sent · {fmtAgo(job.finishedAt ?? job.updatedAt)}
          </div>
          {unsent > 0 && <div className="small muted">{unsent} not sent — can be resubmitted from the history</div>}
        </div>
      );
  }
}

export function ActionCenter() {
  const { environments, resources, user, loading, resourceLoads, showCachedResources } = useStore();
  const rules = useActionRules();
  const templates = useEmailTemplates();
  const jobs = useSendJobs();
  const deleteJobs = useDeleteJobs();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>('rules');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState('');
  // undefined = closed; {} = new template; otherwise edit / duplicate.
  const [editingTpl, setEditingTpl] = useState<Partial<EmailTemplate> | undefined>();
  // undefined = closed; {} = all rules; otherwise one rule.
  const [history, setHistory] = useState<{ ruleId?: string; ruleName?: string } | undefined>();
  const [deleteHistory, setDeleteHistory] = useState<{ ruleId?: string; ruleName?: string } | undefined>();
  const runCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const j of [...jobs, ...deleteJobs]) m.set(j.ruleId, (m.get(j.ruleId) ?? 0) + 1);
    return m;
  }, [jobs, deleteJobs]);

  // Toast handed over by the rule builder after saving / evaluating.
  const handedToast = (location.state as { toast?: string } | null)?.toast;
  const [seenLocation, setSeenLocation] = useState<typeof location | null>(null);
  if (seenLocation !== location) {
    setSeenLocation(location);
    if (handedToast) setToast(handedToast);
  }
  useEffect(() => {
    if (handedToast) navigate(location.pathname, { replace: true, state: null });
  }, [handedToast, location.pathname, navigate]);

  const monitored = useMemo(() => environments.filter((e) => e.monitored), [environments]);
  const [cacheShown, setCacheShown] = useState(false);
  useEffect(() => {
    showCachedResources(monitored.map((e) => e.id));
    // Marks that the cached rows are in, so the first evaluation waits for them.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCacheShown(true);
  }, [monitored, showCachedResources]);
  const scoped = useMemo(() => {
    const ids = new Set(monitored.map((e) => e.id));
    return resources.filter((r) => ids.has(r.envId));
  }, [monitored, resources]);

  // A rule gets its first evaluation automatically (new, duplicated or imported rules): the environments and
  // resources are synced from Dataverse first, then the rule is evaluated once the inventory has settled.
  // The sync covers what all the pending rules need together (an empty envIds / types list means "all").
  const pendingNeeds = useMemo(() => {
    const pending = rules.filter((r) => !r.evaluations.length);
    const all = <T,>(lists: T[][]) => (lists.some((l) => !l.length) ? [] : [...new Set(lists.flat())]);
    return {
      envIds: all(pending.map((r) => r.envIds)),
      types: all(pending.map((r) => r.types)),
      conditions: pending.flatMap((r) => r.conditions),
      action: pending.find((r) => r.action.kind === 'email')?.action ?? pending[0]?.action ?? { kind: 'delete' as const },
    };
  }, [rules]);
  // Fetch plan: everything any pending rule needs (e.g. custom flags for delete rules, runs for e-mails).
  const pendingPlan = useMemo<FetchPlan>(() => {
    const plans = rules.filter((r) => !r.evaluations.length).map(ruleFetchPlan);
    return {
      groups: LIVE_GROUPS.filter((g) => plans.some((p) => p.groups.includes(g))),
      solutions: plans.some((p) => p.solutions),
      runs: plans.some((p) => p.runs),
      customFlags: plans.some((p) => p.customFlags),
    };
  }, [rules]);
  const [sync, runSync] = useEvaluationSync(pendingNeeds, pendingPlan);
  const syncedFor = useRef(new Set<string>());
  const settled =
    cacheShown &&
    !loading &&
    monitored.every((e) => (pendingNeeds.envIds.length && !pendingNeeds.envIds.includes(e.id)) || resourceLoads[e.id]?.state !== 'loading');
  useEffect(() => {
    const pending = rules.filter((r) => !r.evaluations.length);
    if (!pending.length) return;
    // Rules added while a sync runs are synced once it ends (the running sync was planned without them).
    if (sync.status === 'syncing') return;
    const unsynced = pending.filter((r) => !syncedFor.current.has(r.id));
    if (unsynced.length) {
      for (const r of unsynced) syncedFor.current.add(r.id);
      void runSync();
      return;
    }
    if (sync.status !== 'done' || !settled) return;
    const at = new Date().toISOString();
    for (const r of pending) saveActionRule(withEvaluation(r, scoped, environments, at, user.fullName || undefined));
  }, [sync.status, settled, rules, scoped, environments, user.fullName, runSync]);

  const matchCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rules) m.set(r.id, scoped.filter(ruleMatcher(r)).length);
    return m;
  }, [rules, scoped]);

  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rules) {
      const id = r.action.kind === 'email' ? r.action.email?.templateId : undefined;
      if (id) m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [rules]);

  const needle = q.trim().toLowerCase();
  const ruleRows = useMemo(
    () => rules.filter((r) => !needle || r.name.toLowerCase().includes(needle) || r.description.toLowerCase().includes(needle)),
    [rules, needle],
  );
  const tplRows = useMemo(
    () => templates.filter((t) => !needle || t.name.toLowerCase().includes(needle) || t.subject.toLowerCase().includes(needle)),
    [templates, needle],
  );

  const lastEval = (r: ActionRule) => r.evaluations[r.evaluations.length - 1];
  const ruleTable = useTable<ActionRule>(
    ruleRows,
    {
      name: (r) => r.name,
      action: (r) => ACTION_DEFS[r.action.kind].label,
      matches: (r) => matchCounts.get(r.id) ?? 0,
      evaluated: (r) => lastEval(r)?.at ?? '',
      updated: (r) => r.updatedAt,
    },
    'name',
  );
  const tplTable = useTable<EmailTemplate>(
    tplRows,
    {
      name: (t) => t.name,
      subject: (t) => t.subject,
      usage: (t) => usage.get(t.id) ?? 0,
      updated: (t) => t.updatedAt,
    },
    'name',
  );
  const ruleSort = { sortKey: ruleTable.sortKey, sortDir: ruleTable.sortDir, onSort: ruleTable.toggleSort };
  const tplSort = { sortKey: tplTable.sortKey, sortDir: tplTable.sortDir, onSort: tplTable.toggleSort };

  const duplicateRule = (r: ActionRule) => {
    const now = new Date().toISOString();
    const names = new Set(rules.map((x) => x.name.toLowerCase()));
    let name = `${r.name} (copy)`;
    for (let i = 2; names.has(name.toLowerCase()); i++) name = `${r.name} (copy ${i})`;
    saveActionRule({ ...structuredClone(r), id: newId('rule'), name, createdAt: now, updatedAt: now, evaluations: [] });
    setToast(`"${name}" created`);
  };

  const duplicateTemplate = (t: EmailTemplate) => {
    const names = new Set(templates.map((x) => x.name.toLowerCase()));
    let name = `${t.name} (copy)`;
    for (let i = 2; names.has(name.toLowerCase()); i++) name = `${t.name} (copy ${i})`;
    setEditingTpl({ name, subject: t.subject, body: t.body, design: t.design });
  };

  const isRules = tab === 'rules';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Action Center</h1>
          <p>Define trigger conditions over your monitored resources and preview the action that would be applied to them.</p>
        </div>
        <div className="actions">
          {isRules ? (
            <>
              <button className="btn" onClick={() => setHistory({})}>
                <History size={16} /> Send history
              </button>
              {(deleteJobs.length > 0 || rules.some((r) => r.action.kind === 'delete')) && (
                <button className="btn" onClick={() => setDeleteHistory({})}>
                  <History size={16} /> Delete history
                </button>
              )}
              <button className="btn btn-primary" onClick={() => navigate('/actions/new')}>
                <Plus size={16} /> New action rule
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setEditingTpl({})}>
              <Plus size={16} /> New template
            </button>
          )}
        </div>
      </div>

      <div className="notice" style={{ marginBottom: 16 }}>
        <div>
          <strong>E-mail rules can be sent.</strong> Open a rule (or choose <em>Evaluate &amp; send</em>), review the evaluation and submit it — the e-mails are sent from
          your mailbox one by one while this app stays open; progress is shown in the Status column and can be paused or resumed. Failed e-mails are retried
          later; after {MAX_FAILURES} failures sending pauses with a notification. <em>Send history</em> lists every run with the outcome of each e-mail, and
          e-mails that were not sent can be resubmitted from there. <strong>Delete rules can be run too</strong> (apps, flows and custom tables): after a typed
          confirmation the resources are deleted one by one; <em>Delete history</em> shows which ones were deleted or failed, and failed ones can be retried.
          Other actions are evaluation only — no resources are changed.
        </div>
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={(t) => {
          setTab(t);
          setQ('');
        }}
        tabs={[
          { key: 'rules', label: 'Action Rules', count: rules.length },
          { key: 'templates', label: 'E-mail Templates', count: templates.length },
        ]}
      />

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={16} />
            <input placeholder={isRules ? 'Search rules...' : 'Search templates...'} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {isRules ? (
          <>
            <div className="table-wrap rows-10">
              <table className="table">
                <thead>
                  <tr>
                    <SortTh k="name" label="Rule" {...ruleSort} />
                    <th>Trigger</th>
                    <SortTh k="action" label="Action" {...ruleSort} />
                    <SortTh k="matches" label="Matches now" {...ruleSort} />
                    <SortTh k="evaluated" label="Last evaluation" {...ruleSort} />
                    <th>Status</th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {ruleTable.pageRows.map((r) => {
                    const ev = lastEval(r);
                    const job = latestJob(jobs, r.id);
                    const active = job && isActiveJob(job) ? job : undefined;
                    const isDelete = r.action.kind === 'delete';
                    const delJob = latestDeleteJob(deleteJobs, r.id);
                    const activeDel = delJob && isActiveDeleteJob(delJob) ? delJob : undefined;
                    return (
                      <tr key={r.id} className="clickable" {...clickableRow(() => navigate(`/actions/${r.id}`))}>
                        <td>
                          <strong>{r.name}</strong>
                          {r.description && <div className="small muted wrap">{r.description}</div>}
                        </td>
                        <td className="wrap trigger-cell" title={`${describeScope(r, environments)}\n${describeConditions(r)}`}>
                          <div className="clamp-2">{describeScope(r, environments)}</div>
                          <div className="small muted clamp-2">{describeConditions(r)}</div>
                        </td>
                        <td>
                          <span className={`pill ${r.action.kind === 'delete' ? 'pill-bad' : 'pill-no'}`}>{ACTION_DEFS[r.action.kind].label}</span>
                          <div className="small muted">{describeAction(r.action)}</div>
                        </td>
                        <td>{fmtNumber(matchCounts.get(r.id) ?? 0)}</td>
                        <td>
                          {ev ? (
                            <>
                              <div>{fmtAgo(ev.at)}</div>
                              <div className="small muted">
                                {fmtNumber(ev.matched)} matched · {fmtNumber(ev.applicable)} applicable
                              </div>
                            </>
                          ) : (
                            <span className="muted">Never</span>
                          )}
                        </td>
                        <td>
                          {isDelete ? (
                            <DeleteStatus job={delJob} runs={runCounts.get(r.id) ?? 0} onHistory={() => setDeleteHistory({ ruleId: r.id, ruleName: r.name })} />
                          ) : (
                            <SendStatus rule={r} job={job} runs={runCounts.get(r.id) ?? 0} onHistory={() => setHistory({ ruleId: r.id, ruleName: r.name })} />
                          )}
                        </td>
                        <td>
                          <RowMenu
                            items={[
                              {
                                label: r.action.kind === 'email' && !active ? 'Evaluate & send' : isDelete && !activeDel ? 'Evaluate & delete' : 'Evaluate',
                                icon: r.action.kind === 'email' && !active ? <Send size={14} /> : isDelete && !activeDel ? <Trash2 size={14} /> : <Play size={14} />,
                                onClick: () => navigate(`/actions/${r.id}?step=review`),
                              },
                              ...(activeDel?.state === 'running' ? [{ label: 'Pause deleting', icon: <Pause size={14} />, onClick: () => pauseDeleteJob(activeDel.id) }] : []),
                              ...(activeDel?.state === 'paused' ? [{ label: 'Resume deleting', icon: <Play size={14} />, onClick: () => resumeDeleteJob(activeDel.id) }] : []),
                              ...(activeDel
                                ? [
                                    {
                                      label: 'Cancel deleting',
                                      icon: <XCircle size={14} />,
                                      danger: true,
                                      onClick: () => {
                                        cancelDeleteJob(activeDel.id);
                                        setToast(`Deleting for "${r.name}" cancelled — ${deleteProgress(activeDel).deleted} of ${activeDel.items.length} resources were deleted`);
                                      },
                                    },
                                  ]
                                : []),
                              ...(delJob ? [{ label: 'Delete history', icon: <History size={14} />, onClick: () => setDeleteHistory({ ruleId: r.id, ruleName: r.name }) }] : []),
                              ...(active?.state === 'running' ? [{ label: 'Pause sending', icon: <Pause size={14} />, onClick: () => pauseJob(active.id) }] : []),
                              ...(active && active.state !== 'running' ? [{ label: 'Resume sending', icon: <Play size={14} />, onClick: () => resumeJob(active.id) }] : []),
                              ...(active
                                ? [
                                    {
                                      label: 'Cancel sending',
                                      icon: <XCircle size={14} />,
                                      danger: true,
                                      onClick: () => {
                                        cancelJob(active.id);
                                        setToast(`Sending for "${r.name}" cancelled — ${jobProgress(active).sent} of ${active.items.length} e-mails were sent`);
                                      },
                                    },
                                  ]
                                : []),
                              ...(job ? [{ label: 'Send history', icon: <History size={14} />, onClick: () => setHistory({ ruleId: r.id, ruleName: r.name }) }] : []),
                              { label: 'Edit', icon: <Pencil size={14} />, onClick: () => navigate(`/actions/${r.id}`) },
                              { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => duplicateRule(r) },
                              {
                                label: 'Delete',
                                icon: <Trash2 size={14} />,
                                danger: true,
                                onClick: () => {
                                  if (active) cancelJob(active.id);
                                  if (activeDel) cancelDeleteJob(activeDel.id);
                                  deleteActionRule(r.id);
                                  setToast(
                                    active ? `"${r.name}" deleted and its sending cancelled` : activeDel ? `"${r.name}" deleted and its deleting cancelled` : `"${r.name}" deleted`,
                                  );
                                },
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {ruleTable.total === 0 && (
                    <tr>
                      <td className="empty" colSpan={7}>
                        {rules.length ? 'No rules match your search.' : 'No action rules yet. Create one to preview which resources it would affect.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={ruleTable.page} pageSize={ruleTable.pageSize} total={ruleTable.total} onPage={ruleTable.setPage} />
          </>
        ) : (
          <>
            <div className="table-wrap rows-10">
              <table className="table">
                <thead>
                  <tr>
                    <SortTh k="name" label="Template" {...tplSort} />
                    <SortTh k="subject" label="Subject" {...tplSort} />
                    <SortTh k="usage" label="Used by" {...tplSort} />
                    <SortTh k="updated" label="Updated" {...tplSort} />
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {tplTable.pageRows.map((t) => {
                    const used = usage.get(t.id) ?? 0;
                    return (
                      <tr key={t.id} className="clickable" {...clickableRow(() => setEditingTpl(t))}>
                        <td>
                          <strong>{t.name}</strong>
                        </td>
                        <td className="wrap">{t.subject}</td>
                        <td>{used ? `${used} rule${used === 1 ? '' : 's'}` : <span className="muted">—</span>}</td>
                        <td>{fmtAgo(t.updatedAt)}</td>
                        <td>
                          <RowMenu
                            items={[
                              { label: 'Edit', icon: <Pencil size={14} />, onClick: () => setEditingTpl(t) },
                              { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => duplicateTemplate(t) },
                              {
                                label: 'Delete',
                                icon: <Trash2 size={14} />,
                                danger: true,
                                onClick: () => {
                                  deleteEmailTemplate(t.id);
                                  setToast(used ? `"${t.name}" deleted — ${used} rule${used === 1 ? '' : 's'} keep their copy of the message` : `"${t.name}" deleted`);
                                },
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {tplTable.total === 0 && (
                    <tr>
                      <td className="empty" colSpan={5}>
                        {templates.length ? 'No templates match your search.' : 'No e-mail templates yet. Save one here or from the e-mail step of a rule.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={tplTable.page} pageSize={tplTable.pageSize} total={tplTable.total} onPage={tplTable.setPage} />
          </>
        )}
      </div>

      {editingTpl && (
        <EmailTemplatePanel
          template={editingTpl}
          existingNames={templates}
          onClose={() => setEditingTpl(undefined)}
          onSaved={(t) => setToast(`Template "${t.name}" saved`)}
        />
      )}
      {history && (
        <SendHistoryPanel
          jobs={jobs}
          ruleId={history.ruleId}
          ruleName={history.ruleName}
          user={user.fullName || undefined}
          onClose={() => setHistory(undefined)}
          onResubmitted={setToast}
        />
      )}
      {deleteHistory && (
        <DeleteHistoryPanel
          jobs={deleteJobs}
          ruleId={deleteHistory.ruleId}
          ruleName={deleteHistory.ruleName}
          user={user.fullName || undefined}
          onClose={() => setDeleteHistory(undefined)}
          onRetried={setToast}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
