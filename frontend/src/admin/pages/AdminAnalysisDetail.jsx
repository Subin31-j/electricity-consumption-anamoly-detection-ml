import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as analysisService from '../../services/analysisService';
import { Icon } from '../../components/ui/Icon';
import { StatusBadge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { AnalysisResultsView } from '../../components/analysis/AnalysisResultsView';
import { dataPeriod } from '../../components/analysis/analysisUtils';
import { apiError, formatDateTime, modelList, sourceLabel } from '../../utils/format';

/**
 * Admin view of a single analysis. Uses the existing results/anomalies
 * endpoints, which already permit ADMIN access on the backend.
 */
export default function AdminAnalysisDetail() {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError(apiError(err, 'Could not load this analysis.'));
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    load();
  }, [load]);

  const back = (
    <button className="btn-ghost btn-sm admin-back" type="button" onClick={() => navigate('/admin/analyses')}>
      <Icon name="arrowLeft" size={14} /> Back to analyses
    </button>
  );

  if (loading) return <Loading label="Loading analysis..." />;
  if (error) {
    return (
      <div className="admin-page">
        {back}
        <ErrorState title="Unable to load analysis" message={error} onRetry={load} />
      </div>
    );
  }
  if (!results) return null;

  const a = results.analysis;
  const period = dataPeriod(results.charts?.consumption_trend);

  return (
    <div className="admin-page admin-analysis-detail">
      {back}
      <PageHeader
        eyebrow={`Analysis #${analysisId}`}
        eyebrowIcon="cpu"
        title="Analysis Detail"
        meta={[
          { label: 'User', value: `#${a.user_id}`, icon: 'user' },
          { label: 'Source', value: sourceLabel(a), icon: 'database' },
          period && { label: 'Period', value: `${period.from} → ${period.to}`, icon: 'calendar' },
          { label: 'Models', value: modelList(a.models_used).join(', ') || '-', icon: 'layers' },
          { label: 'Run', value: formatDateTime(a.created_at), icon: 'clock' },
        ].filter(Boolean)}
        actions={<StatusBadge status={a.status} />}
      />
      <AnalysisResultsView results={results} anomalies={anomalies} />
    </div>
  );
}
