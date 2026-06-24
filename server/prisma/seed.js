/**
 * Sanlly Database Seed
 * Creates: admin user, 3 therapists (approved + community), sample slots, sample posts
 * Run with: node prisma/seed.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPGlite } = require('pglite-prisma-adapter');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'prisma', 'pgdata');

let prisma;

async function initPrisma() {
  const { PGlite } = await import('@electric-sql/pglite');
  const pglite = new PGlite(dataDir);
  await pglite.waitReady;
  const adapter = new PrismaPGlite(pglite);
  prisma = new PrismaClient({ adapter });
}

const SPECIALTIES = {
  priya: 'Anxiety,Student Stress,Academic Pressure',
  vikram: 'Relationships,Grief,Life Transitions',
  meera: 'Depression,Self-esteem,Young Adults',
};

async function main() {
  await initPrisma();
  console.log('🌱 Seeding Sanlly database...\n');

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sanlly.in' },
    update: {},
    create: {
      email: 'admin@sanlly.in',
      password: adminPassword,
      name: 'Sanlly Admin',
      role: 'admin',
      tier: 'free',
    },
  });
  console.log('✅ Admin user:', admin.email);

  // ─── Therapist 1: Priya Sharma ───────────────────────────────────────────────
  const priyaPassword = await bcrypt.hash('therapist123', 12);
  const priyaUser = await prisma.user.upsert({
    where: { email: 'priya@sanlly.in' },
    update: {},
    create: {
      email: 'priya@sanlly.in',
      password: priyaPassword,
      name: 'Dr. Priya Sharma',
      role: 'therapist',
    },
  });

  const priyaTherapist = await prisma.therapist.upsert({
    where: { userId: priyaUser.id },
    update: { approved: true },
    create: {
      userId: priyaUser.id,
      bio: 'I\'m a clinical psychologist with 8 years of experience working with students and young professionals. I specialize in helping people navigate academic pressure, anxiety, and the challenges of growing up in competitive environments. My approach is warm, practical, and always judgment-free.',
      specialties: SPECIALTIES.priya,
      approved: true,
      priceMin: 800,
      priceMax: 1200,
    },
  });

  const priyaCommunity = await prisma.community.upsert({
    where: { therapistId: priyaTherapist.id },
    update: {},
    create: {
      therapistId: priyaTherapist.id,
      name: 'Student Minds — Anxiety & Stress Support',
      description: 'A safe, supportive space for students and young professionals navigating exam pressure, career anxiety, and the stress of modern life. No judgment, just understanding and practical tools.',
      schedule: 'Weekly group sessions every Saturday at 5:00 PM IST (45 min)\nMonthly one-on-one check-in included\nPrivate community forum — post anytime',
      price: 299,
    },
  });
  console.log('✅ Therapist 1 + Community:', priyaUser.name);

  // ─── Therapist 2: Vikram Nair ────────────────────────────────────────────────
  const vikramPassword = await bcrypt.hash('therapist123', 12);
  const vikramUser = await prisma.user.upsert({
    where: { email: 'vikram@sanlly.in' },
    update: {},
    create: {
      email: 'vikram@sanlly.in',
      password: vikramPassword,
      name: 'Vikram Nair',
      role: 'therapist',
    },
  });

  const vikramTherapist = await prisma.therapist.upsert({
    where: { userId: vikramUser.id },
    update: { approved: true },
    create: {
      userId: vikramUser.id,
      bio: 'Counsellor and life coach with a background in grief support and relationship dynamics. I believe everyone has the capacity to heal — sometimes we just need someone to walk alongside us. I work with individuals going through major life changes, loss, or relationship challenges.',
      specialties: SPECIALTIES.vikram,
      approved: true,
      priceMin: 900,
      priceMax: 1500,
    },
  });

  const vikramCommunity = await prisma.community.upsert({
    where: { therapistId: vikramTherapist.id },
    update: {},
    create: {
      therapistId: vikramTherapist.id,
      name: 'Healing Together — Grief & Relationships',
      description: 'A gentle space for those navigating loss, heartbreak, or major life changes. We meet weekly to share, support, and gently grow through whatever we\'re carrying.',
      schedule: 'Weekly group sessions every Sunday at 7:00 PM IST (60 min)\nOpen forum — share your thoughts any time\nMontly themed workshop included',
      price: 499,
    },
  });
  console.log('✅ Therapist 2 + Community:', vikramUser.name);

  // ─── Therapist 3: Meera Joshi (pending approval) ─────────────────────────────
  const meeraPassword = await bcrypt.hash('therapist123', 12);
  const meeraUser = await prisma.user.upsert({
    where: { email: 'meera@sanlly.in' },
    update: {},
    create: {
      email: 'meera@sanlly.in',
      password: meeraPassword,
      name: 'Meera Joshi',
      role: 'therapist',
    },
  });

  const meeraTherapist = await prisma.therapist.upsert({
    where: { userId: meeraUser.id },
    update: {},
    create: {
      userId: meeraUser.id,
      bio: 'Mental health counsellor specializing in depression, self-esteem issues, and the unique challenges faced by young adults in India. I use a blend of CBT and mindfulness approaches.',
      specialties: SPECIALTIES.meera,
      approved: false, // Pending admin approval — used to demo admin dashboard
      priceMin: 800,
      priceMax: 1000,
    },
  });
  console.log('⏳ Therapist 3 (pending approval):', meeraUser.name);

  // ─── Available Slots for Priya ─────────────────────────────────────────────
  const now = new Date();
  const slotsData = [
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0), // Day after tomorrow 10am
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 11, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 10, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 16, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6, 9, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 15, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8, 10, 0),
  ];

  // Delete old slots and recreate (idempotent seed)
  await prisma.slot.deleteMany({ where: { therapistId: priyaTherapist.id } });
  await prisma.slot.createMany({
    data: slotsData.map(dt => ({ therapistId: priyaTherapist.id, datetime: dt, booked: false })),
  });

  const vikramSlotsData = [
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 18, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 17, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 18, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8, 17, 0),
  ];
  await prisma.slot.deleteMany({ where: { therapistId: vikramTherapist.id } });
  await prisma.slot.createMany({
    data: vikramSlotsData.map(dt => ({ therapistId: vikramTherapist.id, datetime: dt, booked: false })),
  });
  console.log('✅ Seeded available slots for therapists');

  // ─── Sample Community Posts ─────────────────────────────────────────────────
  const existingPosts = await prisma.communityPost.count({ where: { communityId: priyaCommunity.id } });
  if (existingPosts === 0) {
    const post1 = await prisma.communityPost.create({
      data: {
        communityId: priyaCommunity.id,
        userId: priyaUser.id,
        content: '👋 Welcome to Student Minds! This is a safe space to share what you\'re going through. Whether it\'s exam anxiety, career stress, or just feeling overwhelmed — you\'re not alone here. Feel free to introduce yourself below! 💚',
      },
    });
    await prisma.communityPost.create({
      data: {
        communityId: vikramCommunity.id,
        userId: vikramUser.id,
        content: 'Welcome to Healing Together 🌱. This week\'s theme: "Small wins." What\'s one small thing that went right this week, however tiny? Share below — I\'ll start: I managed to sleep before midnight for the first time in weeks.',
      },
    });
    console.log('✅ Seeded sample community posts');
  }

  // ─── Demo User ──────────────────────────────────────────────────────────────
  const demoPassword = await bcrypt.hash('demo123456', 12);
  await prisma.user.upsert({
    where: { email: 'demo@sanlly.in' },
    update: {},
    create: {
      email: 'demo@sanlly.in',
      password: demoPassword,
      name: 'Demo User',
      role: 'user',
      tier: 'free',
      onboardingNote: 'I\'ve been feeling stressed at work and want to talk to someone.',
    },
  });
  console.log('✅ Demo user: demo@sanlly.in / demo123456');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Login credentials:');
  console.log('  Admin:    admin@sanlly.in / admin123456');
  console.log('  Demo:     demo@sanlly.in  / demo123456');
  console.log('  Therapist: priya@sanlly.in / therapist123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
