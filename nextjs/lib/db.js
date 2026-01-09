import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let pool;
let initialized = false;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  let sslConfig = false;
  const awsRdsCertPath = process.env.AWS_RDS_CA_CERT_PATH;

  if (awsRdsCertPath && fs.existsSync(awsRdsCertPath)) {
    sslConfig = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(awsRdsCertPath).toString(),
    };
  } else {
    // If no CA cert is provided, we allow self-signed certificates for now.
    // For maximum security in production, download the AWS RDS CA bundle.
    sslConfig = { rejectUnauthorized: false };
  }

  return new Pool({
    connectionString,
    ssl: sslConfig,
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '10000', 10),
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });
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

export async function initializeDatabase() {
  if (initialized) {
    console.log('[DB] Database already initialized, skipping');
    return { success: true, message: 'Already initialized' };
  }

  try {
    console.log('[DB] Starting database initialization...');
    const client = await getPool().connect();

    try {
      // Check if tables exist
      const tableCheck = await client.query(
        "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
      );

      const tableCount = parseInt(tableCheck.rows[0].table_count);

      if (tableCount > 0) {
        console.log(`[DB] Database already has tables (${tableCount} found), skipping initialization`);
        initialized = true;
        return { success: true, message: `Database already initialized with ${tableCount} tables` };
      }

      // Read schema file
      const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at ${schemaPath}`);
      }

      const schema = fs.readFileSync(schemaPath, 'utf-8');
      console.log('[DB] Executing schema...');

      await client.query(schema);
      console.log('[DB] Schema executed successfully');

      // Get list of created tables
      const result = await client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
      );

      const tables = result.rows.map(r => r.tablename);
      console.log(`[DB] Created ${tables.length} tables:`, tables);

      initialized = true;
      return {
        success: true,
        message: 'Database initialized successfully',
        tables
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[DB] Error initializing database:', err.message);
    return {
      success: false,
      message: err.message,
      error: err
    };
  }
}
