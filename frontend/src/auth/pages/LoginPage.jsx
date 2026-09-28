import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { AuthShell, PasswordField } from '../AuthShell';
import { Icon } from '../../components/ui/Icon';
import { apiError } from '../../utils/format';

/**
 * Normal login form. The admin uses THIS SAME form - there is deliberately no
 * admin login button, tab, link, or label anywhere on this page.
 */
export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Sign in · ECAD';
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(email, password);
      const dest = data.redirect || (location.state?.from?.pathname ?? '/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      setError(apiError(err, 'Invalid email or password'));
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue analyzing electricity consumption."
      footer={
        <span>
          No account? <Link to="/register">Create one</Link>
        </span>
      }
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate={false}>
        {error && (
          <div className="alert alert-error" role="alert">
            <Icon name="alertCircle" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="field">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <div className="input-with-icon">
            <Icon name="mail" size={16} />
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <div className="auth-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button type="submit" className="btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="arrowRight" size={16} />}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
