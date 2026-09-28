import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminStatCard from '../components/AdminStatCard';
import AdminChart, { AdminAreaChart } from '../components/AdminChart';
import HealthGrid, { OverallHealth } from '../components/HealthGrid';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { apiError } from '../../utils/format';

/** Group rows by calendar day (YYYY-MM-DD) of a timestamp field. */
function byDay(rows, field, valueFn = () => 1) {
  const map = new Map();
  (rows || []).forEach((r) => {
    const d = String(r[field] || '').slice(0, 10);
    if (!d) return;
    map.set(d, (map.get(d) || 0) + valueFn(r));
  });
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [analyses, setAnalyses] = useState(null);
  const [users, setUsers] = useState(null);
  const [checkedAt, setCheckedAt] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const t0 = performance.now();
      const healthP = adminService.getSystemHealth().then((h) => {
        setLatency(performance.now() - t0);
        return h;
      });
      const [s, h, a, u] = await Promise.all([
        adminService.getDashboard(),
        healthP,
        adminService.listAnalyses().catch(() => null),
        adminService.listUsers({ page: 1, pageSize: 100 }).catch(() => null),
      ]);
      setStats(s);
      setHealth(h);
      setCheckedAt(new Date());
      setAnalyses(a);
      setUsers(u);
    } catch (err) {
      setError(apiError(err, 'Could not load admin dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const series = useMemo(() => {
    // Cumulative user growth from real created_at values.
    // If only the latest page was fetched, start from the users not included.
    let running = users ? Math.max(0, users.total - (users.items?.length || 0)) : 0;
    const growth = byDay(users?.items, 'created_at').map(([date, n]) => {
      running += n;
      return { date: date.slice(5), users: running };
    });
    const activity = byDay(analyses, 'created_at').map(([date, n]) => ({ date: date.slice(5), analyses: n }));
    const anomalyTrend = byDay(analyses, 'created_at', (r) => r.anomaly_count || 0).map(([date, n]) => ({ date: date.slice(5), anomalies: n }));
    return { growth, activity, anomalyTrend };
  }, [users, analyses]);

  if (loading) return <Loading label="Loading admin dashboard..." />;
  if (error) return <ErrorState title="Unable to load the admin dashboard" message={error} onRetry={load} />;

  const usersTruncated = users && users.total > (users.items?.length || 0);

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Admin Console"
        eyebrowIcon="shield"
        title="System Overview"
        subtitle="Platform-wide usage, detection activity and service health."
        actions={
          <button className="btn-ghost btn-sm" type="button" onClick={load}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        }
      />

      <div className="stat-grid admin-kpis">
        <AdminStatCard label="Users" value={stats.total_users} icon="users" tone="primary" />
        <AdminStatCard label="Active Users" value={stats.active_users} icon="user" tone="success" hint={`${Math.max(0, stats.total_users - stats.active_users)} disabled`} />
        <AdminStatCard label="Demo Consumers" value={stats.demo_consumers} icon="meter" />
        <AdminStatCard label="Datasets" value={stats.total_datasets} icon="database" />
        <AdminStatCard label="Analyses" value={stats.total_analyses} icon="chartLine" tone="primary" hint={`${stats.analyses_this_month} this month`} />
        <AdminStatCard label="Anomalies" value={stats.total_anomalies} icon="alert" tone="anomaly" hint="Stored anomaly records" />
      </div>

      <div className="admin-chart-grid">
        <Card title="User Growth" subtitle={usersTruncated ? `Cumulative users; daily detail for the latest ${users.items.length} of ${users.total}` : 'Cumulative registered users'} icon="users">
          <AdminAreaChart data={series.growth} xKey="date" series={[{ key: 'users', name: 'Users', color: '#60a5fa' }]} />
        </Card>
        <Card title="Analysis Activity" subtitle="Analyses run per day" icon="activity">
          <AdminAreaChart data={series.activity} xKey="date" series={[{ key: 'analyses', name: 'Analyses', color: '#22d3ee' }]} />
        </Card>
        <Card title="Anomaly Detection Trend" subtitle="Anomalies detected per day (by analysis date)" icon="alert">
          <AdminAreaChart data={series.anomalyTrend} xKey="date" series={[{ key: 'anomalies', name: 'Anomalies', color: '#f97316' }]} />
        </Card>
        <Card title="Model Usage" subtitle="Analyses that ran each model" icon="cpu">
          <AdminChart data={stats.charts?.model_usage} labelKey="model" valueKey="count" name="Analyses" horizontal height={240} />
        </Card>
      </div>

      <Card
        title="System Health"
        subtitle="As reported by the backend health endpoint"
        icon="server"
        actions={
          <>
            <OverallHealth overall={health?.overall} />
            <Link to="/admin/system" className="btn-ghost btn-sm">
              Details <Icon name="arrowRight" size={13} />
            </Link>
          </>
        }
      >
        <HealthGrid health={health} checkedAt={checkedAt} latencyMs={latency} compact />
      </Card>
    </div>
  );
}
