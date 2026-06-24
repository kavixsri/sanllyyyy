import { defineConfig } from 'prisma/config';
import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from 'pglite-prisma-adapter';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'prisma', 'pgdata');

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  adapter: async () => {
    const client = new PGlite(dataDir);
    await client.waitReady;
    return new PrismaPGlite(client);
  },
});
