import { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function AdminDashboard() {
  const [therapists, setTherapists] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'all'

  useEffect(() => {
    Promise.all([api.admin.getTherapists(), api.admin.getStats()])
      .then(([tData, sData]) => {
        setTherapists(tData.therapists);
        setStats(sData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    await api.admin.approveTherapist(id);
    setTherapists(prev => prev.map(t => t.id === id ? { ...t, approved: true } : t));
  };

  const handleReject = async (id) => {
    await api.admin.rejectTherapist(id);
    setTherapists(prev => prev.map(t => t.id === id ? { ...t, approved: false } : t));
  };

  const filtered = therapists.filter(t =>
    filter === 'all' ? true : filter === 'pending' ? !t.approved : t.approved
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Review and approve therapist accounts before they go live.
      </p>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Users', value: stats.userCount, icon: '👥' },
            { label: 'Therapists', value: stats.therapistCount, icon: '🩺' },
            { label: 'Communities', value: stats.communityCount, icon: '🌿' },
            { label: 'Active Bookings', value: stats.bookingCount, icon: '📅' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--color-primary-600)' }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[['pending', '⏳ Pending'], ['approved', '✅ Approved'], ['all', 'All']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 99, border: '1.5px solid',
              borderColor: filter === val ? 'var(--color-primary-400)' : 'var(--color-border)',
              background: filter === val ? 'var(--color-primary-50)' : 'white',
              color: filter === val ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
              fontWeight: filter === val ? 600 : 400, fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}>
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
          {filtered.length} therapist{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Therapist list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          No therapists in this category.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map(t => (
            <div key={t.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: t.approved ? 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))' : 'var(--color-surface-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: t.approved ? 'white' : 'var(--color-text-muted)', fontWeight: 700, fontSize: '1rem',
                }}>
                  {t.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{t.name}</span>
                    <span style={{
                      fontSize: '0.72rem', padding: '0.15rem 0.6rem', borderRadius: 99,
                      background: t.approved ? 'var(--color-primary-50)' : 'var(--color-accent-light)',
                      color: t.approved ? 'var(--color-primary-700)' : '#92400E',
                      fontWeight: 600,
                    }}>
                      {t.approved ? '✅ Approved' : '⏳ Pending'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>{t.email}</div>
                  {t.bio && <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.bio}</p>}
                  {t.specialties.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {t.specialties.map(s => <span key={s} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{s}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {!t.approved ? (
                    <button id={`approve-${t.id}`} className="btn-primary" onClick={() => handleApprove(t.id)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                      Approve
                    </button>
                  ) : (
                    <button id={`reject-${t.id}`} className="btn-ghost" onClick={() => handleReject(t.id)}
                      style={{ fontSize: '0.8rem', color: 'var(--color-crisis)', padding: '0.4rem 1rem' }}>
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
