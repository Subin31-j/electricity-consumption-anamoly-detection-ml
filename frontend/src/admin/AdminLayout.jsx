import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import { Icon } from '../components/ui/Icon';
import './admin.css';

export default function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setNavOpen(false);
    document.title = 'Admin · ECAD';
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setNavOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <div className={`admin-shell ${navOpen ? 'nav-open' : ''}`}>
      <a href="#admin-main" className="skip-link">Skip to content</a>
      <AdminSidebar />
      <div className="sidebar-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />
      <div className="admin-main">
        <AdminHeader navOpen={navOpen} onToggleNav={() => setNavOpen((o) => !o)} />
        <main className="admin-content" id="admin-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="admin-footer">
          <Icon name="info" size={13} /> Demo/prototype data. This system analyzes historical consumption only and is not
          connected to a real electricity board.
        </footer>
      </div>
    </div>
  );
}
