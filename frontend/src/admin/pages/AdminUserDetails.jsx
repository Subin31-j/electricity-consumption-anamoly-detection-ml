import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { StatusBadge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { apiError, formatDateTime, initials } from '../../utils/format';

export default function AdminUserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setUser(await adminService.getUser(userId));
    } catch (err) {
      setError(apiError(err, 'Could not load user.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) return <Loading variant="cards" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!user) return null;

  return (
    <div className="admin-page">
      <button className="btn-ghost btn-sm admin-back" type="button" onClick={() => navigate('/admin/users')}>
        <Icon name="arrowLeft" size={14} /> Back to users
      </button>
      <PageHeader eyebrow={`User #${user.id}`} eyebrowIcon="user" title={user.name} subtitle={user.email} />
      <div className="grid-main-side">
        <Card title="Account" icon="user">
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Role</dt><dd><StatusBadge status={user.role} label={user.role === 'ADMIN' ? 'Admin' : 'User'} /></dd></div>
            <div><dt>Status</dt><dd><StatusBadge status={user.status} /></dd></div>
            <div><dt>Created</dt><dd className="tabular">{formatDateTime(user.created_at, true)}</dd></div>
          </dl>
        </Card>
        <Card title="Security" icon="lock">
          <div className="admin-user-avatar">
            <span className="avatar lg" aria-hidden="true">{initials(user.name)}</span>
          </div>
          <p className="text-muted" style={{ fontSize: 'var(--fs-sm)' }}>
            Passwords and password hashes are never exposed through the admin API.
          </p>
        </Card>
      </div>
    </div>
  );
}
