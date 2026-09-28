import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Icon } from '../components/ui/Icon';
import { StatusBadge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Loading, ErrorState, EmptyState } from '../components/ui/States';
import { DataGridBackground } from '../components/visual/Visuals';
import { useAuth } from '../auth/AuthContext';
import { apiError, formatDate, formatDateTime, initials, sourceLabel } from '../utils/format';
import * as analysisService from '../services/analysisService';

export default function ProfilePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setHistory(await analysisService.getHistory());
    } catch (err) {
      setError(apiError(err, 'Could not load your analysis statistics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const items = history?.items || [];
    return {
      total: history?.total ?? 0,
      consumer: items.filter((i) => i.consumer_id).length,
      dataset: items.filter((i) => !i.consumer_id).length,
      records: items.reduce((s, i) => s + i.record_count, 0),
      anomalies: items.reduce((s, i) => s + i.anomaly_count, 0),
    };
  }, [history]);

  return (
    <div className="page">
      <PageHeader eyebrow="Account" eyebrowIcon="user" title="Profile" subtitle="Your account details and analysis activity." />

      <section className="profile-hero">
        <DataGridBackground dark />
        <span className="avatar lg" aria-hidden="true">{initials(user?.name)}</span>
        <div className="profile-hero-text">
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <div className="row" style={{ marginTop: 8 }}>
            <StatusBadge status={user?.status} />
            {user?.created_at && (
              <span className="profile-since">
                <Icon name="calendar" size={13} /> Member since {formatDate(user.created_at)}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid-2 mt-5">
        <Card title="Personal information" icon="user">
          <dl className="detail-list">
            <div><dt>Full name</dt><dd>{user?.name || '-'}</dd></div>
            <div><dt>Email</dt><dd>{user?.email || '-'}</dd></div>
          </dl>
        </Card>
        <Card title="Account information" icon="shield">
          <dl className="detail-list">
            <div><dt>Account type</dt><dd>{user?.role === 'USER' ? 'Standard user' : user?.role || '-'}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge status={user?.status} /></dd></div>
            {user?.created_at && <div><dt>Created</dt><dd>{formatDate(user.created_at)}</dd></div>}
            <div><dt>Password</dt><dd className="text-muted">Stored securely as a hash; never displayed</dd></div>
          </dl>
        </Card>
      </div>

      <div className="section-header">
        <div><h2>Analysis statistics</h2></div>
      </div>
      {loading ? (
        <Loading variant="cards" />
      ) : error ? (
        <ErrorState compact message={error} onRetry={load} />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Analyses" value={stats.total} icon="history" tone="dark" />
            <StatCard label="Consumer analyses" value={stats.consumer} icon="meter" />
            <StatCard label="Dataset analyses" value={stats.dataset} icon="fileSheet" />
            <StatCard label="Records analyzed" value={stats.records} icon="database" />
            <StatCard label="Anomalies found" value={stats.anomalies} icon="alert" tone="anomaly" />
          </div>

          <Card title="Recent activity" subtitle="Your latest analyses" icon="activity" flush>
            {history?.items?.length ? (
              <ul className="recent-list">
                {history.items.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link to={`/analysis/${a.id}/results`} className="recent-item">
                      <span className={`recent-icon ${a.consumer_id ? '' : 'is-dataset'}`}>
                        <Icon name={a.consumer_id ? 'meter' : 'fileSheet'} size={16} />
                      </span>
                      <span className="recent-main">
                        <strong>Ran analysis #{a.id}</strong>
                        <small>{sourceLabel(a)} · {a.anomaly_count.toLocaleString()} anomalies</small>
                      </span>
                      <StatusBadge status={a.status} />
                      <span className="recent-date">{formatDateTime(a.created_at)}</span>
                      <Icon name="chevronRight" size={16} className="recent-chevron" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ padding: 'var(--sp-5)' }}>
                <EmptyState compact title="No activity yet" message="Your analyses will be listed here." />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
