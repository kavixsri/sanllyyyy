/**
 * API client — all fetch calls to the Express backend
 * Uses credentials: 'include' for cookie-based sessions
 * Vite proxies /api/* → http://localhost:3001 in dev
 */

const BASE_URL = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    signup: (body) => request('/auth/signup', { method: 'POST', body }),
    signupTherapist: (body) => request('/auth/signup/therapist', { method: 'POST', body }),
    login: (body) => request('/auth/login', { method: 'POST', body }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    onboarding: (body) => request('/auth/onboarding', { method: 'PATCH', body }),
  },

  // ─── Chat ──────────────────────────────────────────────────────────────────
  chat: {
    getMessageCount: () => request('/chat/message-count'),
    getConversations: () => request('/chat/conversations'),
    createConversation: (body) => request('/chat/conversations', { method: 'POST', body }),
    getMessages: (id) => request(`/chat/conversations/${id}/messages`),
    // Note: sendMessage uses EventSource/fetch directly for SSE — handled in ChatWindow
  },

  // ─── Communities ───────────────────────────────────────────────────────────
  communities: {
    list: () => request('/communities'),
    get: (id) => request(`/communities/${id}`),
    join: (id) => request(`/communities/${id}/join`, { method: 'POST' }),
    createPost: (id, body) => request(`/communities/${id}/posts`, { method: 'POST', body }),
    createReply: (communityId, postId, body) =>
      request(`/communities/${communityId}/posts/${postId}/replies`, { method: 'POST', body }),
  },

  // ─── Therapists ────────────────────────────────────────────────────────────
  therapists: {
    list: () => request('/therapists'),
    get: (id) => request(`/therapists/${id}`),
    getDashboard: () => request('/therapists/dashboard'),
    updateProfile: (body) => request('/therapists/profile', { method: 'PUT', body }),
    createCommunity: (body) => request('/therapists/community', { method: 'POST', body }),
  },

  // ─── Bookings ──────────────────────────────────────────────────────────────
  bookings: {
    list: () => request('/bookings'),
    create: (body) => request('/bookings', { method: 'POST', body }),
    cancel: (id) => request(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    getTherapists: () => request('/admin/therapists'),
    getStats: () => request('/admin/stats'),
    approveTherapist: (id) => request(`/admin/therapists/${id}/approve`, { method: 'PATCH' }),
    rejectTherapist: (id) => request(`/admin/therapists/${id}/reject`, { method: 'PATCH' }),
  },
};

/**
 * Send a chat message with SSE streaming
 * @param {number} conversationId
 * @param {string} content
 * @param {Function} onChunk - called with each text chunk
 * @param {Function} onDone - called when stream ends
 * @param {Function} onError - called on error
 */
export async function sendChatMessage(conversationId, content, onChunk, onDone, onError) {
  try {
    const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      onError(data);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'chunk') onChunk(event.text);
            else if (event.type === 'done') onDone();
            else if (event.type === 'error') onError(new Error(event.error));
          } catch (e) {
            // Ignore malformed JSON
          }
        }
      }
    }
  } catch (err) {
    onError(err);
  }
}
