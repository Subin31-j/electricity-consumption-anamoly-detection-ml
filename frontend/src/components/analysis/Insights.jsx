import { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { deriveInsights } from './analysisUtils';

/**
 * Insight cards. `insights` are the backend-generated strings; derived
 * observations are computed from the actual anomaly records and series.
 * No hardcoded insight text is ever displayed.
 */
export function Insights({ insights, anomalies, trend, summary, disclaimer }) {
  const derived = useMemo(() => deriveInsights({ anomalies, trend, summary }), [anomalies, trend, summary]);
  // The backend includes its disclaimer as the last insight; show it separately.
  const backend = (insights || []).filter((s) => !/do not prove/i.test(s));

  return (
    <Card title="Insights" subtitle="Generated from this analysis' actual results" icon="lightbulb">
      <div className="insight-grid">
        {derived.map((d, i) => (
          <div key={`d-${i}`} className={`insight-card tone-${d.tone}`}>
            <span className="insight-icon">
              <Icon name={d.icon} size={16} />
            </span>
            <p>{d.text}</p>
          </div>
        ))}
        {backend.map((text, i) => (
          <div key={`b-${i}`} className="insight-card">
            <span className="insight-icon">
              <Icon name="sparkles" size={16} />
            </span>
            <p>{text}</p>
          </div>
        ))}
        {!derived.length && !backend.length && <p className="text-muted">No insights available for this analysis.</p>}
      </div>
      {disclaimer && (
        <p className="insight-disclaimer">
          <Icon name="info" size={14} /> {disclaimer}
        </p>
      )}
    </Card>
  );
}

export default Insights;
