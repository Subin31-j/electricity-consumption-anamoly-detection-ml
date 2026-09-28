import { useMemo } from 'react';
import { StatCard } from '../ui/StatCard';
import { Card } from '../ui/Card';
import { SectionHeader } from '../ui/PageHeader';
import { downsample } from '../ui/Sparkline';
import { ConsumptionOverview } from './ConsumptionOverview';
import { AnomalySummary, AnomalyTimeline, AnomalyTable } from './AnomalyPanels';
import { ModelCards, ModelAgreement, ModelConfigList } from './ModelComparison';
import { Insights } from './Insights';

/**
 * Full results body for one analysis. Shared by the user Results page and the
 * admin analysis detail page. Renders only what the API returned.
 */
export function AnalysisResultsView({ results, anomalies }) {
  const s = results.summary;
  const charts = results.charts || {};
  const trend = charts.consumption_trend;
  const items = anomalies?.items;

  const sparks = useMemo(() => {
    const daily = (charts.daily_trend || []).map((d) => d.consumption_kwh);
    const total = (trend || []).reduce((sum, p) => sum + (p.consumption_kwh || 0), 0);
    return { daily: downsample(daily, 40), hourly: (charts.hourly_pattern || []).map((h) => h.consumption_kwh), total };
  }, [charts.daily_trend, charts.hourly_pattern, trend]);

  return (
    <>
      <div className="stat-grid kpi-grid">
        <StatCard label="Records Analyzed" value={s.total_records} icon="database" tone="dark" hint={`${s.normal_records.toLocaleString()} normal`} />
        <StatCard label="Total Consumption" value={trend?.length ? Math.round(sparks.total) : '-'} unit="kWh" icon="bolt" spark={sparks.daily} />
        <StatCard label="Average Usage" value={s.average_consumption} unit="kWh" icon="activity" spark={sparks.hourly} hint="Spark: hourly profile" />
        <StatCard label="Peak Usage" value={s.peak_consumption} unit="kWh" icon="trendUp" hint={`Minimum ${s.minimum_consumption} kWh`} />
        <StatCard label="Anomalies" value={s.anomaly_count} icon="alert" tone="anomaly" hint={`${s.anomaly_rate}% of readings`} />
      </div>

      <ConsumptionOverview trend={trend} anomalies={items} />

      <SectionHeader title="Anomaly Timeline" subtitle="When unusual readings occurred and how many models agreed" />
      <div className="grid-main-side">
        <AnomalyTimeline items={charts.anomaly_timeline} start={trend?.[0]?.timestamp} end={trend?.[trend.length - 1]?.timestamp} listLimit={5} />
        <AnomalySummary summary={s} anomalies={items} />
      </div>

      <SectionHeader title="Model Comparison" subtitle="Detection counts and cross-model agreement" />
      <div className="grid-main-side">
        <ModelCards models={results.models} totalRecords={s.total_records} anomalies={items} />
        <ModelAgreement agreement={results.agreement} />
      </div>

      <SectionHeader title={`Anomaly Records (${(anomalies?.total ?? 0).toLocaleString()})`} subtitle="Every reading flagged by at least one model" />
      <Card flush>
        <AnomalyTable items={items} />
      </Card>

      <SectionHeader title="Insights" />
      <Insights insights={results.insights} anomalies={items} trend={trend} summary={s} disclaimer={results.disclaimer} />

      <SectionHeader title="Model Configuration" subtitle="Parameters used for this run" />
      <Card>
        <ModelConfigList models={results.models} />
      </Card>
    </>
  );
}

export default AnalysisResultsView;
