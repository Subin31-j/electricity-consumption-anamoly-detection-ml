import { NavLink } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { EcadLogo, EnergyPulse } from '../../components/visual/Visuals';

const SECTIONS = [
  {
    label: 'Monitor',
    items: [
      { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
      { to: '/admin/system', label: 'System Health', icon: 'server' },
      { to: '/admin/models', label: 'Model Monitoring', icon: 'cpu' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/admin/users', label: 'Users', icon: 'users' },
      { to: '/admin/consumers', label: 'Consumers', icon: 'meter' },
      { to: '/admin/datasets', label: 'Datasets', icon: 'database' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/admin/analyses', label: 'Analyses', icon: 'chartLine' },
      { to: '/admin/anomalies', label: 'Anomalies', icon: 'alert' },
      { to: '/admin/reports', label: 'Reports', icon: 'report' },
      { to: '/admin/activity', label: 'Activity', icon: 'activity' },
    ],
  },
  {
    label: 'Console',
    items: [{ to: '/admin/settings', label: 'Settings', icon: 'settings' }],
  },
];

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar" id="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-brand">
        <span className="brand-logo">
          <EcadLogo size={19} />
        </span>
        <span className="brand-text">
          <span className="brand-mark">ECAD</span>
          <span className="admin-brand-sub">Admin Console</span>
        </span>
      </div>
      <nav className="admin-nav">
        {SECTIONS.map((sec) => (
          <div key={sec.label} role="group" aria-labelledby={`adm-${sec.label}`}>
            <div className="admin-nav-label" id={`adm-${sec.label}`}>
              {sec.label}
            </div>
            {sec.items.map((s) => (
              <NavLink key={s.to} to={s.to} end={s.end} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                <Icon name={s.icon} size={16} />
                <span>{s.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="admin-sidebar-foot">
        <EnergyPulse size={7} color="#34d399" /> Backend-enforced ADMIN role
      </div>
    </aside>
  );
}
