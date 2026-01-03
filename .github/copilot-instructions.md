## Purpose
Short, actionable notes to help an AI coding agent be productive in this repository.

## Big picture (high level)
- Next.js front-end (in `nextjs/`) connected to Render Postgres database via `nextjs/lib/db.js`.
- All data flows through the Postgres pool client: UI pages in `nextjs/pages/*` → Next.js API endpoints in `nextjs/pages/api/*` → shared Postgres client in `nextjs/lib/db.js` → Render Postgres database.
- Setup and seed data are applied via `sql/schema.sql` (canonical schema) and `render-setup/` automation for Render deployments.

## Where to look first (concrete files)
- App and run scripts: `nextjs/package.json` (dev/build/start).
- DB client: `nextjs/lib/db.js` (Postgres pool wrapper).
- Database schema: `sql/schema.sql` (canonical schema and seeds).
- Render setup automation: `render-setup/setup-database.js` (Node.js setup script using pg pool).
- Example API patterns: `nextjs/pages/api/purchases.js`, `nextjs/pages/api/farmers.js`.

## Development & common workflows (explicit)
- Run the Next.js app:
  - cd `nextjs/`
  - `npm install`
  - `npm run dev` (package.json uses `next dev`).
- Database setup (Render):
  - Attach a Postgres database to your Render service; `DATABASE_URL` is set automatically.
  - The `render-setup/` script runs on first Render deployment to initialize tables and seed data.
- Manual setup (local):
  - Apply `sql/schema.sql` directly: `psql $DATABASE_URL -f sql/schema.sql`.
- Docker: Use `docker-compose up --build` after setting `DATABASE_URL` if you want to run services locally in containers.

## Project-specific conventions and patterns
- Postgres client singleton: `nextjs/lib/db.js` exports `query(text, params)` and caches a `pg.Pool` in module scope.
  - Import and reuse this client in all API routes to avoid creating multiple pool connections.
- Next.js API routes use `req.method` checks and return JSON. Mirror patterns in existing endpoints (`setup-database.js`, `purchases.js`).
- Database is Render Postgres only; `oracleClient.js` and `supabaseClient.js` have been removed.

## Integration points & environment variables (examples)
- Render Postgres: `DATABASE_URL` (automatically set by Render when you attach a Postgres add-on; used by `nextjs/lib/db.js`).
- In `.env.local` or `.env.render.example`, note that `DATABASE_URL` is the only database variable needed.

## Patterns for making changes (concrete examples)
- To add a Postgres-backed API: create `nextjs/pages/api/<resource>.js`, import `query` from `nextjs/lib/db.js`, use parameterized SQL (`query(text, params)`), and return structured JSON. Follow naming and pagination patterns used in existing endpoints.
- To modify the database schema: edit `sql/schema.sql` and apply changes to a running Postgres instance using `psql` or a SQL editor. The `render-setup/` script will automatically apply the schema on Render's first deployment.

## Debugging tips (concrete)
- Postgres connection fails: verify `DATABASE_URL` is set and that `nextjs/lib/db.js`'s pool is being reused (module-level caching). Check pool connectivity and SSL config (the pool toggles `ssl.rejectUnauthorized` depending on NODE_ENV).
- Render deployment: if the setup script fails, check the Render deployment logs; the script logs all operations to stdout for troubleshooting.

## Safety & secrets
- Do not commit real `DATABASE_URL` values or keys. Use environment variables in CI/hosting. Render automatically provides `DATABASE_URL` for attached databases.
- Do not use hardcoded demo values in production code; reference `env.render.example` for expected variable names.

## PR checklist when changing data or API
- Update `sql/schema.sql` for schema changes.
- Preserve `query` function signature in `nextjs/lib/db.js`; many API routes import and use it.
- Test API endpoints against a local Postgres instance before committing.

---
If anything here is unclear or you'd like more detail on Render setup, Postgres patterns, or API examples, let me know.
