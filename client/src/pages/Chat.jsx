import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, sendChatMessage } from '../api/client';

// ─── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #059669, #10B981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(5,150,105,0.2)',
      }}>💚</div>
      <div className="bubble-assistant" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: 18 }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="typing-dot" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--color-primary-400)',
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '0.5rem',
      marginBottom: '1rem',
      animation: 'fadeIn 0.25s ease',
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #059669, #10B981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(5,150,105,0.2)',
        }}>💚</div>
      )}

      <div style={{
        maxWidth: 'min(72%, 500px)',
        display: 'flex', flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        <div
          className={isUser ? 'bubble-user' : 'bubble-assistant'}
          style={{
            padding: '0.7rem 1rem',
            fontSize: '0.9375rem',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
          {isStreaming && (
            <span style={{
              display: 'inline-block', width: 2, height: '1em',
              background: 'var(--color-primary-500)', marginLeft: 2,
              animation: 'pulse-gentle 0.8s ease infinite', verticalAlign: 'text-bottom',
            }} />
          )}
        </div>
        <span style={{
          fontSize: '0.7rem', color: 'var(--color-text-placeholder)',
          marginTop: '0.25rem', padding: '0 0.25rem',
        }}>
          {new Date(message.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ─── Upgrade Prompt ────────────────────────────────────────────────────────────
function UpgradePrompt() {
  return (
    <div style={{
      margin: '1rem', padding: '1.25rem', borderRadius: 14,
      background: 'linear-gradient(135deg, var(--color-accent-light), #FFF8E7)',
      border: '1px solid rgba(245,158,11,0.25)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌱</div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.4rem', color: '#92400E' }}>
        You've reached 50 messages this month
      </h3>
      <p style={{ fontSize: '0.875rem', color: '#B45309', lineHeight: 1.6, marginBottom: '1rem' }}>
        That's a beautiful thing — you've been showing up for yourself. Your cap resets on the 1st,
        or you can unlock unlimited conversations by joining a therapist-led community.
      </p>
      <Link to="/communities" className="btn-primary"
        style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', boxShadow: '0 3px 10px rgba(245,158,11,0.3)' }}>
        Explore Communities — from ₹299/month
      </Link>
    </div>
  );
}

// ─── Main Chat Page ────────────────────────────────────────────────────────────
export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streamingMsg, setStreamingMsg] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messageCount, setMessageCount] = useState({ count: 0, cap: 50, isCapped: false });
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations + message count
  useEffect(() => {
    const load = async () => {
      try {
        const [convData, countData] = await Promise.all([
          api.chat.getConversations(),
          api.chat.getMessageCount(),
        ]);
        setConversations(convData.conversations);
        setMessageCount(countData);

        // Auto-select or create first conversation
        if (convData.conversations.length > 0) {
          setActiveConvId(convData.conversations[0].id);
        } else {
          const newConv = await api.chat.createConversation({ title: 'New Conversation' });
          setConversations([newConv.conversation]);
          setActiveConvId(newConv.conversation.id);
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
      }
    };
    load();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    api.chat.getMessages(activeConvId)
      .then(data => {
        setMessages(data.messages);
        // If it's a brand new conversation, add a welcome message
        if (data.messages.length === 0) {
          setMessages([{
            id: 'welcome', role: 'assistant',
            content: `Hi${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 💚 I'm Sellena, and I'm really glad you're here.\n\nThis is your space — you can talk about anything on your mind. How are you feeling today?`,
            createdAt: new Date().toISOString(),
          }]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMsgs(false));
  }, [activeConvId, user]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMsg]);

  const handleNewConversation = async () => {
    try {
      const data = await api.chat.createConversation({ title: 'New Conversation' });
      setConversations(prev => [data.conversation, ...prev]);
      setActiveConvId(data.conversation.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending || messageCount.isCapped || !activeConvId) return;

    const userMessage = {
      id: `tmp-${Date.now()}`, role: 'user',
      content: input.trim(), createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);
    setStreamingMsg({ role: 'assistant', content: '', createdAt: new Date().toISOString() });

    // Optimistically update count
    setMessageCount(prev => ({
      ...prev, count: prev.count + 1,
      isCapped: prev.count + 1 >= prev.cap && user?.tier === 'free',
    }));

    let fullText = '';

    await sendChatMessage(
      activeConvId,
      userMessage.content,
      (chunk) => {
        fullText += chunk;
        setStreamingMsg(prev => ({ ...prev, content: fullText }));
      },
      () => {
        // Done streaming — add as real message
        setMessages(prev => [...prev, {
          id: `done-${Date.now()}`, role: 'assistant',
          content: fullText, createdAt: new Date().toISOString(),
        }]);
        setStreamingMsg(null);
        setSending(false);
        inputRef.current?.focus();
      },
      (err) => {
        if (err?.error === 'monthly_cap_reached') {
          setMessageCount(prev => ({ ...prev, isCapped: true }));
          setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        } else {
          setMessages(prev => [...prev, {
            id: `err-${Date.now()}`, role: 'assistant',
            content: "I'm having a bit of trouble connecting right now. Please try again in a moment 💚",
            createdAt: new Date().toISOString(),
          }]);
        }
        setStreamingMsg(null);
        setSending(false);
      },
    );
  }, [input, sending, messageCount, activeConvId, user]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isFree = user?.tier === 'free';
  const remaining = Math.max(0, messageCount.cap - messageCount.count);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Conversation sidebar — hidden on mobile */}
      <div style={{
        width: 240, borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface-elevated)', flexShrink: 0,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
        className="chat-sidebar"
      >
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={handleNewConversation} className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
            + New chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {conversations.map(c => (
            <button key={c.id}
              onClick={() => setActiveConvId(c.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: c.id === activeConvId ? 'var(--color-primary-50)' : 'transparent',
                color: c.id === activeConvId ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
                fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: c.id === activeConvId ? 600 : 400,
                transition: 'background 0.15s ease',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
              💬 {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)',
          background: 'white', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669, #10B981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(5,150,105,0.2)',
            }}>💚</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                Sellena
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)' }}>
                ● Online — here for you
              </div>
            </div>
          </div>
          {/* Message counter */}
          {isFree && (
            <div style={{
              fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: 99,
              background: messageCount.isCapped ? 'var(--color-accent-light)' : 'var(--color-surface)',
              color: messageCount.isCapped ? '#92400E' : 'var(--color-text-muted)',
              border: '1px solid',
              borderColor: messageCount.isCapped ? 'rgba(245,158,11,0.3)' : 'var(--color-border)',
              fontWeight: messageCount.isCapped ? 600 : 400,
            }}>
              {messageCount.isCapped
                ? '⚠️ Monthly limit reached'
                : `${messageCount.count}/${messageCount.cap} messages this month`}
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.5rem 0.5rem' }}>
          {loadingMsgs ? (
            <div style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--color-text-muted)' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Loading your conversation...
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} isStreaming={false} />
              ))}
              {streamingMsg && <MessageBubble message={streamingMsg} isStreaming={true} />}
              {sending && !streamingMsg && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Upgrade prompt when capped */}
        {messageCount.isCapped && <UpgradePrompt />}

        {/* Input bar */}
        <div style={{
          padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)',
          background: 'white', flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
            background: 'var(--color-surface)', borderRadius: 14,
            border: '1.5px solid', borderColor: sending ? 'var(--color-primary-300)' : 'var(--color-border)',
            padding: '0.5rem 0.5rem 0.5rem 1rem',
            transition: 'border-color 0.2s ease',
          }}>
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={messageCount.isCapped || sending}
              placeholder={messageCount.isCapped ? 'Monthly limit reached — upgrade to continue' : 'Share what\'s on your mind...'}
              rows={1}
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontFamily: 'inherit', fontSize: '0.9375rem', resize: 'none',
                lineHeight: 1.6, maxHeight: 120, overflowY: 'auto',
                color: 'var(--color-text-primary)',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              id="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || sending || messageCount.isCapped}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                background: input.trim() && !sending && !messageCount.isCapped
                  ? 'linear-gradient(135deg, #059669, #10B981)'
                  : 'var(--color-border)',
                color: 'white', cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', flexShrink: 0,
                transform: input.trim() && !sending ? 'scale(1)' : 'scale(0.95)',
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            </button>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-placeholder)', textAlign: 'center', marginTop: '0.5rem' }}>
            Press Enter to send · Shift+Enter for new line · Sellena is an AI, not a replacement for therapy
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .chat-sidebar { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
