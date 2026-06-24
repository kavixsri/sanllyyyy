import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ICON_SIZE = 20;

function Icon({ name }) {
  const icons = {
    chat: (
      <svg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    communities: (
      <svg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    bookings: (
      <svg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    profile: (
      <svg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    dashboard: (
      <svg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    logout: (
      <svg width={NAV_ICON_SIZE} height={NAV_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
  };
  return icons[name] || null;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tierColors = { free: '#7A9E96', community: '#059669', therapy: '#D97706' };
  const tierLabels = { free: 'Free', community: 'Community', therapy: 'Therapy' };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
        <NavLink to="/chat" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #059669, #10B981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
          }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>S</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--color-primary-700)' }}>
            Sanlly
          </span>
        </NavLink>
      </div>

      {/* User badge */}
      {user && (
        <div style={{
          margin: '0 1rem 1rem',
          padding: '0.75rem 1rem',
          background: 'var(--color-surface)',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>
            {user.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: tierColors[user.tier] || '#7A9E96',
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {tierLabels[user.tier] || 'Free'} Plan
            </span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ padding: '0 0.75rem', flex: 1 }}>
        <NavLink to="/chat" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <Icon name="chat" /><span>Chat with Sellena</span>
        </NavLink>
        <NavLink to="/communities" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <Icon name="communities" /><span>Communities</span>
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <Icon name="bookings" /><span>My Bookings</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <Icon name="profile" /><span>Profile</span>
        </NavLink>

        {/* Role-specific nav */}
        {user?.role === 'therapist' && (
          <NavLink to="/therapist/dashboard" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Icon name="dashboard" /><span>My Dashboard</span>
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <Icon name="dashboard" /><span>Admin</span>
          </NavLink>
        )}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
        {/* Privacy note */}
        <div style={{
          padding: '0.6rem 0.85rem',
          background: 'var(--color-primary-50)',
          borderRadius: 8,
          marginBottom: '0.75rem',
          fontSize: '0.72rem',
          color: 'var(--color-primary-700)',
          lineHeight: 1.5,
        }}>
          🔒 Your conversations are private and not shared without your consent.
        </div>

        <button onClick={handleLogout} className="sidebar-nav-item" style={{ color: 'var(--color-text-muted)' }}>
          <Icon name="logout" /><span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
