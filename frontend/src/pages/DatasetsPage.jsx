import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/Badge';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import { Loading, EmptyState, ErrorState } from '../components/ui/States';
import { apiError, formatDateTime } from '../utils/format';
import * as analysisService from '../services/analysisService';

/**
 * Data sources hub. Uploads happen on the Upload page, consumer lookups on
 * My Consumption. The "sources used" table is derived from the user's real
 * analysis history (there is no separate dataset-listing endpoint for users).
 */
export default function DatasetsPage() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setHistory(await analysisService.getHistory());
    } catch (err) {
      setError(apiError(err, 'Could not load your data sources.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sources = useMemo(() => {
    const map = new Map();
    (history?.items || []).forEach((a) => {
      const key = a.consumer_id ? `c-${a.consumer_id}` : `d-${a.dataset_id}`;
      const cur = map.get(key) || {
        id: key,
        type: a.consumer_id ? 'Consumer number' : 'Uploaded dataset',
        ref: a.consumer_id ? `Consumer #${a.consumer_id}` : `Dataset #${a.dataset_id}`,
        isConsumer: !!a.consumer_id,
        analyses: 0,
        records: a.record_count,
        anomalies: a.anomaly_count,
        lastId: a.id,
        last: a.created_at,
        status: a.status,
      };
      cur.analyses += 1;
      if (String(a.created_at) >= String(cur.last)) {
        cur.last = a.created_at;
        cur.lastId = a.id;
        cur.records = a.record_count;
        cur.anomalies = a.anomaly_count;
        cur.status = a.status;
      }
      map.set(key, cur);
    });
    return [...map.values()];
  }, [history]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Analyze"
        eyebrowIcon="database"
        title="Datasets"
        subtitle="Choose a data source. Both paths feed the same preprocessing and machine-learning pipeline."
      />

      <div className="source-grid">
        <Link to="/consumption" className="source-card is-dark">
          <span className="source-icon"><Icon name="meter" size={24} /></span>
          <div>
            <h3>Use a consumer number</h3>
            <p>Verify an 11-digit demo consumer number and analyze its stored historical readings.</p>
          </div>
          <span className="source-cta">Verify consumer <Icon name="arrowRight" size={15} /></span>
        </Link>
        <Link to="/upload" className="source-card">
          <span className="source-icon"><Icon name="cloudUpload" size={24} /></span>
          <div>
            <h3>Upload CSV / Excel</h3>
            <p>Bring your own file with a timestamp and consumption column. Columns are mapped automatically.</p>
          </div>
          <span className="source-cta">Upload dataset <Icon name="arrowRight" size={15} /></span>
        </Link>
      </div>

      <SectionHeader title="Sources You've Analyzed" subtitle="Derived from your analysis history" />
      {loading ? (
        <Loading variant="table" />
      ) : error ? (
        <ErrorState compact message={error} onRetry={load} />
      ) : sources.length === 0 ? (
        <EmptyState compact title="No data sources yet" message="Sources appear here after you run your first analysis." />
      ) : (
        <Card flush>
          <DataTable
            sortable
            searchable
            pageSize={10}
            caption="Analyzed data sources"
            columns={[
              {
                key: 'ref',
                header: 'Source',
                render: (r) => (
                  <span className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                    <span className={`recent-icon ${r.isConsumer ? '' : 'is-dataset'}`}>
                      <Icon name={r.isConsumer ? 'meter' : 'fileSheet'} size={15} />
                    </span>
                    <span>
                      <span className="cell-strong">{r.ref}</span>
                      <br />
                      <span className="cell-muted">{r.type}</span>
                    </span>
                  </span>
                ),
              },
              { key: 'analyses', header: 'Analyses', align: 'num' },
              { key: 'records', header: 'Records', align: 'num', render: (r) => r.records.toLocaleString() },
              { key: 'anomalies', header: 'Anomalies (latest)', align: 'num', render: (r) => <span className="text-anomaly tabular">{r.anomalies.toLocaleString()}</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'last', header: 'Last analyzed', render: (r) => <span className="tabular">{formatDateTime(r.last)}</span> },
              {
                key: 'actions',
                header: '',
                sortable: false,
                render: (r) => (
                  <Link className="btn-ghost btn-sm" to={`/analysis/${r.lastId}/results`}>
                    View <Icon name="arrowRight" size={13} />
                  </Link>
                ),
              },
            ]}
            rows={sources}
          />
        </Card>
      )}
    </div>
  );
}
