import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const tierInfo = {
  free: {
    label: 'Free',
    color: 'var(--color-text-muted)',
    bg: 'var(--color-surface-elevated)',
    desc: 'Up to 50 AI chats per month with Sellena.',
    upgrade: { label: 'Upgrade to Community — from ₹299/mo', to: '/communities' },
  },
  community: {
    label: 'Community Member',
    color: 'var(--color-primary-700)',
    bg: 'var(--color-primary-50)',
    desc: 'Unlimited Sellena chats + access to your therapist-led community group.',
    upgrade: { label: 'Book a 1-on-1 session', to: '/communities' },
  },
  therapy: {
    label: 'Therapy Subscriber',
    color: '#92400E',
    bg: 'var(--color-accent-light)',
    desc: 'You have 1-on-1 session bookings. Full access to all features.',
    upgrade: null,
  },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const tier = tierInfo[user.tier] || tierInfo.free;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>Your Profile</h1>

      {/* Account card */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '1.5rem',
            boxShadow: '0 3px 12px rgba(5,150,105,0.25)',
          }}>
            {user.name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Account type</span>
            <span style={{ fontWeight: 600, padding: '0.2rem 0.75rem', borderRadius: 99, background: tier.bg, color: tier.color, fontSize: '0.8125rem' }}>
              {tier.label}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Role</span>
            <span style={{ fontWeight: 600 }}>{user.role === 'therapist' ? 'Therapist' : user.role === 'admin' ? 'Admin' : 'Member'}</span>
          </div>
          {user.onboardingNote && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Here for</span>
              <span style={{ fontWeight: 500, fontSize: '0.85rem', maxWidth: '60%', textAlign: 'right' }}>{user.onboardingNote}</span>
            </div>
          )}
        </div>
      </div>

      {/* Plan info */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Your Plan</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          {tier.desc}
        </p>
        {tier.upgrade && (
          <Link to={tier.upgrade.to} className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>
            {tier.upgrade.label}
          </Link>
        )}
      </div>

      {/* Quick links */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Access</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/chat" style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)', textDecoration: 'none', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
            💬 Chat with Sellena
          </Link>
          <Link to="/communities" style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)', textDecoration: 'none', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
            🌿 Browse Communities
          </Link>
          <Link to="/bookings" style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)', textDecoration: 'none', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
            📅 My Bookings
          </Link>
          {user.role === 'therapist' && (
            <Link to="/therapist/dashboard" style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)', textDecoration: 'none', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
              🩺 Therapist Dashboard
            </Link>
          )}
          <Link to="/crisis" style={{ fontSize: '0.875rem', color: 'var(--color-crisis)', textDecoration: 'none', padding: '0.5rem 0' }}>
            🆘 Crisis Helplines
          </Link>
        </div>
      </div>

      {/* Privacy */}
      <div style={{ padding: '1rem 1.25rem', borderRadius: 12, background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)', marginBottom: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-primary-700)', lineHeight: 1.6 }}>
        🔒 <strong>Your privacy matters.</strong> Your conversations with Sellena are private and stored securely.
        We never share your data with third parties without your explicit consent.
      </div>

      <button onClick={handleLogout} className="btn-secondary" id="profile-logout"
        style={{ width: '100%', color: 'var(--color-crisis)', borderColor: 'rgba(220,38,38,0.2)' }}>
        Sign out of Sanlly
      </button>
    </div>
  );
}
