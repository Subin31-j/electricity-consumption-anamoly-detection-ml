import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Icon } from '../components/ui/Icon';
import { StatusBadge } from '../components/ui/Badge';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import { Loading, EmptyState, ErrorState } from '../components/ui/States';
import { downsample } from '../components/ui/Sparkline';
import { ConsumptionOverview } from '../components/analysis/ConsumptionOverview';
import { AnomalySummary, AnomalyTimeline } from '../components/analysis/AnomalyPanels';
import { ModelCards, ModelAgreement } from '../components/analysis/ModelComparison';
import { dataPeriod } from '../components/analysis/analysisUtils';
import { formatDateTime, modelList, sourceLabel, apiError } from '../utils/format';
import * as analysisService from '../services/analysisService';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);
  const [latest, setLatest] = useState(null);
  const [results, setResults] = useState(null);
  const [anomalies, setAnomalies] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const h = await analysisService.getHistory();
      setHistory(h);
      const completed = (h.items || []).find((i) => i.status === 'COMPLETED');
      setLatest(completed || null);
      if (completed) {
        const [res, anom] = await Promise.all([
          analysisService.getResults(completed.id),
          analysisService.getAnomalies(completed.id).catch(() => null),
        ]);
        setResults(res);
        setAnomalies(anom);
      } else {
        setResults(null);
        setAnomalies(null);
      }
    } catch (err) {
      setError(apiError(err, 'Unable to load your dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const charts = results?.charts || {};
  const trend = charts.consumption_trend;
  const items = anomalies?.items;

  const derived = useMemo(() => {
    if (!trend?.length) return null;
    const total = trend.reduce((s, p) => s + (p.consumption_kwh || 0), 0);
    const daily = (charts.daily_trend || []).map((d) => d.consumption_kwh);
    const hourly = (charts.hourly_pattern || []).map((d) => d.consumption_kwh);
    // Anomalies per day aligned to the daily series.
    const perDay = new Map();
    trend.forEach((p) => {
      if (!p.is_anomaly) return;
      const d = String(p.timestamp).slice(0, 10);
      perDay.set(d, (perDay.get(d) || 0) + 1);
    });
    const anomalyDaily = (charts.daily_trend || []).map((d) => perDay.get(String(d.date).slice(0, 10)) || 0);
    return { total, daily: downsample(daily, 40), hourly, anomalyDaily: downsample(anomalyDaily, 40) };
  }, [trend, charts.daily_trend, charts.hourly_pattern]);

  const firstName = (user?.name || '').split(' ')[0];

  if (loading) return <div className="page"><Loading label="Loading dashboard..." /></div>;
  if (error) {
    return (
      <div className="page">
        <ErrorState title="Unable to load your dashboard" message={error} onRetry={load} />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Electricity Intelligence"
          title={firstName ? `Welcome, ${firstName}` : 'Welcome to ECAD'}
          subtitle="Monitor consumption patterns and identify unusual behavior."
        />
        <div className="dash-empty">
          <EmptyState
            title="No analysis yet"
            message="Your electricity insights will appear here after your first analysis."
            action={
              <>
                <Link className="btn-primary" to="/consumption">
                  <Icon name="meter" size={16} /> Use Consumer Number
                </Link>
                <Link className="btn-ghost" to="/upload">
                  <Icon name="upload" size={16} /> Upload Dataset
                </Link>
              </>
            }
          />
          <div className="dash-empty-steps">
            {[
              ['meter', 'Choose a data source', 'Verify a demo consumer number or upload a CSV / Excel file.'],
              ['cpu', 'Run the ML pipeline', 'Isolation Forest, K-Means and LOF analyze the readings.'],
              ['chartLine', 'Review insights', 'Charts, anomaly timeline, model agreement and reports.'],
            ].map(([icon, t, d], i) => (
              <div key={t} className="dash-empty-step">
                <span className="step-badge">{String(i + 1).padStart(2, '0')}</span>
                <Icon name={icon} size={18} />
                <div>
                  <strong>{t}</strong>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
          {history?.total > 0 && (
            <p className="text-muted" style={{ fontSize: 'var(--fs-sm)' }}>
              You have {history.total} analysis record(s) but none completed yet. <Link to="/history">View history</Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  const s = results.summary;
  const period = dataPeriod(trend);
  const recent = (history?.items || []).slice(0, 5);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Electricity Intelligence"
        title={firstName ? `Welcome back, ${firstName}` : 'Electricity Intelligence'}
        subtitle="Monitor consumption patterns and identify unusual behavior."
        meta={[
          { label: 'Source', value: sourceLabel(latest), icon: latest?.consumer_id ? 'meter' : 'database' },
          period && { label: 'Period', value: `${period.from} → ${period.to}`, icon: 'calendar' },
          { label: 'Analysis', value: `#${latest.id}`, icon: 'hash' },
          { label: 'Total analyses', value: history?.total ?? 0, icon: 'history' },
        ].filter(Boolean)}
        actions={
          <>
            <Link className="btn-ghost" to="/consumption">
              <Icon name="plus" size={16} /> New analysis
            </Link>
            <button className="btn-primary" type="button" onClick={() => navigate(`/analysis/${latest.id}/results`)}>
              View full results <Icon name="arrowRight" size={16} />
            </button>
          </>
        }
      />

      <div className="stat-grid kpi-grid">
        <StatCard
          label="Total Consumption"
          value={derived ? Math.round(derived.total) : '-'}
          unit="kWh"
          icon="bolt"
          tone="dark"
          hint={`${s.total_records.toLocaleString()} readings analysed`}
          spark={derived?.daily}
        />
        <StatCard label="Average Usage" value={s.average_consumption} unit="kWh" icon="activity" hint="Per reading" spark={derived?.hourly} />
        <StatCard label="Peak Usage" value={s.peak_consumption} unit="kWh" icon="trendUp" hint={`Minimum ${s.minimum_consumption} kWh`} />
        <StatCard label="Anomalies" value={s.anomaly_count} icon="alert" tone="anomaly" hint={`${s.normal_records.toLocaleString()} normal readings`} spark={derived?.anomalyDaily} />
        <StatCard label="Anomaly Rate" value={s.anomaly_rate} unit="%" decimals={2} icon="target" tone="anomaly" hint="Share of readings flagged" />
      </div>

      <div className="grid-main-side">
        <ConsumptionOverview trend={trend} anomalies={items} />
        <AnomalySummary summary={s} anomalies={items} />
      </div>

      <div className="mt-5">
        <AnomalyTimeline items={charts.anomaly_timeline} start={trend?.[0]?.timestamp} end={trend?.[trend.length - 1]?.timestamp} />
      </div>

      <SectionHeader
        title="Model Comparison"
        subtitle="Isolation Forest is the primary model; K-Means and LOF provide comparison."
        actions={
          <Link className="btn-ghost btn-sm" to={`/analysis/${latest.id}/comparison`}>
            Details <Icon name="arrowRight" size={14} />
          </Link>
        }
      />
      <div className="grid-main-side">
        <ModelCards models={results.models} totalRecords={s.total_records} anomalies={items} />
        <ModelAgreement agreement={results.agreement} />
      </div>

      <SectionHeader
        title="Recent Analyses"
        actions={
          <Link className="btn-ghost btn-sm" to="/history">
            View all <Icon name="arrowRight" size={14} />
          </Link>
        }
      />
      <Card flush>
        <ul className="recent-list">
          {recent.map((a) => (
            <li key={a.id}>
              <Link to={`/analysis/${a.id}/results`} className="recent-item">
                <span className={`recent-icon ${a.consumer_id ? '' : 'is-dataset'}`}>
                  <Icon name={a.consumer_id ? 'meter' : 'fileSheet'} size={16} />
                </span>
                <span className="recent-main">
                  <strong>Analysis #{a.id}</strong>
                  <small>
                    {sourceLabel(a)} · {modelList(a.models_used).join(', ') || '-'}
                  </small>
                </span>
                <span className="recent-stat tabular">
                  <strong>{a.record_count.toLocaleString()}</strong>
                  <small>records</small>
                </span>
                <span className="recent-stat tabular is-anomaly">
                  <strong>{a.anomaly_count.toLocaleString()}</strong>
                  <small>anomalies</small>
                </span>
                <StatusBadge status={a.status} />
                <span className="recent-date">{formatDateTime(a.created_at)}</span>
                <Icon name="chevronRight" size={16} className="recent-chevron" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <p className="page-disclaimer">
        <Icon name="info" size={14} /> {results.disclaimer}
      </p>
    </div>
  );
}
