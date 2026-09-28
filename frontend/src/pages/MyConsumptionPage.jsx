import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { DataTable } from '../components/ui/DataTable';
import { DemoBadge } from '../components/ui/DemoBadge';
import { Icon } from '../components/ui/Icon';
import { Loading } from '../components/ui/States';
import { SectionHeader } from '../components/ui/PageHeader';
import { downsample } from '../components/ui/Sparkline';
import { DataGridBackground, ElectricWave } from '../components/visual/Visuals';
import { ModelSelector, ALL_MODELS } from '../components/analysis/ModelSelector';
import { AnalysisProgress } from '../components/analysis/AnalysisProgress';
import { apiError, formatDateTime, formatKwh } from '../utils/format';
import * as consumerService from '../services/consumerService';

export default function MyConsumptionPage() {
  const navigate = useNavigate();
  const [consumerNumber, setConsumerNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { consumer, stats }
  const [detail, setDetail] = useState(null); // consumption preview
  const [models, setModels] = useState(ALL_MODELS);

  const onVerify = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setDetail(null);
    if (!/^\d{11}$/.test(consumerNumber)) {
      setError('Consumer number must be exactly 11 digits.');
      return;
    }
    setVerifying(true);
    try {
      const data = await consumerService.verifyConsumer(consumerNumber);
      if (!data.found) {
        setError(data.message || 'Consumer number not found in the demo system.');
        return;
      }
      setResult(data);
      const consumption = await consumerService.getConsumption(data.consumer.id);
      setDetail(consumption);
    } catch (err) {
      setError(apiError(err, 'Verification failed.'));
    } finally {
      setVerifying(false);
    }
  };

  const onAnalyze = async () => {
    if (!result?.consumer) return;
    setAnalyzing(true);
    setError('');
    try {
      const data = await consumerService.analyzeConsumer(result.consumer.id, models);
      navigate(`/analysis/${data.analysis_id}/results`);
    } catch (err) {
      setError(apiError(err, 'Analysis failed.'));
    } finally {
      setAnalyzing(false);
    }
  };

  const previewSpark = useMemo(
    () => downsample((detail?.preview || []).map((r) => r.consumption_kwh), 40),
    [detail]
  );

  const c = result?.consumer;
  const st = result?.stats;
  const digits = consumerNumber.padEnd(11, ' ').split('');

  return (
    <div className="page">
      <section className="verify-hero" aria-labelledby="verify-title">
        <DataGridBackground dark />
        <div className="verify-hero-inner">
          <div className="verify-copy">
            <span className="page-eyebrow on-dark">
              <Icon name="meter" size={13} /> My Consumption
            </span>
            <h1 id="verify-title">Analyze Your Electricity Consumption</h1>
            <p>Enter your demo consumer number to explore historical consumption patterns.</p>
            <ul className="verify-steps" aria-label="Steps">
              <li className={c ? 'done' : 'active'}><span>1</span> Verify consumer</li>
              <li className={detail ? 'done' : c ? 'active' : ''}><span>2</span> Preview data</li>
              <li className={detail ? 'active' : ''}><span>3</span> Analyze</li>
            </ul>
          </div>

          <form onSubmit={onVerify} className="verify-card" noValidate>
            <label htmlFor="consumer-number" className="verify-label">
              Consumer Number
            </label>
            <div className="digit-display" aria-hidden="true">
              {digits.map((d, i) => (
                <span key={i} className={d.trim() ? 'filled' : ''}>
                  {d.trim()}
                </span>
              ))}
            </div>
            <div className="input-with-icon">
              <Icon name="hash" size={16} />
              <input
                id="consumer-number"
                className="input verify-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                placeholder="11-digit consumer number"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value.replace(/\D/g, ''))}
                aria-describedby="consumer-hint"
                aria-invalid={error ? true : undefined}
              />
            </div>
            <span id="consumer-hint" className="verify-hint">
              {consumerNumber.length}/11 digits
            </span>
            <button type="submit" className="btn-primary btn-lg btn-block" disabled={verifying}>
              {verifying ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="shield" size={16} />}
              {verifying ? 'Verifying...' : 'Verify Consumer'}
            </button>
            <p className="verify-note">
              <Icon name="info" size={13} /> Prototype data only. Not from a real electricity board.
            </p>
            {error && !c && (
              <div className="alert alert-error" role="alert" style={{ marginTop: 12, marginBottom: 0 }}>
                <Icon name="alertCircle" size={16} />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>
        <ElectricWave className="verify-wave" height={40} color="#3b82f6" opacity={0.35} />
      </section>

      {verifying && <Loading variant="cards" label="Retrieving consumer data..." />}

      {c && (
        <>
          <SectionHeader title="Consumer Profile" subtitle="Retrieved from the ECAD demo database" actions={<DemoBadge />} />
          <div className="grid-main-side">
            <Card className="consumer-profile" icon="user" title={c.consumer_name} subtitle={`Consumer ${c.consumer_number_masked}`}>
              <dl className="detail-list two-col">
                <div><dt>Consumer #</dt><dd className="mono">{c.consumer_number_masked}</dd></div>
                <div><dt>Connection</dt><dd>{c.connection_type || '-'}</dd></div>
                <div><dt>Location</dt><dd>{c.location || '-'}</dd></div>
                <div><dt>Meter type</dt><dd>{c.meter_type || '-'}</dd></div>
                <div><dt>Data period</dt><dd>{c.data_start_date || '-'} → {c.data_end_date || '-'}</dd></div>
                <div><dt>Total records</dt><dd className="tabular">{c.total_records.toLocaleString()}</dd></div>
              </dl>
            </Card>
            {st && (
              <div className="stat-grid stack-kpis">
                <StatCard label="Records" value={st.record_count} icon="database" tone="dark" hint="Historical readings" />
                <StatCard label="Average" value={st.average_consumption} unit="kWh" icon="activity" spark={previewSpark} hint="Spark: first preview rows" />
                <StatCard label="Peak" value={st.peak_consumption} unit="kWh" icon="trendUp" />
                <StatCard label="Minimum" value={st.minimum_consumption} unit="kWh" icon="chartLine" />
              </div>
            )}
          </div>

          {detail?.preview && (
            <>
              <SectionHeader
                title="Consumer Data Preview"
                subtitle={`First ${detail.preview.length} of ${c.total_records.toLocaleString()} readings`}
              />
              <Card flush>
                <DataTable
                  searchable
                  sortable
                  pageSize={10}
                  maxHeight="420px"
                  caption="Consumption preview"
                  columns={[
                    { key: 'date', header: 'Date', render: (r) => <span className="cell-strong tabular">{String(r.date)}</span> },
                    { key: 'time', header: 'Time', render: (r) => <span className="tabular">{String(r.time).slice(0, 5)}</span> },
                    { key: 'timestamp', header: 'Timestamp', render: (r) => <span className="cell-muted tabular">{formatDateTime(r.timestamp, true)}</span> },
                    { key: 'consumption_kwh', header: 'Consumption (kWh)', align: 'num', render: (r) => formatKwh(r.consumption_kwh) },
                  ]}
                  rows={detail.preview}
                />
              </Card>
            </>
          )}

          <SectionHeader title="Model Selection" subtitle="Isolation Forest always runs. Comparison models are optional." />
          <ModelSelector value={models} onChange={setModels} disabled={analyzing} />

          {error && (
            <div className="alert alert-error mt-5" role="alert">
              <Icon name="alertCircle" size={16} />
              <span>{error}</span>
            </div>
          )}
          <div className="analyze-cta">
            <div>
              <strong>Ready to analyze {c.total_records.toLocaleString()} readings</strong>
              <span>
                {models.length} model{models.length === 1 ? '' : 's'} selected · results open automatically when complete
              </span>
            </div>
            <button className="btn-primary btn-lg" onClick={onAnalyze} disabled={analyzing} type="button">
              {analyzing ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="zap" size={17} />}
              {analyzing ? 'Analyzing...' : 'Analyze My Consumption'}
            </button>
          </div>
        </>
      )}

      <AnalysisProgress open={analyzing} models={models} source={c ? `Consumer ${c.consumer_number_masked}` : undefined} />
    </div>
  );
}
