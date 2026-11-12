import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { SidePanel } from '../components/ui';
import { fmtNumber } from '../lib/format';
import { TAG_CATEGORIES, describeCategories, describeRule, isEmail, tagMatcher } from '../lib/tagRules';
import { fetchGroupMembers, searchGroups, type GroupHit } from '../data/liveGroups';
import type { ConditionField, ConditionOperator, Environment, Tag, TagCategory, TagCondition } from '../data/types';

const FIELDS: ConditionField[] = ['Owner', 'Environment', 'Azure Group Owner'];

const OPERATORS: Record<ConditionField, { value: ConditionOperator; label: string }[]> = {
  Owner: [
    { value: 'is', label: 'is' },
    { value: 'is not', label: 'is not' },
    { value: 'contains', label: 'contains' },
  ],
  Environment: [
    { value: 'is', label: 'is' },
    { value: 'is not', label: 'is not' },
  ],
  'Azure Group Owner': [
    { value: 'is', label: 'is a member of' },
    { value: 'is not', label: 'is not a member of' },
  ],
};

const newId = () => `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const newCondition = (field: ConditionField = 'Owner'): TagCondition => ({ id: newId(), field, operator: 'is', values: [] });

const isComplete = (c: TagCondition) =>
  c.field === 'Azure Group Owner' ? !!c.group : c.values.length > 0 && (c.field !== 'Owner' || c.operator === 'contains' || c.values.every(isEmail));

interface OwnerOption {
  email: string;
  name: string;
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'string' ? e : 'Something went wrong');

export function CreateResourceTagPanel({
  existing,
  onClose,
  onCreate,
}: {
  existing: string[];
  onClose: () => void;
  onCreate: (t: Omit<Tag, 'id' | 'resources' | 'active'>) => void;
}) {
  const { environments, resources } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [all, setAll] = useState(true);
  const [cats, setCats] = useState<TagCategory[]>([]);
  const [conditions, setConditions] = useState<TagCondition[]>([]);
  const [match, setMatch] = useState<'all' | 'any'>('all');

  const trimmed = name.trim();
  const duplicate = existing.includes(trimmed.toLowerCase());
  const categories = useMemo<Tag['categories']>(() => (all ? 'all' : TAG_CATEGORIES.map((c) => c.key).filter((k) => cats.includes(k))), [all, cats]);
  const valid = trimmed.length > 0 && !duplicate && (all || cats.length > 0) && conditions.every(isComplete);

  const monitored = useMemo(() => environments.filter((e) => e.monitored), [environments]);
  // Owner e-mails seen on the loaded resources (e-mail, else UPN), with a display name as the label.
  const owners = useMemo<OwnerOption[]>(() => {
    const m = new Map<string, OwnerOption>();
    for (const r of resources) {
      const email = (r.ownerEmail || r.ownerUpn || '').trim();
      if (email && !m.has(email.toLowerCase())) m.set(email.toLowerCase(), { email, name: r.owner });
    }
    return [...m.values()].sort((a, b) => a.email.localeCompare(b.email));
  }, [resources]);

  // Live preview over the resources already loaded in this session.
  const preview = useMemo(() => {
    if (categories !== 'all' && categories?.length === 0) return 0;
    const test = tagMatcher({ id: 'preview', name: 'preview', description: '', rule: '', appliesTo: '', resources: 0, active: true, kind: 'resource', categories, conditions: conditions.filter(isComplete), match });
    return resources.filter(test).length;
  }, [resources, categories, conditions, match]);

  const toggleCat = (k: TagCategory) => setCats((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  const updateCondition = (id: string, change: Partial<TagCondition>) => setConditions((cur) => cur.map((c) => (c.id === id ? { ...c, ...change } : c)));

  const create = () =>
    onCreate({
      name: trimmed,
      description: description.trim(),
      kind: 'resource',
      categories,
      conditions,
      match,
      rule: describeRule(conditions, match),
      appliesTo: describeCategories(categories),
    });

  return (
    <SidePanel
      title="Create Tag"
      onClose={onClose}
      footer={
        <>
          <span className="small muted" style={{ marginRight: 'auto' }}>
            Matches <strong>{fmtNumber(preview)}</strong> loaded resource{preview === 1 ? '' : 's'}
          </span>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!valid} onClick={create}>
            Create Tag
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="tag-name">Tag name</label>
        <input id="tag-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        {duplicate && <span className="small" style={{ color: 'var(--bad)' }}>A tag or flag with this name already exists.</span>}
      </div>
      <div className="field">
        <label htmlFor="tag-desc">Description</label>
        <textarea id="tag-desc" className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="field">
        <label>Applies to</label>
        <label className={`flag-option compact${all ? ' on' : ''}`}>
          <input type="checkbox" className="check" checked={all} onChange={() => setAll(!all)} />
          <strong>All resource types</strong>
        </label>
        {!all && (
          <div className="cat-grid">
            {TAG_CATEGORIES.map((c) => (
              <label key={c.key} className={`flag-option compact${cats.includes(c.key) ? ' on' : ''}`}>
                <input type="checkbox" className="check" checked={cats.includes(c.key)} onChange={() => toggleCat(c.key)} />
                {c.key}
              </label>
            ))}
          </div>
        )}
        {!all && cats.length === 0 && <span className="small" style={{ color: 'var(--bad)' }}>Select at least one category.</span>}
      </div>

      <div className="field">
        <div className="row">
          <label style={{ margin: 0 }}>Rule</label>
          <span className="spacer" />
          {conditions.length > 1 && (
            <div className="seg" role="group" aria-label="Match">
              <button className={match === 'all' ? 'on' : ''} onClick={() => setMatch('all')}>
                Match all
              </button>
              <button className={match === 'any' ? 'on' : ''} onClick={() => setMatch('any')}>
                Match any
              </button>
            </div>
          )}
        </div>
        {conditions.length === 0 && <p className="small muted" style={{ margin: '4px 0 0' }}>No conditions: every resource of the selected types gets this tag.</p>}
        {conditions.map((c, i) => (
          <div key={c.id}>
            {i > 0 && <div className="cond-join">{match === 'all' ? 'AND' : 'OR'}</div>}
            <ConditionEditor
              condition={c}
              owners={owners}
              environments={monitored}
              onChange={(change) => updateCondition(c.id, change)}
              onRemove={() => setConditions((cur) => cur.filter((x) => x.id !== c.id))}
            />
          </div>
        ))}
        <div>
          <button className="btn btn-sm" onClick={() => setConditions((cur) => [...cur, newCondition()])}>
            <Plus size={14} /> Add condition
          </button>
        </div>
      </div>
    </SidePanel>
  );
}

function ConditionEditor({
  condition: c,
  owners,
  environments,
  onChange,
  onRemove,
}: {
  condition: TagCondition;
  owners: OwnerOption[];
  environments: Environment[];
  onChange: (change: Partial<TagCondition>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="cond-card">
      <div className="row" style={{ gap: 8 }}>
        <select
          className="select"
          aria-label="Field"
          value={c.field}
          onChange={(e) => onChange({ field: e.target.value as ConditionField, operator: 'is', values: [], group: undefined })}
        >
          {FIELDS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select className="select" aria-label="Operator" value={c.operator} onChange={(e) => onChange({ operator: e.target.value as ConditionOperator })}>
          {OPERATORS[c.field].map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={onRemove} title="Remove condition" aria-label="Remove condition">
          <Trash2 size={14} />
        </button>
      </div>
      {c.field === 'Owner' && <OwnerValues condition={c} owners={owners} onChange={onChange} />}
      {c.field === 'Environment' && <EnvironmentValues condition={c} environments={environments} onChange={onChange} />}
      {c.field === 'Azure Group Owner' && <GroupValue condition={c} onChange={onChange} />}
    </div>
  );
}

function OwnerValues({ condition: c, owners, onChange }: { condition: TagCondition; owners: OwnerOption[]; onChange: (change: Partial<TagCondition>) => void }) {
  const [text, setText] = useState('');
  const listId = `owners-${c.id}`;
  const needEmail = c.operator !== 'contains';
  const v = text.trim();
  const canAdd = !!v && (!needEmail || isEmail(v));
  const add = () => {
    if (!canAdd) return;
    if (!c.values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange({ values: [...c.values, v] });
    setText('');
  };
  // Values saved before owner tags matched on e-mail: replace display names with the e-mail when exactly one fits.
  const invalid = needEmail ? c.values.filter((x) => !isEmail(x)) : [];
  const convert = () =>
    onChange({
      values: [
        ...new Set(
          c.values.map((x) => {
            if (isEmail(x)) return x;
            const hits = [...new Set(owners.filter((o) => o.name.trim().toLowerCase() === x.trim().toLowerCase()).map((o) => o.email))];
            return hits.length === 1 ? hits[0] : x;
          }),
        ),
      ],
    });
  return (
    <>
      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <input
          className="input"
          list={listId}
          type={needEmail ? 'email' : 'text'}
          placeholder={needEmail ? 'Owner e-mail, e.g. alex.silva@contoso.com' : 'Text in the owner e-mail, e.g. @contoso.com'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button className="btn btn-sm" onClick={add} disabled={!canAdd}>
          Add
        </button>
        <datalist id={listId}>
          {owners.map((o) => (
            <option key={o.email} value={o.email} label={o.name && o.name !== o.email ? o.name : undefined} />
          ))}
        </datalist>
      </div>
      {c.values.length > 0 && (
        <div className="chips" style={{ marginTop: 8 }}>
          {c.values.map((v) => (
            <span
              key={v}
              className="chip chip-removable tag"
              style={needEmail && !isEmail(v) ? { borderColor: 'var(--bad)', color: 'var(--bad)' } : undefined}
              title={needEmail && !isEmail(v) ? 'Not an e-mail address: this value never matches' : undefined}
            >
              {v}
              <button onClick={() => onChange({ values: c.values.filter((x) => x !== v) })} aria-label={`Remove ${v}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {v && needEmail && !isEmail(v) && <p className="small" style={{ margin: '6px 0 0', color: 'var(--bad)' }}>Enter the owner's e-mail address.</p>}
      {invalid.length > 0 && (
        <p className="small" style={{ margin: '6px 0 0', color: 'var(--bad)' }}>
          {invalid.length} value{invalid.length === 1 ? ' is' : 's are'} not an e-mail and will not match.{' '}
          <button className="link-btn small" onClick={convert}>
            Replace with e-mails
          </button>
        </p>
      )}
      <p className="small muted" style={{ margin: '6px 0 0' }}>
        Matched on the resource owner's e-mail (or UPN), the same for flows, apps, agents and other resources. Display names are not used.
        {c.values.length > 1 ? ' Any of these values matches.' : ''}
      </p>
    </>
  );
}

function EnvironmentValues({ condition: c, environments, onChange }: { condition: TagCondition; environments: Environment[]; onChange: (change: Partial<TagCondition>) => void }) {
  if (environments.length === 0) return <p className="small muted">No monitored environments yet.</p>;
  const toggle = (id: string) => onChange({ values: c.values.includes(id) ? c.values.filter((x) => x !== id) : [...c.values, id] });
  return (
    <div className="env-pick">
      {environments.map((e) => (
        <label key={e.id} className="env-pick-row">
          <input type="checkbox" className="check" checked={c.values.includes(e.id)} onChange={() => toggle(e.id)} />
          <span>{e.name}</span>
        </label>
      ))}
    </div>
  );
}

function GroupValue({ condition: c, onChange }: { condition: TagCondition; onChange: (change: Partial<TagCondition>) => void }) {
  const [query, setQuery] = useState('');
  const [foundHits, setHits] = useState<GroupHit[]>([]);
  // Query whose search last finished: a search is running while it differs from the typed query.
  const [searchedQuery, setSearchedQuery] = useState('');
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  const trimmed = query.trim();
  const tooShort = trimmed.length < 2;
  const hits = tooShort ? [] : foundHits;
  const searching = !tooShort && searchedQuery !== trimmed;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchGroups(q)
        .then((r) => !cancelled && (setHits(r), setError('')))
        .catch((e) => !cancelled && setError(`Group search failed: ${errorText(e)}`))
        .finally(() => !cancelled && setSearchedQuery(q));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const pick = async (g: GroupHit) => {
    setImporting(g.id);
    setError('');
    try {
      const snapshot = await fetchGroupMembers(g);
      onChange({ group: snapshot });
      setQuery('');
      setHits([]);
    } catch (e) {
      setError(`Could not import the members of "${g.name}": ${errorText(e)}`);
    } finally {
      setImporting(null);
    }
  };

  if (c.group) {
    const g = c.group;
    return (
      <div className="group-card">
        <div className="row" style={{ gap: 8 }}>
          <Users size={16} />
          <strong>{g.name}</strong>
          <span className="spacer" />
          <button className="btn btn-ghost btn-sm" onClick={() => onChange({ group: undefined })}>
            Change
          </button>
        </div>
        <div className="small muted" style={{ marginTop: 4 }}>
          {fmtNumber(g.members.length)} member{g.members.length === 1 ? '' : 's'} imported{g.directOnly ? '' : ' (direct and nested)'} ·{' '}
          {new Date(g.importedAt).toLocaleString()}
          {' · '}
          <button className="link-btn" onClick={() => setShowMembers(!showMembers)}>
            {showMembers ? 'Hide' : 'Show'} members
          </button>
        </div>
        {g.directOnly && (
          <div className="notice notice-bad" style={{ marginTop: 8 }}>
            Only direct members could be read (no permission for nested groups). Members of nested groups are not included.
          </div>
        )}
        {showMembers && (
          <ul className="member-list">
            {g.members.map((m) => (
              <li key={m.upn ?? m.mail ?? m.name}>
                {m.name}
                {m.mail && <span className="muted"> · {m.mail}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div className="search" style={{ width: '100%' }}>
        <Search size={16} />
        <input placeholder="Search Azure groups by name..." value={query} onChange={(e) => setQuery(e.target.value)} />
        {searching && <Loader2 size={14} className="spin" />}
      </div>
      {error && (
        <div className="notice notice-bad" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
      {hits.length > 0 && (
        <div className="group-results">
          {hits.map((h) => (
            <button key={h.id} className="group-hit" disabled={importing !== null} onClick={() => pick(h)}>
              <span>
                <strong>{h.name}</strong>
                {(h.mail || h.description) && <span className="small muted"> · {h.mail ?? h.description}</span>}
              </span>
              {importing === h.id ? (
                <span className="small">
                  <Loader2 size={14} className="spin" /> Importing members...
                </span>
              ) : (
                <span className="small muted">Select</span>
              )}
            </button>
          ))}
        </div>
      )}
      {!searching && query.trim().length >= 2 && hits.length === 0 && !error && <p className="small muted">No groups found.</p>}
      <p className="small muted" style={{ margin: '6px 0 0' }}>
        All direct and indirect (nested) members are imported. Use “Refresh group members” in the tag menu later to update them.
      </p>
    </div>
  );
}
