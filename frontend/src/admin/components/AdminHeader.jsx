import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from '../../components/ui/Icon';
import { initials } from '../../utils/format';

const TITLES = {
  '': 'System Overview',
  users: 'Users',
  consumers: 'Consumers',
  datasets: 'Datasets',
  analyses: 'Analyses',
  anomalies: 'Anomalies',
  models: 'Model Monitoring',
  reports: 'Reports',
  activity: 'Activity',
  system: 'System Health',
  settings: 'Settings',
};

export default function AdminHeader({ navOpen, onToggleNav }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const parts = pathname.replace(/^\/admin\/?/, '').split('/');
  const section = TITLES[parts[0]] || 'Admin';
  const detail = parts[1] ? `#${parts[1]}` : null;

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="admin-icon-btn topbar-menu"
          onClick={onToggleNav}
          aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={navOpen}
          aria-controls="admin-sidebar"
        >
          <Icon name={navOpen ? 'close' : 'menu'} size={18} />
        </button>
        <div className="topbar-crumbs">
          <small>
            Admin Console <Icon name="chevronRight" size={10} /> {section}
          </small>
          <span className="topbar-title">
            {section}
            {detail ? ` ${detail}` : ''}
          </span>
        </div>
      </div>
      <div className="admin-topbar-user">
        <span className="admin-role-badge">ADMIN</span>
        <span className="avatar" aria-hidden="true">{initials(user?.name)}</span>
        <span className="admin-user-name">{user?.name}</span>
        <button className="admin-icon-btn" type="button" onClick={onLogout} aria-label="Logout">
          <Icon name="logout" size={16} />
          <span className="topbar-logout-label">Logout</span>
        </button>
      </div>
    </header>
  );
}
