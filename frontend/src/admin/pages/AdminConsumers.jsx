import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDataTable from '../components/AdminDataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState, EmptyState } from '../../components/ui/States';
import { apiError } from '../../utils/format';

const EMPTY_FORM = {
  consumer_number: '',
  consumer_name: '',
  connection_type: '',
  location: '',
  meter_type: '',
};

export default function AdminConsumers() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [view, setView] = useState('cards');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await adminService.listConsumers());
    } catch (err) {
      setError(apiError(err, 'Could not load consumers.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await adminService.createConsumer(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiError(err, 'Create failed.'));
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async () => {
    if (!confirm) return;
    try {
      await adminService.deleteConsumer(confirm.id);
    } catch (err) {
      setError(apiError(err, 'Delete failed.'));
    } finally {
      setConfirm(null);
      load();
    }
  };

  if (loading && !rows) return <Loading variant="cards" />;
  if (error && !rows) return <ErrorState message={error} onRetry={load} />;

  const list = rows || [];

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Manage"
        eyebrowIcon="meter"
        title="Consumers"
        subtitle="Demo / prototype consumer accounts. Numbers are masked."
        actions={
          <>
            <Tabs
              options={[
                { value: 'cards', label: 'Cards' },
                { value: 'table', label: 'Table' },
              ]}
              value={view}
              onChange={setView}
              label="View"
            />
            <button className="btn-primary btn-sm" type="button" onClick={() => setShowForm((s) => !s)} aria-expanded={showForm}>
              <Icon name={showForm ? 'close' : 'plus'} size={14} /> {showForm ? 'Close' : 'Add consumer'}
            </button>
          </>
        }
      />

      {error && (
        <div className="alert alert-error" role="alert">
          <Icon name="alertCircle" size={16} />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <Card title="Add consumer" subtitle="Consumers created here have no historical readings until data is seeded." icon="plus" className="mb-5">
          <form className="admin-form-grid" onSubmit={onCreate}>
            <label>
              Consumer number (11 digits)
              <input
                className="input"
                value={form.consumer_number}
                maxLength={11}
                inputMode="numeric"
                onChange={(e) => setForm({ ...form, consumer_number: e.target.value.replace(/\D/g, '') })}
                required
              />
            </label>
            <label>
              Name
              <input className="input" value={form.consumer_name} onChange={(e) => setForm({ ...form, consumer_name: e.target.value })} required />
            </label>
            <label>
              Connection type
              <input className="input" value={form.connection_type} onChange={(e) => setForm({ ...form, connection_type: e.target.value })} />
            </label>
            <label>
              Location
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </label>
            <label>
              Meter type
              <input className="input" value={form.meter_type} onChange={(e) => setForm({ ...form, meter_type: e.target.value })} />
            </label>
            <div className="admin-form-actions">
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="plus" size={15} />}
                {creating ? 'Adding...' : 'Add consumer'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {list.length === 0 ? (
        <EmptyState title="No consumers" message="Add a demo consumer or seed the demo data." />
      ) : view === 'cards' ? (
        <div className="consumer-grid">
          {list.map((c) => (
            <article key={c.id} className="consumer-card">
              <header>
                <span className="consumer-card-icon"><Icon name="meter" size={18} /></span>
                <div>
                  <strong>{c.consumer_name}</strong>
                  <span className="mono">{c.consumer_number}</span>
                </div>
                {c.is_demo && <Badge tone="warning">Demo</Badge>}
              </header>
              <dl>
                <div><dt>Records</dt><dd className="tabular">{c.total_records.toLocaleString()}</dd></div>
                <div><dt>Connection</dt><dd>{c.connection_type || '-'}</dd></div>
                <div><dt>Location</dt><dd>{c.location || '-'}</dd></div>
                <div><dt>Meter</dt><dd>{c.meter_type || '-'}</dd></div>
              </dl>
              {!c.total_records && <p className="consumer-card-note">No readings seeded yet</p>}
              <footer className="row-actions">
                <button className="btn-ghost btn-sm" type="button" onClick={() => navigate(`/admin/consumers/${c.id}`)}>
                  <Icon name="eye" size={13} /> View
                </button>
                <button className="btn-ghost btn-sm" type="button" onClick={() => navigate(`/admin/consumers/${c.id}`)}>
                  <Icon name="edit" size={13} /> Edit
                </button>
                <button className="btn-danger btn-sm" type="button" onClick={() => setConfirm(c)} aria-label={`Delete consumer ${c.consumer_number}`}>
                  <Icon name="trash" size={13} />
                </button>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <Card flush>
          <AdminDataTable
            caption="Consumers"
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'consumer_number', header: 'Number (masked)', render: (r) => <span className="mono">{r.consumer_number}</span> },
              { key: 'consumer_name', header: 'Name' },
              { key: 'is_demo', header: 'Demo', render: (r) => (r.is_demo ? <Badge tone="warning">Demo</Badge> : 'No') },
              { key: 'connection_type', header: 'Connection' },
              { key: 'location', header: 'Location' },
              { key: 'total_records', header: 'Records', align: 'num', render: (r) => r.total_records.toLocaleString() },
              {
                key: 'actions',
                header: 'Actions',
                sortable: false,
                render: (r) => (
                  <div className="row-actions">
                    <button className="btn-ghost btn-sm" type="button" onClick={() => navigate(`/admin/consumers/${r.id}`)}>View / Edit</button>
                    <button className="btn-danger btn-sm" type="button" onClick={() => setConfirm(r)}>Delete</button>
                  </div>
                ),
              },
            ]}
            rows={list}
          />
        </Card>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete consumer"
        message={`Delete consumer ${confirm?.consumer_number}? This removes its data.`}
        confirmLabel="Delete"
        onConfirm={onDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
