const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: 'user',
      },
      select: { id: true, email: true, name: true, role: true, tier: true, onboardingNote: true },
    });

    // Regenerate session after login for security
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Session error.' });
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.save((err) => {
        if (err) return res.status(500).json({ error: 'Session save error.' });
        res.status(201).json({ user });
      });
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// ─── POST /api/auth/signup/therapist ──────────────────────────────────────────
router.post('/signup/therapist', async (req, res) => {
  try {
    const { email, password, name, bio, specialties } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + therapist profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name.trim(),
          role: 'therapist',
        },
      });

      const therapist = await tx.therapist.create({
        data: {
          userId: user.id,
          bio: bio || '',
          specialties: Array.isArray(specialties) ? specialties.join(',') : (specialties || ''),
          approved: false, // Requires admin approval
        },
      });

      return { user, therapist };
    });

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Session error.' });
      req.session.userId = result.user.id;
      req.session.role = result.user.role;
      req.session.save((err) => {
        if (err) return res.status(500).json({ error: 'Session save error.' });
        res.status(201).json({
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            tier: result.user.tier,
          },
          therapist: result.therapist,
          message: 'Your therapist account has been created. You will appear publicly after admin approval.',
        });
      });
    });
  } catch (err) {
    console.error('[Auth] Therapist signup error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { therapist: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Session error.' });
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.save((err) => {
        if (err) return res.status(500).json({ error: 'Session save error.' });
        res.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tier: user.tier,
            communityId: user.communityId,
            onboardingNote: user.onboardingNote,
            therapistId: user.therapist?.id || null,
            therapistApproved: user.therapist?.approved || false,
          },
        });
      });
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.clearCookie('sanlly.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: { therapist: true },
    });

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Session invalid.' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
        communityId: user.communityId,
        onboardingNote: user.onboardingNote,
        therapistId: user.therapist?.id || null,
        therapistApproved: user.therapist?.approved || false,
      },
    });
  } catch (err) {
    console.error('[Auth] /me error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ─── PATCH /api/auth/onboarding ───────────────────────────────────────────────
router.patch('/onboarding', requireAuth, async (req, res) => {
  try {
    const { onboardingNote } = req.body;
    const user = await prisma.user.update({
      where: { id: req.session.userId },
      data: { onboardingNote: onboardingNote || '' },
      select: { id: true, onboardingNote: true },
    });
    res.json({ user });
  } catch (err) {
    console.error('[Auth] Onboarding error:', err);
    res.status(500).json({ error: 'Failed to save.' });
  }
});

module.exports = router;
