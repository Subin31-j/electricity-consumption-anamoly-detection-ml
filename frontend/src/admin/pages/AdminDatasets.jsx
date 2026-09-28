import { useEffect, useMemo, useState } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import AdminStatCard from '../components/AdminStatCard';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { StatusBadge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { apiError, formatDateTime } from '../../utils/format';

export default function AdminDatasets() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await adminService.listDatasets());
    } catch (err) {
      setError(apiError(err, 'Could not load datasets.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(
    () => ({ count: rows?.length || 0, records: (rows || []).reduce((s, r) => s + r.record_count, 0) }),
    [rows]
  );

  if (loading) return <Loading variant="table" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Manage" eyebrowIcon="database" title="Datasets" subtitle="All datasets uploaded or created across the platform." />
      <div className="stat-grid">
        <AdminStatCard label="Datasets" value={totals.count} icon="database" tone="primary" />
        <AdminStatCard label="Total Records" value={totals.records} icon="layers" />
      </div>
      <Card flush>
        <AdminDataTable
          caption="Datasets"
          columns={[
            { key: 'id', header: 'ID', render: (r) => <span className="cell-strong">#{r.id}</span> },
            {
              key: 'name',
              header: 'Name',
              render: (r) => (
                <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                  <Icon name="fileSheet" size={15} /> {r.name}
                </span>
              ),
            },
            { key: 'source_type', header: 'Source' },
            { key: 'user_id', header: 'User', render: (r) => `#${r.user_id}` },
            { key: 'record_count', header: 'Records', align: 'num', render: (r) => r.record_count.toLocaleString() },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'created_at', header: 'Created', render: (r) => <span className="tabular">{formatDateTime(r.created_at)}</span> },
          ]}
          rows={rows || []}
        />
      </Card>
    </div>
  );
}
