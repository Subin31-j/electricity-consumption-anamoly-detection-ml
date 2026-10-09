import { useId, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartCard } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { CHART, buildChartPoints, filterByRange, indexAnomalies } from './analysisUtils';

export const RANGE_KEY = 'ecad_default_range';
const RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All' },
];

export function getDefaultRange() {
  const v = localStorage.getItem(RANGE_KEY);
  return RANGES.some((r) => r.value === v) ? v : 'all';
}

function OverviewTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const [date, time] = p.t.split('T');
  const rec = p.rec;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{date}</div>
      <div className="chart-tooltip-row">
        <span>Time</span>
        <strong>{(time || '').slice(0, 5)}</strong>
      </div>
      <div className="chart-tooltip-row">
        <span>{p.bucket > 1 ? `Avg of ${p.bucket} readings` : 'Consumption'}</span>
        <strong>{Number(p.kwh).toFixed(3)} kWh</strong>
      </div>
      {p.isAnomaly && p.bucket > 1 && (
        <div className="chart-tooltip-row">
          <span>Flagged reading</span>
          <strong className="is-anomaly">{Number(p.anomalyKwh).toFixed(3)} kWh</strong>
        </div>
      )}
      <div className="chart-tooltip-row">
        <span>Status</span>
        <strong className={p.isAnomaly ? 'is-anomaly' : ''}>
          {p.isAnomaly ? (p.bucketAnomalies > 1 ? `${p.bucketAnomalies} anomalies` : 'Anomaly') : 'Normal'}
        </strong>
      </div>
      {rec && (
        <>
          <div className="chart-tooltip-row">
            <span>Model agreement</span>
            <strong>{rec.agreement_count} / 3</strong>
          </div>
          {rec.iforest_score !== null && rec.iforest_score !== undefined && (
            <div className="chart-tooltip-row">
              <span>IF score</span>
              <strong>{rec.iforest_score.toFixed(3)}</strong>
            </div>
          )}
          {rec.lof_score !== null && rec.lof_score !== undefined && (
            <div className="chart-tooltip-row">
              <span>LOF score</span>
              <strong>{rec.lof_score.toFixed(3)}</strong>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AnomalyDot({ cx, cy, payload }) {
  if (payload?.anomalyKwh === null || payload?.anomalyKwh === undefined || cy === null || cy === undefined) return null;
  const strong = payload.agreement === 3;
  const c = strong ? CHART.anomalyStrong : CHART.anomaly;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={c} opacity={0.16} />
      <circle cx={cx} cy={cy} r={3.4} fill={c} stroke="#fff" strokeWidth={1.2} />
    </g>
  );
}

function tickDate(t) {
  return String(t).slice(5, 10);
}

/**
 * The main consumption visualization: area chart with highlighted anomaly
 * points, range controls, legend and a rich tooltip (joined with anomaly
 * records to show agreement and model scores when available).
 */
export function ConsumptionOverview({
  trend,
  anomalies,
  title = 'Consumption Overview',
  subtitle,
  height = 320,
  extraActions,
  downloadable = false,
}) {
  const gid = useId().replace(/:/g, '');
  const [range, setRange] = useState(getDefaultRange);
  const index = useMemo(() => indexAnomalies(anomalies), [anomalies]);
  const filtered = useMemo(() => filterByRange(trend, range), [trend, range]);
  const points = useMemo(() => buildChartPoints(filtered, index), [filtered, index]);
  const anomalyCount = filtered.filter((p) => p.is_anomaly).length;
  const bucketed = points.length && points[0].bucket > 1;

  return (
    <ChartCard
      title={title}
      subtitle={
        subtitle ||
        `${filtered.length.toLocaleString()} readings · ${anomalyCount.toLocaleString()} flagged${bucketed ? ' · long series grouped for display, all anomalies kept' : ''}`
      }
      icon="activity"
      downloadable={downloadable}
      actions={
        <>
          <Tabs options={RANGES} value={range} onChange={setRange} label="Chart time range" />
          {extraActions}
        </>
      }
      legend={
        <>
          <span>
            <i className="legend-swatch line" /> Consumption (kWh)
          </span>
          <span>
            <i className="legend-swatch dot" /> Anomaly
          </span>
          <span>
            <i className="legend-swatch dot" style={{ background: CHART.anomalyStrong }} /> Flagged by all 3 models
          </span>
        </>
      }
    >
      {points.length === 0 ? (
        <div className="chart-empty">No consumption data in this range.</div>
      ) : (
        <div className="chart-reveal" style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 10, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id={`co-${gid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={CHART.blue} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="t" tickFormatter={tickDate} minTickGap={48} tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={48} />
              <Tooltip content={<OverviewTooltip />} cursor={{ stroke: '#93c5fd', strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey="kwh"
                stroke={CHART.blueDeep}
                strokeWidth={1.6}
                fill={`url(#co-${gid})`}
                dot={false}
                activeDot={{ r: 4, fill: CHART.blueDeep, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={points.length < 2000}
                name="Consumption (kWh)"
              />
              <Line
                type="monotone"
                dataKey="anomalyKwh"
                stroke="none"
                dot={<AnomalyDot />}
                activeDot={false}
                isAnimationActive={false}
                legendType="none"
                name="Anomaly"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export default ConsumptionOverview;
