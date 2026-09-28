import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';
import { Icon } from '../components/ui/Icon';
import { StatusBadge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import { Loading, ErrorState, EmptyState } from '../components/ui/States';
import { apiError, formatDateTime, modelList, sourceLabel } from '../utils/format';
import * as analysisService from '../services/analysisService';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setHistory(await analysisService.getHistory());
    } catch (err) {
      setError(apiError(err, 'Could not load history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => history?.items || [], [history]);
  const filtered = useMemo(
    () =>
      items.filter((r) =>
        sourceFilter === 'all' ? true : sourceFilter === 'consumer' ? !!r.consumer_id : !r.consumer_id
      ),
    [items, sourceFilter]
  );

  const totals = useMemo(
    () => ({
      records: items.reduce((s, r) => s + r.record_count, 0),
      anomalies: items.reduce((s, r) => s + r.anomaly_count, 0),
      completed: items.filter((r) => r.status === 'COMPLETED').length,
    }),
    [items]
  );

  if (loading) return <div className="page"><Loading /></div>;
  if (error) return <div className="page"><ErrorState title="Unable to load analysis history" message={error} onRetry={load} /></div>;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Insights"
        eyebrowIcon="history"
        title="Analysis History"
        subtitle="Every analysis you've run, with its data source, size and detected anomalies."
        actions={
          <Link to="/consumption" className="btn-primary">
            <Icon name="plus" size={16} /> New analysis
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No analyses yet"
          message="Run an analysis from My Consumption or Upload Dataset to see it here."
          action={
            <>
              <Link className="btn-primary" to="/consumption"><Icon name="meter" size={16} /> Use Consumer Number</Link>
              <Link className="btn-ghost" to="/upload"><Icon name="upload" size={16} /> Upload Dataset</Link>
            </>
          }
        />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Analyses" value={history.total} icon="history" tone="dark" hint={`${totals.completed} completed`} />
            <StatCard label="Records Analyzed" value={totals.records} icon="database" hint="Across all runs" />
            <StatCard label="Anomalies Found" value={totals.anomalies} icon="alert" tone="anomaly" hint="Across all runs" />
          </div>

          <SectionHeader title="Recent" />
          <div className="history-cards">
            {items.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/analysis/${a.id}/results`} className="history-card">
                <div className="history-card-top">
                  <span className={`recent-icon ${a.consumer_id ? '' : 'is-dataset'}`}>
                    <Icon name={a.consumer_id ? 'meter' : 'fileSheet'} size={16} />
                  </span>
                  <StatusBadge status={a.status} />
                </div>
                <strong>Analysis #{a.id}</strong>
                <span className="text-muted">{sourceLabel(a)}</span>
                <div className="history-card-stats">
                  <span><b className="tabular">{a.record_count.toLocaleString()}</b> records</span>
                  <span className="is-anomaly"><b className="tabular">{a.anomaly_count.toLocaleString()}</b> anomalies</span>
                </div>
                <div className="history-card-foot">
                  <span>{formatDateTime(a.created_at)}</span>
                  <span className="history-card-link">View analysis <Icon name="arrowRight" size={13} /></span>
                </div>
              </Link>
            ))}
          </div>

          <SectionHeader title="Complete History" />
          <Card flush>
            <DataTable
              searchable
              sortable
              pageSize={10}
              caption="Analysis history"
              toolbar={
                <Tabs
                  label="Filter by source"
                  value={sourceFilter}
                  onChange={setSourceFilter}
                  options={[
                    { value: 'all', label: 'All sources' },
                    { value: 'consumer', label: 'Consumer' },
                    { value: 'dataset', label: 'Dataset' },
                  ]}
                />
              }
              onRowClick={(r) => navigate(`/analysis/${r.id}/results`)}
              columns={[
                { key: 'id', header: 'Analysis ID', render: (r) => <span className="cell-strong">#{r.id}</span> },
                { key: 'created_at', header: 'Date', render: (r) => <span className="tabular">{formatDateTime(r.created_at)}</span> },
                { key: 'source', header: 'Data source', sortValue: (r) => sourceLabel(r), searchValue: (r) => sourceLabel(r), render: (r) => sourceLabel(r) },
                { key: 'models_used', header: 'Models', render: (r) => <span className="cell-muted">{modelList(r.models_used).join(', ') || '-'}</span> },
                { key: 'record_count', header: 'Records', align: 'num', render: (r) => r.record_count.toLocaleString() },
                { key: 'anomaly_count', header: 'Anomalies', align: 'num', render: (r) => <span className="text-anomaly tabular">{r.anomaly_count.toLocaleString()}</span> },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                {
                  key: 'actions',
                  header: '',
                  sortable: false,
                  render: (r) => (
                    <button
                      className="btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/analysis/${r.id}/results`);
                      }}
                      type="button"
                    >
                      View Analysis
                    </button>
                  ),
                },
              ]}
              rows={filtered}
            />
          </Card>
        </>
      )}
    </div>
  );
}
