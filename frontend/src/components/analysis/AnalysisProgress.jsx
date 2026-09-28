import { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon';
import { ElectricWave } from '../visual/Visuals';

const MODEL_STAGE = {
  isolation_forest: 'Running Isolation Forest',
  kmeans: 'Running K-Means',
  lof: 'Running Local Outlier Factor',
};

/**
 * Processing screen shown while the analysis request is in flight.
 *
 * The backend runs the whole pipeline in a single synchronous request and
 * does not report per-stage progress, so stages are listed as the pipeline
 * being executed - none are marked complete until the request finishes.
 * Elapsed time is real.
 */
export function AnalysisProgress({ open, models = ['isolation_forest', 'kmeans', 'lof'], source }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    setElapsed(0);
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 200);
    return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  const stages = [
    'Preparing data',
    'Engineering features',
    ...models.map((m) => MODEL_STAGE[m]).filter(Boolean),
    'Comparing model results',
    'Preparing insights',
  ];

  return (
    <div className="modal-overlay analysis-progress-overlay" role="dialog" aria-modal="true" aria-labelledby="ap-title">
      <div className="analysis-progress" role="status" aria-live="polite">
        <div className="analysis-progress-head">
          <span className="analysis-progress-icon">
            <Icon name="cpu" size={22} />
          </span>
          <div>
            <h3 id="ap-title">Analyzing Electricity Consumption</h3>
            <p>{source ? `${source} · ` : ''}running on the ECAD server</p>
          </div>
        </div>

        <ElectricWave height={40} color="#60a5fa" opacity={0.7} />

        <ol className="analysis-stages">
          {stages.map((s, i) => (
            <li key={s}>
              <span className="stage-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="stage-label">{s}</span>
              <span className="stage-state" aria-hidden="true" />
            </li>
          ))}
        </ol>

        <div className="progress indeterminate" aria-hidden="true">
          <div className="progress-bar" />
        </div>
        <div className="analysis-progress-foot">
          <span>These stages run server-side in one request; individual stage status is not reported.</span>
          <strong className="tabular">{elapsed.toFixed(1)}s</strong>
        </div>
      </div>
    </div>
  );
}

export default AnalysisProgress;
