const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/therapists ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const therapists = await prisma.therapist.findMany({
      where: { approved: true },
      include: {
        user: { select: { name: true, email: true } },
        community: { select: { id: true, name: true, price: true } },
        _count: { select: { bookings: true } },
      },
    });

    res.json({
      therapists: therapists.map(t => ({
        id: t.id,
        name: t.user.name,
        bio: t.bio,
        specialties: t.specialties ? t.specialties.split(',').map(s => s.trim()) : [],
        photoUrl: t.photoUrl,
        priceMin: t.priceMin,
        priceMax: t.priceMax,
        community: t.community,
        sessionCount: t._count.bookings,
      })),
    });
  } catch (err) {
    console.error('[Therapists] List error:', err);
    res.status(500).json({ error: 'Failed to fetch therapists.' });
  }
});

// ─── GET /api/therapists/dashboard ────────────────────────────────────────────
router.get('/dashboard', requireRole('therapist'), async (req, res) => {
  try {
    const therapist = await prisma.therapist.findUnique({
      where: { userId: req.session.userId },
      include: {
        user: { select: { name: true, email: true } },
        community: {
          include: {
            members: { select: { id: true, name: true, email: true } },
            _count: { select: { members: true } },
          },
        },
        bookings: {
          where: {
            status: 'confirmed',
            datetime: { gte: new Date() },
          },
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { datetime: 'asc' },
          take: 20,
        },
        slots: {
          where: { datetime: { gte: new Date() } },
          orderBy: { datetime: 'asc' },
        },
      },
    });

    if (!therapist) {
      return res.status(404).json({ error: 'Therapist profile not found.' });
    }

    res.json({ therapist });
  } catch (err) {
    console.error('[Therapists] Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
});

// ─── GET /api/therapists/:id ──────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.id);
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
      include: {
        user: { select: { name: true } },
        community: { select: { id: true, name: true, price: true, description: true } },
        slots: {
          where: { booked: false, datetime: { gte: new Date() } },
          orderBy: { datetime: 'asc' },
          take: 20,
        },
      },
    });

    if (!therapist || !therapist.approved) {
      return res.status(404).json({ error: 'Therapist not found.' });
    }

    res.json({
      therapist: {
        id: therapist.id,
        name: therapist.user.name,
        bio: therapist.bio,
        specialties: therapist.specialties ? therapist.specialties.split(',').map(s => s.trim()) : [],
        photoUrl: therapist.photoUrl,
        priceMin: therapist.priceMin,
        priceMax: therapist.priceMax,
        community: therapist.community,
        availableSlots: therapist.slots,
      },
    });
  } catch (err) {
    console.error('[Therapists] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch therapist.' });
  }
});

// ─── PUT /api/therapists/profile ──────────────────────────────────────────────
router.put('/profile', requireRole('therapist'), async (req, res) => {
  try {
    const { bio, specialties, priceMin, priceMax, photoUrl } = req.body;

    const therapist = await prisma.therapist.update({
      where: { userId: req.session.userId },
      data: {
        bio: bio || '',
        specialties: Array.isArray(specialties)
          ? specialties.join(',')
          : (specialties || ''),
        priceMin: priceMin ? parseInt(priceMin) : undefined,
        priceMax: priceMax ? parseInt(priceMax) : undefined,
        photoUrl: photoUrl || null,
      },
    });

    res.json({ therapist });
  } catch (err) {
    console.error('[Therapists] Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ─── POST /api/therapists/community ───────────────────────────────────────────
// Therapist creates/updates their community
router.post('/community', requireRole('therapist'), async (req, res) => {
  try {
    const { name, description, schedule, price } = req.body;

    if (!name) return res.status(400).json({ error: 'Community name is required.' });

    const therapist = await prisma.therapist.findUnique({
      where: { userId: req.session.userId },
      include: { community: true },
    });

    if (!therapist) return res.status(404).json({ error: 'Therapist profile not found.' });

    let community;
    if (therapist.community) {
      community = await prisma.community.update({
        where: { therapistId: therapist.id },
        data: { name, description, schedule, price: price ? parseInt(price) : 299 },
      });
    } else {
      community = await prisma.community.create({
        data: {
          therapistId: therapist.id,
          name,
          description: description || '',
          schedule: schedule || '',
          price: price ? parseInt(price) : 299,
        },
      });
    }

    res.json({ community });
  } catch (err) {
    console.error('[Therapists] Create community error:', err);
    res.status(500).json({ error: 'Failed to create community.' });
  }
});

module.exports = router;
