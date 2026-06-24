const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/bookings ────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.session.userId },
      include: {
        therapist: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { datetime: 'asc' },
    });

    res.json({
      bookings: bookings.map(b => ({
        id: b.id,
        datetime: b.datetime,
        price: b.price,
        status: b.status,
        notes: b.notes,
        therapist: {
          id: b.therapist.id,
          name: b.therapist.user.name,
          photoUrl: b.therapist.photoUrl,
        },
      })),
    });
  } catch (err) {
    console.error('[Bookings] List error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// ─── POST /api/bookings ────────────────────────────────────────────────────────
// Mock checkout — creates booking and marks slot as booked
router.post('/', requireAuth, async (req, res) => {
  try {
    const { therapistId, slotId, datetime, price, notes } = req.body;

    if (!therapistId || !datetime) {
      return res.status(400).json({ error: 'Therapist and datetime are required.' });
    }

    const therapist = await prisma.therapist.findUnique({
      where: { id: parseInt(therapistId) },
      select: { id: true, approved: true, priceMin: true },
    });

    if (!therapist || !therapist.approved) {
      return res.status(404).json({ error: 'Therapist not found.' });
    }

    // Mark slot as booked if a slotId was provided
    let bookingDatetime = new Date(datetime);

    if (slotId) {
      const slot = await prisma.slot.findUnique({ where: { id: parseInt(slotId) } });
      if (!slot || slot.booked) {
        return res.status(409).json({ error: 'This slot is no longer available.' });
      }
      await prisma.slot.update({
        where: { id: parseInt(slotId) },
        data: { booked: true },
      });
      bookingDatetime = slot.datetime;
    }

    // Mock payment: just create the booking directly
    const booking = await prisma.booking.create({
      data: {
        userId: req.session.userId,
        therapistId: parseInt(therapistId),
        slotId: slotId ? parseInt(slotId) : null,
        datetime: bookingDatetime,
        price: price ? parseInt(price) : therapist.priceMin,
        status: 'confirmed',
        notes: notes || '',
      },
      include: {
        therapist: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    // Upgrade user to therapy tier
    await prisma.user.update({
      where: { id: req.session.userId },
      data: { tier: 'therapy' },
    });

    res.status(201).json({
      booking: {
        id: booking.id,
        datetime: booking.datetime,
        price: booking.price,
        status: booking.status,
        therapistName: booking.therapist.user.name,
      },
      message: 'Your session is confirmed!',
    });
  } catch (err) {
    console.error('[Bookings] Create error:', err);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
});

// ─── PATCH /api/bookings/:id/cancel ───────────────────────────────────────────
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: req.session.userId },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled.' });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });

    // Free up the slot if applicable
    if (booking.slotId) {
      await prisma.slot.update({
        where: { id: booking.slotId },
        data: { booked: false },
      });
    }

    res.json({ booking: updated });
  } catch (err) {
    console.error('[Bookings] Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
});

module.exports = router;
