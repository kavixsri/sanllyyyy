const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/communities ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const communities = await prisma.community.findMany({
      include: {
        therapist: {
          include: { user: { select: { name: true, email: true } } },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      communities: communities.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        schedule: c.schedule,
        price: c.price,
        memberCount: c._count.members,
        therapist: {
          id: c.therapist.id,
          name: c.therapist.user.name,
          bio: c.therapist.bio,
          specialties: c.therapist.specialties ? c.therapist.specialties.split(',').map(s => s.trim()) : [],
          photoUrl: c.therapist.photoUrl,
        },
      })),
    });
  } catch (err) {
    console.error('[Communities] List error:', err);
    res.status(500).json({ error: 'Failed to fetch communities.' });
  }
});

// ─── GET /api/communities/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        therapist: {
          include: { user: { select: { name: true } } },
        },
        members: { select: { id: true, name: true } },
        posts: {
          include: {
            user: { select: { id: true, name: true } },
            replies: {
              include: { user: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: { select: { members: true } },
      },
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found.' });
    }

    res.json({
      community: {
        id: community.id,
        name: community.name,
        description: community.description,
        schedule: community.schedule,
        price: community.price,
        memberCount: community._count.members,
        therapist: {
          id: community.therapist.id,
          name: community.therapist.user.name,
          bio: community.therapist.bio,
          specialties: community.therapist.specialties ? community.therapist.specialties.split(',').map(s => s.trim()) : [],
          photoUrl: community.therapist.photoUrl,
          priceMin: community.therapist.priceMin,
          priceMax: community.therapist.priceMax,
        },
        posts: community.posts,
      },
    });
  } catch (err) {
    console.error('[Communities] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch community.' });
  }
});

// ─── POST /api/communities/:id/join (Mock Checkout) ───────────────────────────
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      return res.status(404).json({ error: 'Community not found.' });
    }

    // Mock payment — just update user tier and communityId
    const user = await prisma.user.update({
      where: { id: req.session.userId },
      data: {
        tier: 'community',
        communityId,
      },
      select: { id: true, tier: true, communityId: true },
    });

    // Update session with new tier
    req.session.tier = 'community';

    res.json({
      success: true,
      message: `Welcome to ${community.name}! You're now a member.`,
      user,
    });
  } catch (err) {
    console.error('[Communities] Join error:', err);
    res.status(500).json({ error: 'Failed to join community.' });
  }
});

// ─── POST /api/communities/:id/posts ─────────────────────────────────────────
router.post('/:id/posts', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content is required.' });
    }

    // Check membership
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { communityId: true, role: true },
    });

    // Therapist of this community or member can post
    const therapist = await prisma.therapist.findFirst({
      where: { userId: req.session.userId, community: { id: communityId } },
    });

    if (user.communityId !== communityId && !therapist) {
      return res.status(403).json({ error: 'You must be a member of this community to post.' });
    }

    const post = await prisma.communityPost.create({
      data: {
        communityId,
        userId: req.session.userId,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true } },
        replies: [],
      },
    });

    res.status(201).json({ post });
  } catch (err) {
    console.error('[Communities] Create post error:', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// ─── POST /api/communities/:id/posts/:postId/replies ─────────────────────────
router.post('/:id/posts/:postId/replies', requireAuth, async (req, res) => {
  try {
    const communityId = parseInt(req.params.id);
    const postId = parseInt(req.params.postId);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reply content is required.' });
    }

    const post = await prisma.communityPost.findFirst({
      where: { id: postId, communityId },
    });
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const reply = await prisma.communityReply.create({
      data: {
        postId,
        userId: req.session.userId,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ reply });
  } catch (err) {
    console.error('[Communities] Create reply error:', err);
    res.status(500).json({ error: 'Failed to create reply.' });
  }
});

module.exports = router;
