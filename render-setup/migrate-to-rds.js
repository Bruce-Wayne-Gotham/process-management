#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');

function sslForUrl(url) {
  const isRender = url.includes('render.com');
  const isRds = url.includes('.rds.amazonaws.com') || url.includes('.rds.');
  if (isRds) {
    const certPath = process.env.AWS_RDS_CA_CERT_PATH;
    if (certPath && fs.existsSync(certPath)) {
      return { rejectUnauthorized: true, ca: fs.readFileSync(certPath).toString() };
    }
    return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : { rejectUnauthorized: false };
  }
  if (isRender) return { rejectUnauthorized: false };
  return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}

const sourceUrl = process.env.RENDER_DATABASE_URL || process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL_SOURCE;
const destUrl = process.env.RDS_DATABASE_URL || process.env.DEST_DATABASE_URL || process.env.DATABASE_URL_DEST;

if (!sourceUrl || !destUrl) {
  console.error('Missing source or destination database URL');
  process.exit(1);
}

const source = new Pool({
  connectionString: sourceUrl,
  ssl: sslForUrl(sourceUrl),
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '10000', 10),
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

const dest = new Pool({
  connectionString: destUrl,
  ssl: sslForUrl(destUrl),
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '10000', 10),
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

const tables = [
  'process_status',
  'farmers',
  'purchases',
  'lots',
  'process',
  'jardi_output',
  'payments',
  'lot_purchases',
  'farmer_efficacy',
  'process_status_history'
];

async function copyTable(table) {
  const srcRows = await source.query(`SELECT * FROM ${table}`);
  if ((srcRows.rows || []).length === 0) return;
  const cols = Object.keys(srcRows.rows[0]);
  const colList = cols.map(c => `"${c}"`).join(', ');
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const insertSql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`;
  for (const row of srcRows.rows) {
    const values = cols.map(c => row[c]);
    await dest.query(insertSql, values);
  }
}

async function bumpSequence(table) {
  await dest.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`, [table]);
}

async function verify() {
  const counts = {};
  for (const t of tables) {
    const src = await source.query(`SELECT COUNT(*) AS c FROM ${t}`);
    const dst = await dest.query(`SELECT COUNT(*) AS c FROM ${t}`);
    counts[t] = { source: Number(src.rows[0].c), dest: Number(dst.rows[0].c) };
  }
  console.log('Verification:', counts);
}

async function main() {
  console.log('Starting migration from Render to AWS RDS');
  const client = await dest.connect();
  try {
    await client.query('BEGIN');
    for (const t of tables) {
      console.log(`Copying table: ${t}`);
      await copyTable(t);
    }
    for (const t of tables) {
      await bumpSequence(t);
    }
    await client.query('COMMIT');
    console.log('Migration completed');
    await verify();
  } catch (e) {
    console.error('Migration failed:', e.message);
    await client.query('ROLLBACK');
    process.exitCode = 1;
  } finally {
    client.release();
    await source.end();
    await dest.end();
  }
}

main();

