import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

const OPTIONS = [
  { value: 'anxiety', label: '😰 Stress or anxiety', emoji: '😰' },
  { value: 'relationships', label: '💔 Relationships', emoji: '💔' },
  { value: 'work', label: '💼 Work or career pressure', emoji: '💼' },
  { value: 'loneliness', label: '🌙 Loneliness or isolation', emoji: '🌙' },
  { value: 'grief', label: '🕊️ Grief or loss', emoji: '🕊️' },
  { value: 'self', label: '🌱 Self-esteem or identity', emoji: '🌱' },
  { value: 'general', label: '💬 Just want to talk', emoji: '💬' },
  { value: 'other', label: '✨ Something else', emoji: '✨' },
];

export default function Onboarding() {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleContinue = async () => {
    setLoading(true);
    try {
      if (selected) {
        const label = OPTIONS.find(o => o.value === selected)?.label || selected;
        await api.auth.onboarding({ onboardingNote: label });
        updateUser({ onboardingNote: label });
      }
      navigate('/chat');
    } catch (err) {
      navigate('/chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, var(--color-primary-50), var(--color-surface) 60%, var(--color-sage-50))',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 480, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💚</div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
            Welcome, {user?.name?.split(' ')[0] || 'friend'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
            What brings you here today?<br />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>This is optional — just helps Sellena understand you better.</span>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {OPTIONS.map(opt => (
            <button key={opt.value} id={`onboard-${opt.value}`}
              onClick={() => setSelected(opt.value)}
              style={{
                padding: '1rem', borderRadius: 12, border: '1.5px solid',
                borderColor: selected === opt.value ? 'var(--color-primary-400)' : 'var(--color-border)',
                background: selected === opt.value ? 'var(--color-primary-50)' : 'white',
                color: selected === opt.value ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
                cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', fontWeight: selected === opt.value ? 600 : 400,
                transition: 'all 0.15s ease', fontFamily: 'inherit',
                transform: selected === opt.value ? 'scale(1.01)' : 'scale(1)',
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        <button id="onboard-continue" className="btn-primary" disabled={loading} onClick={handleContinue}
          style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}>
          {loading ? 'Almost there...' : 'Start talking with Sellena →'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={() => navigate('/chat')} className="btn-ghost" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
