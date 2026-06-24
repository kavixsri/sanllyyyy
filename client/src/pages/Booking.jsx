import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Booking() {
  const { therapistId } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [booking, setBooking] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    api.therapists.get(therapistId)
      .then(data => setTherapist(data.therapist))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [therapistId]);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setConfirming(true);
    try {
      const data = await api.bookings.create({
        therapistId: parseInt(therapistId),
        slotId: selectedSlot.id,
        datetime: selectedSlot.datetime,
        price: therapist.priceMin,
      });
      setBooking(data.booking);
      updateUser({ tier: 'therapy' });
    } catch (err) {
      alert(err.message || 'Failed to book session.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Confirmation screen
  if (booking) {
    return (
      <div style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Session Confirmed!</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Your session with <strong>{booking.therapistName}</strong> is booked.
        </p>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Date & Time</span>
              <span style={{ fontWeight: 600 }}>
                {new Date(booking.datetime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' at '}
                {new Date(booking.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Therapist</span>
              <span style={{ fontWeight: 600 }}>{booking.therapistName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Amount paid</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>₹{booking.price}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
              <span className="badge badge-primary">✅ Confirmed</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '0.75rem 1rem', background: 'var(--color-primary-50)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--color-primary-700)', marginBottom: '1.5rem' }}>
          📱 The therapist will contact you via the platform to share the session link before your appointment.
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => navigate('/bookings')}>View My Bookings</button>
          <button className="btn-secondary" onClick={() => navigate('/chat')}>Chat with Sellena</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        ← Back
      </button>

      {/* Therapist summary */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '1.25rem',
          }}>
            {therapist?.name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{therapist?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              ₹{therapist?.priceMin}–{therapist?.priceMax} / session
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Select slot */}
      {!showCheckout ? (
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
            Choose an available time
          </h2>

          {therapist?.availableSlots?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              No available slots right now. Please check back later.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {therapist?.availableSlots?.map(slot => (
                <button
                  key={slot.id}
                  id={`slot-${slot.id}`}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: '0.875rem', borderRadius: 12, border: '1.5px solid',
                    borderColor: selectedSlot?.id === slot.id ? 'var(--color-primary-500)' : 'var(--color-border)',
                    background: selectedSlot?.id === slot.id ? 'var(--color-primary-50)' : 'white',
                    cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    transform: selectedSlot?.id === slot.id ? 'scale(1.02)' : 'scale(1)',
                  }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                    {new Date(slot.datetime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: selectedSlot?.id === slot.id ? 'var(--color-primary-600)' : 'var(--color-text-primary)' }}>
                    {new Date(slot.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            id="proceed-checkout"
            className="btn-primary"
            disabled={!selectedSlot}
            onClick={() => setShowCheckout(true)}
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
            Continue to Payment →
          </button>
        </div>
      ) : (
        /* Step 2: Mock Checkout */
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Confirm & Pay</h2>

          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Session with</span>
                <span style={{ fontWeight: 600 }}>{therapist?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Date & Time</span>
                <span style={{ fontWeight: 600 }}>
                  {new Date(selectedSlot.datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                  {' '}
                  {new Date(selectedSlot.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-primary-600)' }}>₹{therapist?.priceMin}</span>
              </div>
            </div>

            {/* Fake card inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input className="input" placeholder="Card number: 4242 4242 4242 4242" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input className="input" placeholder="MM/YY" />
                <input className="input" placeholder="CVV" />
              </div>
              <input className="input" placeholder="Name on card" />
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--color-surface)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            🔒 Demo mode — no real payment is processed
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setShowCheckout(false)}>← Back</button>
            <button id="confirm-booking-btn" className="btn-primary" onClick={handleConfirm} disabled={confirming}
              style={{ flex: 1, justifyContent: 'center', padding: '0.875rem' }}>
              {confirming ? 'Confirming...' : `Confirm Booking — ₹${therapist?.priceMin}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
