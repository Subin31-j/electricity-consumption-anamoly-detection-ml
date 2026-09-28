import { useCallback, useEffect, useState } from 'react';
import HealthGrid, { OverallHealth } from '../components/HealthGrid';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { apiError } from '../../utils/format';

export default function AdminSystem() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState(null);
  const [latency, setLatency] = useState(null);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const t0 = performance.now();
      const h = await adminService.getSystemHealth();
      setLatency(performance.now() - t0);
      setHealth(h);
      setCheckedAt(new Date());
    } catch (err) {
      setError(apiError(err, 'Could not load system health.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  if (loading) return <Loading variant="cards" />;
  if (error && !health) return <ErrorState message={error} onRetry={() => load(true)} />;

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Monitor"
        eyebrowIcon="server"
        title="System Health"
        subtitle="Live status reported by GET /api/admin/system-health. Nothing on this page is simulated."
        actions={
          <>
            <OverallHealth overall={health?.overall} />
            <button className="btn-primary btn-sm" type="button" onClick={() => load(false)} disabled={refreshing}>
              {refreshing ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="refresh" size={14} />} Refresh
            </button>
          </>
        }
      />
      {error && (
        <div className="alert alert-error" role="alert">
          <Icon name="alertCircle" size={16} />
          <span>{error}</span>
        </div>
      )}
      <HealthGrid health={health} checkedAt={checkedAt} latencyMs={latency} />

      <Card title="How health is determined" icon="info" className="mt-5">
        <ul className="admin-notes">
          <li><strong>Backend API</strong> - healthy when the health endpoint responds.</li>
          <li><strong>Database</strong> - a <code>SELECT 1</code> query succeeds.</li>
          <li><strong>ML Engine</strong> - the scikit-learn library can be loaded.</li>
          <li><strong>Storage</strong> - consumption readings exist in the database (degraded when none are seeded).</li>
          <li>Last checked and round-trip time are measured in this browser for the health request.</li>
        </ul>
      </Card>
    </div>
  );
}
