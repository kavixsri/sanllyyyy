import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SPECIALTIES = ['Anxiety', 'Depression', 'Relationships', 'Student Stress', 'Grief', 'Self-esteem', 'Trauma', 'Life Transitions', 'Work Stress', 'Young Adults', 'Academic Pressure', 'Mindfulness'];

export default function TherapistSignup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', specialties: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signupTherapist } = useAuth();
  const navigate = useNavigate();

  const toggleSpecialty = (s) => {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(s) ? f.specialties.filter(x => x !== s) : [...f.specialties, s],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await signupTherapist(form);
      navigate('/therapist/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(145deg, var(--color-primary-50), var(--color-surface))',
      padding: '2rem 1rem', display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 0.75rem',
            background: 'linear-gradient(135deg, #059669, #10B981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>S</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Join as a Therapist</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Your profile will go live after admin review — usually within 24 hours.
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--color-crisis-light)', color: 'var(--color-crisis)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Full name</label>
                <input id="t-name" type="text" className="input" placeholder="Dr. Priya Sharma" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Email</label>
                <input id="t-email" type="email" className="input" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Password</label>
              <input id="t-password" type="password" className="input" placeholder="At least 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>
                Short bio <span style={{ color: 'var(--color-text-placeholder)', fontWeight: 400 }}>(optional — you can update later)</span>
              </label>
              <textarea id="t-bio" className="input" rows={4} placeholder="Tell potential clients a little about your background and approach..."
                value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.6rem', color: 'var(--color-text-secondary)' }}>
                Specialties <span style={{ color: 'var(--color-text-placeholder)', fontWeight: 400 }}>(select all that apply)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {SPECIALTIES.map(s => (
                  <button key={s} type="button"
                    onClick={() => toggleSpecialty(s)}
                    style={{
                      padding: '0.3rem 0.75rem', borderRadius: 99, fontSize: '0.8125rem',
                      fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
                      border: form.specialties.includes(s) ? '1.5px solid var(--color-primary-500)' : '1.5px solid var(--color-border)',
                      background: form.specialties.includes(s) ? 'var(--color-primary-50)' : 'white',
                      color: form.specialties.includes(s) ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button id="t-signup-submit" type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
              {loading ? 'Creating account...' : 'Submit for Review'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
