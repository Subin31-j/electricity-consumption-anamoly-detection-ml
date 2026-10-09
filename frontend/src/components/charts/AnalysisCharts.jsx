import { useId } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartCard } from '../ui/Card';
import { ConsumptionOverview } from '../analysis/ConsumptionOverview';
import { CHART } from '../analysis/analysisUtils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MODEL_COLORS = { 'Isolation Forest': '#2563eb', 'K-Means': '#0891b2', LOF: '#7c3aed' };

/**
 * Plot heights per density. `compact` trims vertical space so a whole
 * dashboard of charts fits on one screen without scrolling.
 */
const H = {
  trend: { normal: 300, compact: 216 },
  donut: { normal: 240, compact: 188 },
  standard: { normal: 260, compact: 196 },
  bars: { normal: 240, compact: 184 },
};

const h = (key, compact) => H[key][compact ? 'compact' : 'normal'];

function Empty() {
  return <div className="chart-empty">No data available for this chart.</div>;
}

function SimpleTooltip({ active, payload, label, labelFormatter, unit = 'kWh', valueLabel = 'Average' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{labelFormatter ? labelFormatter(label) : label}</div>
      {payload.map((p) => (
        <div className="chart-tooltip-row" key={p.dataKey}>
          <span>{p.name || valueLabel}</span>
          <strong>
            {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : p.value}
            {unit ? ` ${unit}` : ''}
          </strong>
        </div>
      ))}
    </div>
  );
}

const axisProps = { tickLine: false, axisLine: false };

/** Consumption trend with anomaly overlay (delegates to the main overview chart). */
export function ConsumptionTrendChart({ data, anomalies, downloadable = false, compact = false }) {
  return (
    <ConsumptionOverview
      trend={data}
      anomalies={anomalies}
      title="Consumption Trend"
      height={h('trend', compact)}
      downloadable={downloadable}
    />
  );
}

export function NormalVsAnomalyChart({ data, downloadable = false, compact = false }) {
  const rows = data || [];
  const total = rows.reduce((s, r) => s + (r.value || 0), 0);
  const anomaly = rows.find((r) => r.name === 'Anomaly')?.value || 0;
  const outer = compact ? 74 : 96;
  const inner = compact ? 52 : 68;
  return (
    <ChartCard
      title="Normal vs Anomaly"
      subtitle="Share of readings by overall status"
      icon="pie"
      downloadable={downloadable}
      legend={rows.map((r) => (
        <span key={r.name}>
          <i className="legend-swatch" style={{ background: r.name === 'Anomaly' ? CHART.anomaly : CHART.blue }} />
          {r.name}: <strong className="tabular">{(r.value || 0).toLocaleString()}</strong>
        </span>
      ))}
    >
      {total === 0 ? (
        <Empty />
      ) : (
        <div className="donut-wrap">
          <ResponsiveContainer width="100%" height={h('donut', compact)}>
            <PieChart>
              <Pie data={rows} dataKey="value" nameKey="name" innerRadius={inner} outerRadius={outer} paddingAngle={2} stroke="none">
                {rows.map((entry) => (
                  <Cell key={entry.name} fill={entry.name === 'Anomaly' ? CHART.anomaly : CHART.blue} />
                ))}
              </Pie>
              <Tooltip content={<SimpleTooltip unit="readings" valueLabel="Readings" />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center" aria-hidden="true">
            <strong className="tabular">{((anomaly / total) * 100).toFixed(1)}%</strong>
            <span>anomalous</span>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

export function HourlyPatternChart({ data, downloadable = false, compact = false }) {
  const rows = data || [];
  const max = Math.max(0, ...rows.map((r) => r.consumption_kwh || 0));
  return (
    <ChartCard
      title="Hourly Pattern"
      subtitle="Average consumption by hour of day"
      icon="clock"
      downloadable={downloadable}
    >
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={h('standard', compact)}>
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="hour" {...axisProps} tickFormatter={(hr) => `${String(hr).padStart(2, '0')}`} />
            <YAxis {...axisProps} width={44} />
            <Tooltip
              cursor={{ fill: 'rgba(59,130,246,0.06)' }}
              content={<SimpleTooltip labelFormatter={(hr) => `${String(hr).padStart(2, '0')}:00 – ${String(hr).padStart(2, '0')}:59`} />}
            />
            <Bar dataKey="consumption_kwh" name="Average" radius={[4, 4, 0, 0]}>
              {rows.map((r) => (
                <Cell key={r.hour} fill={r.consumption_kwh === max ? CHART.blueDeep : '#93c5fd'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function DailyTrendChart({ data, downloadable = false, compact = false }) {
  const gid = useId().replace(/:/g, '');
  const rows = data || [];
  return (
    <ChartCard
      title="Daily Pattern"
      subtitle="Average consumption per day"
      icon="calendar"
      downloadable={downloadable}
    >
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={h('standard', compact)}>
          <AreaChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id={`dt-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="date" {...axisProps} tickFormatter={(d) => String(d).slice(5)} minTickGap={40} />
            <YAxis {...axisProps} width={44} />
            <Tooltip content={<SimpleTooltip />} />
            <Area type="monotone" dataKey="consumption_kwh" name="Average" stroke="#0891b2" strokeWidth={1.8} fill={`url(#dt-${gid})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function MonthlyTrendChart({ data, downloadable = false, compact = false }) {
  const rows = data || [];
  return (
    <ChartCard
      title="Monthly Pattern"
      subtitle="Average consumption by calendar month"
      icon="chartBar"
      downloadable={downloadable}
    >
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={h('standard', compact)}>
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="month" {...axisProps} tickFormatter={(m) => MONTHS[m - 1] || m} />
            <YAxis {...axisProps} width={44} />
            <Tooltip cursor={{ fill: 'rgba(59,130,246,0.06)' }} content={<SimpleTooltip labelFormatter={(m) => MONTHS[m - 1] || m} />} />
            <Bar dataKey="consumption_kwh" name="Average" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function TimelineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{String(p.timestamp).replace('T', ' ').slice(0, 16)}</div>
      <div className="chart-tooltip-row">
        <span>Consumption</span>
        <strong className="is-anomaly">{Number(p.consumption_kwh).toFixed(3)} kWh</strong>
      </div>
      <div className="chart-tooltip-row">
        <span>Model agreement</span>
        <strong>{p.agreement_count} / 3</strong>
      </div>
    </div>
  );
}

export function AnomalyTimelineChart({ data, downloadable = false, compact = false }) {
  const rows = (data || []).map((d) => ({ ...d, x: Date.parse(String(d.timestamp).slice(0, 19)) }));
  const byLevel = [1, 2, 3].map((lvl) => rows.filter((r) => r.agreement_count === lvl));
  const colors = ['#fdba74', CHART.anomaly, CHART.anomalyStrong];
  return (
    <ChartCard
      title="Anomaly Scatter"
      subtitle="Flagged readings over time, coloured by model agreement"
      icon="target"
      downloadable={downloadable}
      legend={['1 model', '2 models', '3 models'].map((l, i) => (
        <span key={l}>
          <i className="legend-swatch dot" style={{ background: colors[i] }} /> {l}
        </span>
      ))}
    >
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={h('standard', compact)}>
          <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={CHART.grid} />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              {...axisProps}
              tickFormatter={(t) => {
                const d = new Date(t);
                return Number.isNaN(d.getTime()) ? '' : `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              }}
              minTickGap={40}
            />
            <YAxis dataKey="consumption_kwh" name="kWh" {...axisProps} width={44} />
            <ZAxis range={compact ? [26, 26] : [36, 36]} />
            <Tooltip content={<TimelineTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            {byLevel.map((set, i) => (
              <Scatter key={i} data={set} fill={colors[i]} name={`${i + 1} model(s)`} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function ModelComparisonChart({ data, downloadable = false, compact = false }) {
  const rows = data || [];
  return (
    <ChartCard
      title="Model Comparison"
      subtitle="Anomalies flagged by each model"
      icon="compare"
      downloadable={downloadable}
    >
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={h('bars', compact)}>
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
            <CartesianGrid horizontal={false} stroke={CHART.grid} />
            <XAxis type="number" {...axisProps} allowDecimals={false} />
            <YAxis type="category" dataKey="model" {...axisProps} width={110} />
            <Tooltip cursor={{ fill: 'rgba(59,130,246,0.06)' }} content={<SimpleTooltip unit="" valueLabel="Anomalies" />} />
            <Bar dataKey="anomalies" name="Anomalies" radius={[0, 6, 6, 0]} barSize={compact ? 16 : 22}>
              {rows.map((r) => (
                <Cell key={r.model} fill={MODEL_COLORS[r.model] || CHART.blue} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
