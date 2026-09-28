import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { DataGridBackground, EcadLogo, ElectricWave } from '../components/visual/Visuals';

/**
 * Split-screen authentication layout: ECAD brand panel + form panel.
 * Contains no admin entry point of any kind.
 */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand" aria-hidden="false">
        <DataGridBackground dark />
        <div className="auth-brand-inner">
          <Link to="/" className="public-brand">
            <span className="brand-logo">
              <EcadLogo size={18} />
            </span>
            <span className="brand-text">
              <span className="brand-mark">ECAD</span>
              <span className="brand-sub">Electricity Consumption Anomaly Detection</span>
            </span>
          </Link>

          <div className="auth-brand-copy">
            <h2>
              Understand your electricity.
              <span>Detect what doesn&apos;t belong.</span>
            </h2>
            <p>Historical consumption analysis with Isolation Forest, K-Means and Local Outlier Factor.</p>
          </div>

          <div className="auth-brand-wave" aria-hidden="true">
            <ElectricWave height={80} color="#60a5fa" opacity={0.6} />
            <span className="auth-brand-marker" />
          </div>

          <ul className="auth-brand-points">
            <li><Icon name="shield" size={15} /> Secure JWT sign-in</li>
            <li><Icon name="database" size={15} /> Historical demo data only</li>
            <li><Icon name="cpu" size={15} /> Three ML models</li>
          </ul>
        </div>
      </aside>

      <main className="auth-panel" id="main-content">
        <div className="auth-card">
          <Link to="/" className="auth-mobile-brand">
            <span className="brand-logo">
              <EcadLogo size={16} />
            </span>
            ECAD
          </Link>
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="auth-links">{footer}</div>}
        </div>
        <p className="auth-legal">Prototype system · historical data only · not connected to a real electricity board.</p>
      </main>
    </div>
  );
}

/** Password input with an accessible show/hide toggle (UI only). */
export function PasswordField({ id, label, value, onChange, autoComplete, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="input-with-icon password-field">
        <Icon name="lock" size={16} />
        <input
          id={id}
          className="input"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          <Icon name="eye" size={16} />
        </button>
      </div>
      {hint && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
}
