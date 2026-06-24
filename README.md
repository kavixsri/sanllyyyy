# Sanlly — Mental Health Platform MVP

## Quick Start

### 1. Start the backend (first time setup)
```bash
cd server
npm install
npm run db:migrate    # Create database tables (PGlite, no external DB needed)
npm run db:seed       # Seed with sample therapists, users, communities
npm run dev           # Start API server on http://localhost:3001
```

### 2. Start the frontend (in a new terminal)
```bash
cd client
npm install
npm run dev           # Start frontend on http://localhost:5173
```

### 3. Open your browser
Visit **http://localhost:5173**

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sanlly.in | admin123456 |
| Demo User | demo@sanlly.in | demo123456 |
| Therapist | priya@sanlly.in | therapist123 |

---

## Architecture Notes

### Why PGlite instead of SQLite?
This project runs on **ARM64 Windows** where native Node.js modules (like `better-sqlite3`) require Visual Studio C++ build tools which aren't installed. [PGlite](https://electric-sql.com/pglite) is a pure WebAssembly PostgreSQL that requires no compilation — it just works.

### Database
- Engine: PGlite (embedded WASM PostgreSQL)
- ORM: Prisma 7 with `pglite-prisma-adapter`
- Data directory: `server/prisma/pgdata/`
- To reset: delete `server/prisma/pgdata/` and run `npm run db:setup` again

### Session Storage
Sessions are stored directly in PGlite using raw SQL (no Prisma type system involved).

---

## Enable Real AI (optional)
Add your Anthropic API key to `server/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```
The app auto-switches from mock to real Claude streaming when the key is present.

---

## Known Gaps (MVP scope)
- Hindi-language UI — English only for now
- Real payment processing — all checkouts are mocked
- Real video calling — "Join Call" button is a placeholder
- Push notifications
