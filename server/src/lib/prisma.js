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
  
  // If Vercel/External Postgres URL is provided, use standard Postgres (Vercel-ready)
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    _prismaClient = new PrismaClient({ adapter });
    return { pglite: null, prisma: _prismaClient };
  }

  // Otherwise fallback to local PGlite file-based DB
  const { PGlite } = await import('@electric-sql/pglite');
  _pglite = new PGlite(dataDir);
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
