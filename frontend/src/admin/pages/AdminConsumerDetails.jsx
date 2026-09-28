import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as adminService from '../adminService';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading, ErrorState, SuccessBanner } from '../../components/ui/States';
import { apiError } from '../../utils/format';

export default function AdminConsumerDetails() {
  const { consumerId } = useParams();
  const navigate = useNavigate();
  const [consumer, setConsumer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const c = await adminService.getConsumer(consumerId);
      setConsumer(c);
      setForm({
        consumer_name: c.consumer_name || '',
        connection_type: c.connection_type || '',
        location: c.location || '',
        meter_type: c.meter_type || '',
      });
    } catch (err) {
      setError(apiError(err, 'Could not load consumer.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumerId]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaved(false);
    setSaving(true);
    try {
      await adminService.updateConsumer(consumerId, form);
      setSaved(true);
      load();
    } catch (err) {
      setError(apiError(err, 'Update failed.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !consumer) return <Loading variant="cards" />;
  if (error && !consumer) return <ErrorState message={error} onRetry={load} />;
  if (!consumer) return null;

  return (
    <div className="admin-page">
      <button className="btn-ghost btn-sm admin-back" type="button" onClick={() => navigate('/admin/consumers')}>
        <Icon name="arrowLeft" size={14} /> Back to consumers
      </button>
      <PageHeader
        eyebrow={`Consumer #${consumer.id}`}
        eyebrowIcon="meter"
        title={consumer.consumer_name}
        subtitle={`Masked number ${consumer.consumer_number}`}
        actions={consumer.is_demo && <Badge tone="warning">Demo consumer</Badge>}
      />

      {saved && <SuccessBanner message="Consumer updated." />}
      {error && (
        <div className="alert alert-error" role="alert">
          <Icon name="alertCircle" size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="stat-grid">
        <StatCard label="Records" value={consumer.total_records} icon="database" tone="primary" />
        <StatCard label="Number (masked)" value={consumer.consumer_number} animate={false} icon="hash" />
        <StatCard label="Demo" value={consumer.is_demo ? 'Yes' : 'No'} animate={false} icon="info" />
      </div>

      <Card title="Edit metadata" icon="edit">
        <form className="admin-form-grid" onSubmit={onSave}>
          <label>
            Name
            <input className="input" value={form.consumer_name} onChange={(e) => setForm({ ...form, consumer_name: e.target.value })} />
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
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="check" size={15} />}
              Save changes
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
