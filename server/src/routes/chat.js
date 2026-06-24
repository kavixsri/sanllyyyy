const express = require('express');
const prisma = require('../lib/prisma');
const { getAIResponse } = require('../lib/ai');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const FREE_TIER_CAP = 50; // messages per month

// Helper: count user messages this calendar month
async function getMonthlyMessageCount(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Count user messages across all conversations this month
  const count = await prisma.message.count({
    where: {
      role: 'user',
      createdAt: { gte: startOfMonth },
      conversation: { userId },
    },
  });
  return count;
}

// ─── GET /api/chat/message-count ─────────────────────────────────────────────
router.get('/message-count', requireAuth, async (req, res) => {
  try {
    const count = await getMonthlyMessageCount(req.session.userId);
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { tier: true },
    });
    const isCapped = user.tier === 'free' && count >= FREE_TIER_CAP;
    res.json({ count, cap: FREE_TIER_CAP, isCapped, tier: user.tier });
  } catch (err) {
    console.error('[Chat] Message count error:', err);
    res.status(500).json({ error: 'Failed to get message count.' });
  }
});

// ─── GET /api/chat/conversations ─────────────────────────────────────────────
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.session.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Last message preview
        },
      },
    });
    res.json({ conversations });
  } catch (err) {
    console.error('[Chat] Get conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// ─── POST /api/chat/conversations ────────────────────────────────────────────
router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await prisma.conversation.create({
      data: {
        userId: req.session.userId,
        title: title || 'New Conversation',
      },
    });
    res.status(201).json({ conversation });
  } catch (err) {
    console.error('[Chat] Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation.' });
  }
});

// ─── GET /api/chat/conversations/:id/messages ─────────────────────────────────
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: req.session.userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    res.json({ messages: conversation.messages });
  } catch (err) {
    console.error('[Chat] Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// ─── POST /api/chat/conversations/:id/messages ────────────────────────────────
// This is the main SSE endpoint — streams Sellena's response back to the client
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // Verify the conversation belongs to this user
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: req.session.userId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // ─── Server-side message cap check ─────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { tier: true },
    });

    if (user.tier === 'free') {
      const count = await getMonthlyMessageCount(req.session.userId);
      if (count >= FREE_TIER_CAP) {
        return res.status(429).json({
          error: 'monthly_cap_reached',
          message: `You've reached your ${FREE_TIER_CAP} messages for this month. Your cap resets on the 1st. Upgrading to a community gives you unlimited conversations with Sellena plus access to therapist-led groups.`,
          count,
          cap: FREE_TIER_CAP,
        });
      }
    }

    // Save the user's message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: content.trim(),
      },
    });

    // Fetch conversation history for context (last 20 messages)
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // ─── Set up SSE streaming ───────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let assistantContent = '';

    const onChunk = (chunk) => {
      assistantContent += chunk;
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
    };

    const onDone = async () => {
      // Save the complete assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: assistantContent,
        },
      });

      // Update conversation title if it's the first exchange
      if (history.length <= 2) {
        const shortTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: shortTitle },
        });
      } else {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      }

      res.write(`data: ${JSON.stringify({ type: 'done', messageId: assistantMessage.id })}\n\n`);
      res.end();
    };

    // Stream the AI response
    await getAIResponse(
      history.map(m => ({ role: m.role, content: m.content })),
      onChunk,
      onDone,
    );

  } catch (err) {
    console.error('[Chat] Send message error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to send message.' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Something went wrong.' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
