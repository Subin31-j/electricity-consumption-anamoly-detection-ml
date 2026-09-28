import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../AuthShell';
import { Icon } from '../../components/ui/Icon';

/**
 * Forgot-password placeholder flow. The backend password-reset endpoint is
 * optional per the PRD; this page collects the email and shows a neutral
 * confirmation without revealing whether the account exists.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Reset password · ECAD';
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle={submitted ? undefined : 'Enter your email and we will send reset instructions.'}
      footer={
        <Link to="/login">
          <Icon name="arrowLeft" size={14} /> Back to sign in
        </Link>
      }
    >
      {submitted ? (
        <div className="alert alert-success" role="status">
          <Icon name="checkCircle" size={16} />
          <span>If an account exists for {email}, password reset instructions will be sent.</span>
        </div>
      ) : (
        <form className="auth-form" onSubmit={onSubmit}>
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
              />
            </div>
          </div>
          <button type="submit" className="btn-primary btn-lg btn-block">
            <Icon name="mail" size={16} /> Send instructions
          </button>
        </form>
      )}
    </AuthShell>
  );
}
