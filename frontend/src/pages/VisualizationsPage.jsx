import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loading, ErrorState } from '../components/ui/States';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import {
  ConsumptionTrendChart,
  HourlyPatternChart,
  DailyTrendChart,
  MonthlyTrendChart,
  AnomalyTimelineChart,
  NormalVsAnomalyChart,
  ModelComparisonChart,
} from '../components/charts/AnalysisCharts';
import { AnomalyTimeline } from '../components/analysis/AnomalyPanels';
import { AnalysisNav } from '../components/analysis/AnalysisNav';
import { apiError } from '../utils/format';
import * as analysisService from '../services/analysisService';

const VIEWS = [
  { value: 'all', label: 'All charts' },
  { value: 'consumption', label: 'Consumption' },
  { value: 'patterns', label: 'Patterns' },
  { value: 'anomalies', label: 'Anomalies' },
  { value: 'models', label: 'Models' },
];

export default function VisualizationsPage() {
  const { analysisId } = useParams();
  const [charts, setCharts] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, anom] = await Promise.all([
        analysisService.getResults(analysisId),
        analysisService.getAnomalies(analysisId).catch(() => null),
      ]);
      setCharts(res.charts || {});
      setAnomalies(anom);
    } catch (err) {
      setError(apiError(err, 'Could not load visualizations.'));
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="page"><Loading variant="chart" label="Loading visualizations..." /></div>;
  if (error) return <div className="page"><ErrorState title="Unable to load visualizations" message={error} onRetry={load} /></div>;

  const show = (v) => view === 'all' || view === v;
  const trend = charts.consumption_trend;

  return (
    <div className="page">
      <PageHeader
        eyebrow={`Analysis #${analysisId}`}
        eyebrowIcon="chartBar"
        title="Visualizations"
        subtitle="An analytics workspace for consumption trends, usage patterns and detected anomalies."
        actions={<Tabs options={VIEWS} value={view} onChange={setView} label="Chart group" size="lg" />}
      />
      <AnalysisNav analysisId={analysisId} />

      {show('consumption') && (
        <div className="mb-5">
          <ConsumptionTrendChart data={trend} anomalies={anomalies?.items} />
        </div>
      )}

      {show('patterns') && (
        <div className="chart-grid">
          <HourlyPatternChart data={charts.hourly_pattern} />
          <DailyTrendChart data={charts.daily_trend} />
          <MonthlyTrendChart data={charts.monthly_trend} />
        </div>
      )}

      {show('anomalies') && (
        <>
          <div className="chart-grid">
            <NormalVsAnomalyChart data={charts.normal_vs_anomaly} />
            <AnomalyTimelineChart data={charts.anomaly_timeline} />
          </div>
          <div className="mb-5">
            <AnomalyTimeline items={charts.anomaly_timeline} start={trend?.[0]?.timestamp} end={trend?.[trend.length - 1]?.timestamp} listLimit={4} />
          </div>
        </>
      )}

      {show('models') && (
        <div className="chart-grid">
          <ModelComparisonChart data={charts.model_comparison} />
        </div>
      )}
    </div>
  );
}
