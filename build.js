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

  // Database Migrations and Seeding have been moved to runtime to prevent build failures.
  console.log('--- BUILD SUCCESS ---');
} catch (err) {
  console.error('\n❌ BUILD FAILED:', err.message);
  process.exit(1);
}
