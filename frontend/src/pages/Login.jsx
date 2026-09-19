import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMOS = [
  { label: 'Admin', email: 'admin@healthtech.local', password: 'Admin@123' },
  { label: 'Doctor', email: 'doctor@healthtech.local', password: 'Doctor@123' },
  { label: 'Nurse', email: 'nurse@healthtech.local', password: 'Nurse@123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reason = params.get('reason');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'ADMIN' || user.role === 'DOCTOR') navigate('/dashboard');
      else navigate('/encounters');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demo) {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <span className="brand-mark large" aria-hidden />
          <h1>HealthTech</h1>
          <p>Secure encounter entry for rural telemedicine clinics</p>
        </div>

        {reason === 'expired' && (
          <div className="alert alert-warn" role="alert">
            Your session expired during data entry. Please sign in again — unsaved form fields may need to be re-entered.
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-row">
          <span>Demo accounts:</span>
          {DEMOS.map((d) => (
            <button key={d.label} type="button" className="btn btn-chip" onClick={() => fillDemo(d)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
