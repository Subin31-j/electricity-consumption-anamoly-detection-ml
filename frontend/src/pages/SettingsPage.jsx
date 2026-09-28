import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { Select, Switch } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { SuccessBanner } from '../components/ui/States';
import { useAuth } from '../auth/AuthContext';
import { getReduceMotionSetting, setReduceMotionSetting } from '../components/ui/motion';
import { RANGE_KEY, getDefaultRange } from '../components/analysis/ConsumptionOverview';

/**
 * Settings limited to what the app actually supports. Preferences are stored
 * in this browser (localStorage) and applied immediately.
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const [reduceMotion, setReduceMotion] = useState(getReduceMotionSetting);
  const [range, setRange] = useState(getDefaultRange);
  const [saved, setSaved] = useState('');

  const onMotion = (v) => {
    setReduceMotion(v);
    setReduceMotionSetting(v);
    setSaved('Appearance preference saved.');
  };

  const onRange = (e) => {
    setRange(e.target.value);
    localStorage.setItem(RANGE_KEY, e.target.value);
    setSaved('Chart preference saved.');
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Account" eyebrowIcon="settings" title="Settings" subtitle="Preferences are stored in this browser and apply immediately." />

      {saved && <SuccessBanner message={saved} />}

      <div className="settings-grid">
        <Card title="Appearance" subtitle="How ECAD looks and moves" icon="palette">
          <div className="settings-row">
            <Switch
              checked={reduceMotion}
              onChange={onMotion}
              label="Reduce motion"
              description="Turns off chart reveals, count-ups and waveform animation. Your operating-system setting is always respected."
            />
          </div>
        </Card>

        <Card title="Preferences" subtitle="Analysis display defaults" icon="sliders">
          <div className="settings-row">
            <Select
              label="Default consumption chart range"
              value={range}
              onChange={onRange}
              options={[
                { value: 'all', label: 'All data' },
                { value: '90d', label: 'Last 90 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '7d', label: 'Last 7 days' },
              ]}
            />
            <span className="field-hint">Used when a Consumption Overview chart first opens. Ranges are relative to the last reading.</span>
          </div>
        </Card>

        <Card title="Account" subtitle="Managed by your ECAD administrator" icon="user">
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{user?.name}</dd></div>
            <div><dt>Email</dt><dd>{user?.email}</dd></div>
          </dl>
          <Link to="/profile" className="btn-ghost btn-sm mt-5">
            View profile <Icon name="arrowRight" size={13} />
          </Link>
        </Card>

        <Card title="Data & privacy" icon="shield">
          <p className="text-muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
            Your uploaded datasets and analysis history are stored securely and are only visible to your account and
            system administrators.
          </p>
        </Card>
      </div>
    </div>
  );
}
