import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function BookingCard({ booking, onCancel }) {
  const isPast = new Date(booking.datetime) < new Date();
  const isCancelled = booking.status === 'cancelled';
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this session?')) return;
    setCancelling(true);
    try {
      await onCancel(booking.id);
    } finally {
      setCancelling(false);
    }
  };

  const statusColors = {
    confirmed: { bg: 'var(--color-primary-50)', color: 'var(--color-primary-700)', label: '✅ Confirmed' },
    cancelled: { bg: 'var(--color-crisis-light)', color: 'var(--color-crisis)', label: '❌ Cancelled' },
    completed: { bg: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', label: '✔️ Completed' },
  };
  const status = statusColors[booking.status] || statusColors.confirmed;

  return (
    <div className="card" style={{ padding: '1.5rem', opacity: isCancelled ? 0.7 : 1 }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: isCancelled ? 'var(--color-surface-elevated)' : 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: '1.1rem',
        }}>
          {booking.therapist.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{booking.therapist.name}</span>
            <span style={{ ...status, padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            {new Date(booking.datetime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' at '}
            {new Date(booking.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Session fee: <strong style={{ color: 'var(--color-primary-600)' }}>₹{booking.price}</strong>
          </div>
        </div>
        {!isCancelled && !isPast && (
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button className="btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '0.3rem 0.8rem', opacity: 0.7 }}>
              Join Call
            </button>
            <button onClick={handleCancel} disabled={cancelling} className="btn-ghost"
              style={{ fontSize: '0.8rem', color: 'var(--color-crisis)', padding: '0.3rem 0.8rem' }}>
              {cancelling ? '...' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.bookings.list()
      .then(data => setBookings(data.bookings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (bookingId) => {
    await api.bookings.cancel(bookingId);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
  };

  const upcoming = bookings.filter(b => new Date(b.datetime) >= new Date() && b.status !== 'cancelled');
  const past = bookings.filter(b => new Date(b.datetime) < new Date() || b.status === 'cancelled');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>My Sessions</h1>
        <Link to="/communities" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>
          Book a new session
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>No sessions yet</h3>
          <p style={{ marginBottom: '1.5rem' }}>Browse our therapists to book your first 1-on-1 session.</p>
          <Link to="/communities" className="btn-primary" style={{ textDecoration: 'none' }}>
            Find a therapist
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                Upcoming
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {upcoming.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Past / Cancelled
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {past.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
