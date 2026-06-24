require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const prisma = require('./lib/prisma');
const getPglite = () => prisma.getPglite();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const communityRoutes = require('./routes/communities');
const therapistRoutes = require('./routes/therapists');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Session Store (Universal for PGlite & Vercel/Postgres) ─────────────────────
// Uses Prisma raw queries to bypass schema type issues and work across DB engines.
class UniversalSessionStore extends session.Store {
  async get(sid, cb) {
    try {
      // Use BigInt for compatibility with the BIGINT expire column
      const now = BigInt(Date.now());
      const rows = await prisma.$queryRaw`SELECT sess FROM sessions WHERE sid = ${sid} AND (expire IS NULL OR expire > ${now})`;
      cb(null, rows[0] ? JSON.parse(rows[0].sess) : null);
    } catch (e) { cb(e); }
  }

  async set(sid, sess, cb) {
    const expire = BigInt(Date.now() + (sess.cookie?.maxAge ?? 7 * 24 * 60 * 60 * 1000));
    try {
      await prisma.$executeRaw`
        INSERT INTO sessions (sid, sess, expire) VALUES (${sid}, ${JSON.stringify(sess)}, ${expire})
        ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire
      `;
      cb(null);
    } catch (e) { cb(e); }
  }

  async destroy(sid, cb) {
    try {
      await prisma.$executeRaw`DELETE FROM sessions WHERE sid = ${sid}`;
      cb(null);
    } catch (e) { cb(e); }
  }

  touch(sid, sess, cb) { this.set(sid, sess, cb); }
}

// Clean up expired sessions periodically
setInterval(async () => {
  try {
    const now = BigInt(Date.now());
    await prisma.$executeRaw`DELETE FROM sessions WHERE expire IS NOT NULL AND expire < ${now}`;
  } catch (_) {}
}, 15 * 60 * 1000);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Session ──────────────────────────────────────────────────────────────────
app.use(session({
  name: 'sanlly.sid',
  secret: process.env.SESSION_SECRET || 'sanlly-dev-secret',
  resave: false,
  saveUninitialized: false,
  store: new UniversalSessionStore(),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🌿 Sanlly API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   AI Mode: ${process.env.ANTHROPIC_API_KEY ? '✅ Claude AI (live)' : '🤖 Mock AI (add ANTHROPIC_API_KEY to enable)'}\n`);
  });
}

process.on('SIGTERM', async () => {
  try {
    const client = await prisma.getPrisma();
    await client.$disconnect();
  } catch (_) {}
  process.exit(0);
});

module.exports = app;
