import { Icon } from '../../components/ui/Icon';
import { EnergyPulse } from '../../components/visual/Visuals';

const ICONS = { 'Backend API': 'api', Database: 'database', 'ML Engine': 'cpu', Storage: 'harddrive' };
const COLORS = { healthy: '#34d399', degraded: '#fbbf24', unavailable: '#f87171' };
const LABELS = { healthy: 'Healthy', degraded: 'Degraded', unavailable: 'Unavailable' };

/**
 * Renders components exactly as reported by GET /api/admin/system-health.
 * `checkedAt` and `latencyMs` are measured client-side for the health request.
 */
export default function HealthGrid({ health, checkedAt, latencyMs, compact = false }) {
  const components = health?.components || [];
  return (
    <div className={`health-grid ${compact ? 'is-compact' : ''}`}>
      {components.map((c) => (
        <div key={c.name} className={`health-item status-${c.status}`}>
          <div className="health-item-top">
            <span className="health-icon">
              <Icon name={ICONS[c.name] || 'server'} size={18} />
            </span>
            <span className="health-status">
              <EnergyPulse size={8} color={COLORS[c.status] || '#94a3b8'} />
              {LABELS[c.status] || c.status}
            </span>
          </div>
          <strong className="health-name">{c.name}</strong>
          {!compact && (
            <dl className="health-meta">
              <div>
                <dt>Detail</dt>
                <dd>{c.detail || 'No issues reported'}</dd>
              </div>
              {checkedAt && (
                <div>
                  <dt>Last checked</dt>
                  <dd className="tabular">{checkedAt.toLocaleTimeString()}</dd>
                </div>
              )}
              {c.name === 'Backend API' && latencyMs !== undefined && latencyMs !== null && (
                <div>
                  <dt>Round-trip</dt>
                  <dd className="tabular">{Math.round(latencyMs)} ms (health request)</dd>
                </div>
              )}
            </dl>
          )}
          {compact && c.detail && <small className="health-detail">{c.detail}</small>}
        </div>
      ))}
    </div>
  );
}

export function OverallHealth({ overall }) {
  return (
    <span className={`health-overall status-${overall}`}>
      <EnergyPulse size={8} color={COLORS[overall] || '#94a3b8'} /> Overall: {LABELS[overall] || overall || 'Unknown'}
    </span>
  );
}
