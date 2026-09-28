import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { StatusBadge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Loading, ErrorState } from '../components/ui/States';
import { AnalysisNav } from '../components/analysis/AnalysisNav';
import { AnalysisResultsView } from '../components/analysis/AnalysisResultsView';
import { dataPeriod } from '../components/analysis/analysisUtils';
import { apiError, formatDateTime, modelList, sourceLabel } from '../utils/format';
import * as analysisService from '../services/analysisService';

export default function ResultsPage() {
  const { analysisId } = useParams();
  const [results, setResults] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportMsg, setReportMsg] = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, anom] = await Promise.all([
        analysisService.getResults(analysisId),
        analysisService.getAnomalies(analysisId),
      ]);
      setResults(res);
      setAnomalies(anom);
    } catch (err) {
      setError(apiError(err, 'Could not load results.'));
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    load();
  }, [load]);

  const onGenerateReport = async () => {
    setGenerating(true);
    try {
      const report = await analysisService.createReport(analysisId);
      setReportMsg({ ok: true, text: `Report #${report.id} generated. View it under Reports.` });
    } catch (err) {
      setReportMsg({ ok: false, text: apiError(err, 'Report generation failed.') });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="page"><Loading label="Loading analysis results..." /></div>;
  if (error) {
    return (
      <div className="page">
        <ErrorState title="Unable to load your analysis" message={error} onRetry={load} />
      </div>
    );
  }
  if (!results) return null;

  const a = results.analysis;
  const period = dataPeriod(results.charts?.consumption_trend);

  return (
    <div className="page">
      <PageHeader
        eyebrow={`Analysis #${analysisId}`}
        eyebrowIcon="cpu"
        title="Analysis Results"
        subtitle="Machine-learning results for the selected consumption data."
        meta={[
          { label: 'Source', value: sourceLabel(a), icon: a?.consumer_id ? 'meter' : 'database' },
          period && { label: 'Data period', value: `${period.from} → ${period.to}`, icon: 'calendar' },
          { label: 'Records', value: results.summary.total_records.toLocaleString(), icon: 'database' },
          { label: 'Models', value: modelList(a?.models_used).join(', ') || '-', icon: 'layers' },
          a?.processing_time !== null && a?.processing_time !== undefined && { label: 'Processing', value: `${a.processing_time}s`, icon: 'clock' },
          a?.created_at && { label: 'Run', value: formatDateTime(a.created_at), icon: 'history' },
        ].filter(Boolean)}
        actions={
          <>
            {a?.status && <StatusBadge status={a.status} />}
            <button className="btn-primary" onClick={onGenerateReport} type="button" disabled={generating}>
              {generating ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="report" size={16} />}
              Generate report
            </button>
          </>
        }
      />

      <AnalysisNav analysisId={analysisId} />

      {reportMsg && (
        <div className={`alert ${reportMsg.ok ? 'alert-success' : 'alert-error'}`} role={reportMsg.ok ? 'status' : 'alert'}>
          <Icon name={reportMsg.ok ? 'checkCircle' : 'alertCircle'} size={16} />
          <span>
            {reportMsg.text} {reportMsg.ok && <Link to="/reports">Open Reports</Link>}
          </span>
        </div>
      )}

      <AnalysisResultsView results={results} anomalies={anomalies} />
    </div>
  );
}
