import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function MobileNavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.2rem',
        padding: '0.5rem 0.25rem',
        textDecoration: 'none',
        color: isActive ? 'var(--color-primary-600)' : 'var(--color-text-muted)',
        fontSize: '0.65rem',
        fontWeight: isActive ? 600 : 400,
        transition: 'color 0.15s ease',
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default function MobileNav() {
  const { user } = useAuth();

  return (
    <nav className="mobile-nav">
      <MobileNavItem to="/chat" label="Chat" icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      } />
      <MobileNavItem to="/communities" label="Communities" icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      } />
      <MobileNavItem to="/bookings" label="Bookings" icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      } />
      <MobileNavItem to="/profile" label="Profile" icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      } />
    </nav>
  );
}
