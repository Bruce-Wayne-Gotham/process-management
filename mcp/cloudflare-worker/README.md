# Cloudflare Worker MCP Connector

This connector exposes the repo's Cloudflare Worker deployment commands as MCP tools so an assistant can deploy, validate, and inspect the Worker without memorizing Wrangler flags.

## Setup

```sh
npm install --prefix mcp/cloudflare-worker
npm run mcp:cloudflare-worker
```

Wrangler must be authenticated before deploying:

```sh
npx wrangler login
```

For non-interactive environments, set `CLOUDFLARE_API_TOKEN` with permission to edit Workers.

## Tools

- `cloudflareWorker.deploy`: deploys `worker.js` using the root `wrangler.toml`.
- `cloudflareWorker.whoami`: checks the active Wrangler account.
- `cloudflareWorker.tail`: streams Worker logs for a short window.
- `cloudflareWorker.setOrigin`: stores `ORIGIN_URL` through Wrangler secrets.

## Quick Deploy

Validate first:

```sh
npm run cf:deploy:dry-run
```

Deploy:

```sh
npm run cf:deploy
```
