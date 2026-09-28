import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { AuthShell, PasswordField } from '../AuthShell';
import { Icon } from '../../components/ui/Icon';
import { apiError } from '../../utils/format';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Create account · ECAD';
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      const data = await register(name, email, password);
      navigate(data.redirect || '/dashboard', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Registration failed'));
    }
  };

  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start exploring electricity consumption patterns."
      footer={
        <span>
          Already have an account? <Link to="/login">Sign in</Link>
        </span>
      }
    >
      <form className="auth-form" onSubmit={onSubmit}>
        {error && (
          <div className="alert alert-error" role="alert">
            <Icon name="alertCircle" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="field">
          <label className="field-label" htmlFor="name">
            Full name
          </label>
          <div className="input-with-icon">
            <Icon name="user" size={16} />
            <input id="name" className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <div className="input-with-icon">
            <Icon name="mail" size={16} />
            <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
        </div>

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          hint="At least 6 characters."
        />

        <PasswordField
          id="confirm"
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          hint={mismatch ? 'Passwords do not match yet.' : undefined}
        />

        <button type="submit" className="btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="user" size={16} />}
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
