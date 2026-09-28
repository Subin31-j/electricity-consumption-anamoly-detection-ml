import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminChart from '../components/AdminChart';
import AdminStatCard from '../components/AdminStatCard';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { ModelAgreement } from '../../components/analysis/ModelComparison';
import { apiError } from '../../utils/format';

const MODELS = [
  { key: 'isolation_forest', label: 'Isolation Forest', flag: 'iforest_label', score: 'iforest_score', icon: 'tree', color: '#60a5fa', primary: true },
  { key: 'kmeans', label: 'K-Means', flag: 'kmeans_label', score: 'kmeans_score', icon: 'clusters', color: '#22d3ee' },
  { key: 'lof', label: 'LOF', flag: 'lof_label', score: 'lof_score', icon: 'radar', color: '#a78bfa' },
];

/**
 * Model monitoring built from existing admin endpoints: model usage from the
 * dashboard stats, and per-model flag counts / agreement / mean scores from the
 * latest anomaly records.
 */
export default function AdminModels() {
  const [stats, setStats] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, a] = await Promise.all([adminService.getDashboard(), adminService.listAnomalies()]);
      setStats(s);
      setAnomalies(a);
    } catch (err) {
      setError(apiError(err, 'Could not load model monitoring data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const per = useMemo(() => {
    const list = anomalies || [];
    return MODELS.map((m) => {
      const flagged = list.filter((r) => r[m.flag]);
      const scores = flagged.map((r) => r[m.score]).filter((v) => Number.isFinite(v));
      const usage = stats?.charts?.model_usage?.find((u) => u.model === (m.key === 'lof' ? 'LOF' : m.label))?.count ?? 0;
      return {
        ...m,
        usage,
        flagged: flagged.length,
        solo: flagged.filter((r) => r.agreement_count === 1).length,
        meanScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      };
    });
  }, [anomalies, stats]);

  const agreement = useMemo(() => {
    const list = anomalies || [];
    return {
      detected_by_all_three: list.filter((r) => r.agreement_count === 3).length,
      detected_by_two: list.filter((r) => r.agreement_count === 2).length,
      detected_by_one: list.filter((r) => r.agreement_count === 1).length,
    };
  }, [anomalies]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Monitor"
        eyebrowIcon="cpu"
        title="Model Monitoring"
        subtitle={`Usage across ${stats.total_analyses} analyses; flag behaviour from the latest ${anomalies.length} anomaly records.`}
      />

      <div className="admin-model-grid">
        {per.map((m) => (
          <Card key={m.key} className={`admin-model-card ${m.primary ? 'is-primary' : ''}`}>
            <div className="admin-model-head">
              <span className="model-icon" style={{ '--model-color': m.color }}>
                <Icon name={m.icon} size={18} />
              </span>
              <div>
                <strong>{m.label}</strong>
                <Badge tone={m.primary ? 'primary' : 'outline'}>{m.primary ? 'Primary' : 'Comparison'}</Badge>
              </div>
            </div>
            <dl className="admin-model-stats">
              <div><dt>Analyses run</dt><dd className="tabular">{m.usage.toLocaleString()}</dd></div>
              <div><dt>Flags (sample)</dt><dd className="tabular">{m.flagged.toLocaleString()}</dd></div>
              <div><dt>Solo flags</dt><dd className="tabular">{m.solo.toLocaleString()}</dd></div>
              <div><dt>Mean score of flags</dt><dd className="tabular">{m.meanScore !== null ? m.meanScore.toFixed(3) : '-'}</dd></div>
            </dl>
          </Card>
        ))}
      </div>

      <div className="stat-grid mt-5">
        <AdminStatCard label="Total analyses" value={stats.total_analyses} icon="chartLine" tone="primary" />
        <AdminStatCard label="Stored anomalies" value={stats.total_anomalies} icon="alert" tone="anomaly" />
        <AdminStatCard label="Analyses this month" value={stats.analyses_this_month} icon="calendar" />
      </div>

      <div className="grid-2">
        <Card title="Model Usage" subtitle="Analyses that included each model" icon="chartBar">
          <AdminChart data={stats.charts?.model_usage} labelKey="model" valueKey="count" name="Analyses" horizontal height={220} />
        </Card>
        <ModelAgreement agreement={agreement} />
      </div>
    </div>
  );
}
