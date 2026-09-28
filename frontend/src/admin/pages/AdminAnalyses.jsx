import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDataTable from '../components/AdminDataTable';
import AdminStatCard from '../components/AdminStatCard';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { apiError, formatDateTime, modelList, sourceLabel } from '../../utils/format';

export default function AdminAnalyses() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await adminService.listAnalyses());
    } catch (err) {
      setError(apiError(err, 'Could not load analyses.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => (rows || []).filter((r) => status === 'all' || r.status === status), [rows, status]);
  const totals = useMemo(() => {
    const list = rows || [];
    const times = list.map((r) => r.processing_time).filter((t) => Number.isFinite(t));
    return {
      count: list.length,
      completed: list.filter((r) => r.status === 'COMPLETED').length,
      failed: list.filter((r) => r.status === 'FAILED').length,
      avgTime: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
    };
  }, [rows]);

  if (loading) return <Loading variant="table" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Analytics" eyebrowIcon="chartLine" title="Analyses" subtitle="Every analysis run on the platform. Select a row to open its detailed results." />
      <div className="stat-grid">
        <AdminStatCard label="Analyses" value={totals.count} icon="chartLine" tone="primary" />
        <AdminStatCard label="Completed" value={totals.completed} icon="checkCircle" tone="success" />
        <AdminStatCard label="Failed" value={totals.failed} icon="alertCircle" tone={totals.failed ? 'danger' : 'default'} />
        <AdminStatCard label="Avg processing" value={totals.avgTime !== null ? `${totals.avgTime.toFixed(2)}s` : '-'} icon="clock" />
      </div>
      <Card flush>
        <AdminDataTable
          caption="Analyses"
          onRowClick={(r) => navigate(`/admin/analyses/${r.id}`)}
          toolbar={
            <Tabs
              label="Filter by status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'RUNNING', label: 'Running' },
                { value: 'FAILED', label: 'Failed' },
              ]}
            />
          }
          columns={[
            { key: 'id', header: 'Analysis ID', render: (r) => <span className="cell-strong">#{r.id}</span> },
            { key: 'user_id', header: 'User', render: (r) => `#${r.user_id}` },
            { key: 'source', header: 'Source', sortValue: sourceLabel, searchValue: sourceLabel, render: (r) => sourceLabel(r) },
            { key: 'record_count', header: 'Records', align: 'num', render: (r) => r.record_count.toLocaleString() },
            { key: 'models_used', header: 'Models', render: (r) => <span className="cell-muted">{modelList(r.models_used).join(', ') || '-'}</span> },
            { key: 'anomaly_count', header: 'Anomalies', align: 'num', render: (r) => <span className="text-anomaly tabular">{r.anomaly_count.toLocaleString()}</span> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'processing_time', header: 'Time (s)', align: 'num', render: (r) => r.processing_time ?? '-' },
            { key: 'created_at', header: 'Created', render: (r) => <span className="tabular">{formatDateTime(r.created_at)}</span> },
          ]}
          rows={filtered}
        />
      </Card>
    </div>
  );
}
