/**
 * Shared PGlite + Prisma singleton for the Sanlly server.
 * PGlite is a pure WASM in-process Postgres — no native binaries needed.
 * 
 * Exports:
 *  - prisma: a transparent proxy to PrismaClient (auto-initializes)
 *  - getPglite(): resolves to the shared PGlite instance
 *  - getPrisma(): resolves to the initialized PrismaClient
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPGlite } = require('pglite-prisma-adapter');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'prisma', 'pgdata');

let _pglite = null;
let _prismaClient = null;
let _initPromise = null;

async function init() {
  if (_prismaClient) return { pglite: _pglite, prisma: _prismaClient };
  
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (dbUrl) {
    try {
      const { Pool } = require('pg');
      const { PrismaPg } = require('@prisma/adapter-pg');
      const pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 3000 });
      
      // Test the connection immediately. If it fails (e.g. broken dbUrl), fallback to PGlite
      const client = await pool.connect();
      client.release();
      
      const adapter = new PrismaPg(pool);
      _prismaClient = new PrismaClient({ adapter });
      return { pglite: null, prisma: _prismaClient };
    } catch (e) {
      console.warn('[DB] Failed to connect to external Postgres. Falling back to PGlite...', e.message);
      // Fall through to local PGlite
    }
  }

  // Otherwise fallback to local PGlite file-based DB (or memory on Vercel to prevent filesystem hangs)
  const pgliteTarget = process.env.VERCEL ? 'memory://' : dataDir;
  const { PGlite } = await import('@electric-sql/pglite');
  _pglite = new PGlite(pgliteTarget);
  await _pglite.waitReady;
  const adapter = new PrismaPGlite(_pglite);
  _prismaClient = new PrismaClient({ adapter });
  return { pglite: _pglite, prisma: _prismaClient };
}

function getPglite() {
  if (!_initPromise) _initPromise = init();
  return _initPromise.then(r => r.pglite);
}

function getPrisma() {
  if (!_initPromise) _initPromise = init();
  return _initPromise.then(r => r.prisma);
}

/**
 * Transparent Prisma proxy — delegates all model operations through the lazy client.
 * Usage: same as PrismaClient (e.g., await prisma.user.findMany())
 */
const prisma = new Proxy({}, {
  get(_, model) {
    if (model === '$disconnect') {
      return () => getPrisma().then(c => c.$disconnect());
    }
    if (model === '$transaction') {
      return (...args) => getPrisma().then(c => c.$transaction(...args));
    }
    if (model === '$queryRaw') {
      return (...args) => getPrisma().then(c => c.$queryRaw(...args));
    }
    if (model === '$executeRaw') {
      return (...args) => getPrisma().then(c => c.$executeRaw(...args));
    }
    if (model === '$queryRawUnsafe') {
      return (...args) => getPrisma().then(c => c.$queryRawUnsafe(...args));
    }
    if (model === '$executeRawUnsafe') {
      return (...args) => getPrisma().then(c => c.$executeRawUnsafe(...args));
    }
    if (model === 'getPglite') return getPglite;
    if (model === 'getPrisma') return getPrisma;
    return new Proxy({}, {
      get(__, operation) {
        return (...args) => getPrisma().then(c => c[model][operation](...args));
      },
    });
  },
});

module.exports = prisma;
