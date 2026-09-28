import { useId } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#f97316'];
const AXIS = { tickLine: false, axisLine: false, tick: { fill: '#8193b2', fontSize: 11 } };

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p) => (
        <div className="chart-tooltip-row" key={p.dataKey}>
          <span>{p.name}</span>
          <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function Empty({ height }) {
  return (
    <div className="admin-chart-empty" style={{ height }}>
      No data yet
    </div>
  );
}

/** Bar chart for admin dashboards. data: [{ [labelKey], [valueKey] }] */
export default function AdminChart({ data, labelKey, valueKey, height = 260, name = 'Count', horizontal = false }) {
  const rows = data || [];
  if (!rows.length) return <Empty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 12, bottom: 0, left: horizontal ? 10 : -14 }}>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" allowDecimals={false} {...AXIS} />
            <YAxis type="category" dataKey={labelKey} width={110} {...AXIS} />
          </>
        ) : (
          <>
            <XAxis dataKey={labelKey} {...AXIS} />
            <YAxis allowDecimals={false} {...AXIS} />
          </>
        )}
        <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
        <Bar dataKey={valueKey} name={name} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} barSize={horizontal ? 20 : undefined}>
          {rows.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Area/line series for admin trend charts. series: [{ key, name, color }] */
export function AdminAreaChart({ data, xKey, series, height = 240 }) {
  const gid = useId().replace(/:/g, '');
  const rows = data || [];
  if (!rows.length) return <Empty height={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`ag-${gid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} minTickGap={30} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'rgba(147,197,253,0.4)' }} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#ag-${gid}-${s.key})`}
            dot={rows.length < 20 ? { r: 3, fill: s.color, strokeWidth: 0 } : false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
