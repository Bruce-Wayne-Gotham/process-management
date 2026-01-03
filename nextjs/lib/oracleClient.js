// Oracle client removed from this codebase.
// The project now uses Render's native Postgres database via DATABASE_URL.
// See nextjs/lib/db.js for the Postgres client.

export async function testConnection() {
  throw new Error('Oracle client has been removed. Use Postgres (nextjs/lib/db.js) instead.');
}

export async function executeQuery() {
  throw new Error('Oracle client has been removed. Use Postgres (nextjs/lib/db.js) instead.');
}

export async function executeInsert() {
  throw new Error('Oracle client has been removed. Use Postgres (nextjs/lib/db.js) instead.');
}

export async function executeTransaction() {
  throw new Error('Oracle client has been removed. Use Postgres (nextjs/lib/db.js) instead.');
}

export async function initializeOracleClient() {
  throw new Error('Oracle client has been removed. Use Postgres (nextjs/lib/db.js) instead.');
}

