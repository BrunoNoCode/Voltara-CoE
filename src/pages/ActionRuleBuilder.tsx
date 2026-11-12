import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Download, Mail, Plus, RefreshCw, Search, Send, Trash2 } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { ChipInput, Pagination, SidePanel, SortTh, Stepper } from '../components/ui';
import { EmailFields, EmailTemplatePanel } from '../components/EmailTemplatePanel';
import { useTable } from '../lib/useTable';
import { TYPE_GROUPS, downloadCsv, fmtNumber } from '../lib/format';
import type { Resource, ResourceType } from '../data/types';
import {
  ACTION_DEFS,
  ACTION_FIELDS,
  ACTION_KINDS,
  FIELD_DEFS,
  NOT_IN_SOLUTION,
  describeAction,
  describeConditions,
  describeScope,
  fieldKind,
  isConditionComplete,
  newActionCondition,
  newId,
  emailHtml,
  planRule,
  ruleMatcher,
  saveActionRule,
  saveEmailTemplate,
  supportsAction,
  useActionRules,
  useEmailTemplates,
  withEvaluation,
  type ActionCondition,
  type ActionField,
  type ActionKind,
  type ActionRule,
  type PlannedEmail,
  type PlannedItem,
  type RuleAction,
  type ShareRole,
} from '../lib/actions';

import { createSendJob, isActiveJob, useSendJobs } from '../lib/sendJobs';
import { createDeleteJob, isActiveDeleteJob, useDeleteJobs } from '../lib/deleteJobs';
import { useEvaluationSync, type EvaluationSync } from '../lib/useEvaluationSync';

const STEPS = ['Trigger', 'Action', 'Evaluation'];

const emptyAction = (kind: ActionKind): RuleAction => {
  switch (kind) {
    case 'email':
      return {
        kind,
        email: { subject: '', body: '', recipients: 'owners', to: [], cc: [] },
      };
    case 'share':
      return { kind, share: { users: [], role: 'User' } };
    case 'reassign':
      return { kind, newOwner: '' };
    default:
      return { kind };
  }
};

const newRule = (): ActionRule => {
  const now = new Date().toISOString();
  return {
    id: newId('rule'),
    name: '',
    description: '',
    envIds: [],
    types: [],
    conditions: [],
    match: 'all',
    excludeSystem: true,
    action: emptyAction('email'),
    createdAt: now,
    updatedAt: now,
    evaluations: [],
  };
};

const uniqSorted = (xs: Iterable<string | undefined>) => [...new Set([...xs].filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b));

export function ActionRuleBuilder() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { environments, resources, tags, user, loading, resourceLoads, showCachedResources } = useStore();
  const rules = useActionRules();
  const templates = useEmailTemplates();
  const existing = id ? rules.find((r) => r.id === id) : undefined;

  const [rule, setRule] = useState<ActionRule>(() => (existing ? structuredClone(existing) : newRule()));
  const [step, setStep] = useState(() => (existing && params.get('step') === 'review' ? 2 : 0));
  const [saveAsOpen, setSaveAsOpen] = useState(false);

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

  // Every evaluation first brings what the rule needs up to date (its environments, resource types and lookups),
  // reusing data synced less than an hour ago.
  const [sync, runSync] = useEvaluationSync(rule);
  useEffect(() => {
    if (step === 2) void runSync();
  }, [step, runSync]);
  const synced = sync.status === 'done';

  // Opening the evaluation from the Action Center ("Evaluate" / "Evaluate & send") records it right away,
  // once the sync is done and the resource inventory has settled so the counts are not taken from a half-loaded list.
  const autoEvalAt = useRef<string | undefined>(undefined);
  const settled = cacheShown && !loading && monitored.every((e) => (rule.envIds.length && !rule.envIds.includes(e.id)) || resourceLoads[e.id]?.state !== 'loading');
  useEffect(() => {
    if (autoEvalAt.current || !existing || !synced || !settled || params.get('step') !== 'review') return;
    const at = new Date().toISOString();
    autoEvalAt.current = at;
    const evaluated = withEvaluation(existing, scoped, environments, at, user.fullName || undefined);
    saveActionRule(evaluated);
    setRule((r) => ({ ...r, evaluations: evaluated.evaluations }));
  }, [existing, synced, settled, params, scoped, environments, user.fullName]);

  const matches = useMemo(() => scoped.filter(ruleMatcher(rule)), [scoped, rule]);
  const plan = useMemo(() => (step === 2 ? planRule(rule, scoped, environments) : undefined), [step, rule, scoped, environments]);
  const jobs = useSendJobs();
  const activeJob = jobs.find((j) => j.ruleId === rule.id && isActiveJob(j));
  const deleteJobs = useDeleteJobs();
  const activeDelete = deleteJobs.find((j) => j.ruleId === rule.id && isActiveDeleteJob(j));
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState('');
  // Confirmations are reset when the step changes (adjusting state during render, not in an effect).
  const [confirmStep, setConfirmStep] = useState(step);
  if (confirmStep !== step) {
    setConfirmStep(step);
    setConfirmSend(false);
    setConfirmDelete(false);
    setDeleteTyped('');
  }

  if (id && !existing) {
    return (
      <>
        <div className="breadcrumb">
          <Link to="/actions">Action Center</Link>
          <ChevronRight size={14} /> Not found
        </div>
        <div className="card card-pad">
          <p>This action rule does not exist in this browser.</p>
          <Link className="btn" to="/actions">
            Back to Action Center
          </Link>
        </div>
      </>
    );
  }

  const update = (patch: Partial<ActionRule>) => setRule((r) => ({ ...r, ...patch }));
  const setAction = (a: RuleAction) => update({ action: a });

  const trimmed = rule.name.trim();
  const duplicateName = rules.some((r) => r.id !== rule.id && r.name.trim().toLowerCase() === trimmed.toLowerCase());
  const triggerValid = !!trimmed && !duplicateName && rule.conditions.every(isConditionComplete);
  const a = rule.action;
  const actionValid =
    a.kind === 'email'
      ? !!a.email?.subject.trim() && (!!a.email.body.trim() || !!a.email.design) && (a.email.recipients === 'owners' || a.email.to.length > 0)
      : a.kind === 'share'
        ? !!a.share?.users.length
        : a.kind === 'reassign'
          ? !!a.newOwner?.trim()
          : true;
  const canNext = step === 0 ? triggerValid : actionValid;

  const emails = a.kind === 'email' ? (plan?.emails ?? []) : [];
  const canSend = a.kind === 'email' && actionValid && emails.length > 0 && !activeJob;
  const toDelete = a.kind === 'delete' ? (plan?.items.filter((i) => i.supported && !i.noChange).length ?? 0) : 0;
  const canDelete = a.kind === 'delete' && toDelete > 0 && !activeDelete;

  // The Evaluation step is the evaluation itself, so saving from there records it in the rule history
  // (replacing the automatic entry of this visit, so a new rule is evaluated on its first save).
  const persist = (mode: 'save' | 'send' | 'delete') => {
    const now = new Date().toISOString();
    const history = rule.evaluations.filter((e) => e.at !== autoEvalAt.current);
    const final = withEvaluation({ ...rule, name: trimmed, updatedAt: now, evaluations: history }, scoped, environments, now, user.fullName || undefined);
    const p = planRule(final, scoped, environments);
    saveActionRule(final);
    if (mode === 'send') {
      const job = createSendJob(final.id, final.name, p.emails, user.fullName || undefined);
      navigate('/actions', {
        state: {
          toast: `Sending ${job.items.length} e-mail${job.items.length === 1 ? '' : 's'} for "${final.name}" — keep the app open until it completes`,
        },
      });
      return;
    }
    if (mode === 'delete') {
      // Exactly the resources counted in the confirmation (the inventory may have changed since).
      if (!plan) return;
      const job = createDeleteJob(final.id, final.name, plan.items, environments, user.fullName || undefined);
      navigate('/actions', {
        state: {
          toast: `Deleting ${job.items.length} resource${job.items.length === 1 ? '' : 's'} for "${final.name}" — keep the app open until it completes`,
        },
      });
      return;
    }
    navigate('/actions', {
      state: { toast: `"${final.name}" saved — no changes were made` },
    });
  };

  return (
    <>
      <div className="breadcrumb">
        <Link to="/actions">Action Center</Link>
        <ChevronRight size={14} /> {existing ? existing.name : 'New action rule'}
      </div>
      <div className="page-head">
        <div>
          <h1>{existing ? 'Edit action rule' : 'New action rule'}</h1>
          <p>
            Choose which resources the rule targets and the action to apply, then check the evaluation of every affected resource. E-mail rules can be sent and delete rules run
            from the evaluation; other actions are evaluation only.
          </p>
        </div>
      </div>

      <div className="card">
        <Stepper steps={STEPS} current={step} />
        <div className="wizard-body">
          {step === 0 && <TriggerStep rule={rule} update={update} scoped={scoped} tagNames={tags.map((t) => t.name)} duplicateName={duplicateName} />}
          {step === 1 && (
            <ActionStep
              action={a}
              setAction={setAction}
              matches={matches}
              owners={uniqSorted(scoped.flatMap((r) => [r.ownerEmail ?? r.ownerUpn, r.owner]))}
              onSaveAs={() => setSaveAsOpen(true)}
            />
          )}
          {step === 2 && !synced && (
            <div className="sync-wait">
              <RefreshCw size={20} className="spin" />
              <div>
                <strong>Syncing environments and resources…</strong>
                <div className="small muted">
                  {sync.total ? `${fmtNumber(sync.done)} of ${fmtNumber(sync.total)} environments in scope checked. ` : ''}
                  Only the resource types and details this rule uses are fetched; data synced less than an hour ago is reused. The evaluation is shown as soon as the inventory is
                  up to date.
                </div>
              </div>
            </div>
          )}
          {step === 2 && synced && plan && <ReviewStep rule={rule} plan={plan} activeJob={a.kind === 'delete' ? !!activeDelete : !!activeJob} loaded={scoped.length} sync={sync} />}
        </div>
        <div className="wizard-foot">
          <button className="btn" onClick={() => navigate('/actions')}>
            Cancel
          </button>
          <span className="small muted">
            Matches <strong>{fmtNumber(matches.length)}</strong> of {fmtNumber(scoped.length)} loaded resources
          </span>
          <span className="spacer" />
          {step > 0 && (
            <button className="btn" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < 2 ? (
            <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : confirmDelete ? (
            <span className="send-confirm">
              <strong className="bad-text">
                Permanently delete {fmtNumber(toDelete)} resource
                {toDelete === 1 ? '' : 's'}? Type {toDelete} to confirm:
              </strong>
              <input
                className="input"
                style={{ width: 90 }}
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                aria-label="Number of resources to delete"
                autoFocus
              />
              <button className="btn" onClick={() => setConfirmDelete(false)}>
                Not now
              </button>
              <button className="btn btn-danger" disabled={deleteTyped.trim() !== String(toDelete)} onClick={() => persist('delete')}>
                <Trash2 size={15} /> Delete permanently
              </button>
            </span>
          ) : confirmSend ? (
            <span className="send-confirm">
              <strong>
                Send {fmtNumber(emails.length)} e-mail
                {emails.length === 1 ? '' : 's'} from your mailbox?
              </strong>
              <button className="btn" onClick={() => setConfirmSend(false)}>
                Not now
              </button>
              <button className="btn btn-primary" onClick={() => persist('send')}>
                <Send size={15} /> Confirm &amp; send
              </button>
            </span>
          ) : (
            <>
              <button className={a.kind === 'email' || a.kind === 'delete' ? 'btn' : 'btn btn-primary'} disabled={!synced} onClick={() => persist('save')}>
                Save rule
              </button>
              {a.kind === 'delete' && (
                <button
                  className="btn btn-danger"
                  disabled={!canDelete || !synced}
                  title={activeDelete ? 'This rule is already deleting — wait for it to finish or cancel it in the Action Center' : !toDelete ? 'Nothing to delete' : undefined}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={15} /> Delete {fmtNumber(toDelete)} resource
                  {toDelete === 1 ? '' : 's'}
                </button>
              )}
              {a.kind === 'email' && (
                <button
                  className="btn btn-primary"
                  disabled={!canSend || !synced}
                  title={activeJob ? 'This rule is already sending — pause or cancel it in the Action Center first' : !emails.length ? 'No e-mails to send' : undefined}
                  onClick={() => setConfirmSend(true)}
                >
                  <Send size={15} /> Send {fmtNumber(emails.length)} e-mail
                  {emails.length === 1 ? '' : 's'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {saveAsOpen && a.email && (
        <EmailTemplatePanel
          template={{
            name: '',
            subject: a.email.subject,
            body: a.email.body,
            design: a.email.design,
          }}
          existingNames={templates}
          onClose={() => setSaveAsOpen(false)}
          onSaved={(t) => setAction({ ...a, email: { ...a.email!, templateId: t.id } })}
        />
      )}
    </>
  );
}

/* ---------- Step 1: trigger ---------- */

/** Toggles `id` in an explicit selection; returns [] ("all") when everything ends up selected, and never empties the selection. */
function toggleIn<T>(current: T[], id: T, all: T[]): T[] {
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  if (!next.length) return current;
  return all.every((x) => next.includes(x)) ? [] : next;
}

function TriggerStep({
  rule,
  update,
  scoped,
  tagNames,
  duplicateName,
}: {
  rule: ActionRule;
  update: (patch: Partial<ActionRule>) => void;
  scoped: Resource[];
  tagNames: string[];
  duplicateName: boolean;
}) {
  const { environments } = useStore();
  const monitored = environments.filter((e) => e.monitored).sort((x, y) => x.name.localeCompare(y.name));
  // An empty list means "all" (and also covers environments / types added later). Unticking one item while
  // "all" is on switches to an explicit list of everything else; ticking the last missing one goes back to "all".
  const allEnvIds = monitored.map((e) => e.id);
  const allEnvs = !rule.envIds.length;
  const envOn = (id: string) => allEnvs || rule.envIds.includes(id);
  const envCount = allEnvs ? allEnvIds.length : allEnvIds.filter((id) => rule.envIds.includes(id)).length;
  const toggleEnv = (envId: string) =>
    update({
      envIds: toggleIn(allEnvs ? allEnvIds : rule.envIds.filter((x) => allEnvIds.includes(x)), envId, allEnvIds),
    });
  // The last type cannot be removed: an empty list means "all types".
  const toggleType = (t: ResourceType) =>
    !(rule.types.length === 1 && rule.types[0] === t) &&
    update({
      types: rule.types.includes(t) ? rule.types.filter((x) => x !== t) : [...rule.types, t],
    });
  const setCond = (c: ActionCondition) => update({ conditions: rule.conditions.map((x) => (x.id === c.id ? c : x)) });

  // Resources in the chosen scope feed the value pickers.
  const inScope = useMemo(() => scoped.filter(ruleMatcher({ ...rule, conditions: [] })), [scoped, rule]);
  const options = useMemo<Partial<Record<ActionField, string[]>>>(
    () => ({
      Owner: uniqSorted(inScope.flatMap((r) => [r.owner, r.ownerEmail])),
      Status: uniqSorted(inScope.map((r) => r.status)),
      Solution: [NOT_IN_SOLUTION, ...uniqSorted(inScope.flatMap((r) => r.solutions ?? []))],
      Tag: uniqSorted([...tagNames, ...inScope.flatMap((r) => r.tags)]),
      License: uniqSorted(inScope.map((r) => r.license)),
      Connector: uniqSorted(inScope.flatMap((r) => r.connectors ?? [])),
    }),
    [inScope, tagNames],
  );

  return (
    <div className="grid" style={{ gap: 20, maxWidth: 820 }}>
      <div className="field">
        <label htmlFor="rule-name">Rule name</label>
        <input id="rule-name" className="input" value={rule.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Inactive flows cleanup" autoFocus />
        {duplicateName && (
          <span className="small" style={{ color: 'var(--bad)' }}>
            A rule with this name already exists.
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor="rule-desc">Description</label>
        <input id="rule-desc" className="input" value={rule.description} onChange={(e) => update({ description: e.target.value })} placeholder="Optional" />
      </div>

      <div className="field">
        <label>Environments</label>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <label className={`flag-option compact${allEnvs ? ' on' : ''}`}>
            <input type="checkbox" className="check" checked={allEnvs} onChange={() => update({ envIds: allEnvs ? allEnvIds.slice(0, 1) : [] })} />
            <strong>All monitored environments</strong>
            <span className="small muted">({monitored.length})</span>
          </label>
          <span className="small muted">
            {envCount} of {monitored.length} selected
          </span>
        </div>
        <div className="env-pick">
          {monitored.map((e) => {
            const on = envOn(e.id);
            return (
              <label key={e.id} className="env-pick-row" title={on && envCount === 1 ? 'At least one environment must stay selected' : undefined}>
                <input type="checkbox" className="check" checked={on} disabled={on && envCount === 1} onChange={() => toggleEnv(e.id)} />
                <span>{e.name}</span>
              </label>
            );
          })}
        </div>
        <span className="small muted">
          {allEnvs
            ? 'Untick the environments to leave out. With all selected, environments monitored later are included automatically.'
            : 'Only the ticked environments are included; environments monitored later are not added automatically.'}
        </span>
      </div>

      <div className="field">
        <label>Resource types</label>
        <label className={`flag-option compact${!rule.types.length ? ' on' : ''}`}>
          <input type="checkbox" className="check" checked={!rule.types.length} onChange={() => update({ types: rule.types.length ? [] : ['Cloud Flow'] })} />
          <strong>All resource types</strong>
        </label>
        {!!rule.types.length &&
          TYPE_GROUPS.map((g) => (
            <div key={g.key}>
              <div className="small muted" style={{ margin: '6px 0 4px', fontWeight: 600 }}>
                {g.label}
              </div>
              <div className="cat-grid">
                {g.types.map((t) => (
                  <label key={t} className={`flag-option compact${rule.types.includes(t) ? ' on' : ''}`}>
                    <input type="checkbox" className="check" checked={rule.types.includes(t)} onChange={() => toggleType(t)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          ))}
      </div>

      <div className="field">
        <div className="row">
          <label style={{ margin: 0 }}>Conditions</label>
          <span className="spacer" />
          {rule.conditions.length > 1 && (
            <div className="seg" role="group" aria-label="Match">
              <button className={rule.match === 'all' ? 'on' : ''} onClick={() => update({ match: 'all' })}>
                Match all
              </button>
              <button className={rule.match === 'any' ? 'on' : ''} onClick={() => update({ match: 'any' })}>
                Match any
              </button>
            </div>
          )}
        </div>
        {!rule.conditions.length && <span className="small muted">No conditions — every resource in the chosen environments and types matches.</span>}
        {rule.conditions.map((c, i) => (
          <div key={c.id}>
            {i > 0 && <div className="cond-join">{rule.match === 'all' ? 'AND' : 'OR'}</div>}
            <ConditionEditor
              condition={c}
              options={options}
              onChange={setCond}
              onRemove={() =>
                update({
                  conditions: rule.conditions.filter((x) => x.id !== c.id),
                })
              }
            />
          </div>
        ))}
        <div>
          <button
            className="btn btn-sm"
            onClick={() =>
              update({
                conditions: [...rule.conditions, newActionCondition('Owner')],
              })
            }
          >
            <Plus size={14} /> Add condition
          </button>
        </div>
      </div>

      <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" className="check" checked={rule.excludeSystem} onChange={() => update({ excludeSystem: !rule.excludeSystem })} />
        <span>Exclude SYSTEM-owned resources</span>
      </label>
    </div>
  );
}

function ConditionEditor({
  condition: c,
  options,
  onChange,
  onRemove,
}: {
  condition: ActionCondition;
  options: Partial<Record<ActionField, string[]>>;
  onChange: (c: ActionCondition) => void;
  onRemove: () => void;
}) {
  const kind = fieldKind(c.field);
  const def = FIELD_DEFS[c.field];
  const choices = uniqSorted([...(options[c.field] ?? []), ...c.values]);
  if (c.field === 'Solution') choices.sort((x, y) => (x === NOT_IN_SOLUTION ? -1 : y === NOT_IN_SOLUTION ? 1 : x.localeCompare(y)));
  const toggle = (v: string) =>
    onChange({
      ...c,
      values: c.values.includes(v) ? c.values.filter((x) => x !== v) : [...c.values, v],
    });

  return (
    <div className="cond-card">
      <div className="row" style={{ gap: 8 }}>
        <select
          className="select"
          aria-label="Field"
          value={c.field}
          onChange={(e) =>
            onChange({
              ...newActionCondition(e.target.value as ActionField),
              id: c.id,
            })
          }
        >
          {ACTION_FIELDS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select
          className="select"
          aria-label="Operator"
          value={c.operator}
          onChange={(e) =>
            onChange({
              ...c,
              operator: e.target.value as ActionCondition['operator'],
            })
          }
        >
          {def.operators.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <button className="icon-btn" aria-label="Remove condition" onClick={onRemove}>
          <Trash2 size={16} />
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        {kind === 'text' && (
          <ChipInput
            id={`cond-${c.id}`}
            values={c.values}
            onChange={(values) => onChange({ ...c, values })}
            suggestions={c.field === 'Owner' ? options.Owner : undefined}
            placeholder={c.field === 'Owner' ? 'Name or e-mail, press Enter' : 'Text, press Enter'}
          />
        )}
        {kind === 'choice' &&
          (choices.length ? (
            <div className="env-pick">
              {choices.map((v) => (
                <label key={v} className="env-pick-row">
                  <input type="checkbox" className="check" checked={c.values.includes(v)} onChange={() => toggle(v)} />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          ) : (
            <span className="small muted">No values found in the loaded resources.</span>
          ))}
        {(kind === 'number' || kind === 'age') && (
          <div className="row" style={{ gap: 8 }}>
            <input
              type="number"
              min={0}
              className="input"
              style={{ width: 120 }}
              aria-label="Value"
              value={c.value ?? ''}
              onChange={(e) => onChange({ ...c, value: e.target.value })}
            />
            {kind === 'age' && <span className="muted">days</span>}
          </div>
        )}
        {def.hint && (
          <div className="small muted" style={{ marginTop: 6 }}>
            {def.hint}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Step 2: action ---------- */

function ActionStep({
  action: a,
  setAction,
  matches,
  owners,
  onSaveAs,
}: {
  action: RuleAction;
  setAction: (a: RuleAction) => void;
  matches: Resource[];
  owners: string[];
  onSaveAs: () => void;
}) {
  const templates = useEmailTemplates();
  const unsupported = matches.filter((r) => !supportsAction(a.kind, r.type)).length;
  const email = a.email;
  const tpl = email?.templateId ? templates.find((t) => t.id === email.templateId) : undefined;
  const modified = !!tpl && !!email && (tpl.subject !== email.subject || tpl.body !== email.body || JSON.stringify(tpl.design ?? null) !== JSON.stringify(email.design ?? null));
  const setEmail = (patch: Partial<NonNullable<RuleAction['email']>>) => email && setAction({ ...a, email: { ...email, ...patch } });

  return (
    <div className="grid" style={{ gap: 20, maxWidth: 820 }}>
      <div className="field">
        <label>Action</label>
        <div className="action-grid">
          {ACTION_KINDS.map((k) => {
            const d = ACTION_DEFS[k];
            return (
              <label key={k} className={`flag-option action-card${a.kind === k ? ' on' : ''}`}>
                <input type="radio" name="action-kind" className="check" checked={a.kind === k} onChange={() => setAction(emptyAction(k))} />
                <div>
                  <strong>{d.label}</strong>
                  <div className="small muted">{d.description}</div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {d.supports === 'all' ? 'All resource types' : `${d.supports.length} resource types`}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        {unsupported > 0 && (
          <div className="notice">
            <AlertTriangle size={16} /> {fmtNumber(unsupported)} of {fmtNumber(matches.length)} matched resources do not support “{ACTION_DEFS[a.kind].label}” and will be listed as
            not supported.
          </div>
        )}
      </div>

      {a.kind === 'email' && email && (
        <>
          <div className="field">
            <label htmlFor="email-tpl">Template</label>
            <select
              id="email-tpl"
              className="select"
              value={email.templateId ?? ''}
              onChange={(e) => {
                const t = templates.find((x) => x.id === e.target.value);
                setEmail(
                  t
                    ? {
                        templateId: t.id,
                        subject: t.subject,
                        body: t.body,
                        design: t.design,
                      }
                    : { templateId: undefined },
                );
              }}
            >
              <option value="">(Custom message)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {email.templateId && !tpl && <span className="small muted">The template used before was deleted; the message below is kept.</span>}
          </div>
          <EmailFields
            idPrefix="rule-email"
            subject={email.subject}
            body={email.body}
            design={email.design}
            onChange={(c) => setEmail(c)}
            onDesignChange={(design) => setEmail({ design })}
          />
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {modified && <span className="small muted">Modified from “{tpl!.name}”.</span>}
            {modified && (
              <button
                className="btn btn-sm"
                onClick={() =>
                  saveEmailTemplate({
                    ...tpl!,
                    subject: email.subject,
                    body: email.body,
                    design: email.design,
                    updatedAt: new Date().toISOString(),
                  })
                }
              >
                Update template
              </button>
            )}
            <button className="btn btn-sm" disabled={!email.subject.trim() || (!email.body.trim() && !email.design)} onClick={onSaveAs}>
              Save as new template
            </button>
          </div>
          <div className="field">
            <label>Recipients</label>
            <div className="seg" role="group" aria-label="Recipients">
              <button className={email.recipients === 'owners' ? 'on' : ''} onClick={() => setEmail({ recipients: 'owners' })}>
                Resource owners (one e-mail each)
              </button>
              <button className={email.recipients === 'custom' ? 'on' : ''} onClick={() => setEmail({ recipients: 'custom' })}>
                Specific people
              </button>
            </div>
          </div>
          {email.recipients === 'custom' && (
            <div className="field">
              <label htmlFor="email-to">To</label>
              <ChipInput id="email-to" values={email.to} onChange={(to) => setEmail({ to })} placeholder="e-mail address, press Enter" />
            </div>
          )}
          <div className="field">
            <label htmlFor="email-cc">Cc</label>
            <ChipInput id="email-cc" values={email.cc} onChange={(cc) => setEmail({ cc })} placeholder="Optional" />
          </div>
        </>
      )}

      {a.kind === 'share' && a.share && (
        <>
          <div className="field">
            <label htmlFor="share-users">Share with</label>
            <ChipInput
              id="share-users"
              values={a.share.users}
              onChange={(users) => setAction({ ...a, share: { ...a.share!, users } })}
              suggestions={owners}
              placeholder="User e-mail, press Enter"
            />
          </div>
          <div className="field">
            <label htmlFor="share-role">Permission</label>
            <select
              id="share-role"
              className="select"
              style={{ width: 220 }}
              value={a.share.role}
              onChange={(e) =>
                setAction({
                  ...a,
                  share: { ...a.share!, role: e.target.value as ShareRole },
                })
              }
            >
              <option value="User">User (can run / use)</option>
              <option value="Co-owner">Co-owner (can edit)</option>
            </select>
          </div>
        </>
      )}

      {a.kind === 'reassign' && (
        <div className="field">
          <label htmlFor="new-owner">New owner</label>
          <input
            id="new-owner"
            className="input"
            list="new-owner-list"
            value={a.newOwner ?? ''}
            onChange={(e) => setAction({ ...a, newOwner: e.target.value })}
            placeholder="Name or e-mail"
          />
          <datalist id="new-owner-list">
            {owners.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
      )}

      {a.kind === 'delete' && (
        <div className="notice notice-bad">
          <AlertTriangle size={16} /> Deleting resources is permanent. Canvas, code and model-driven apps, flows and custom Dataverse tables can be deleted — deleting a table also
          deletes all its data. The Evaluation step lists what would be deleted; nothing is deleted until you confirm it there.
        </div>
      )}
      {a.kind === 'disable' && <div className="notice">Resources that are already off, inactive or draft are listed as “no change”.</div>}
    </div>
  );
}

/* ---------- Step 3: review ---------- */

type ReviewFilter = 'all' | 'change' | 'nochange' | 'unsupported';

function ReviewStep({ rule, plan, activeJob, loaded, sync }: { rule: ActionRule; plan: ReturnType<typeof planRule>; activeJob: boolean; loaded: number; sync: EvaluationSync }) {
  const { environments } = useStore();
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [openEmail, setOpenEmail] = useState<PlannedEmail | null>(null);
  const [resQ, setResQ] = useState('');
  const [mailQ, setMailQ] = useState('');
  const envName = (id: string) => environments.find((e) => e.id === id)?.name ?? id;

  const noChange = plan.items.filter((i) => i.supported && i.noChange).length;
  const rows = useMemo(() => {
    const q = resQ.trim().toLowerCase();
    return plan.items.filter((i) => {
      const keep = filter === 'all' ? true : filter === 'change' ? i.supported && !i.noChange : filter === 'nochange' ? i.supported && i.noChange : !i.supported;
      if (!keep || !q) return keep;
      const r = i.resource;
      return [r.name, r.type, envName(r.envId), r.owner, r.ownerEmail, r.status, i.result].some((v) => v?.toLowerCase().includes(q));
    });
    // envName only depends on environments
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, filter, resQ, environments]);
  const emails = useMemo(() => {
    const q = mailQ.trim().toLowerCase();
    if (!q) return plan.emails;
    return plan.emails.filter((e) => [e.recipientName, ...e.to, ...e.cc].some((v) => v.toLowerCase().includes(q)));
  }, [plan, mailQ]);
  const t = useTable<PlannedItem>(
    rows,
    {
      name: (i) => i.resource.name.toLowerCase(),
      type: (i) => i.resource.type,
      env: (i) => envName(i.resource.envId),
      owner: (i) => (i.resource.owner || '').toLowerCase(),
      status: (i) => i.resource.status,
      result: (i) => i.result,
    },
    'name',
  );

  const exportCsv = () =>
    downloadCsv(`action-rule-${(rule.name || 'evaluation').replace(/[^\w-]+/g, '-').toLowerCase()}.csv`, [
      ['Name', 'Type', 'Environment', 'Owner', 'Owner e-mail', 'Status', 'Planned result', 'Supported'],
      ...plan.items.map((i) => [
        i.resource.name,
        i.resource.type,
        envName(i.resource.envId),
        i.resource.owner,
        i.resource.ownerEmail ?? '',
        i.resource.status,
        i.result,
        i.supported ? 'Yes' : 'No',
      ]),
    ]);

  return (
    <div className="grid" style={{ gap: 18 }}>
      {rule.action.kind === 'delete' ? (
        activeJob ? (
          <div className="notice notice-bad">
            <AlertTriangle size={16} /> This rule is already deleting resources. Wait for it to finish or cancel it in the Action Center before deleting again.
          </div>
        ) : (
          <div className="notice notice-bad">
            <AlertTriangle size={16} />
            <div>
              <strong>Save rule</strong> only records this evaluation. <strong>Delete</strong> permanently removes the{' '}
              {fmtNumber(plan.items.filter((i) => i.supported && !i.noChange).length)} resources marked for deletion below, one by one — keep the app open until it completes.
              Resources that cannot be deleted (e.g. managed components, or tables other components depend on) are marked failed in the <em>Delete history</em>, where they can be
              retried.
            </div>
          </div>
        )
      ) : rule.action.kind !== 'email' ? (
        <div className="notice">
          <AlertTriangle size={16} /> Evaluation only: saving records this evaluation in the rule history. No resource is changed.
        </div>
      ) : activeJob ? (
        <div className="notice notice-bad">
          <AlertTriangle size={16} /> This rule is already sending e-mails. Pause or cancel it in the Action Center before sending again.
        </div>
      ) : (
        <div className="notice">
          <Mail size={16} />
          <div>
            <strong>Save rule</strong> only records this evaluation. <strong>Send</strong> sends the {fmtNumber(plan.emails.length)} e-mail
            {plan.emails.length === 1 ? '' : 's'} below from your mailbox, one by one — keep the app open until it completes. Progress, pause and resume are in the Action Center.
          </div>
        </div>
      )}

      <div className="review-summary">
        <div>
          <div className="small muted">Trigger</div>
          <strong>{describeScope(rule, environments)}</strong>
          <div className="small">{describeConditions(rule)}</div>
          {rule.excludeSystem && <div className="small muted">SYSTEM-owned resources excluded</div>}
        </div>
        <div>
          <div className="small muted">Action</div>
          <strong>{describeAction(rule.action)}</strong>
          {rule.action.kind === 'email' && rule.action.email && <div className="small">Subject: {rule.action.email.subject}</div>}
        </div>
      </div>

      <div className="stat-boxes">
        <div className="stat-box">
          <div className="stat-value">{fmtNumber(plan.matched)}</div>
          <div className="small muted">Matched</div>
        </div>
        <div className="stat-box good">
          <div className="stat-value">{fmtNumber(plan.applicable)}</div>
          <div className="small muted">Will change</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{fmtNumber(noChange)}</div>
          <div className="small muted">No change / skipped</div>
        </div>
        <div className="stat-box warn">
          <div className="stat-value">{fmtNumber(plan.unsupported)}</div>
          <div className="small muted">Not supported</div>
        </div>
      </div>

      {rule.action.kind === 'email' && (
        <div>
          <div className="toolbar">
            <h3 style={{ margin: 0 }}>E-mails that would be sent ({plan.emails.length})</h3>
            <span className="spacer" />
            {plan.emails.length > 0 && (
              <div className="search">
                <Search size={16} />
                <input placeholder="Search recipient..." value={mailQ} onChange={(e) => setMailQ(e.target.value)} />
              </div>
            )}
          </div>
          {!plan.emails.length && <span className="small muted">No e-mail would be sent.</span>}
          {plan.emails.length > 0 && !emails.length && <span className="small muted">No recipient matches “{mailQ}”.</span>}
          {mailQ.trim() && emails.length > 0 && (
            <div className="small muted" style={{ marginBottom: 6 }}>
              {emails.length} of {plan.emails.length} e-mails
            </div>
          )}
          <div className="email-list">
            {emails.map((e, i) => (
              <button key={i} className="email-row" onClick={() => setOpenEmail(e)}>
                <Mail size={16} />
                <span>
                  <strong>{e.recipientName}</strong> <span className="muted small">{e.to.join(', ')}</span>
                </span>
                <span className="spacer" />
                <span className="small muted">
                  {e.resources.length} resource
                  {e.resources.length === 1 ? '' : 's'} · Preview
                </span>
              </button>
            ))}
          </div>
          {plan.ownersWithoutEmail.length > 0 && (
            <div className="notice notice-bad" style={{ marginTop: 8 }}>
              <AlertTriangle size={16} /> {plan.ownersWithoutEmail.length} owner(s) have no e-mail address and would be skipped: {plan.ownersWithoutEmail.slice(0, 8).join(', ')}
              {plan.ownersWithoutEmail.length > 8 ? '…' : ''}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="toolbar">
          <h3 style={{ margin: 0 }}>Affected resources</h3>
          <div className="search">
            <Search size={16} />
            <input placeholder="Search name, owner, environment..." value={resQ} onChange={(e) => setResQ(e.target.value)} />
          </div>
          <span className="spacer" />
          <div className="seg" role="group" aria-label="Filter">
            {(
              [
                ['all', `All (${plan.matched})`],
                ['change', `Will change (${plan.applicable})`],
                ['nochange', `No change (${noChange})`],
                ['unsupported', `Not supported (${plan.unsupported})`],
              ] as [ReviewFilter, string][]
            ).map(([k, label]) => (
              <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
                {label}
              </button>
            ))}
          </div>
          <button className="btn btn-sm" onClick={exportCsv} disabled={!plan.items.length}>
            <Download size={14} /> Export CSV
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <SortTh k="name" label="Name" sortKey={t.sortKey} sortDir={t.sortDir} onSort={t.toggleSort} />
                <SortTh k="type" label="Type" sortKey={t.sortKey} sortDir={t.sortDir} onSort={t.toggleSort} />
                <SortTh k="env" label="Environment" sortKey={t.sortKey} sortDir={t.sortDir} onSort={t.toggleSort} />
                <SortTh k="owner" label="Owner" sortKey={t.sortKey} sortDir={t.sortDir} onSort={t.toggleSort} />
                <SortTh k="status" label="Status" sortKey={t.sortKey} sortDir={t.sortDir} onSort={t.toggleSort} />
                <SortTh k="result" label="Planned result" sortKey={t.sortKey} sortDir={t.sortDir} onSort={t.toggleSort} />
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map((i) => (
                <tr key={`${i.resource.envId}-${i.resource.id}`}>
                  <td>
                    <strong>{i.resource.name}</strong>
                  </td>
                  <td>
                    <span className="type-pill">{i.resource.type}</span>
                  </td>
                  <td>{envName(i.resource.envId)}</td>
                  <td>
                    {i.resource.owner || '—'}
                    {i.resource.ownerEmail && <div className="small muted">{i.resource.ownerEmail}</div>}
                  </td>
                  <td>{i.resource.status}</td>
                  <td className="result-cell">
                    <span className={`pill ${!i.supported ? 'pill-no' : i.noChange ? 'pill-no' : 'pill-yes'}`} style={!i.supported ? { opacity: 0.7 } : undefined}>
                      {i.result}
                    </span>
                  </td>
                </tr>
              ))}
              {!t.pageRows.length && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    {resQ.trim() ? `No resource matches “${resQ}”.` : 'No resources.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={t.page} pageSize={t.pageSize} total={t.total} onPage={t.setPage} />
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          Based on {fmtNumber(loaded)} resources (admin connectors + Dataverse FetchXML) checked just before this evaluation
          {sync.syncedAt ? ` (${new Date(sync.syncedAt).toLocaleTimeString()})` : ''}: {fmtNumber(sync.refreshed)} of {fmtNumber(sync.total)} environments in scope refreshed, the
          others reused from a sync less than an hour old.
        </p>
        {(sync.envError || sync.failed > 0) && (
          <div className="sync-warn">
            <AlertTriangle size={15} />
            <span>
              {sync.envError && (
                <>
                  The environment list could not be refreshed ({sync.envError}
                  ).{' '}
                </>
              )}
              {sync.failed > 0 && (
                <>
                  Resources of {fmtNumber(sync.failed)} of {fmtNumber(sync.total)} environments in scope could not be refreshed.{' '}
                </>
              )}
              Their last cached data is used.
            </span>
          </div>
        )}
      </div>

      {openEmail && (
        <SidePanel title="E-mail preview" wide onClose={() => setOpenEmail(null)}>
          <div className="small">
            <strong>To:</strong> {openEmail.to.join(', ')}
          </div>
          {openEmail.cc.length > 0 && (
            <div className="small">
              <strong>Cc:</strong> {openEmail.cc.join(', ')}
            </div>
          )}
          <div className="email-preview">
            <div className="email-preview-subject">{openEmail.subject}</div>
            <div className={`email-preview-body${openEmail.design ? ' branded' : ''}`} dangerouslySetInnerHTML={{ __html: emailHtml(openEmail) }} />
          </div>
        </SidePanel>
      )}
    </div>
  );
}
