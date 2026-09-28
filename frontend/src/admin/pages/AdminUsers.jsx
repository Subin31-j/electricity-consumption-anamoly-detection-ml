import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDataTable from '../components/AdminDataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { StatusBadge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState } from '../../components/ui/States';
import { apiError, formatDate, initials } from '../../utils/format';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISABLED', label: 'Disabled' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'USER', label: 'User' },
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null); // user to delete

  // Status filters are applied server-side; role filters on the loaded page.
  const statusFilter = filter === 'ACTIVE' || filter === 'DISABLED' ? filter : '';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminService.listUsers({ search, status: statusFilter, page }));
    } catch (err) {
      setError(apiError(err, 'Could not load users.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const onSearch = (e) => {
    e.preventDefault();
    if (page !== 1) setPage(1);
    else load();
  };

  const toggleStatus = async (user) => {
    const next = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(user.id, next);
    } catch (err) {
      setError(apiError(err, 'Status update failed.'));
    }
    load();
  };

  const onDelete = async () => {
    if (!confirm) return;
    try {
      await adminService.deleteUser(confirm.id);
    } catch (err) {
      setError(apiError(err, 'Delete failed.'));
    } finally {
      setConfirm(null);
      load();
    }
  };

  const rows = useMemo(() => {
    const items = data?.items || [];
    if (filter === 'ADMIN' || filter === 'USER') return items.filter((u) => u.role === filter);
    return items;
  }, [data, filter]);

  if (loading && !data) return <Loading variant="table" />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Manage" eyebrowIcon="users" title="Users" subtitle={`${data?.total ?? 0} registered accounts. Passwords are never displayed.`} />

      {error && (
        <div className="alert alert-error" role="alert">
          <Icon name="alertCircle" size={16} />
          <span>{error}</span>
        </div>
      )}

      <Card flush>
        <div className="admin-toolbar">
          <form className="admin-search" onSubmit={onSearch} role="search">
            <label className="input-with-icon">
              <span className="sr-only">Search users</span>
              <Icon name="search" size={16} />
              <input className="input input-sm" type="search" placeholder="Search email or name" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <button className="btn-primary btn-sm" type="submit">Search</button>
          </form>
          <Tabs
            options={FILTERS}
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            label="Filter users"
          />
        </div>
        <AdminDataTable
          searchable={false}
          pageSize={0}
          caption="Users"
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => (
                <span className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                  <span className="avatar sm" aria-hidden="true">{initials(r.name)}</span>
                  <span className="cell-strong">{r.name}</span>
                </span>
              ),
            },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role', render: (r) => <StatusBadge status={r.role} label={r.role === 'ADMIN' ? 'Admin' : 'User'} /> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'created_at', header: 'Created', render: (r) => <span className="tabular">{formatDate(r.created_at)}</span> },
            {
              key: 'actions',
              header: 'Actions',
              sortable: false,
              render: (r) => (
                <div className="row-actions">
                  <button className="btn-ghost btn-sm" type="button" onClick={() => navigate(`/admin/users/${r.id}`)}>
                    <Icon name="eye" size={13} /> View
                  </button>
                  {r.role !== 'ADMIN' && (
                    <>
                      <button className="btn-ghost btn-sm" type="button" onClick={() => toggleStatus(r)}>
                        {r.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn-danger btn-sm" type="button" onClick={() => setConfirm(r)} aria-label={`Delete ${r.email}`}>
                        <Icon name="trash" size={13} />
                      </button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          rows={rows}
        />
        <div className="ui-table-footer">
          <span>
            Page {page} of {totalPages} ({data?.total ?? 0} users){loading ? ' · refreshing…' : ''}
          </span>
          <nav className="pager" aria-label="Users pagination">
            <button className="btn-ghost btn-sm btn-icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button" aria-label="Previous page">
              <Icon name="chevronLeft" size={14} />
            </button>
            <button className="btn-ghost btn-sm btn-icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} type="button" aria-label="Next page">
              <Icon name="chevronRight" size={14} />
            </button>
          </nav>
        </div>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        title="Delete user"
        message={`Delete ${confirm?.email}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={onDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
