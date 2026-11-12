import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { FlagChip, FlagChips, ManagedPill, Stepper } from '../components/ui';
import { fmtDate, flagColor } from '../lib/format';
import { clickableRow } from '../lib/clickableRow';

const STEPS = ['Select Environments', 'Add Custom Flags', 'Confirm'];

export function AddEnvironment() {
  const { environments, resources, tags, monitorEnvironment } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselect = params.get('env') ?? '';

  const candidates = useMemo(() => environments.filter((e) => !e.monitored), [environments]);
  const initial = candidates.find((e) => e.id === preselect);
  const [selectedIds, setSelectedIds] = useState<string[]>(initial ? [initial.id] : []);
  const [step, setStep] = useState(initial ? 1 : 0);
  const [q, setQ] = useState('');
  const [displayName, setDisplayName] = useState(initial?.name ?? '');
  const [flags, setFlags] = useState<string[]>(initial?.flags ?? []);

  const selected = useMemo(() => environments.filter((e) => selectedIds.includes(e.id)), [environments, selectedIds]);
  const single = selected.length === 1 ? selected[0] : undefined;
  const flagTags = tags.filter((t) => t.kind === 'flag' && t.active);
  const visible = candidates.filter((e) => e.name.toLowerCase().includes(q.trim().toLowerCase()));
  const resourceCount = resources.filter((r) => selectedIds.includes(r.envId)).length;
  const visibleSelected = visible.filter((e) => selectedIds.includes(e.id)).length;
  const allVisibleSelected = visible.length > 0 && visibleSelected === visible.length;

  const toggle = (id: string) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    setSelectedIds(next);
    // With exactly one environment, prefill its name so it can be edited.
    const only = next.length === 1 ? environments.find((e) => e.id === next[0]) : undefined;
    setDisplayName(only?.name ?? '');
  };

  const toggleAllVisible = () => {
    const ids = visible.map((e) => e.id);
    setSelectedIds((cur) => (allVisibleSelected ? cur.filter((id) => !ids.includes(id)) : [...new Set([...cur, ...ids])]));
    setDisplayName('');
  };

  const toggleFlag = (f: string) => setFlags((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  const finish = () => {
    if (!selected.length) return;
    if (single) {
      monitorEnvironment(single.id, flags, displayName);
      navigate(`/environments/${single.id}`);
      return;
    }
    // Same flags for every selected environment.
    for (const e of selected) monitorEnvironment(e.id, flags);
    navigate('/environments');
  };

  return (
    <>
      <div className="breadcrumb">
        <Link to="/environments">Environments</Link>
        <ChevronRight size={14} /> Add Environment
      </div>
      <div className="page-head">
        <div>
          <h1>Add Environments</h1>
          <p>Start monitoring one or more environments you have access to. Selected environments share the same flags. The environment group comes from Power Platform.</p>
        </div>
      </div>

      <div className="card">
        <Stepper steps={STEPS} current={step} />
        <div className="wizard-body">
          {step === 0 && (
            <>
              <div className="row" style={{ marginBottom: 14 }}>
                <div className="search" style={{ width: 320, background: '#fff' }}>
                  <Search size={16} />
                  <input placeholder="Search environments..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <span className="muted small">{candidates.length} environments available that are not monitored yet</span>
                <span className="spacer" />
                {selectedIds.length > 0 && (
                  <>
                    <strong className="small">{selectedIds.length} selected</strong>
                    <button className="btn btn-sm" onClick={() => setSelectedIds([])}>
                      Clear
                    </button>
                  </>
                )}
              </div>
              <div className="card table-wrap" style={{ boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          className="check"
                          aria-label="Select all visible environments"
                          checked={allVisibleSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = visibleSelected > 0 && !allVisibleSelected;
                          }}
                          onChange={toggleAllVisible}
                          disabled={visible.length === 0}
                        />
                      </th>
                      <th>Environment Name</th>
                      <th>Type</th>
                      <th>Region</th>
                      <th>Managed</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((e) => {
                      const on = selectedIds.includes(e.id);
                      return (
                        <tr key={e.id} className={`clickable${on ? ' selected' : ''}`} {...clickableRow(() => toggle(e.id))}>
                          <td>
                            <input
                              type="checkbox"
                              className="check"
                              checked={on}
                              onChange={() => toggle(e.id)}
                              onClick={(ev) => ev.stopPropagation()}
                              aria-label={e.name}
                            />
                          </td>
                          <td className="name">{e.name}</td>
                          <td>{e.type}</td>
                          <td>{e.region}</td>
                          <td>
                            <ManagedPill managed={e.managed} />
                          </td>
                          <td className="muted">{fmtDate(e.created)}</td>
                        </tr>
                      );
                    })}
                    {visible.length === 0 && (
                      <tr>
                        <td className="empty" colSpan={6}>
                          {candidates.length ? 'No environments match your search.' : 'All environments you have access to are already monitored.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="muted" style={{ marginTop: 0 }}>
                {selected.length > 1
                  ? `These flags will be set on all ${selected.length} selected environments. You can change them per environment later.`
                  : 'Custom flags help you group and filter environments (e.g. by business or workload). You can change them later.'}
              </p>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {flagTags.map((t) => {
                  const on = flags.includes(t.name);
                  const c = flagColor(t.name);
                  return (
                    <label key={t.id} className={`flag-option${on ? ' on' : ''}`}>
                      <input type="checkbox" className="check" checked={on} onChange={() => toggleFlag(t.name)} />
                      <span className="chip" style={{ background: c.bg, color: c.fg }}>
                        {t.name}
                      </span>
                      <span className="muted small">{t.description}</span>
                    </label>
                  );
                })}
              </div>
              {flags.length > 0 && (
                <div className="row" style={{ marginTop: 16 }}>
                  <span className="small muted">Selected:</span>
                  {flags.map((f) => (
                    <FlagChip key={f} flag={f} onRemove={() => toggleFlag(f)} />
                  ))}
                </div>
              )}
            </>
          )}

          {step === 2 && single && (
            <>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Review and confirm</h3>
              <div className="field" style={{ maxWidth: 420 }}>
                <label htmlFor="dn">Display name</label>
                <input id="dn" className="input" value={displayName} placeholder={single.name} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <dl className="kv" style={{ maxWidth: 640 }}>
                <dt>Environment</dt>
                <dd>{single.name}</dd>
                <dt>Type / Region</dt>
                <dd>
                  {single.type} · {single.region}
                </dd>
                <dt>Managed</dt>
                <dd>
                  <ManagedPill managed={single.managed} />
                </dd>
                <dt>Environment group</dt>
                <dd>{single.group || <span className="muted">—</span>}</dd>
                <dt>Custom flags</dt>
                <dd>
                  <FlagChips flags={flags} />
                </dd>
                <dt>Resources</dt>
                <dd>{resourceCount}</dd>
              </dl>
            </>
          )}

          {step === 2 && selected.length > 1 && (
            <>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Review and confirm</h3>
              <dl className="kv" style={{ maxWidth: 640 }}>
                <dt>Environments</dt>
                <dd>{selected.length}</dd>
                <dt>Custom flags</dt>
                <dd>{flags.length ? <FlagChips flags={flags} /> : <span className="muted">None</span>}</dd>
              </dl>
              <p className="small muted" style={{ margin: '14px 0 8px' }}>
                The following environments will be monitored:
              </p>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {selected.map((e) => (
                  <span key={e.id} className="chip" style={{ background: '#eef2f5', color: '#3d4f59' }}>
                    {e.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="wizard-foot">
          <button className="btn" onClick={() => navigate('/environments')}>
            Cancel
          </button>
          <span className="spacer" />
          {step > 0 && (
            <button className="btn" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" disabled={!selected.length} onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button className="btn btn-primary" onClick={finish}>
              {selected.length > 1 ? `Add ${selected.length} Environments` : 'Add Environment'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
