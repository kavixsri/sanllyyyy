const { execSync } = require('child_process');
const path = require('path');

function run(cmd, cwdPath) {
  console.log(`\n> Running: ${cmd} in ${cwdPath || '.'}`);
  execSync(cmd, { 
    stdio: 'inherit', 
    cwd: cwdPath ? path.join(__dirname, cwdPath) : __dirname,
    env: process.env
  });
}

try {
  // Build client
  console.log('--- BUILDING CLIENT ---');
  run('npm install', 'client');
  run('npm run build', 'client');
  
  // Build server
  console.log('--- BUILDING SERVER ---');
  run('npm install', 'server');
  run('npx prisma generate', 'server');

  // Handle Database Migrations on Vercel
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (dbUrl) {
    console.log('--- RUNNING MIGRATIONS ---');
    process.env.DATABASE_URL = dbUrl;
    run('npx prisma db push --accept-data-loss', 'server');
    console.log('--- SEEDING DATABASE ---');
    run('node prisma/seed.js', 'server');
  } else {
    console.log('No external database configured. Skipping migration.');
  }
} catch (err) {
  console.error('\n❌ BUILD FAILED:', err.message);
  process.exit(1);
}
