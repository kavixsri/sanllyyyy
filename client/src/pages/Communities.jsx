import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function SpecialtyBadge({ label }) {
  return (
    <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{label}</span>
  );
}

function CommunityCard({ community }) {
  return (
    <Link to={`/communities/${community.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '1.5rem', height: '100%', cursor: 'pointer' }}>
        {/* Therapist avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '1.1rem',
          }}>
            {community.therapist.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
              {community.therapist.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {community.memberCount} member{community.memberCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.4, color: 'var(--color-text-primary)' }}>
          {community.name}
        </h3>

        <p style={{ fontSize: '0.8375rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {community.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
          {community.therapist.specialties.slice(0, 3).map(s => (
            <SpecialtyBadge key={s} label={s} />
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '0.875rem', borderTop: '1px solid var(--color-border)',
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary-600)' }}>
              ₹{community.price}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>/month</span>
          </div>
          <div style={{
            fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary-600)',
            background: 'var(--color-primary-50)', padding: '0.3rem 0.75rem',
            borderRadius: 99,
          }}>
            View →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Communities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.communities.list()
      .then(data => setCommunities(data.communities))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem 2rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          Therapist-Led Communities
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
          Join a group led by a verified mental health professional. Share, learn, and heal together — from just ₹299/month.
        </p>
      </div>

      {/* Tier 2 explanation banner */}
      <div style={{
        padding: '1rem 1.25rem', borderRadius: 12, marginBottom: '2rem',
        background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-sage-50))',
        border: '1px solid var(--color-primary-200)',
        display: 'flex', gap: '1rem', alignItems: 'center',
      }}>
        <span style={{ fontSize: '1.5rem' }}>🌿</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary-700)', marginBottom: '0.2rem' }}>
            What's included in a community membership?
          </div>
          <div style={{ fontSize: '0.8375rem', color: 'var(--color-primary-600)' }}>
            Weekly group sessions · Private community forum · Direct access to your therapist · Unlimited Sellena messages
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 280, borderRadius: 16, background: 'var(--color-surface-elevated)', animation: 'pulse-gentle 1.5s ease infinite' }} />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌱</div>
          <p>Communities are being set up. Check back soon!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {communities.map(c => <CommunityCard key={c.id} community={c} />)}
        </div>
      )}
    </div>
  );
}
