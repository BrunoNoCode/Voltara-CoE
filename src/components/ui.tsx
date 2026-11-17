import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import type { AgentHarness, HealthStatus, LicenseDesignation } from '../data/types';
import { flagColor } from '../lib/format';

export function StatusDot({ status }: { status: HealthStatus }) {
  return (
    <span className={`status-pill status-${status.toLowerCase()}`}>
      <span className="dot" />
      {status}
    </span>
  );
}

export function ManagedPill({ managed }: { managed: boolean }) {
  return <span className={`pill ${managed ? 'pill-yes' : 'pill-no'}`}>{managed ? 'Yes' : 'No'}</span>;
}

export function LicensePill({ license }: { license: LicenseDesignation }) {
  return <span className={`pill ${license === 'Premium' ? 'pill-premium' : 'pill-no'}`}>{license}</span>;
}

export function PoweredByPill({ value }: { value: AgentHarness }) {
  return <span className={`pill ${value === 'MSFT Copilot' ? 'pill-msft' : 'pill-no'}`}>{value}</span>;
}

export function FlagChip({ flag, onRemove }: { flag: string; onRemove?: () => void }) {
  const c = flagColor(flag);
  return (
    <span className={`chip${onRemove ? ' chip-removable' : ''}`} style={{ background: c.bg, color: c.fg }}>
      {flag}
      {onRemove && (
        <button aria-label={`Remove ${flag}`} onClick={onRemove}>
          <X size={12} />
        </button>
      )}
    </span>
  );
}

export function FlagChips({ flags }: { flags: string[] }) {
  if (!flags.length) return <span className="muted small">—</span>;
  return (
    <span className="chips">
      {flags.map((f) => (
        <FlagChip key={f} flag={f} />
      ))}
    </span>
  );
}

export function TagChips({ tags, max = 2 }: { tags: string[]; max?: number }) {
  if (!tags.length) return <span className="muted small">—</span>;
  return (
    <span className="chips">
      {tags.slice(0, max).map((t) => (
        <span key={t} className="chip tag">
          {t}
        </span>
      ))}
      {tags.length > max && <span className="chip tag">+{tags.length - max}</span>}
    </span>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label?: string }) {
  return <button className={`toggle${on ? ' on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={onChange} />;
}

export interface TabDef<K extends string> {
  key: K;
  label: ReactNode;
  count?: number;
}

export function Tabs<K extends string>({ tabs, value, onChange }: { tabs: TabDef<K>[]; value: K; onChange: (k: K) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={value === t.key} className={`tab${value === t.key ? ' active' : ''}`} onClick={() => onChange(t.key)}>
          {t.label}
          {t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  // Compact window of page numbers around the current page.
  const nums: (number | '…')[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  return (
    <div className="pagination">
      Showing {from} to {to} of {total} results
      <div className="pages">
        <button className="page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={14} />
        </button>
        {nums.map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} style={{ padding: '4px 6px' }}>
              …
            </span>
          ) : (
            <button key={n} className={`page-btn${n === page ? ' active' : ''}`} onClick={() => onPage(n)}>
              {n}
            </button>
          ),
        )}
        <button className="page-btn" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick: () => void;
}

export function RowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div className="menu-anchor" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button className="icon-btn" aria-label="More actions" onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="menu" role="menu">
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              className={it.danger ? 'danger' : undefined}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'contents' }}>
          {i > 0 && <div className={`step-line${i <= current ? ' done' : ''}`} />}
          <div className={`step${i === current ? ' active' : ''}${i < current ? ' done' : ''}`}>
            <span className="num">{i < current ? '✓' : i + 1}</span>
            {s}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidePanel({
  title,
  onClose,
  footer,
  wide,
  children,
}: {
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  /** 40% of the screen instead of the default 440px. */
  wide?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className={`panel${wide ? ' panel-wide' : ''}`} role="dialog" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>{title}</h3>
          <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="panel-body">{children}</div>
        {footer && <div className="panel-foot">{footer}</div>}
      </aside>
    </div>
  );
}

export function KpiCard({ icon, color, label, value, sub, extra }: { icon: ReactNode; color: string; label: string; value: string; sub?: string; extra?: ReactNode }) {
  return (
    <div className="card kpi">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}>
        {icon}
      </div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      {extra && <div className="kpi-extra">{extra}</div>}
    </div>
  );
}

/** Options are strings (value = label) or { value, label } pairs (e.g. ids shown by name). */
export function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: (string | { value: string; label: string })[]; onChange: (v: string) => void }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{label}: All</option>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}

export function SortTh({ k, label, sortKey, sortDir, onSort }: { k: string; label: string; sortKey: string; sortDir: 'asc' | 'desc'; onSort: (k: string) => void }) {
  return (
    <th className="sortable" onClick={() => onSort(k)} aria-sort={sortKey === k ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      {label}
      {sortKey === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );
}

/** Free-text values shown as removable chips; Enter or "Add" adds the typed value. */
export function ChipInput({
  id,
  values,
  onChange,
  suggestions,
  placeholder,
}: {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setText('');
  };
  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <input
          id={id}
          className="input"
          list={suggestions ? `${id}-list` : undefined}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button className="btn btn-sm" onClick={add} disabled={!text.trim()}>
          Add
        </button>
        {suggestions && (
          <datalist id={`${id}-list`}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>
      {values.length > 0 && (
        <div className="chips" style={{ marginTop: 8 }}>
          {values.map((v) => (
            <span key={v} className="chip chip-removable tag">
              {v}
              <button onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}

export function Toast({ message, onDone, duration = 2600 }: { message: ReactNode; onDone: () => void; duration?: number }) {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const t = setTimeout(() => done.current(), duration);
    return () => clearTimeout(t);
  }, [message, duration]);
  return <div className="toast">{message}</div>;
}
