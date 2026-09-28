import { useEffect, useMemo, useState } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { apiError, formatDateTime } from '../../utils/format';

function actionTone(action = '') {
  if (/delete|disabled|fail/i.test(action)) return 'danger';
  if (/login|register|enabled/i.test(action)) return 'success';
  if (/analysis|report/i.test(action)) return 'primary';
  return 'default';
}

function prettyAction(action = '') {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminActivity() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await adminService.listActivity());
    } catch (err) {
      setError(apiError(err, 'Could not load activity logs.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const actions = useMemo(() => [...new Set((rows || []).map((r) => r.action))].sort(), [rows]);
  const filtered = useMemo(() => (rows || []).filter((r) => !action || r.action === action), [rows, action]);

  if (loading) return <Loading variant="table" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Analytics"
        eyebrowIcon="activity"
        title="Activity"
        subtitle="Latest 200 audit events. Passwords and authentication secrets are never logged."
        actions={
          <button className="btn-ghost btn-sm" type="button" onClick={load}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        }
      />
      <Card flush>
        <AdminDataTable
          caption="Activity log"
          toolbar={
            <Select
              label="Action"
              hideLabel
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="input-sm"
              options={[{ value: '', label: 'All actions' }, ...actions.map((a) => ({ value: a, label: prettyAction(a) }))]}
            />
          }
          columns={[
            { key: 'created_at', header: 'When', render: (r) => <span className="tabular">{formatDateTime(r.created_at, true)}</span> },
            { key: 'action', header: 'Action', render: (r) => <Badge tone={actionTone(r.action)} dot>{prettyAction(r.action)}</Badge> },
            { key: 'user_id', header: 'User', render: (r) => (r.user_id ? `#${r.user_id}` : '-') },
            { key: 'entity_type', header: 'Entity', render: (r) => r.entity_type || '-' },
            { key: 'entity_id', header: 'Entity ID', render: (r) => (r.entity_id ? `#${r.entity_id}` : '-') },
            { key: 'id', header: 'Event', render: (r) => <span className="cell-muted">#{r.id}</span> },
          ]}
          rows={filtered}
        />
      </Card>
    </div>
  );
}
