import { useEffect, useMemo, useState } from 'react';
import * as adminService from '../adminService';
import AdminStatCard from '../components/AdminStatCard';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Select } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { AnomalyTable } from '../../components/analysis/AnomalyPanels';
import { apiError } from '../../utils/format';

/**
 * Platform-wide anomaly monitoring. The admin endpoint returns the most recent
 * anomaly records (default 200) without consumer linkage, so filters cover
 * model, agreement and date.
 */
export default function AdminAnomalies() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [agreementFilter, setAgreementFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await adminService.listAnomalies());
    } catch (err) {
      setError(apiError(err, 'Could not load anomalies.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let out = rows || [];
    if (modelFilter === 'isolation_forest') out = out.filter((r) => r.iforest_label);
    else if (modelFilter === 'kmeans') out = out.filter((r) => r.kmeans_label);
    else if (modelFilter === 'lof') out = out.filter((r) => r.lof_label);
    if (agreementFilter) out = out.filter((r) => String(r.agreement_count) === agreementFilter);
    if (from) out = out.filter((r) => String(r.timestamp).slice(0, 10) >= from);
    if (to) out = out.filter((r) => String(r.timestamp).slice(0, 10) <= to);
    return out;
  }, [rows, modelFilter, agreementFilter, from, to]);

  const counts = useMemo(() => {
    const list = rows || [];
    return {
      total: list.length,
      three: list.filter((r) => r.agreement_count === 3).length,
      iforest: list.filter((r) => r.iforest_label).length,
    };
  }, [rows]);

  if (loading) return <Loading variant="table" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const hasFilters = modelFilter || agreementFilter || from || to;

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Analytics" eyebrowIcon="alert" title="Anomalies" subtitle="Most recent anomaly records across all analyses (latest 200)." />

      <div className="stat-grid">
        <AdminStatCard label="Records loaded" value={counts.total} icon="alert" tone="anomaly" />
        <AdminStatCard label="All 3 models agree" value={counts.three} icon="layers" tone="danger" />
        <AdminStatCard label="Flagged by Isolation Forest" value={counts.iforest} icon="tree" tone="primary" />
      </div>

      <Card flush>
        <div className="admin-toolbar admin-filters">
          <Select
            label="Model"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="input-sm"
            options={[
              { value: '', label: 'All models' },
              { value: 'isolation_forest', label: 'Isolation Forest' },
              { value: 'kmeans', label: 'K-Means' },
              { value: 'lof', label: 'LOF' },
            ]}
          />
          <Select
            label="Agreement"
            value={agreementFilter}
            onChange={(e) => setAgreementFilter(e.target.value)}
            className="input-sm"
            options={[
              { value: '', label: 'Any agreement' },
              { value: '3', label: 'All 3 models' },
              { value: '2', label: '2 models' },
              { value: '1', label: '1 model' },
            ]}
          />
          <div className="field">
            <label className="field-label" htmlFor="anom-from">From</label>
            <input id="anom-from" type="date" className="input input-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="anom-to">To</label>
            <input id="anom-to" type="date" className="input input-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {hasFilters && (
            <button
              type="button"
              className="btn-ghost btn-sm admin-clear"
              onClick={() => {
                setModelFilter('');
                setAgreementFilter('');
                setFrom('');
                setTo('');
              }}
            >
              <Icon name="close" size={13} /> Clear
            </button>
          )}
        </div>
        <AnomalyTable items={filtered} pageSize={15} />
      </Card>
    </div>
  );
}
