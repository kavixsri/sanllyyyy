import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 0.75rem',
            background: 'linear-gradient(135deg, #059669, #10B981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>S</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Create your account</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            It's free, private, and always judgment-free 💚
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
                Your name
              </label>
              <input id="signup-name" type="text" className="input" placeholder="What should we call you?" value={name}
                onChange={e => setName(e.target.value)} required autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>
                Email address
              </label>
              <input id="signup-email" type="email" className="input" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <input id="signup-password" type="password" className="input" placeholder="At least 8 characters" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>

            <div style={{
              padding: '0.6rem 0.85rem', background: 'var(--color-primary-50)',
              borderRadius: 8, fontSize: '0.75rem', color: 'var(--color-primary-700)',
            }}>
              🔒 Your conversations are private and never shared without your consent.
            </div>

            <button id="signup-submit" type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', marginTop: '0.25rem' }}>
              {loading ? 'Creating account...' : 'Get started — it\'s free'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--color-text-placeholder)' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            <Link
              to="/login"
              style={{ display: 'flex', width: '100%', justifyContent: 'center', padding: '0.8rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, textDecoration: 'none', color: 'var(--color-text)' }}
              onClick={(e) => {
                // Rely on the login page's guest button functionality if they navigate
              }}
            >
              Continue as Guest
            </Link>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 500, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
