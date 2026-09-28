import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from '../ui/Icon';
import { EcadLogo } from '../visual/Visuals';
import { useHideOnScroll } from '../ui/motion';

/** Public marketing shell for Home/About/Documentation. No admin entry point. */
export default function PublicLayout() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // Hide the bar while scrolling down, reveal on scroll up. Never hide with the mobile menu open.
  const hidden = useHideOnScroll({ disabled: open });

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <div className={`public-shell ${hidden ? 'header-hidden' : ''}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className={`public-header ${open ? 'open' : ''} ${hidden ? 'is-hidden' : ''}`}>
        <div className="public-header-inner">
          <Link to="/" className="public-brand" aria-label="ECAD home">
            <span className="brand-logo">
              <EcadLogo size={18} />
            </span>
            <span className="brand-text">
              <span className="brand-mark">ECAD</span>
              <span className="brand-sub">Anomaly Detection</span>
            </span>
          </Link>

          <button
            type="button"
            className="btn-ghost btn-icon public-nav-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="public-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <Icon name={open ? 'close' : 'menu'} size={18} />
          </button>

          <nav className="public-nav" id="public-nav" aria-label="Primary">
            <NavLink to="/" end className="nav-link">Home</NavLink>
            <NavLink to="/about" className="nav-link">About Project</NavLink>
            <NavLink to="/documentation" className="nav-link">Documentation</NavLink>
            {isAuthenticated ? (
              <NavLink to="/dashboard" className="btn-primary nav-cta">
                Open Dashboard <Icon name="arrowRight" size={15} />
              </NavLink>
            ) : (
              <>
                <NavLink to="/login" className="nav-login">Login</NavLink>
                <NavLink to="/register" className="btn-primary nav-cta">
                  Get Started
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="public-content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div>
            <Link to="/" className="public-brand" style={{ marginBottom: 14 }}>
              <span className="brand-logo">
                <EcadLogo size={18} />
              </span>
              <span className="brand-text">
                <span className="brand-mark">ECAD</span>
                <span className="brand-sub">Electricity Consumption Anomaly Detection</span>
              </span>
            </Link>
            <p>
              A machine-learning prototype that analyzes historical electricity consumption and highlights unusual
              patterns using Isolation Forest, K-Means and Local Outlier Factor.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="/#how-it-works">How it works</a></li>
              <li><a href="/#models">ML models</a></li>
              <li><a href="/#demo">Demo consumers</a></li>
              <li><a href="/#future">Future extension</a></li>
            </ul>
          </div>
          <div>
            <h4>Get started</h4>
            <ul>
              <li><Link to="/about">About ECAD</Link></li>
              <li><Link to="/documentation">Documentation</Link></li>
              {isAuthenticated ? (
                <li><Link to="/dashboard">Dashboard</Link></li>
              ) : (
                <>
                  <li><Link to="/login">Sign in</Link></li>
                  <li><Link to="/register">Create account</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="public-footer-bottom">
          <span>&copy; {new Date().getFullYear()} ECAD Prototype. Historical data analysis only.</span>
          <span>Not connected to a real electricity board.</span>
        </div>
      </footer>
    </div>
  );
}
