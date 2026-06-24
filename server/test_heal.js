const { PGlite } = require('@electric-sql/pglite');
const { PrismaPGlite } = require('pglite-prisma-adapter');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function test() {
  try {
    console.log('Initializing PGlite with memory://');
    const pglite = new PGlite('memory://');
    await pglite.waitReady;
    console.log('PGlite ready.');

    const adapter = new PrismaPGlite(pglite);
    const prisma = new PrismaClient({ adapter });

    console.log('Testing queryRaw...');
    try {
      await prisma.$queryRaw`SELECT 1 FROM sessions LIMIT 1`;
      console.log('Tables exist!');
    } catch (e) {
      console.log('Tables missing, healing...', e.message);
      const statements = [
        `CREATE TABLE IF NOT EXISTS "sessions" ("sid" TEXT PRIMARY KEY, "sess" TEXT NOT NULL, "expire" BIGINT);`,
        `CREATE TABLE IF NOT EXISTS "User" ("id" SERIAL PRIMARY KEY, "email" TEXT UNIQUE NOT NULL, "password" TEXT NOT NULL, "name" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'user', "tier" TEXT NOT NULL DEFAULT 'free', "onboardingNote" TEXT, "communityId" INTEGER, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());`,
        `CREATE TABLE IF NOT EXISTS "Therapist" ("id" SERIAL PRIMARY KEY, "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "bio" TEXT NOT NULL DEFAULT '', "specialties" TEXT NOT NULL DEFAULT '', "photoUrl" TEXT, "priceMin" INTEGER NOT NULL DEFAULT 800, "priceMax" INTEGER NOT NULL DEFAULT 1500, "approved" BOOLEAN NOT NULL DEFAULT FALSE, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());`,
        `CREATE TABLE IF NOT EXISTS "Community" ("id" SERIAL PRIMARY KEY, "therapistId" INTEGER UNIQUE NOT NULL REFERENCES "Therapist"("id") ON DELETE CASCADE, "name" TEXT NOT NULL, "description" TEXT NOT NULL DEFAULT '', "schedule" TEXT NOT NULL DEFAULT '', "price" INTEGER NOT NULL DEFAULT 299, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());`,
        `CREATE TABLE IF NOT EXISTS "Conversation" ("id" SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "title" TEXT NOT NULL DEFAULT 'New Conversation', "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW());`,
        `CREATE TABLE IF NOT EXISTS "Message" ("id" SERIAL PRIMARY KEY, "conversationId" INTEGER NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE, "role" TEXT NOT NULL, "content" TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());`,
        `CREATE TABLE IF NOT EXISTS "CommunityPost" ("id" SERIAL PRIMARY KEY, "communityId" INTEGER NOT NULL REFERENCES "Community"("id") ON DELETE CASCADE, "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "content" TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());`,
        `CREATE TABLE IF NOT EXISTS "CommunityReply" ("id" SERIAL PRIMARY KEY, "postId" INTEGER NOT NULL REFERENCES "CommunityPost"("id") ON DELETE CASCADE, "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "content" TEXT NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());`,
        `CREATE TABLE IF NOT EXISTS "Slot" ("id" SERIAL PRIMARY KEY, "therapistId" INTEGER NOT NULL REFERENCES "Therapist"("id") ON DELETE CASCADE, "datetime" TIMESTAMP NOT NULL, "booked" BOOLEAN NOT NULL DEFAULT FALSE);`,
        `CREATE TABLE IF NOT EXISTS "Booking" ("id" SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "therapistId" INTEGER NOT NULL REFERENCES "Therapist"("id") ON DELETE CASCADE, "slotId" INTEGER, "datetime" TIMESTAMP NOT NULL, "price" INTEGER NOT NULL DEFAULT 800, "status" TEXT NOT NULL DEFAULT 'confirmed', "notes" TEXT, "createdAt" TIMESTAMP NOT NULL DEFAULT NOW());`
      ];
      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt);
      }
      const demoPassword = await bcrypt.hash('demo123456', 12);
      await prisma.$executeRawUnsafe(`INSERT INTO "User" (email, password, name, role, tier) VALUES ('demo@sanlly.in', '${demoPassword}', 'Demo User', 'user', 'free') ON CONFLICT (email) DO NOTHING`);
      console.log('Healed successfully!');
    }
  } catch (err) {
    console.error('FATAL ERROR:', err);
  }
}
test();
