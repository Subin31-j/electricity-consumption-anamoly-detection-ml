import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from '../ui/Icon';
import { EcadLogo, ElectricWave, EnergyPulse } from '../visual/Visuals';
import { initials } from '../../utils/format';

/**
 * Main authenticated app shell for normal users. Deliberately contains NO admin
 * navigation entry, link, or label. Admins reach /admin via the redirect after
 * login, not through this UI.
 */
const NAV = [
  {
    section: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    section: 'Analyze',
    items: [
      { to: '/consumption', label: 'My Consumption', icon: 'meter' },
      { to: '/datasets', label: 'Datasets', icon: 'database' },
      { to: '/upload', label: 'Upload Dataset', icon: 'upload' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { to: '/history', label: 'Analysis History', icon: 'history' },
      { to: '/reports', label: 'Reports', icon: 'report' },
    ],
  },
  {
    section: 'Account',
    items: [
      { to: '/profile', label: 'Profile', icon: 'user' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
      { to: '/help', label: 'Help', icon: 'help' },
    ],
  },
];

/** Page title + breadcrumb context derived from the current route. */
function routeContext(pathname) {
  const m = pathname.match(/^\/analysis\/(\d+)\/(results|visualizations|comparison)/);
  if (m) {
    const titles = { results: 'Analysis Results', visualizations: 'Visualizations', comparison: 'Model Comparison' };
    return { crumb: `Analysis #${m[1]}`, title: titles[m[2]] };
  }
  const map = {
    '/dashboard': ['Overview', 'Dashboard'],
    '/consumption': ['Analyze', 'My Consumption'],
    '/datasets': ['Analyze', 'Datasets'],
    '/upload': ['Analyze', 'Upload Dataset'],
    '/preview': ['Analyze', 'Dataset Preview'],
    '/history': ['Insights', 'Analysis History'],
    '/reports': ['Insights', 'Reports'],
    '/profile': ['Account', 'Profile'],
    '/settings': ['Account', 'Settings'],
    '/help': ['Account', 'Help'],
  };
  const [crumb, title] = map[pathname] || ['ECAD', 'Electricity Intelligence'];
  return { crumb, title };
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const ctx = routeContext(location.pathname);

  useEffect(() => {
    setNavOpen(false);
    window.scrollTo?.(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setNavOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen]);

  useEffect(() => {
    document.title = `${ctx.title} · ECAD`;
  }, [ctx.title]);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app-shell ${navOpen ? 'nav-open' : ''}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <aside className="app-sidebar" id="app-sidebar" aria-label="Main navigation">
        <Link to="/dashboard" className="app-brand">
          <span className="brand-logo">
            <EcadLogo size={20} />
          </span>
          <span className="brand-text">
            <span className="brand-mark">ECAD</span>
            <span className="brand-sub">Electricity Anomaly Detection</span>
          </span>
        </Link>

        <nav className="app-nav">
          {NAV.map((group) => (
            <div key={group.section} role="group" aria-labelledby={`nav-${group.section}`}>
              <div className="nav-section-label" id={`nav-${group.section}`}>
                {group.section}
              </div>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}>
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <strong>
            <EnergyPulse size={7} color="#f59e0b" /> Prototype mode
          </strong>
          Historical demo data only. Not connected to a real electricity board.
          <ElectricWave className="wave" height={22} color="#60a5fa" opacity={0.55} />
        </div>
      </aside>

      <div className="sidebar-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="btn-ghost btn-icon topbar-menu"
              onClick={() => setNavOpen((o) => !o)}
              aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={navOpen}
              aria-controls="app-sidebar"
            >
              <Icon name={navOpen ? 'close' : 'menu'} size={18} />
            </button>
            <div className="topbar-crumbs">
              <small>
                ECAD <Icon name="chevronRight" size={10} /> {ctx.crumb}
              </small>
              <span className="topbar-title">{ctx.title}</span>
            </div>
          </div>

          <div className="topbar-right">
            <span className="topbar-status" title="This prototype analyzes stored historical data">
              <EnergyPulse size={7} color="#059669" /> Historical analysis
            </span>
            <Link to="/profile" className="user-chip" aria-label={`Profile: ${user?.name || 'user'}`}>
              <span className="avatar" aria-hidden="true">
                {initials(user?.name)}
              </span>
              <span className="user-chip-text">
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
              </span>
            </Link>
            <button className="btn-ghost btn-sm" onClick={onLogout} type="button">
              <Icon name="logout" size={15} />
              <span className="topbar-logout-label">Logout</span>
            </button>
          </div>
        </header>

        <main className="app-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>
            <Icon name="info" size={13} /> Prototype system analyzing historical data only. Not connected to a real electricity board.
          </span>
          <span>ECAD · Electricity Consumption Anomaly Detection</span>
        </footer>
      </div>
    </div>
  );
}
