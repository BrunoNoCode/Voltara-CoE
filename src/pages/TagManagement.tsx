import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { FlagChip, RowMenu, SidePanel, SortTh, Tabs, Toast, Toggle, Pagination, type MenuItem } from '../components/ui';
import { useTable } from '../lib/useTable';
import { fmtAgo, fmtNumber } from '../lib/format';
import { describeCondition, isRuleTag, tagMatcher } from '../lib/tagRules';
import { describeSync, groupConditions, hasGroups, isStale, oldestImport, syncTagGroups } from '../lib/groupSync';
import { CreateResourceTagPanel } from './CreateResourceTagPanel';
import type { Tag } from '../data/types';

type Kind = Tag['kind'];

export function TagManagement() {
  const { tags, resources, environments, createTag, toggleTag, updateTag, deleteTag, setEnvironmentFlags } = useStore();
  const [kind, setKind] = useState<Kind>('resource');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Tag>();
  const [toast, setToast] = useState('');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tags.filter((t) => t.kind === kind && (!needle || t.name.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle)));
  }, [tags, kind, q]);

  // Rule tags are counted live over the loaded resources (inactive ones are counted as if active).
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tags) if (isRuleTag(t)) m.set(t.id, resources.filter(tagMatcher({ ...t, active: true })).length);
    return m;
  }, [tags, resources]);
  const countOf = (t: Tag) => counts.get(t.id) ?? t.resources;

  // Azure group sync: '' idle, 'all' header button, or the id of the tag being synced.
  const [syncing, setSyncing] = useState('');
  const groupTags = useMemo(() => tags.filter((t) => t.kind === 'resource' && hasGroups(t)), [tags]);
  const staleCount = groupTags.filter(isStale).length;

  const syncGroups = async (targets: Tag[], key: string) => {
    if (!targets.length || syncing) return;
    setSyncing(key);
    setToast(key === 'all' ? 'Syncing Azure group members...' : `Syncing group members for "${targets[0].name}"...`);
    try {
      const result = await syncTagGroups(targets);
      for (const [id, conditions] of result.updates) updateTag(id, { conditions });
      setToast(describeSync(result));
    } finally {
      setSyncing('');
    }
  };

  const table = useTable<Tag>(
    rows,
    {
      name: (t) => t.name,
      rule: (t) => t.rule,
      appliesTo: (t) => t.appliesTo,
      groupSync: (t) => oldestImport(t),
      resources: countOf,
      active: (t) => (t.active ? 1 : 0),
    },
    'name',
  );
  const sortProps = { sortKey: table.sortKey, sortDir: table.sortDir, onSort: table.toggleSort };
  const isFlag = kind === 'flag';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tag Management</h1>
          <p>Define rules that tag resources automatically, and the custom flags used to group environments.</p>
        </div>
        <div className="actions">
          {groupTags.length > 0 && (
            <button
              className="btn"
              disabled={!!syncing}
              onClick={() => void syncGroups(groupTags, 'all')}
              title={`Re-import the members of the Azure groups used by ${groupTags.length} tag${groupTags.length === 1 ? '' : 's'}`}
            >
              <RefreshCw size={16} className={syncing === 'all' ? 'spin' : undefined} /> Sync Azure groups
              {staleCount > 0 && <span className="badge-warn">{staleCount} stale</span>}
            </button>
          )}
          <Link className="btn" to="/settings" title="Export or import tags to use them on another device">
            <ArrowLeftRight size={16} /> Backup / transfer
          </Link>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> Create {isFlag ? 'Flag' : 'Tag'}
          </button>
        </div>
      </div>

      <Tabs<Kind>
        value={kind}
        onChange={setKind}
        tabs={[
          { key: 'resource', label: 'Resource Tags', count: tags.filter((t) => t.kind === 'resource').length },
          { key: 'flag', label: 'Environment Flags', count: tags.filter((t) => t.kind === 'flag').length },
        ]}
      />

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={16} />
            <input placeholder={`Search ${isFlag ? 'flags' : 'tags'}...`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <SortTh k="name" label={isFlag ? 'Flag' : 'Tag Name'} {...sortProps} />
                <th>Description</th>
                <SortTh k="rule" label="Rule" {...sortProps} />
                <SortTh k="appliesTo" label="Applies To" {...sortProps} />
                {!isFlag && <SortTh k="groupSync" label="Azure Group Sync" {...sortProps} />}
                <SortTh k="resources" label={isFlag ? 'Environments' : 'Resources'} {...sortProps} />
                <SortTh k="active" label="Active" {...sortProps} />
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {table.pageRows.map((t) => (
                <tr key={t.id}>
                  <td>{isFlag ? <FlagChip flag={t.name} /> : <span className="chip tag">{t.name}</span>}</td>
                  <td className="muted wrap">{t.description}</td>
                  <td title={t.conditions?.length ? t.conditions.map((c) => describeCondition(c, environments)).join(t.match === 'any' ? '\nOR ' : '\nAND ') : undefined}>
                    {t.rule}
                  </td>
                  <td>{t.appliesTo}</td>
                  {!isFlag && (
                    <td>
                      {hasGroups(t) ? (
                        <span className="row" style={{ gap: 6 }}>
                          <button
                            className="icon-btn"
                            disabled={!!syncing}
                            onClick={() => void syncGroups([t], t.id)}
                            title={`Sync now — ${groupConditions(t)
                              .map((c) => `${c.group.name}: ${fmtNumber(c.group.members.length)} members${c.group.directOnly ? ' (direct only)' : ''}`)
                              .join(', ')}`}
                            aria-label={`Sync group members for ${t.name}`}
                          >
                            <RefreshCw size={14} className={syncing === t.id || syncing === 'all' ? 'spin' : undefined} />
                          </button>
                          <span className={isStale(t) ? 'stale' : 'muted'}>
                            {fmtAgo(oldestImport(t))}
                            {isStale(t) ? ' · stale' : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  )}
                  <td>{fmtNumber(countOf(t))}</td>
                  <td>
                    <Toggle on={t.active} onChange={() => toggleTag(t.id)} label={`Toggle ${t.name}`} />
                  </td>
                  <td>
                    <RowMenu
                      items={[
                        { label: 'Edit', icon: <Pencil size={14} />, onClick: () => setEditing(t) },
                        ...(hasGroups(t)
                          ? [{ label: 'Sync group members', icon: <RefreshCw size={14} />, onClick: () => void syncGroups([t], t.id) } satisfies MenuItem]
                          : []),
                        {
                          label: 'Delete',
                          icon: <Trash2 size={14} />,
                          danger: true,
                          onClick: () => {
                            deleteTag(t.id);
                            setToast(`"${t.name}" deleted`);
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {table.total === 0 && (
                <tr>
                  <td className="empty" colSpan={isFlag ? 7 : 8}>
                    No {isFlag ? 'flags' : 'tags'} found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPage={table.setPage} />
      </div>

      {creating &&
        (() => {
          const props = {
            existing: tags.map((t) => t.name.toLowerCase()),
            onClose: () => setCreating(false),
            onCreate: (t: Omit<Tag, 'id' | 'resources' | 'active'>) => {
              createTag(t);
              setCreating(false);
              setToast(`"${t.name}" created`);
            },
          };
          return isFlag ? <CreateFlagPanel {...props} /> : <CreateResourceTagPanel {...props} />;
        })()}
      {editing &&
        (() => {
          const tag = editing;
          const props = {
            initial: tag,
            existing: tags.filter((t) => t.id !== tag.id).map((t) => t.name.toLowerCase()),
            onClose: () => setEditing(undefined),
            onCreate: (change: Omit<Tag, 'id' | 'resources' | 'active'>) => {
              updateTag(tag.id, change);
              // Environments store their flags by name: carry a renamed flag over.
              if (tag.kind === 'flag' && change.name !== tag.name)
                for (const e of environments) if (e.flags.includes(tag.name)) setEnvironmentFlags(e.id, e.flags.map((f) => (f === tag.name ? change.name : f)));
              setEditing(undefined);
              setToast(`"${change.name}" saved`);
            },
          };
          return tag.kind === 'flag' ? <CreateFlagPanel {...props} /> : <CreateResourceTagPanel {...props} />;
        })()}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}

function CreateFlagPanel({
  existing,
  initial,
  onClose,
  onCreate,
}: {
  existing: string[];
  /** Flag being edited; omitted when creating a new flag. */
  initial?: Tag;
  onClose: () => void;
  onCreate: (t: Omit<Tag, 'id' | 'resources' | 'active'>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  const trimmed = name.trim();
  const duplicate = trimmed.toLowerCase() !== initial?.name.toLowerCase() && existing.includes(trimmed.toLowerCase());
  const valid = trimmed.length > 0 && !duplicate;

  return (
    <SidePanel
      title={initial ? 'Edit Flag' : 'Create Flag'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => onCreate({ name: trimmed, description: description.trim(), rule: 'Manual', appliesTo: 'Environments', kind: 'flag' })}
          >
            {initial ? 'Save' : 'Create Flag'}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="tag-name">Flag name</label>
        <input id="tag-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        {duplicate && <span className="small" style={{ color: 'var(--bad)' }}>A tag or flag with this name already exists.</span>}
      </div>
      <div className="field">
        <label htmlFor="tag-desc">Description</label>
        <textarea id="tag-desc" className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {trimmed && (
        <div className="field">
          <label>Preview</label>
          <div>
            <FlagChip flag={trimmed} />
          </div>
        </div>
      )}
    </SidePanel>
  );
}
