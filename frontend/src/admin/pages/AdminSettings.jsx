import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { StatusBadge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';

export default function AdminSettings() {
  const { user } = useAuth();
  return (
    <div className="admin-page">
      <PageHeader eyebrow="Console" eyebrowIcon="settings" title="Admin Settings" subtitle="Administrator account and security posture." />
      <div className="grid-2">
        <Card title="Administrator account" icon="user">
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{user?.name}</dd></div>
            <div><dt>Email</dt><dd>{user?.email}</dd></div>
            <div><dt>Role</dt><dd><StatusBadge status={user?.role} label="Admin" /></dd></div>
          </dl>
        </Card>
        <Card title="Security notes" icon="shield">
          <ul className="admin-notes">
            <li><Icon name="check" size={14} /> Admin credentials are validated server-side and stored as a password hash.</li>
            <li><Icon name="check" size={14} /> The admin uses the same login form as normal users; no admin entry point is exposed in the normal UI.</li>
            <li><Icon name="check" size={14} /> Every /api/admin/* endpoint enforces the ADMIN role on the backend.</li>
            <li><Icon name="check" size={14} /> Passwords and secrets are never logged or returned by the API.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
