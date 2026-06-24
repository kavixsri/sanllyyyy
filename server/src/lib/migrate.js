/**
 * Database initialization for Sanlly.
 * Creates all tables using PGlite's exec() since Prisma 7 migrations
 * require a URL which isn't applicable to embedded PGlite.
 *
 * Run: node src/lib/migrate.js
 */
const path = require('path');
const { PrismaPGlite } = require('pglite-prisma-adapter');
const { PrismaClient } = require('@prisma/client');

const dataDir = path.join(__dirname, '..', '..', 'prisma', 'pgdata');

async function migrate() {
  const { PGlite } = await import('@electric-sql/pglite');
  const pglite = new PGlite(dataDir);
  await pglite.waitReady;

  console.log('📦 Creating database tables...');

  // Create all tables (idempotent)
  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "sid" TEXT PRIMARY KEY,
      "sess" TEXT NOT NULL,
      "expire" BIGINT
    );

    CREATE TABLE IF NOT EXISTS "User" (
      "id" SERIAL PRIMARY KEY,
      "email" TEXT UNIQUE NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'user',
      "tier" TEXT NOT NULL DEFAULT 'free',
      "onboardingNote" TEXT,
      "communityId" INTEGER,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Therapist" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "bio" TEXT NOT NULL DEFAULT '',
      "specialties" TEXT NOT NULL DEFAULT '',
      "photoUrl" TEXT,
      "priceMin" INTEGER NOT NULL DEFAULT 800,
      "priceMax" INTEGER NOT NULL DEFAULT 1500,
      "approved" BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Community" (
      "id" SERIAL PRIMARY KEY,
      "therapistId" INTEGER UNIQUE NOT NULL REFERENCES "Therapist"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "schedule" TEXT NOT NULL DEFAULT '',
      "price" INTEGER NOT NULL DEFAULT 299,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Conversation" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "title" TEXT NOT NULL DEFAULT 'New Conversation',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Message" (
      "id" SERIAL PRIMARY KEY,
      "conversationId" INTEGER NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "CommunityPost" (
      "id" SERIAL PRIMARY KEY,
      "communityId" INTEGER NOT NULL REFERENCES "Community"("id") ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "CommunityReply" (
      "id" SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES "CommunityPost"("id") ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Slot" (
      "id" SERIAL PRIMARY KEY,
      "therapistId" INTEGER NOT NULL REFERENCES "Therapist"("id") ON DELETE CASCADE,
      "datetime" TIMESTAMP NOT NULL,
      "booked" BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS "Booking" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "therapistId" INTEGER NOT NULL REFERENCES "Therapist"("id") ON DELETE CASCADE,
      "slotId" INTEGER,
      "datetime" TIMESTAMP NOT NULL,
      "price" INTEGER NOT NULL DEFAULT 800,
      "status" TEXT NOT NULL DEFAULT 'confirmed',
      "notes" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Community <-> User many-to-many (via communityId on User)
    -- Already handled via communityId foreign key on User table
    -- Just add the FK if not exists (safe to run multiple times due to IF NOT EXISTS above)
  `);

  // Add foreign key from User.communityId to Community
  try {
    await pglite.exec(`
      ALTER TABLE "User" ADD CONSTRAINT "User_communityId_fkey"
      FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL;
    `);
  } catch (e) {
    // Constraint already exists — ignore
    if (!e.message?.includes('already exists')) throw e;
  }

  console.log('✅ Database tables created successfully!');
  await pglite.close();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
