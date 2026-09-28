import { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { DataTable } from '../ui/DataTable';
import { AnomalyMarker } from '../visual/Visuals';
import { anomalyFacts, toMs, tsKey } from './analysisUtils';
import { formatDateTime, formatKwh } from '../../utils/format';

/** Agreement indicator: three pips, filled per model that flagged the record. */
export function AgreementPips({ count }) {
  const n = Number(count) || 0;
  return (
    <span className={`agree-pips lvl-${n}`} aria-label={`Flagged by ${n} of 3 models`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? 'on' : ''} />
      ))}
      <small>{n}/3</small>
    </span>
  );
}

/** "Detected Anomalies" card: count, rate, latest and highest anomaly. */
export function AnomalySummary({ summary, anomalies }) {
  const { latest, highest } = useMemo(() => anomalyFacts(anomalies), [anomalies]);
  const count = summary?.anomaly_count ?? anomalies?.length ?? 0;
  return (
    <Card title="Detected Anomalies" subtitle="Readings flagged by at least one model" icon="alert" variant="anomaly">
      <div className="anomaly-summary">
        <div className="anomaly-summary-main">
          <AnomalyMarker size={22} />
          <div>
            <div className="anomaly-summary-count tabular">{count.toLocaleString()}</div>
            <div className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
              {summary ? `${summary.anomaly_rate}% of ${summary.total_records.toLocaleString()} readings` : 'flagged readings'}
            </div>
          </div>
        </div>
        {summary && (
          <div className="progress" aria-hidden="true" style={{ marginTop: 10 }}>
            <div className="progress-bar is-anomaly" style={{ width: `${Math.min(100, summary.anomaly_rate)}%` }} />
          </div>
        )}
        <dl className="anomaly-facts">
          <div>
            <dt>
              <Icon name="clock" size={13} /> Latest anomaly
            </dt>
            <dd>
              {latest ? (
                <>
                  <strong>{formatDateTime(latest.timestamp)}</strong>
                  <span>{formatKwh(latest.consumption_kwh)} kWh</span>
                </>
              ) : (
                <span className="text-muted">None detected</span>
              )}
            </dd>
          </div>
          <div>
            <dt>
              <Icon name="zap" size={13} /> Highest anomaly
            </dt>
            <dd>
              {highest ? (
                <>
                  <strong>{formatKwh(highest.consumption_kwh)} kWh</strong>
                  <span>{formatDateTime(highest.timestamp)}</span>
                </>
              ) : (
                <span className="text-muted">None detected</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

/**
 * Anomaly timeline: a horizontal strip spanning the full data period with a
 * marker at each flagged reading, plus a vertical list of the latest ones.
 * items: [{ timestamp, consumption_kwh, agreement_count }]
 */
export function AnomalyTimeline({ items, start, end, listLimit = 6, title = 'Anomaly Timeline' }) {
  const sorted = useMemo(
    () => [...(items || [])].sort((a, b) => (tsKey(a.timestamp) < tsKey(b.timestamp) ? -1 : 1)),
    [items]
  );
  const t0 = toMs(start) ?? (sorted[0] ? toMs(sorted[0].timestamp) : null);
  const t1 = toMs(end) ?? (sorted.length ? toMs(sorted[sorted.length - 1].timestamp) : null);
  const span = t0 !== null && t1 !== null && t1 > t0 ? t1 - t0 : null;
  const recent = sorted.slice(-listLimit).reverse();

  return (
    <Card
      title={title}
      subtitle={sorted.length ? `${sorted.length.toLocaleString()} flagged readings across the analysed period` : 'No anomalies in this analysis'}
      icon="history"
    >
      {sorted.length === 0 ? (
        <div className="timeline-strip is-empty">
          <span className="timeline-normal-label">All readings within the normal pattern</span>
        </div>
      ) : (
        <>
          <div className="timeline-strip" role="img" aria-label={`Timeline with ${sorted.length} anomaly markers`}>
            <span className="timeline-axis" />
            {span &&
              sorted.map((a, i) => {
                const pos = ((toMs(a.timestamp) - t0) / span) * 100;
                return (
                  <span
                    key={a.id ?? i}
                    className={`timeline-mark lvl-${a.agreement_count}`}
                    style={{ left: `${Math.max(0, Math.min(100, pos))}%` }}
                    title={`${formatDateTime(a.timestamp)} · ${formatKwh(a.consumption_kwh)} kWh · ${a.agreement_count}/3 models`}
                  />
                );
              })}
          </div>
          <div className="timeline-scale">
            <span>{start ? String(tsKey(start)).slice(0, 10) : tsKey(sorted[0].timestamp).slice(0, 10)}</span>
            <span className="timeline-key">
              <i className="lvl-1" /> 1 model <i className="lvl-2" /> 2 models <i className="lvl-3" /> 3 models
            </span>
            <span>{end ? String(tsKey(end)).slice(0, 10) : tsKey(sorted[sorted.length - 1].timestamp).slice(0, 10)}</span>
          </div>

          <ol className="timeline-list" aria-label="Most recent anomalies">
            {recent.map((a, i) => (
              <li key={a.id ?? i} className={`lvl-${a.agreement_count}`}>
                <span className="timeline-list-dot" aria-hidden="true" />
                <div className="timeline-list-body">
                  <strong className="tabular">{formatDateTime(a.timestamp)}</strong>
                  <span className="tabular">{formatKwh(a.consumption_kwh)} kWh</span>
                </div>
                <AgreementPips count={a.agreement_count} />
              </li>
            ))}
          </ol>
        </>
      )}
    </Card>
  );
}

function Flag({ on, score, extra }) {
  return (
    <span className={`flag ${on ? 'on' : ''}`}>
      <span className="flag-dot" aria-hidden="true" />
      {on ? 'Yes' : 'No'}
      {score !== null && score !== undefined && <span className="text-muted">· {Number(score).toFixed(3)}</span>}
      {extra}
    </span>
  );
}

/** Full anomaly records table with search, sort and pagination. */
export function AnomalyTable({ items, pageSize = 12 }) {
  return (
    <DataTable
      searchable
      sortable
      pageSize={pageSize}
      searchPlaceholder="Search timestamp or kWh…"
      caption="Anomaly records"
      emptyText="No anomalies were detected."
      rowClassName={(r) => (r.agreement_count === 3 ? 'row-anomaly-strong' : 'row-anomaly')}
      columns={[
        {
          key: 'timestamp',
          header: 'Timestamp',
          render: (r) => <span className="cell-strong tabular">{formatDateTime(r.timestamp, true)}</span>,
          searchValue: (r) => formatDateTime(r.timestamp, true),
        },
        {
          key: 'consumption_kwh',
          header: 'kWh',
          align: 'num',
          render: (r) => <span className="tabular">{Number(r.consumption_kwh).toFixed(3)}</span>,
        },
        {
          key: 'iforest',
          header: 'Isolation Forest',
          sortValue: (r) => r.iforest_score ?? -1,
          render: (r) => <Flag on={r.iforest_label} score={r.iforest_score} />,
        },
        {
          key: 'kmeans',
          header: 'K-Means',
          sortValue: (r) => r.kmeans_score ?? -1,
          render: (r) => (
            <Flag
              on={r.kmeans_label}
              extra={r.kmeans_cluster !== null && r.kmeans_cluster !== undefined ? <span className="text-muted">· c{r.kmeans_cluster}</span> : null}
            />
          ),
        },
        {
          key: 'lof',
          header: 'LOF',
          sortValue: (r) => r.lof_score ?? -1,
          render: (r) => <Flag on={r.lof_label} score={r.lof_score} />,
        },
        {
          key: 'agreement_count',
          header: 'Agreement',
          render: (r) => <AgreementPips count={r.agreement_count} />,
        },
      ]}
      rows={items || []}
    />
  );
}
