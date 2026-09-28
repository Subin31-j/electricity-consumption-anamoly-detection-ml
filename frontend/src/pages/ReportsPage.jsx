import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/ui/StatCard';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Loading, EmptyState, ErrorState } from '../components/ui/States';
import { ModelAgreement, ModelConfigList } from '../components/analysis/ModelComparison';
import { apiError, formatDateTime, modelList, sourceLabel } from '../utils/format';
import * as analysisService from '../services/analysisService';

/** Trigger a client-side download of the report JSON returned by the API. */
function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Reports overview. Lists the user's analyses; generating a report creates it
 * on the backend (POST /api/analysis/{id}/report) and loads its content.
 * Deletion is not offered because the API does not expose a delete endpoint.
 */
export default function ReportsPage() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [reports, setReports] = useState({}); // analysisId -> { report, content }
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setHistory(await analysisService.getHistory());
    } catch (err) {
      setLoadError(apiError(err, 'Could not load analyses.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Generate (once per session per analysis) and return the report detail. */
  const ensureReport = async (analysisId) => {
    if (reports[analysisId]) return reports[analysisId];
    const report = await analysisService.createReport(analysisId);
    const detail = await analysisService.getReport(report.id);
    setReports((r) => ({ ...r, [analysisId]: detail }));
    return detail;
  };

  const openReport = async (analysisId) => {
    setError('');
    setBusyId(analysisId);
    try {
      await ensureReport(analysisId);
      setSelected(analysisId);
    } catch (err) {
      setError(apiError(err, 'Could not generate report.'));
    } finally {
      setBusyId(null);
    }
  };

  const download = async (analysisId) => {
    setError('');
    setBusyId(analysisId);
    try {
      const detail = await ensureReport(analysisId);
      downloadJson(`ecad-report-${detail.report.id}-analysis-${analysisId}.json`, detail);
    } catch (err) {
      setError(apiError(err, 'Could not download report.'));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="page"><Loading variant="cards" /></div>;
  if (loadError) return <div className="page"><ErrorState title="Unable to load reports" message={loadError} onRetry={load} /></div>;

  const items = history?.items || [];
  const current = selected ? reports[selected] : null;
  const content = current?.content;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Insights"
        eyebrowIcon="report"
        title="Reports"
        subtitle="Generate a summary report for any analysis, view it, print it or download the data."
      />

      {error && (
        <div className="alert alert-error" role="alert">
          <Icon name="alertCircle" size={16} />
          <span>{error}</span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No analyses"
          message="Run an analysis to generate a report."
          action={<Link className="btn-primary" to="/consumption"><Icon name="zap" size={16} /> Analyze Consumption</Link>}
        />
      ) : (
        <div className="report-grid">
          {items.map((a) => {
            const generated = reports[a.id];
            const busy = busyId === a.id;
            return (
              <article key={a.id} className="report-card">
                <div className="report-doc" aria-hidden="true">
                  <span className="report-doc-fold" />
                  <span className="report-doc-line w80" />
                  <span className="report-doc-line w60" />
                  <span className="report-doc-bars">
                    <i style={{ height: '40%' }} />
                    <i style={{ height: '70%' }} />
                    <i style={{ height: '55%' }} />
                    <i className="is-anomaly" style={{ height: '90%' }} />
                  </span>
                </div>
                <div className="report-body">
                  <div className="report-title-row">
                    <h3>Analysis Report #{a.id}</h3>
                    <StatusBadge status={a.status} />
                  </div>
                  <dl className="report-meta">
                    <div><dt>Analysis ID</dt><dd>#{a.id}</dd></div>
                    <div><dt>Source</dt><dd>{sourceLabel(a)}</dd></div>
                    <div><dt>Analysed</dt><dd>{formatDateTime(a.created_at)}</dd></div>
                    <div><dt>Anomalies</dt><dd className="text-anomaly">{a.anomaly_count.toLocaleString()}</dd></div>
                    <div><dt>Records</dt><dd>{a.record_count.toLocaleString()}</dd></div>
                    <div><dt>Models</dt><dd>{modelList(a.models_used).length || '-'}</dd></div>
                  </dl>
                  {generated && (
                    <p className="report-generated">
                      <Icon name="checkCircle" size={13} /> Report #{generated.report.id} created {formatDateTime(generated.report.created_at)}
                    </p>
                  )}
                  <div className="report-actions">
                    <button className="btn-primary btn-sm" type="button" onClick={() => openReport(a.id)} disabled={busy}>
                      {busy ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="eye" size={14} />}
                      {generated ? 'View' : 'Generate & view'}
                    </button>
                    <button className="btn-ghost btn-sm" type="button" onClick={() => download(a.id)} disabled={busy}>
                      <Icon name="download" size={14} /> Download
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={!!content}
        size="lg"
        title={`Report for analysis #${selected}`}
        onClose={() => setSelected(null)}
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => window.print()}>
              <Icon name="printer" size={15} /> Print / Save PDF
            </button>
            <button className="btn-ghost" type="button" onClick={() => download(selected)}>
              <Icon name="download" size={15} /> Download JSON
            </button>
            <button className="btn-primary" type="button" onClick={() => setSelected(null)}>
              Close
            </button>
          </>
        }
      >
        {content && (
          <div className="report-view">
            <div className="page-meta" style={{ marginTop: 0 }}>
              <span className="meta-chip"><Icon name="calendar" size={13} /> Analysis date: <strong>{formatDateTime(content.analysis_date)}</strong></span>
              <span className="meta-chip"><Icon name="database" size={13} /> Source: <strong>{content.identification?.source_type}</strong></span>
              <span className="meta-chip"><Icon name="layers" size={13} /> Models: <strong>{modelList(content.models_used).join(', ')}</strong></span>
            </div>
            <div className="stat-grid mt-5">
              <StatCard label="Records" value={content.record_count} icon="database" tone="dark" animate={false} />
              <StatCard label="Anomalies" value={content.anomaly_counts?.total_anomalies ?? 0} icon="alert" tone="anomaly" animate={false} />
              <StatCard label="Anomaly rate" value={`${content.anomaly_counts?.anomaly_rate ?? 0}%`} icon="target" animate={false} />
              {content.summary?.average_consumption !== undefined && (
                <StatCard label="Average" value={content.summary.average_consumption} unit="kWh" icon="activity" animate={false} />
              )}
            </div>

            <h4 className="report-h">Insights</h4>
            <ul className="report-insights">
              {(content.insights || []).map((ins, i) => (
                <li key={i}><Icon name="sparkles" size={14} /> {ins}</li>
              ))}
            </ul>

            <div className="grid-2 mt-5">
              <ModelAgreement agreement={content.model_agreement} />
              <div>
                <h4 className="report-h" style={{ marginTop: 0 }}>Model configuration</h4>
                <ModelConfigList models={content.model_configuration} />
              </div>
            </div>

            <p className="insight-disclaimer"><Icon name="info" size={14} /> {content.disclaimer}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
