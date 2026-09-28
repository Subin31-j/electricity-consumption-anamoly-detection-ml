import { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { modelStats } from './analysisUtils';

/** Three model cards with detection bars and corroboration, computed from results. */
export function ModelCards({ models, totalRecords, anomalies }) {
  const stats = useMemo(() => modelStats(models, totalRecords, anomalies), [models, totalRecords, anomalies]);
  const maxRate = Math.max(1, ...stats.filter((s) => s.ran).map((s) => s.rate));

  return (
    <div className="model-cards">
      {stats.map((s) => (
        <article key={s.name} className={`model-card ${s.meta.key === 'iforest' ? 'is-primary' : ''} ${s.ran ? '' : 'is-off'}`}>
          <header>
            <span className="model-icon" style={{ '--model-color': s.meta.color }}>
              <Icon name={s.meta.icon} size={18} />
            </span>
            <div>
              <h4>{s.name}</h4>
              <Badge tone={s.meta.key === 'iforest' ? 'primary' : 'outline'}>{s.meta.key === 'iforest' ? 'Primary' : 'Comparison'}</Badge>
            </div>
          </header>
          {s.ran ? (
            <>
              <div className="model-metric">
                <span className="model-metric-value tabular">{s.count.toLocaleString()}</span>
                <span className="model-metric-label">anomalies detected</span>
              </div>
              <div className="model-bar-row">
                <span>Detection rate</span>
                <strong className="tabular">{s.rate.toFixed(2)}%</strong>
              </div>
              <div className="progress" aria-hidden="true">
                <div className="progress-bar" style={{ width: `${(s.rate / maxRate) * 100}%`, background: s.meta.color }} />
              </div>
              {s.corroboration !== null && (
                <>
                  <div className="model-bar-row">
                    <span title="Share of this model's flags that at least one other model also flagged">Agreement with others</span>
                    <strong className="tabular">{s.corroboration.toFixed(0)}%</strong>
                  </div>
                  <div className="progress" aria-hidden="true">
                    <div className="progress-bar is-anomaly" style={{ width: `${s.corroboration}%` }} />
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-muted" style={{ fontSize: 'var(--fs-sm)', margin: '12px 0 0' }}>
              Not run in this analysis.
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

/** Agreement breakdown (all 3 / 2 / 1 models) as a stacked bar + legend. */
export function ModelAgreement({ agreement }) {
  const all = agreement?.detected_by_all_three ?? 0;
  const two = agreement?.detected_by_two ?? 0;
  const one = agreement?.detected_by_one ?? 0;
  const total = all + two + one;
  const pct = (n) => (total ? (n / total) * 100 : 0);
  const rows = [
    { label: 'All 3 models', value: all, cls: 'lvl-3', desc: 'Strongest consensus' },
    { label: '2 models', value: two, cls: 'lvl-2', desc: 'Partial consensus' },
    { label: '1 model', value: one, cls: 'lvl-1', desc: 'Single-model flag' },
  ];
  return (
    <Card
      title="Model Agreement"
      subtitle="How many models flagged the same reading. Higher agreement indicates stronger consensus, not certainty."
      icon="layers"
    >
      {total === 0 ? (
        <p className="text-muted" style={{ margin: 0 }}>No readings were flagged by any model.</p>
      ) : (
        <>
          <div className="agree-stack" role="img" aria-label={`All three: ${all}, two: ${two}, one: ${one}`}>
            {rows.map((r) =>
              r.value ? <span key={r.cls} className={r.cls} style={{ width: `${pct(r.value)}%` }} /> : null
            )}
          </div>
          <div className="agree-rows">
            {rows.map((r) => (
              <div key={r.cls} className="agree-row">
                <i className={r.cls} aria-hidden="true" />
                <div>
                  <strong>{r.label}</strong>
                  <small>{r.desc}</small>
                </div>
                <span className="tabular">{r.value.toLocaleString()}</span>
                <span className="text-muted tabular">{pct(r.value).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

/** Model configuration table (parameters + scoring notes) from results.models. */
export function ModelConfigList({ models }) {
  return (
    <div className="model-config-list">
      {(models || []).map((m) => (
        <div key={m.name} className="model-config">
          <div className="model-config-head">
            <strong>{m.name}</strong>
            <span className="text-muted tabular">{m.anomaly_count.toLocaleString()} flagged</span>
          </div>
          <div className="param-chips">
            {Object.entries(m.params || {}).map(([k, v]) => (
              <code key={k} className="param-chip">
                {k}: {String(v)}
              </code>
            ))}
          </div>
          {m.scoring_note && <p className="model-config-note">{m.scoring_note}</p>}
        </div>
      ))}
    </div>
  );
}
