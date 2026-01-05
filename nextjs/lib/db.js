import { Pool } from 'pg';

let pool;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  // Render Postgres databases require SSL connections
  // Check if this is a Render database (contains render.com) or production
  const isRenderDatabase = connectionString.includes('render.com');
  const requiresSSL = isRenderDatabase || process.env.NODE_ENV === 'production';

  const poolConfig = {
    connectionString,
    ssl: requiresSSL ? { rejectUnauthorized: false } : false,
    // Connection pool configuration for reliability
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  };

  return new Pool(poolConfig);
}

export function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}
