import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.onboardingNote ? '/chat' : '/onboarding');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, var(--color-primary-50) 0%, var(--color-surface) 50%, var(--color-sage-50) 100%)',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 0.75rem',
            background: 'linear-gradient(135deg, #059669, #10B981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>S</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            You're in a safe space. Let's continue.
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 8,
                background: 'var(--color-crisis-light)', color: 'var(--color-crisis)',
                fontSize: '0.875rem', border: '1px solid rgba(220,38,38,0.2)',
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button id="login-submit" type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.8rem' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--color-primary-600)', fontWeight: 500, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-placeholder)' }}>
            Are you a therapist?{' '}
            <Link to="/signup/therapist" style={{ color: 'var(--color-primary-600)', textDecoration: 'none' }}>
              Join as a provider
            </Link>
          </div>
        </div>

        {/* Crisis link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/crisis" style={{ color: 'var(--color-crisis)', fontSize: '0.8rem', textDecoration: 'none' }}>
            🆘 Need immediate help? See crisis resources
          </Link>
        </div>
      </div>
    </div>
  );
}
