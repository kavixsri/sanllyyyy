import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function PostCard({ post, onReply, currentUserId }) {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(post.id, replyText);
      setReplyText('');
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: '0.85rem',
        }}>
          {post.user.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{post.user.name}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>
        </div>
      </div>

      {/* Replies */}
      {post.replies?.length > 0 && (
        <div style={{ marginLeft: '2.75rem', borderLeft: '2px solid var(--color-primary-100)', paddingLeft: '0.85rem', marginBottom: '0.75rem' }}>
          {post.replies.map(r => (
            <div key={r.id} style={{ marginBottom: '0.6rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{r.user.name} </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>
                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReply ? (
        <div style={{ marginLeft: '2.75rem', display: 'flex', gap: '0.5rem' }}>
          <input className="input" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReply()} autoFocus />
          <button className="btn-primary" onClick={handleReply} disabled={submitting || !replyText.trim()}
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            {submitting ? '...' : 'Reply'}
          </button>
          <button className="btn-ghost" onClick={() => setShowReply(false)} style={{ fontSize: '0.8rem' }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowReply(true)} className="btn-ghost"
          style={{ marginLeft: '2.5rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', padding: '0.25rem 0.5rem' }}>
          💬 Reply
        </button>
      )}
    </div>
  );
}

function MockCheckoutModal({ community, onConfirm, onCancel, loading }) {
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem',
    }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2rem', animation: 'fadeIn 0.2s ease' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Complete your membership</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Join <strong>{community.name}</strong> for just ₹{community.price}/month
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
              Card number
            </label>
            <input className="input" placeholder="4242 4242 4242 4242" value={cardNum}
              onChange={e => setCardNum(e.target.value)} maxLength={19} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>Expiry</label>
              <input className="input" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} maxLength={5} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>CVV</label>
              <input className="input" placeholder="123" value={cvv} onChange={e => setCvv(e.target.value)} maxLength={3} />
            </div>
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'var(--color-surface)', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          🔒 This is a demo — no real payment is processed
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
          <button id="checkout-confirm" className="btn-primary" onClick={onConfirm} disabled={loading}
            style={{ flex: 2, justifyContent: 'center' }}>
            {loading ? 'Processing...' : `Confirm — ₹${community.price}/mo`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityDetail() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [joiningLoading, setJoiningLoading] = useState(false);

  useEffect(() => {
    api.communities.get(id)
      .then(data => setCommunity(data.community))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const isMember = user?.communityId === parseInt(id) || user?.role === 'therapist';

  const handleJoin = async () => {
    setJoiningLoading(true);
    try {
      const data = await api.communities.join(id);
      updateUser({ tier: 'community', communityId: parseInt(id) });
      setShowCheckout(false);
      setCommunity(prev => prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev);
    } catch (err) {
      alert(err.message);
    } finally {
      setJoiningLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const data = await api.communities.createPost(id, { content: newPost });
      setCommunity(prev => prev ? { ...prev, posts: [{ ...data.post, replies: [] }, ...prev.posts] } : prev);
      setNewPost('');
    } catch (err) {
      alert(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (postId, content) => {
    const data = await api.communities.createReply(id, postId, { content });
    setCommunity(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map(p => p.id === postId ? { ...p, replies: [...(p.replies || []), data.reply] } : p),
      };
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!community) return <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Community not found.</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      {showCheckout && (
        <MockCheckoutModal
          community={community}
          onConfirm={handleJoin}
          onCancel={() => setShowCheckout(false)}
          loading={joiningLoading}
        />
      )}

      {/* Back */}
      <Link to="/communities" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem' }}>
        ← Back to Communities
      </Link>

      {/* Hero */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '1.5rem',
          }}>
            {community.therapist.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{community.name}</h1>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Led by <strong>{community.therapist.name}</strong> · {community.memberCount} members
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {community.therapist.specialties.map(s => (
                <span key={s} className="badge badge-primary">{s}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-primary-600)' }}>₹{community.price}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>/month</div>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
          {community.therapist.bio}
        </p>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          {community.description}
        </p>

        {/* Schedule */}
        {community.schedule && (
          <div style={{ padding: '1rem', background: 'var(--color-primary-50)', borderRadius: 10, marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>📅 Schedule</div>
            <pre style={{ fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--color-primary-700)', whiteSpace: 'pre-wrap', margin: 0 }}>
              {community.schedule}
            </pre>
          </div>
        )}

        {/* Join / Book CTA */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isMember ? (
            <div className="badge badge-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              ✅ You're a member
            </div>
          ) : (
            <button id="join-community-btn" className="btn-primary" onClick={() => setShowCheckout(true)}>
              Join Community — ₹{community.price}/month
            </button>
          )}
          <Link to={`/therapists/${community.therapist.id}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
            Book 1-on-1 Session
          </Link>
        </div>
      </div>

      {/* Community Feed */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Community Feed</h2>

        {/* Post composer — only for members */}
        {isMember && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <textarea className="input" rows={3} placeholder="Share something with the community..."
              value={newPost} onChange={e => setNewPost(e.target.value)}
              style={{ marginBottom: '0.75rem', resize: 'vertical', fontFamily: 'inherit' }} />
            <button id="post-submit" className="btn-primary" onClick={handlePost} disabled={posting || !newPost.trim()}>
              {posting ? 'Posting...' : 'Post to community'}
            </button>
          </div>
        )}

        {!isMember && (
          <div style={{
            padding: '1rem 1.25rem', borderRadius: 10, marginBottom: '1.25rem',
            background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)',
            fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center',
          }}>
            Join this community to participate in the forum and attend group sessions.
          </div>
        )}

        {community.posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌱</div>
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          community.posts.map(post => (
            <PostCard key={post.id} post={post} onReply={handleReply} currentUserId={user?.id} />
          ))
        )}
      </div>
    </div>
  );
}
