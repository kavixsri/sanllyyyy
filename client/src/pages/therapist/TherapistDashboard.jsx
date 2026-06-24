import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const SPECIALTIES = ['Anxiety', 'Depression', 'Relationships', 'Student Stress', 'Grief', 'Self-esteem', 'Trauma', 'Life Transitions', 'Work Stress', 'Young Adults', 'Academic Pressure', 'Mindfulness'];

export default function TherapistDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [profileForm, setProfileForm] = useState({ bio: '', specialties: [], priceMin: 800, priceMax: 1500 });
  const [communityForm, setCommunityForm] = useState({ name: '', description: '', schedule: '', price: 299 });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    api.therapists.getDashboard()
      .then(data => {
        setDashboard(data.therapist);
        setProfileForm({
          bio: data.therapist.bio || '',
          specialties: data.therapist.specialties ? data.therapist.specialties.split(',').map(s => s.trim()).filter(Boolean) : [],
          priceMin: data.therapist.priceMin || 800,
          priceMax: data.therapist.priceMax || 1500,
        });
        if (data.therapist.community) {
          setCommunityForm({
            name: data.therapist.community.name || '',
            description: data.therapist.community.description || '',
            schedule: data.therapist.community.schedule || '',
            price: data.therapist.community.price || 299,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSpecialty = (s) => {
    setProfileForm(f => ({
      ...f,
      specialties: f.specialties.includes(s) ? f.specialties.filter(x => x !== s) : [...f.specialties, s],
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.therapists.updateProfile(profileForm);
      setSavedMsg('Profile saved! ✅');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveCommunity = async () => {
    setSaving(true);
    try {
      const data = await api.therapists.createCommunity(communityForm);
      setDashboard(prev => prev ? { ...prev, community: data.community } : prev);
      setSavedMsg('Community saved! ✅');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'profile', label: '✏️ My Profile' },
    { id: 'community', label: '🌿 Community' },
    { id: 'bookings', label: '📅 Bookings' },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Therapist Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: dashboard?.approved ? 'var(--color-primary-600)' : '#D97706' }}>
            {dashboard?.approved ? '✅ Approved — visible to users' : '⏳ Pending admin approval'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--color-primary-500)' : '2px solid transparent',
              marginBottom: '-2px', transition: 'all 0.15s ease',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {savedMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {savedMsg}
        </div>
      )}

      {/* Overview tab */}
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Community Members', value: dashboard?.community?._count?.members ?? 0, icon: '👥' },
              { label: 'Upcoming Sessions', value: dashboard?.bookings?.length ?? 0, icon: '📅' },
              { label: 'Status', value: dashboard?.approved ? 'Active' : 'Pending', icon: '✅' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--color-primary-600)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Upcoming bookings */}
          {dashboard?.bookings?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Upcoming Sessions</h3>
              {dashboard.bookings.map(b => (
                <div key={b.id} className="card" style={{ padding: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {new Date(b.datetime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                      {' at '}
                      {new Date(b.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button className="btn-ghost" style={{ fontSize: '0.8rem', opacity: 0.6 }}>Join Call</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile tab */}
      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Bio</label>
            <textarea className="input" rows={5} value={profileForm.bio}
              onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Tell potential clients about yourself and your approach..." />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.6rem', color: 'var(--color-text-secondary)' }}>Specialties</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {SPECIALTIES.map(s => (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    border: profileForm.specialties.includes(s) ? '1.5px solid var(--color-primary-500)' : '1.5px solid var(--color-border)',
                    background: profileForm.specialties.includes(s) ? 'var(--color-primary-50)' : 'white',
                    color: profileForm.specialties.includes(s) ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Min price (₹/session)</label>
              <input type="number" className="input" value={profileForm.priceMin}
                onChange={e => setProfileForm(f => ({ ...f, priceMin: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Max price (₹/session)</label>
              <input type="number" className="input" value={profileForm.priceMax}
                onChange={e => setProfileForm(f => ({ ...f, priceMax: parseInt(e.target.value) }))} />
            </div>
          </div>
          <button className="btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
        </div>
      )}

      {/* Community tab */}
      {tab === 'community' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Create or update your therapist-led community. Members pay a monthly fee to access your group sessions and forum.
          </p>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Community name</label>
            <input className="input" value={communityForm.name} placeholder="e.g. Student Minds — Anxiety Support"
              onChange={e => setCommunityForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea className="input" rows={4} value={communityForm.description} placeholder="What will members get out of this community?"
              onChange={e => setCommunityForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>
              Group session schedule
            </label>
            <textarea className="input" rows={3} value={communityForm.schedule}
              placeholder={'e.g.\nWeekly sessions every Saturday at 5:00 PM IST\nMonthly 1-on-1 check-in included'}
              onChange={e => setCommunityForm(f => ({ ...f, schedule: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>Monthly price (₹)</label>
            <input type="number" className="input" value={communityForm.price}
              onChange={e => setCommunityForm(f => ({ ...f, price: parseInt(e.target.value) }))} />
          </div>
          <button className="btn-primary" onClick={saveCommunity} disabled={saving || !communityForm.name}>
            {saving ? 'Saving...' : dashboard?.community ? 'Update Community' : 'Create Community'}
          </button>
        </div>
      )}

      {/* Members tab */}
      {tab === 'bookings' && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Community Members</h3>
          {!dashboard?.community?.members?.length ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              No members yet. Once you have a community, members will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {dashboard.community.members.map(m => (
                <div key={m.id} className="card" style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>
                    {m.name.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
