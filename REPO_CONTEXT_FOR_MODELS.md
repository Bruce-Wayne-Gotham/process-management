# Repository Context for Models

This file is a compact handoff for another model or engineer working on the `process-management` repository.

## High-Level Purpose

`process-management` is a tobacco processing management app. It tracks farmers, tobacco purchases, lots, processing stages, final output, payments, reports, and user access.

The user-facing app is a Next.js application under `nextjs/`. The deployed public URL is served through a Cloudflare Worker proxy, which forwards requests to the Render-hosted Next.js app.

## Current Deployment Shape

- Main app: Next.js pages-router app in `nextjs/`.
- Primary origin: Render app at `https://process-management-4t4o.onrender.com`.
- Public proxy: Cloudflare Worker at `https://process-management.waynegothambrucebat.workers.dev/`.
- Worker source: `worker.js`.
- Worker config: `wrangler.toml`.
- Worker behavior: takes the incoming request path/query, maps it to `ORIGIN_URL`, forwards the request, and sets `X-Forwarded-Host` / `X-Forwarded-Proto`.
- `ORIGIN_URL` is configured in `wrangler.toml` and defaults in `worker.js`.

Useful deploy commands:

```sh
npm run cf:deploy:dry-run
npm run cf:deploy
```

The repo also has a local MCP connector for Worker deploy operations:

```sh
npm run mcp:cloudflare-worker:install
npm run mcp:cloudflare-worker
```

Connector files:

- `mcp/cloudflare-worker/server.js`
- `mcp/cloudflare-worker/package.json`
- `mcp/cloudflare-worker/README.md`

Connector tools exposed:

- `cloudflareWorker.deploy`
- `cloudflareWorker.whoami`
- `cloudflareWorker.tail`
- `cloudflareWorker.setOrigin`

## Tech Stack

- Frontend: Next.js 14, React 18, pages router.
- API: Next.js API routes under `nextjs/pages/api/`.
- Main database: PostgreSQL via `pg`.
- Target database host: AWS RDS PostgreSQL, usually configured through `DATABASE_URL`.
- Deployment: Render Docker service plus Cloudflare Worker proxy.
- MCP: `mcp/gemini` for Gemini bridge, `mcp/cloudflare-worker` for Worker deploy control.

## Repository Layout

- `nextjs/`: main app source.
- `nextjs/pages/`: pages and page-level routes.
- `nextjs/pages/api/`: backend API routes.
- `nextjs/components/`: reusable UI components such as `Layout`, `Card`, and `Button`.
- `nextjs/lib/`: database, auth, and service helpers.
- `sql/`: schema and seed scripts used by setup flows.
- `INITIALIZE_DATABASE.sql`: full PostgreSQL initialization script.
- `render-setup/`: Render pre-deploy database setup utilities.
- `rds-setup/`: RDS verification and initialization utilities.
- `mcp/gemini/`: local MCP server for Gemini.
- `mcp/cloudflare-worker/`: local MCP server for Cloudflare Worker deployment.
- `worker.js`: Cloudflare Worker proxy entrypoint.
- `wrangler.toml`: Cloudflare Worker config.
- `render.yaml`: Render service definitions.

## Main App Routes

Important pages:

- `/`: dashboard.
- `/login`: login.
- `/manual-setup`: database setup helper.
- `/farmers`, `/farmers/add`
- `/purchases`, `/purchases/add`, `/purchases/[id]`, `/purchases/[id]/edit`
- `/lots`, `/lots/add`, `/lots/[id]`, `/lots/[id]/edit`
- `/process`, `/process/add`, `/process/[id]`, `/process/[id]/edit`
- `/payments`, `/payments/add`, `/payments/[id]`, `/payments/[id]/edit`
- `/manage-users`
- `/change-password`

The layout component builds the left navigation and filters items based on permissions stored in the browser user object.

## Main API Routes

Common resource APIs:

- `GET/POST /api/farmers`
- `/api/farmers/[id]`
- `GET/POST /api/purchases`
- `/api/purchases/[id]`
- `GET/POST /api/lots`
- `/api/lots/[id]`
- `GET/POST /api/process`
- `/api/process/[id]`
- `/api/process/status`
- `GET/POST /api/payments`
- `/api/payments/[id]`
- `/api/users`
- `/api/health`
- `/api/setup-database`
- `/api/reports/purchases`
- `/api/reports/payments`
- `/api/reports/processes`

API routes are not fully uniform. Some import `nextjs/lib/db.js`, while others import `nextjs/lib/dbService.js`.

## Database Model

The canonical schema is in `INITIALIZE_DATABASE.sql`.

Core tables:

- `farmers`: farmer identity, bank details, efficacy score, active flag.
- `purchases`: purchases from farmers, weights, rates, generated total weight and amount.
- `lots`: groups of purchase material.
- `lot_purchases`: junction table linking lots to purchases with used weight.
- `process_status`: master status values.
- `process`: one process per lot, tracks input and wastage weights.
- `jardi_output`: final product output for a process.
- `payments`: payments against purchases.
- `farmer_efficacy`: farmer evaluation history.
- `users`: app users, role, permissions, active flag.
- `process_status_history`: audit/history for process status changes.

Default process statuses:

- `PENDING`
- `IN_PROGRESS`
- `COMPLETED`
- `ON_HOLD`
- `CANCELLED`

Default users inserted by the SQL script:

- `owner` / `admin123`
- `manager` / `admin123`

Security note: passwords are stored and compared as plain text in the current code. Treat this as a known production risk.

## Database Helpers

There are two PostgreSQL helpers:

- `nextjs/lib/db.js`: ES module helper with `query()` and auto-initialization from `INITIALIZE_DATABASE.sql`.
- `nextjs/lib/dbService.js`: CommonJS class-based helper that can create/check the database and schema using `sql/schema.sql` and `sql/seed_data.sql`.

There is also:

- `nextjs/lib/mongoDb.js`: MongoDB helper used by `nextjs/pages/api/auth/login.js`.

Important inconsistency:

- Most of the app and schema now indicate PostgreSQL is the source of truth.
- `nextjs/pages/api/users.js` uses PostgreSQL.
- `nextjs/pages/api/auth/login.js` still imports from `nextjs/lib/mongoDb.js`.
- There is also `nextjs/pages/api/login.js`, so auth/login paths should be checked carefully before changing authentication.

Do not assume auth is fully migrated to Postgres without testing the actual login flow.

## Auth and Permissions

Client-side auth helper: `nextjs/lib/auth.js`.

Current behavior:

- User data is stored in `localStorage` under `user`.
- `requireAuth()` redirects to `/login` if no user is present.
- `hasPermission(feature)` grants all access to `owner`.
- Managers get access based on the `permissions` array; if no permissions are present, managers currently get access by default.

This is not server-enforced authorization. API routes generally do not verify sessions or roles.

## Frontend Patterns

- The app uses inline React styles heavily.
- `Layout` wraps most pages and provides header/sidebar navigation.
- `Card` and `Button` provide small reusable UI primitives.
- Dashboard fetches `/api/health`, then `/api/farmers` and `/api/purchases`.
- The UI is mobile-aware, with a slide-out nav controlled through DOM IDs in `Layout`.

## Deployment Details

Render:

- `render.yaml` defines the web service using `nextjs/Dockerfile`.
- `preDeployCommand` runs `node render-setup/setup-database.js`.
- `DATABASE_URL` must be provided as an environment variable.

Docker:

- Root `Dockerfile` builds the Next.js app from `nextjs/`.
- `nextjs/Dockerfile` is used by Render according to `render.yaml`.

Cloudflare:

- `worker.js` is the proxy Worker.
- `wrangler.toml` sets the Worker name, entrypoint, compatibility date, workers.dev setting, and `ORIGIN_URL`.
- Direct deploy scripts live in root `package.json`.
- MCP deploy connector lives in `mcp/cloudflare-worker/`.

## Local Development

Expected basic flow:

```sh
cd nextjs
npm install
npm run dev
```

Required env:

```dotenv
DATABASE_URL=postgresql://username:password@host:5432/tobacco_tracker
```

If using the Worker connector:

```sh
npm run mcp:cloudflare-worker:install
npm run mcp:cloudflare-worker
```

If deploying the Worker directly:

```sh
npx wrangler login
npm run cf:deploy:dry-run
npm run cf:deploy
```

## Known Risks and Gotchas

- `node`, `npm`, and `gh` were not available on the local shell PATH during the latest work session.
- Git HTTPS auth was not configured locally, so previous publishing used the GitHub connector rather than `git push`.
- Local `main` may show ahead of `origin/main` if remote updates were made by the connector with different commit SHAs.
- Auth uses localStorage and plain-text passwords.
- Server-side API authorization is minimal or absent.
- Data access is split between `db.js`, `dbService.js`, and a lingering MongoDB auth path.
- RDS SSL behavior is inconsistent: `dbService.js` uses `ssl: { rejectUnauthorized: false }`, while `db.js` currently has `ssl: false`.
- `INITIALIZE_DATABASE.sql` enables RLS but creates permissive `FOR ALL USING (true)` policies.
- Some setup scripts include hard-coded defaults; review secrets before production hardening.

## Recent Work

Recent changes added:

- Cloudflare Worker proxy behavior that serves the UI through workers.dev by forwarding to Render.
- Root npm scripts for Worker deployment.
- `mcp/cloudflare-worker` MCP connector for deploy, auth check, tail logs, and origin updates.
- README notes explaining the Worker deploy path.

Live verification showed the workers.dev URL returns `200 text/html` with Next.js headers and app HTML for the Tobacco Tracker dashboard.

## Guidance for Future Models

When modifying this repo:

1. Identify whether the change belongs in frontend pages, API routes, database schema, deployment config, or MCP connector code.
2. Prefer Postgres for new business data work unless explicitly asked to use MongoDB.
3. Check both `db.js` and `dbService.js` usage before changing database initialization or connection behavior.
4. Be careful around auth; there are overlapping login routes and mixed datastore assumptions.
5. For Cloudflare Worker changes, test the Worker response with `curl -I` and a body fetch against the workers.dev URL.
6. Avoid committing secrets. Several files contain environment examples or setup defaults; treat them cautiously.
7. If local git says it is ahead after connector-based publishing, compare remote content before assuming the push failed.
