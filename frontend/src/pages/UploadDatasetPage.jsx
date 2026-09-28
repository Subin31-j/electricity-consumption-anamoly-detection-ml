import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';
import { Icon } from '../components/ui/Icon';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/States';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import { ModelSelector, ALL_MODELS } from '../components/analysis/ModelSelector';
import { AnalysisProgress } from '../components/analysis/AnalysisProgress';
import { apiError, formatBytes, formatDateTime, formatKwh } from '../utils/format';
import * as datasetService from '../services/datasetService';
import * as analysisService from '../services/analysisService';

const ACCEPT = '.csv,.xlsx,.xls';

/** Extract the number from a backend preprocessing warning, if any. */
function warnCount(warnings, pattern) {
  const w = (warnings || []).find((x) => pattern.test(x));
  if (!w) return 0;
  const m = /(\d+)/.exec(w);
  return m ? Number(m[1]) : 0;
}

/**
 * Build the preprocessing pipeline view from the REAL upload response.
 * Stage figures come only from detected_columns, record_count and the
 * backend's warnings; feature engineering runs server-side during analysis.
 */
function buildPipeline(file, uploaded) {
  const w = uploaded.warnings || [];
  const cols = uploaded.detected_columns || {};
  const invalid = warnCount(w, /invalid timestamp or consumption/i);
  const negative = warnCount(w, /negative consumption/i);
  const dupes = warnCount(w, /duplicate/i);
  const dateOnly = w.some((x) => /No time column/i.test(x));
  const removed = invalid + negative + dupes;
  const raw = uploaded.record_count + removed;

  return [
    {
      key: 'raw',
      title: 'Raw Data',
      icon: 'file',
      status: 'done',
      records: raw,
      desc: 'File received and parsed on the server.',
      change: file ? `${file.name} · ${formatBytes(file.size)}` : uploaded.dataset?.name,
    },
    {
      key: 'validation',
      title: 'Validation',
      icon: 'shield',
      status: 'done',
      desc: 'Timestamp and consumption columns detected and mapped.',
      change: [
        cols.consumption_kwh && `consumption ← ${cols.consumption_kwh}`,
        cols.timestamp ? `timestamp ← ${cols.timestamp}` : cols.date && `date ← ${cols.date}${cols.time ? ` + ${cols.time}` : ''}`,
        dateOnly && 'date only (time defaults to 00:00)',
      ]
        .filter(Boolean)
        .join(' · '),
    },
    {
      key: 'missing',
      title: 'Missing Values',
      icon: 'filter',
      status: 'done',
      desc: 'Rows with an invalid timestamp or consumption value are dropped.',
      change: invalid ? `${invalid.toLocaleString()} rows dropped` : 'No invalid rows found',
      warn: invalid > 0,
    },
    {
      key: 'cleaning',
      title: 'Cleaning',
      icon: 'wand',
      status: 'done',
      desc: 'Negative readings and duplicate timestamps removed; rows sorted by time.',
      change:
        negative || dupes
          ? [negative && `${negative} negative`, dupes && `${dupes} duplicate`].filter(Boolean).join(' · ') + ' removed'
          : 'No negative or duplicate rows',
      warn: negative + dupes > 0,
    },
    {
      key: 'features',
      title: 'Feature Engineering',
      icon: 'sliders',
      status: 'pending',
      desc: 'Hour, day, month, season, weekend, lag and rolling statistics (past-only, leakage-safe).',
      change: 'Runs on the server when analysis starts',
    },
    {
      key: 'ready',
      title: 'Ready for ML',
      icon: 'cpu',
      status: 'ready',
      records: uploaded.record_count,
      desc: 'Clean, chronologically ordered readings ready for the models.',
      change: `${uploaded.record_count.toLocaleString()} valid records`,
    },
  ];
}

export default function UploadDatasetPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [uploaded, setUploaded] = useState(null); // upload response
  const [models, setModels] = useState(ALL_MODELS);

  const pickFile = (f) => {
    setError('');
    if (!f) return;
    if (!/\.(csv|xlsx|xls)$/i.test(f.name)) {
      setError('Please choose a CSV or Excel file (.csv, .xlsx, .xls).');
      return;
    }
    setFile(f);
    setUploaded(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const onUpload = async (e) => {
    e.preventDefault();
    setError('');
    setUploaded(null);
    if (!file) {
      setError('Please choose a CSV or Excel file.');
      return;
    }
    setUploading(true);
    try {
      const data = await datasetService.uploadDataset(file);
      setUploaded(data);
    } catch (err) {
      setError(apiError(err, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const onAnalyze = async () => {
    if (!uploaded?.dataset) return;
    setAnalyzing(true);
    setError('');
    try {
      const data = await analysisService.createAnalysis(uploaded.dataset.id, models);
      navigate(`/analysis/${data.analysis_id}/results`);
    } catch (err) {
      setError(apiError(err, 'Analysis failed.'));
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setUploaded(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const pipeline = useMemo(() => (uploaded ? buildPipeline(file, uploaded) : []), [uploaded, file]);

  const previewStats = useMemo(() => {
    const rows = uploaded?.preview || [];
    const vals = rows.map((r) => r.consumption_kwh).filter((v) => Number.isFinite(v));
    if (!vals.length) return null;
    const ts = rows.map((r) => r.timestamp).filter(Boolean);
    return {
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      peak: Math.max(...vals),
      from: ts[0],
      to: ts[ts.length - 1],
    };
  }, [uploaded]);

  const detectedCount = uploaded ? Object.values(uploaded.detected_columns || {}).filter(Boolean).length : 0;
  const quality = uploaded ? (uploaded.warnings?.length ? `${uploaded.warnings.length} adjustment${uploaded.warnings.length > 1 ? 's' : ''}` : 'Clean') : null;
  const step = analyzing ? 4 : uploaded ? 3 : file ? 1 : 0;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Analyze"
        eyebrowIcon="upload"
        title="Upload Dataset"
        subtitle="Bring your own historical electricity data. ECAD validates, cleans and prepares it for the ML models."
      />

      <ol className="flow-stepper" aria-label="Upload progress">
        {['Select file', 'Upload & validate', 'Preprocess', 'Preview & models', 'Analyze'].map((label, i) => (
          <li key={label} className={i < step ? 'done' : i === step ? 'active' : ''} aria-current={i === step ? 'step' : undefined}>
            <span className="flow-stepper-dot">{i < step ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      <form onSubmit={onUpload}>
        <label
          className={`dropzone ${dragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0] || null)}
            aria-describedby="dropzone-hint"
          />
          <span className="dropzone-icon" aria-hidden="true">
            <Icon name="cloudUpload" size={30} />
          </span>
          {file ? (
            <>
              <strong className="dropzone-title">{file.name}</strong>
              <span className="dropzone-sub">{formatBytes(file.size)} · click or drop to replace</span>
            </>
          ) : (
            <>
              <strong className="dropzone-title">Drop your electricity dataset here</strong>
              <span className="dropzone-sub">CSV or Excel files</span>
              <span className="dropzone-or">or</span>
              <span className="btn-secondary btn-sm dropzone-browse">Browse files</span>
            </>
          )}
          <span id="dropzone-hint" className="dropzone-hint">
            Needs a timestamp (or date + time) column and a consumption column such as consumption_kwh, energy or kwh.
          </span>
        </label>

        {error && !uploaded && (
          <div className="alert alert-error mt-5" role="alert">
            <Icon name="alertCircle" size={16} />
            <span>{error}</span>
          </div>
        )}

        {file && !uploaded && (
          <div className="analyze-cta">
            <div>
              <strong>
                <Icon name="fileSheet" size={16} /> {file.name}
              </strong>
              <span>{formatBytes(file.size)} · will be validated and cleaned on the server</span>
            </div>
            <div className="row">
              <button type="button" className="btn-ghost" onClick={reset} disabled={uploading}>
                Remove
              </button>
              <button type="submit" className="btn-primary btn-lg" disabled={uploading}>
                {uploading ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="upload" size={16} />}
                {uploading ? 'Uploading...' : 'Upload & validate'}
              </button>
            </div>
          </div>
        )}
      </form>

      {uploading && (
        <div className="mt-5">
          <Loading variant="cards" label="Validating dataset..." />
        </div>
      )}

      {uploaded && (
        <>
          <SectionHeader
            title="Upload Summary"
            subtitle={`Dataset #${uploaded.dataset.id} · ${uploaded.dataset.name}`}
            actions={
              <button type="button" className="btn-ghost btn-sm" onClick={reset}>
                <Icon name="refresh" size={14} /> Upload another file
              </button>
            }
          />
          <div className="stat-grid">
            <StatCard label="File" value={uploaded.dataset.name} animate={false} icon="file" hint={file ? formatBytes(file.size) : undefined} />
            <StatCard label="Valid Records" value={uploaded.record_count} icon="database" tone="dark" />
            <StatCard label="Detected Columns" value={`${detectedCount} / 4`} animate={false} icon="grid" hint="timestamp · date · time · consumption" />
            <StatCard
              label="Data Quality"
              value={quality}
              animate={false}
              icon={uploaded.warnings?.length ? 'alert' : 'checkCircle'}
              tone={uploaded.warnings?.length ? 'warning' : 'success'}
              hint={uploaded.warnings?.length ? 'See preprocessing below' : 'No rows needed changes'}
            />
          </div>

          <SectionHeader title="Preprocessing Pipeline" subtitle="How the raw file became model-ready data" />
          <ol className="pipeline">
            {pipeline.map((s, i) => (
              <li key={s.key} className={`pipeline-stage is-${s.status} ${s.warn ? 'has-warn' : ''}`}>
                <span className="pipeline-node" aria-hidden="true">
                  {s.status === 'done' ? <Icon name="check" size={16} strokeWidth={2.6} /> : <Icon name={s.icon} size={16} />}
                </span>
                <div className="pipeline-body">
                  <div className="pipeline-head">
                    <span className="pipeline-num">{String(i + 1).padStart(2, '0')}</span>
                    <strong>{s.title}</strong>
                    {s.status === 'done' && <Badge tone={s.warn ? 'warning' : 'success'}>{s.warn ? 'Adjusted' : 'Completed'}</Badge>}
                    {s.status === 'pending' && <Badge tone="outline">During analysis</Badge>}
                    {s.status === 'ready' && <Badge tone="primary">Ready</Badge>}
                    {s.records !== undefined && <span className="pipeline-records tabular">{s.records.toLocaleString()} records</span>}
                  </div>
                  <p>{s.desc}</p>
                  {s.change && <code className="pipeline-change">{s.change}</code>}
                </div>
              </li>
            ))}
          </ol>

          {uploaded.warnings?.length > 0 && (
            <div className="alert alert-warning mt-5">
              <Icon name="alert" size={16} />
              <div>
                <strong>Preprocessing notes from the server</strong>
                <ul className="plain-list">
                  {uploaded.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <SectionHeader
            title="Dataset Preview"
            subtitle={`First ${uploaded.preview?.length || 0} cleaned rows of ${uploaded.record_count.toLocaleString()}`}
          />
          {previewStats && (
            <div className="page-meta" style={{ marginTop: 0, marginBottom: 'var(--sp-4)' }}>
              <span className="meta-chip">
                <Icon name="calendar" size={13} /> Preview range: <strong>{formatDateTime(previewStats.from)} → {formatDateTime(previewStats.to)}</strong>
              </span>
              <span className="meta-chip">
                <Icon name="activity" size={13} /> Preview avg: <strong>{formatKwh(previewStats.avg)} kWh</strong>
              </span>
              <span className="meta-chip">
                <Icon name="trendUp" size={13} /> Preview peak: <strong>{formatKwh(previewStats.peak)} kWh</strong>
              </span>
            </div>
          )}
          <Card flush>
            <DataTable
              searchable
              sortable
              pageSize={10}
              maxHeight="420px"
              caption="Cleaned data preview"
              columns={[
                { key: 'date', header: 'Date', render: (r) => <span className="cell-strong tabular">{r.date || String(r.timestamp || '').slice(0, 10)}</span> },
                { key: 'time', header: 'Time', render: (r) => <span className="tabular">{r.time ? String(r.time).slice(0, 5) : String(r.timestamp || '').slice(11, 16)}</span> },
                { key: 'timestamp', header: 'Timestamp', render: (r) => <span className="cell-muted tabular">{formatDateTime(r.timestamp, true)}</span> },
                { key: 'consumption_kwh', header: 'Consumption (kWh)', align: 'num', render: (r) => formatKwh(r.consumption_kwh) },
              ]}
              rows={uploaded.preview}
            />
          </Card>

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
              <strong>Continue to analysis</strong>
              <span>
                {uploaded.record_count.toLocaleString()} records · {models.length} model{models.length === 1 ? '' : 's'} selected
              </span>
            </div>
            <button className="btn-primary btn-lg" onClick={onAnalyze} disabled={analyzing} type="button">
              {analyzing ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="zap" size={17} />}
              {analyzing ? 'Analyzing...' : 'Continue to Analysis'}
            </button>
          </div>
        </>
      )}

      <AnalysisProgress open={analyzing} models={models} source={uploaded ? uploaded.dataset.name : undefined} />
    </div>
  );
}
