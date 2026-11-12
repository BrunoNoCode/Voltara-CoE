import { fmtNumber } from '../lib/format';
import type { Slice } from './DonutChart';

interface Props {
  data: Slice[];
  /** Makes rows clickable (e.g. to filter a table). */
  onSelect?: (label: string) => void;
  /** Highlighted row label. */
  active?: string;
}

/** Horizontal bars, one per slice, scaled to the largest value. */
export function HBarChart({ data, onSelect, active }: Props) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const select = (label: string) => onSelect?.(label);
  return (
    <ul className={`hbars hbars-tall${onSelect ? ' hbars-click' : ''}${active ? ' has-active' : ''}`}>
      {data.map((d) => (
        <li
          key={d.label}
          className={active === d.label ? 'active' : undefined}
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect ? 0 : undefined}
          title={onSelect ? (active === d.label ? 'Click to clear the filter' : `Filter on ${d.label}`) : undefined}
          onClick={onSelect ? () => select(d.label) : undefined}
          onKeyDown={
            onSelect
              ? (ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    select(d.label);
                  }
                }
              : undefined
          }
        >
          <span className="lbl">{d.label}</span>
          <span className="track">
            <span className="bar" style={{ width: `${max ? (d.value / max) * 100 : 0}%`, background: d.color }} />
          </span>
          <span className="num">{fmtNumber(d.value)}</span>
        </li>
      ))}
    </ul>
  );
}
