import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Download, Search } from 'lucide-react';
import type { Resource, ResourceType } from '../data/types';
import { useStore } from '../state/AppStore';
import { useTable } from '../lib/useTable';
import { TYPE_COLOR, TYPE_GROUPS, downloadCsv, fmtNumber, groupOf } from '../lib/format';
import { clickableRow } from '../lib/clickableRow';
import { DonutChart } from './DonutChart';
import { HBarChart } from './HBarChart';
import { isSystemOwned, useHideSystem } from '../lib/hideSystem';
import { FilterSelect, LicensePill, Pagination, PoweredByPill, SortTh, TagChips } from './ui';
import { ResourceDetailsPanel } from './ResourceDetailsPanel';

interface Props {
  rows: Resource[];
  showEnvironment?: boolean;
  initialQuery?: string;
  exportName?: string;
  /** Adds the License Designation (Premium/Standard) column — flows only. */
  showLicense?: boolean;
  /** Shows "by type" and "by status" charts above the table, following the table's filters. */
  showCharts?: boolean;
  /** Environment filter options (default: environments present in the rows). */
  envOptions?: string[];
  /** Extra toolbar buttons; receives the selected Environment filter ('' = all). */
  toolbarActions?: (env: string) => ReactNode;
  /** Called when the environment filter changes ('' = all). */
  onEnvChange?: (env: string) => void;
  /** Rows per page (default 10). */
  pageSize?: number;
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

/** Distinct shades so statuses sharing a table dot color stay apart in the chart. */
const CHART_STATUS_COLOR: Record<Resource['status'], string> = {
  Published: '#0f8a4f',
  On: '#2fbf71',
  Active: '#8ad9ab',
  Draft: 'var(--warn)',
  Off: '#8a99a3',
  Inactive: '#c3ccd2',
  Suspended: 'var(--bad)',
};

/** Type shown in the table: for Copilot Studio agents, the agent type (Standard / MSFT Copilot) when known. */
const typeOf = (r: Resource): string => (r.type === 'Copilot Studio' && r.poweredBy ? r.poweredBy : r.type);

/** [label, count] pairs, largest first. */
function countBy<T>(items: T[], key: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>();
  for (const it of items) counts.set(key(it), (counts.get(key(it)) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Solution filter option for resources that are in no (visible, non-default) solution. */
const NO_SOLUTION = '(Not in a solution)';
/** Solution cell / CSV text: names, "Not in a solution", or empty while unknown. */
const solutionText = (r: Resource) => (r.solutions === undefined ? '' : r.solutions.length ? r.solutions.join(', ') : 'Not in a solution');

export function ResourceTable({ rows: allRows, showEnvironment = false, initialQuery = '', exportName, showLicense = false, showCharts = false, envOptions, toolbarActions, onEnvChange, pageSize = 10 }: Props) {
  const { environments } = useStore();
  const envName = useMemo(() => new Map(environments.map((e) => [e.id, e.name])), [environments]);
  const [q, setQ] = useState(initialQuery);
  const [type, setType] = useState('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState('');
  const [env, setEnv] = useState('');
  useEffect(() => onEnvChange?.(env), [env, onEnvChange]);
  const [license, setLicense] = useState('');
  const [solution, setSolution] = useState('');
  const [selected, setSelected] = useState<Resource | null>(null);
  const [hideSystem, setHideSystem] = useHideSystem();
  const systemCount = useMemo(() => allRows.filter(isSystemOwned).length, [allRows]);
  // "Custom tables only" appears once custom-table info (IsCustomEntity) is known for the rows.
  const [customOnly, setCustomOnly] = useState(false);
  const hasCustomInfo = useMemo(() => allRows.some((r) => r.customTable !== undefined), [allRows]);
  const customCount = useMemo(() => allRows.filter((r) => r.customTable === true && !(hideSystem && isSystemOwned(r))).length, [allRows, hideSystem]);
  const rows = useMemo(
    () => allRows.filter((r) => !(hideSystem && isSystemOwned(r)) && !(customOnly && hasCustomInfo && r.customTable !== true)),
    [allRows, hideSystem, customOnly, hasCustomInfo],
  );

  // Kind (Power Apps, Power Automate, …) narrows the Type options to the types of that kind.
  const [kind, setKind] = useState('');
  const kinds = useMemo(() => TYPE_GROUPS.filter((g) => rows.some((r) => g.types.includes(r.type))).map((g) => g.label), [rows]);
  const changeKind = (next: string) => {
    setKind(next);
    if (next && type && !rows.some((r) => groupOf(r.type).label === next && typeOf(r) === type)) setType('');
  };

  const types = useMemo(() => [...new Set(rows.filter((r) => !kind || groupOf(r.type).label === kind).map(typeOf))].sort(), [rows, kind]);
  const tagNames = useMemo(() => [...new Set(rows.flatMap((r) => r.tags))].sort(), [rows]);
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))].sort(), [rows]);
  const envNames = useMemo(
    () => envOptions ?? [...new Set(rows.map((r) => envName.get(r.envId) ?? ''))].sort(),
    [envOptions, rows, envName],
  );
  // Solution options follow the Environment filter: only solutions found in that environment.
  const solutionsIn = useMemo(
    () => (envFilter: string) => {
      const scoped = envFilter ? rows.filter((r) => envName.get(r.envId) === envFilter) : rows;
      const names = [...new Set(scoped.flatMap((r) => r.solutions ?? []))].sort((a, b) => a.localeCompare(b));
      return scoped.some((r) => r.solutions?.length === 0) ? [NO_SOLUTION, ...names] : names;
    },
    [rows, envName],
  );
  const solutionNames = useMemo(() => solutionsIn(env), [solutionsIn, env]);
  const changeEnv = (next: string) => {
    setEnv(next);
    if (solution && !solutionsIn(next).includes(solution)) setSolution('');
  };

  // One predicate per filter, so each chart can ignore its own dimension (cross-filtering).
  const filterBy = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (skip?: 'type' | 'status') => (r: Resource) =>
      (!needle ||
        r.name.toLowerCase().includes(needle) ||
        r.owner.toLowerCase().includes(needle) ||
        r.tags.some((t) => t.toLowerCase().includes(needle)) ||
        (r.solutions ?? []).some((s) => s.toLowerCase().includes(needle))) &&
      (!kind || groupOf(r.type).label === kind) &&
      (skip === 'type' || !type || typeOf(r) === type) &&
      (!tag || r.tags.includes(tag)) &&
      (skip === 'status' || !status || r.status === status) &&
      (!env || envName.get(r.envId) === env) &&
      (!license || r.license === license) &&
      (!solution || (solution === NO_SOLUTION ? r.solutions?.length === 0 : (r.solutions ?? []).includes(solution)));
  }, [q, kind, type, tag, status, env, license, solution, envName]);

  const filtered = useMemo(() => rows.filter(filterBy()), [rows, filterBy]);

  const typeSlices = useMemo(() => {
    if (!showCharts) return [];
    return countBy(rows.filter(filterBy('type')), typeOf).map(([label, value]) => ({
      label,
      value,
      color: TYPE_COLOR[label as ResourceType] ?? (label === 'MSFT Copilot' ? '#6e40c9' : label === 'Standard' ? TYPE_COLOR['Copilot Studio'] : undefined) ?? '#b6c2ca',
    }));
  }, [showCharts, rows, filterBy]);
  const statusSlices = useMemo(() => {
    if (!showCharts) return [];
    return countBy(rows.filter(filterBy('status')), (r) => r.status).map(([label, value]) => ({ label, value, color: CHART_STATUS_COLOR[label as Resource['status']] }));
  }, [showCharts, rows, filterBy]);

  const table = useTable<Resource>(
    filtered,
    {
      name: (r) => r.name,
      type: typeOf,
      env: (r) => envName.get(r.envId) ?? '',
      owner: (r) => r.owner,
      license: (r) => r.license ?? '',
      solution: solutionText,
      status: (r) => r.status,
    },
    'name',
    pageSize,
  );
  const sortProps = { sortKey: table.sortKey, sortDir: table.sortDir, onSort: table.toggleSort };

  const exportCsv = () =>
    downloadCsv(`${exportName ?? 'resources'}.csv`, [
      ['Name', 'Type', 'Environment', 'Owner', ...(showLicense ? ['License Designation'] : []), 'Solution', 'Tags', 'Status'],
      ...filtered.map((r) => [
        r.name,
        typeOf(r),
        envName.get(r.envId) ?? '',
        r.owner,
        ...(showLicense ? [r.license ?? ''] : []),
        solutionText(r),
        r.tags.join('; '),
        r.status,
      ]),
    ]);

  const charts = showCharts && (
    <div className="res-charts">
      <div className="card card-pad">
        <div className="card-title">
          Resources by Type
          {type && (
            <button className="link-btn" onClick={() => setType('')}>
              Clear type filter
            </button>
          )}
        </div>
        <DonutChart size={204} data={typeSlices} centerLabel="Resources" active={type || undefined} onSelect={(l) => setType(type === l ? '' : l)} />
      </div>
      <div className="card card-pad">
        <div className="card-title">
          Resources by Status
          {status && (
            <button className="link-btn" onClick={() => setStatus('')}>
              Clear status filter
            </button>
          )}
        </div>
        <HBarChart data={statusSlices} active={status || undefined} onSelect={(l) => setStatus(status === l ? '' : l)} />
      </div>
    </div>
  );

  return (
    <>
    {charts}
    <div className="card">
      <div className="toolbar toolbar-stacked">
        <div className="toolbar-row toolbar-main">
          <div className="search">
            <Search size={16} />
            <input placeholder="Search by name, owner, tag or solution..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {showEnvironment && <FilterSelect label="Environment" value={env} onChange={changeEnv} options={envNames} />}
          <FilterSelect label="Solution" value={solution} onChange={setSolution} options={solutionNames} />
        </div>
        <div className="toolbar-row">
          {kinds.length > 1 && <FilterSelect label="Kind" value={kind} onChange={changeKind} options={kinds} />}
          {(types.length > 1 || (kinds.length === 1 && types.length > 0)) && <FilterSelect label="Type" value={type} onChange={setType} options={types} />}
          {showLicense && <FilterSelect label="License" value={license} onChange={setLicense} options={['Premium', 'Standard']} />}
          <FilterSelect label="Tag" value={tag} onChange={setTag} options={tagNames} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={statuses} />
          <label className="hide-system" title="Hide resources owned by Microsoft accounts (SYSTEM, Microsoft Corporation, …). The list is configured on the Settings page.">
            <input type="checkbox" checked={hideSystem} onChange={(e) => setHideSystem(e.target.checked)} />
            Hide MSFT-owned{systemCount ? ` (${fmtNumber(systemCount)})` : ''}
          </label>
          {hasCustomInfo && (
            <label className="hide-system" title="Show only custom Dataverse tables (IsCustomEntity)">
              <input type="checkbox" checked={customOnly} onChange={(e) => setCustomOnly(e.target.checked)} />
              Custom tables only ({fmtNumber(customCount)})
            </label>
          )}
          <span className="spacer" />
          {toolbarActions?.(env)}
          <button className="btn" onClick={exportCsv}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>
      <div className={pageSize > 10 ? 'table-wrap tall' : 'table-wrap'}>
        <table className="table">
          <thead>
            <tr>
              <SortTh k="name" label="Name" {...sortProps} />
              <SortTh k="type" label="Type" {...sortProps} />
              {showEnvironment && <SortTh k="env" label="Environment" {...sortProps} />}
              <SortTh k="owner" label="Owner" {...sortProps} />
              {showLicense && <SortTh k="license" label="License Designation" {...sortProps} />}
              <SortTh k="solution" label="Solution" {...sortProps} />
              <th>Tags</th>
              <SortTh k="status" label="Status" {...sortProps} />
            </tr>
          </thead>
          <tbody>
            {table.pageRows.map((r) => (
              <tr key={`${r.envId}:${r.id}`} className="clickable" {...clickableRow(() => setSelected(r))}>
                <td>
                  <span className="row" style={{ gap: 8 }}>
                    <span className="sw" style={{ width: 8, height: 8, borderRadius: 2, background: groupOf(r.type).color, flexShrink: 0 }} />
                    <span className="name">{r.name}</span>
                  </span>
                </td>
                <td>
                  {r.type === 'Copilot Studio' && r.poweredBy ? <PoweredByPill value={r.poweredBy} /> : <span className="type-pill">{r.type}</span>}
                </td>
                {showEnvironment && <td>{envName.get(r.envId)}</td>}
                <td>{r.owner}</td>
                {showLicense && (
                  <td title={r.connectors?.length ? `Connectors: ${r.connectors.join(', ')}` : undefined}>
                    {r.license ? <LicensePill license={r.license} /> : <span className="muted">—</span>}
                  </td>
                )}
                <td className="wrap" title={r.solutions === undefined ? 'Solution membership not loaded yet — use Sync now' : undefined}>
                  {r.solutions === undefined ? (
                    <span className="muted">—</span>
                  ) : r.solutions.length ? (
                    r.solutions.join(', ')
                  ) : (
                    <span className="muted">Not in a solution</span>
                  )}
                </td>
                <td>
                  <TagChips tags={r.tags} />
                </td>
                <td>
                  <span className="status">
                    <span className="dot" style={{ background: STATUS_COLOR[r.status] }} />
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {table.total === 0 && (
              <tr>
                <td className="empty" colSpan={6 + (showEnvironment ? 1 : 0) + (showLicense ? 1 : 0)}>
                  No resources found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPage={table.setPage} />
    </div>
    {selected && <ResourceDetailsPanel resource={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
