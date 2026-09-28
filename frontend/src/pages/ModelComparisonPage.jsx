import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import { Loading, ErrorState } from '../components/ui/States';
import { ModelComparisonChart } from '../components/charts/AnalysisCharts';
import { ModelCards, ModelAgreement, ModelConfigList } from '../components/analysis/ModelComparison';
import { AnalysisNav } from '../components/analysis/AnalysisNav';
import { apiError } from '../utils/format';
import * as analysisService from '../services/analysisService';

export default function ModelComparisonPage() {
  const { analysisId } = useParams();
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
        analysisService.getAnomalies(analysisId).catch(() => null),
      ]);
      setResults(res);
      setAnomalies(anom);
    } catch (err) {
      setError(apiError(err, 'Could not load comparison.'));
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="page"><Loading label="Loading model comparison..." /></div>;
  if (error) return <div className="page"><ErrorState title="Unable to load model comparison" message={error} onRetry={load} /></div>;
  if (!results) return null;

  return (
    <div className="page">
      <PageHeader
        eyebrow={`Analysis #${analysisId}`}
        eyebrowIcon="compare"
        title="Model Comparison"
        subtitle="Isolation Forest is the primary detector. K-Means and LOF offer independent perspectives on the same readings."
      />
      <AnalysisNav analysisId={analysisId} />

      <ModelCards models={results.models} totalRecords={results.summary.total_records} anomalies={anomalies?.items} />

      <div className="grid-2 mt-5">
        <ModelComparisonChart data={results.charts?.model_comparison} />
        <ModelAgreement agreement={results.agreement} />
      </div>

      <SectionHeader title="Per-model Configuration and Findings" subtitle="Parameters and scoring notes returned by the backend" />
      <Card>
        <ModelConfigList models={results.models} />
      </Card>
    </div>
  );
}
