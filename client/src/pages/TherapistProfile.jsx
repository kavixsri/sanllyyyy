import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function TherapistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.therapists.get(id)
      .then(data => setTherapist(data.therapist))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!therapist) return <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Therapist not found.</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem' }}>
      <Link to="/communities" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem' }}>
        ← Back
      </Link>

      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '2rem',
            boxShadow: '0 4px 16px rgba(5,150,105,0.25)',
          }}>
            {therapist.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{therapist.name}</h1>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              Verified Mental Health Professional
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {therapist.specialties.map(s => (
                <span key={s} className="badge badge-primary">{s}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>1-on-1 sessions</div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-primary-600)' }}>
              ₹{therapist.priceMin}–{therapist.priceMax}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>per session</div>
          </div>
        </div>

        <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          {therapist.bio}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button id="book-session-btn" className="btn-primary" onClick={() => navigate(`/book/${id}`)}>
            Book a 1-on-1 Session
          </button>
          {therapist.community && (
            <Link to={`/communities/${therapist.community.id}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
              View Community — ₹{therapist.community.price}/mo
            </Link>
          )}
        </div>
      </div>

      {/* Available Slots preview */}
      {therapist.availableSlots?.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Available Soon</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
            {therapist.availableSlots.slice(0, 6).map(slot => (
              <div key={slot.id} style={{
                padding: '0.6rem 0.8rem', borderRadius: 8, background: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-200)', fontSize: '0.8rem',
                color: 'var(--color-primary-700)', fontWeight: 500,
              }}>
                {new Date(slot.datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                <br />
                <span style={{ fontWeight: 600 }}>
                  {new Date(slot.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ marginTop: '1rem', fontSize: '0.875rem' }} onClick={() => navigate(`/book/${id}`)}>
            Book a slot →
          </button>
        </div>
      )}
    </div>
  );
}
