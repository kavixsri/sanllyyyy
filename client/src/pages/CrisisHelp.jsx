import { Link } from 'react-router-dom';

const HELPLINES = [
  {
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    hours: '24/7, free, confidential',
    desc: 'India\'s largest mental health helpline. Available round the clock in multiple languages.',
    emoji: '💚',
  },
  {
    name: 'iCall',
    number: '9152987821',
    hours: 'Mon–Sat, 8am–10pm',
    desc: 'Psychosocial support by trained professionals. Run by TISS (Tata Institute of Social Sciences).',
    emoji: '🌿',
  },
  {
    name: 'AASRA',
    number: '9820466626',
    hours: '24/7',
    desc: 'Crisis intervention and suicide prevention. Available all day, every day.',
    emoji: '🕊️',
  },
  {
    name: 'Sneha Foundation',
    number: '044-24640050',
    hours: '24/7',
    desc: 'Emotional support and suicide prevention, based in Chennai.',
    emoji: '🌸',
  },
];

export default function CrisisHelp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, var(--color-primary-50), var(--color-surface) 60%)',
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        {/* Back link */}
        <Link to="/chat" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2rem' }}>
          ← Back to Sanlly
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💚</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>You're not alone</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
            If you're going through something difficult right now, please reach out.
            Real people are available to listen — right now, for free.
          </p>
        </div>

        {/* Urgent callout */}
        <div style={{
          padding: '1.25rem 1.5rem', borderRadius: 14, marginBottom: '2rem',
          background: 'white', border: '2px solid var(--color-primary-200)',
          boxShadow: '0 4px 16px rgba(5,150,105,0.1)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary-700)', marginBottom: '0.4rem' }}>
            🆘 Call right now — it's free and confidential
          </div>
          <a href="tel:18602662345" style={{
            display: 'block', fontSize: '1.75rem', fontWeight: 800,
            color: 'var(--color-primary-600)', textDecoration: 'none', letterSpacing: '0.02em',
          }}>
            1860-2662-345
          </a>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Vandrevala Foundation · Available 24 hours a day, 7 days a week
          </div>
        </div>

        {/* All helplines */}
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          More helplines
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
          {HELPLINES.map(h => (
            <div key={h.name} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{h.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.15rem' }}>{h.name}</div>
                  <a href={`tel:${h.number.replace(/-/g, '')}`}
                    style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-600)', textDecoration: 'none', display: 'block', marginBottom: '0.25rem' }}>
                    {h.number}
                  </a>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>{h.hours}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{h.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gentle message */}
        <div style={{
          padding: '1.5rem', borderRadius: 14, background: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-100)', textAlign: 'center', marginBottom: '2rem',
        }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-primary-700)', lineHeight: 1.7 }}>
            You've made it this far, and that takes real courage. Whatever you're going through,
            it can get better — and there are people who want to help you get there. 💚
          </p>
        </div>

        {/* Back to Sanlly */}
        <div style={{ textAlign: 'center' }}>
          <Link to="/chat" className="btn-primary" style={{ textDecoration: 'none' }}>
            Talk to Sellena →
          </Link>
        </div>
      </div>
    </div>
  );
}
