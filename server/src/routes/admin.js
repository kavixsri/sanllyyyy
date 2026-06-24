const express = require('express');
const prisma = require('../lib/prisma');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(requireRole('admin'));

// ─── GET /api/admin/therapists ────────────────────────────────────────────────
router.get('/therapists', async (req, res) => {
  try {
    const therapists = await prisma.therapist.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        community: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      therapists: therapists.map(t => ({
        id: t.id,
        name: t.user.name,
        email: t.user.email,
        bio: t.bio,
        specialties: t.specialties ? t.specialties.split(',').map(s => s.trim()) : [],
        approved: t.approved,
        community: t.community,
        bookingCount: t._count.bookings,
        joinedAt: t.user.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Admin] List therapists error:', err);
    res.status(500).json({ error: 'Failed to fetch therapists.' });
  }
});

// ─── PATCH /api/admin/therapists/:id/approve ─────────────────────────────────
router.patch('/therapists/:id/approve', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.id);
    const therapist = await prisma.therapist.update({
      where: { id: therapistId },
      data: { approved: true },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json({
      therapist,
      message: `${therapist.user.name} has been approved and is now visible to users.`,
    });
  } catch (err) {
    console.error('[Admin] Approve error:', err);
    res.status(500).json({ error: 'Failed to approve therapist.' });
  }
});

// ─── PATCH /api/admin/therapists/:id/reject ───────────────────────────────────
router.patch('/therapists/:id/reject', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.id);
    const therapist = await prisma.therapist.update({
      where: { id: therapistId },
      data: { approved: false },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json({
      therapist,
      message: `${therapist.user.name}'s approval has been revoked.`,
    });
  } catch (err) {
    console.error('[Admin] Reject error:', err);
    res.status(500).json({ error: 'Failed to update therapist status.' });
  }
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [userCount, therapistCount, communityCount, bookingCount] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.therapist.count(),
      prisma.community.count(),
      prisma.booking.count({ where: { status: 'confirmed' } }),
    ]);

    res.json({ userCount, therapistCount, communityCount, bookingCount });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
