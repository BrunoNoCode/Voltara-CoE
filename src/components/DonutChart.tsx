import { fmtNumber } from '../lib/format';

export interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: Slice[];
  size?: number;
  centerLabel?: string;
  /** Makes slices and legend items clickable (e.g. to filter a table). */
  onSelect?: (label: string) => void;
  /** Highlighted slice label. */
  active?: string;
}

export function DonutChart({ data, size = 170, centerLabel = 'Total', onSelect, active }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const stroke = size * 0.15;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${centerLabel} ${total}`} style={{ flexShrink: 0 }}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f5" strokeWidth={stroke} />
          {total > 0 &&
            data.map((d) => {
              const len = (d.value / total) * c;
              const el = (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  opacity={active && active !== d.label ? 0.35 : 1}
                  style={onSelect ? { cursor: 'pointer' } : undefined}
                  onClick={onSelect ? () => onSelect(d.label) : undefined}
                >
                  <title>{`${d.label}: ${d.value}`}</title>
                </circle>
              );
              offset += len;
              return el;
            })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" fontSize={size * 0.15} fontWeight={700} fill="var(--text)">
          {fmtNumber(total)}
        </text>
        <text x="50%" y="60%" textAnchor="middle" fontSize={size * 0.075} fill="var(--text-2)">
          {centerLabel}
        </text>
      </svg>
      <ul className={data.length > 8 ? 'legend scroll' : 'legend'}>
        {data.map((d) => (
          <li
            key={d.label}
            className={`${onSelect ? 'clickable' : ''}${active === d.label ? ' active' : ''}${active && active !== d.label ? ' dim' : ''}`}
            onClick={onSelect ? () => onSelect(d.label) : undefined}
            title={onSelect ? (active === d.label ? 'Click to clear the filter' : `Filter on ${d.label}`) : undefined}
          >
            <span className="sw" style={{ background: d.color }} />
            {d.label}
            <span className="val">{fmtNumber(d.value)}</span>
            <span className="pct">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
