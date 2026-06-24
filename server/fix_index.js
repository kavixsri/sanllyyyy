const fs = require('fs');

const code = `require('dotenv').config();
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

// ─── Session Store ────────────────────────────────────────────────────────────
class UniversalSessionStore extends session.Store {
  async get(sid, cb) {
    try {
      const now = BigInt(Date.now());
      const rows = await prisma.$queryRaw\`SELECT sess FROM sessions WHERE sid = \${sid} AND (expire IS NULL OR expire > \${now})\`;
      cb(null, rows[0] ? JSON.parse(rows[0].sess) : null);
    } catch (e) { cb(e); }
  }

  async set(sid, sess, cb) {
    const expire = BigInt(Date.now() + (sess.cookie?.maxAge ?? 7 * 24 * 60 * 60 * 1000));
    try {
      await prisma.$executeRaw\`
        INSERT INTO sessions (sid, sess, expire) VALUES (\${sid}, \${JSON.stringify(sess)}, \${expire})
        ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire
      \`;
      cb(null);
    } catch (e) { cb(e); }
  }

  async destroy(sid, cb) {
    try {
      await prisma.$executeRaw\`DELETE FROM sessions WHERE sid = \${sid}\`;
      cb(null);
    } catch (e) { cb(e); }
  }

  touch(sid, sess, cb) { this.set(sid, sess, cb); }
}

// ─── Security & Middlewares ───────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auto-Heal Middleware: Ensures the database tables exist BEFORE session runs!
let dbHealed = false;
app.use(async (req, res, next) => {
  if (dbHealed) return next();
  try {
    await prisma.$queryRaw\`SELECT 1 FROM sessions LIMIT 1\`;
    dbHealed = true;
    next();
  } catch (err) {
    console.log('[AUTO-HEAL] Database tables missing. Self-healing dynamically...');
    try {
      const statements = [
        \`CREATE TABLE IF NOT EXISTS "sessions" ("sid" TEXT PRIMARY KEY, "sess" TEXT NOT NULL, "expire" BIGINT);\`,
        \`CREATE TABLE IF NOT EXISTS "User" ("id" SERIAL PRIMARY KEY, "email" TEXT UNIQUE NOT NULL, "password" TEXT NOT NULL, "name" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'user', "tier" TEXT NOT NULL DEFAULT 'free', "onboardingNote" TEXT, "communityId" INTEGER, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());\`,
        \`CREATE TABLE IF NOT EXISTS "Therapist" ("id" SERIAL PRIMARY KEY, "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "bio" TEXT NOT NULL DEFAULT '', "specialties" TEXT NOT NULL DEFAULT '', "photoUrl" TEXT, "priceMin" INTEGER NOT NULL DEFAULT 800, "priceMax" INTEGER NOT NULL DEFAULT 1500, "approved" BOOLEAN NOT NULL DEFAULT FALSE, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());\`,
        \`CREATE TABLE IF NOT EXISTS "Community" ("id" SERIAL PRIMARY KEY, "therapistId" INTEGER UNIQUE NOT NULL REFERENCES "Therapist"("id") ON DELETE CASCADE, "name" TEXT NOT NULL, "description" TEXT NOT NULL DEFAULT '', "schedule" TEXT NOT NULL DEFAULT '', "price" INTEGER NOT NULL DEFAULT 299, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());\`,
        \`CREATE TABLE IF NOT EXISTS "Conversation" ("id" SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "title" TEXT NOT NULL DEFAULT 'New Conversation', "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());\`,
        \`CREATE TABLE IF NOT EXISTS "Message" ("id" SERIAL PRIMARY KEY, "conversationId" INTEGER NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE, "role" TEXT NOT NULL, "content" TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());\`,
        \`CREATE TABLE IF NOT EXISTS "CommunityPost" ("id" SERIAL PRIMARY KEY, "communityId" INTEGER NOT NULL REFERENCES "Community"("id") ON DELETE CASCADE, "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "content" TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());\`,
        \`CREATE TABLE IF NOT EXISTS "CommunityReply" ("id" SERIAL PRIMARY KEY, "postId" INTEGER NOT NULL REFERENCES "CommunityPost"("id") ON DELETE CASCADE, "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "content" TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());\`,
        \`CREATE TABLE IF NOT EXISTS "Slot" ("id" SERIAL PRIMARY KEY, "therapistId" INTEGER NOT NULL REFERENCES "Therapist"("id") ON DELETE CASCADE, "datetime" TIMESTAMP NOT NULL, "booked" BOOLEAN NOT NULL DEFAULT FALSE);\`,
        \`CREATE TABLE IF NOT EXISTS "Booking" ("id" SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "therapistId" INTEGER NOT NULL REFERENCES "Therapist"("id") ON DELETE CASCADE, "slotId" INTEGER, "datetime" TIMESTAMP NOT NULL, "price" INTEGER NOT NULL DEFAULT 800, "status" TEXT NOT NULL DEFAULT 'confirmed', "notes" TEXT, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());\`
      ];
      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt);
      }
      try {
        await prisma.$executeRawUnsafe(\`ALTER TABLE "User" ADD CONSTRAINT "User_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL;\`);
      } catch(e) {}
      
      const bcrypt = require('bcryptjs');
      const demoPassword = await bcrypt.hash('demo123456', 12);
      await prisma.$executeRawUnsafe(\`INSERT INTO "User" (email, password, name, role, tier) VALUES ('demo@sanlly.in', '\${demoPassword}', 'Demo User', 'user', 'free') ON CONFLICT (email) DO NOTHING\`);
      console.log('[AUTO-HEAL] Database initialized successfully!');
      dbHealed = true;
      next();
    } catch (e) {
      console.error('[AUTO-HEAL] Failed to self-heal:', e.message);
      next(e);
    }
  }
});

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

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
    console.log(\`\\n🚀 Sanlly API running on http://localhost:\${PORT}\`);
    console.log(\`   Environment: \${process.env.NODE_ENV || 'development'}\`);
    console.log(\`   AI Mode: \${process.env.ANTHROPIC_API_KEY ? '✅ Claude AI (live)' : '⚠️ Mock AI (add ANTHROPIC_API_KEY to enable)'}\\n\`);
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
`;

fs.writeFileSync('src/index.js', code);
console.log('Fixed index.js!');
