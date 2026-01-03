#!/usr/bin/env node

/**
 * Local Database Setup Helper (Supabase removed)
 *
 * The repository no longer includes Supabase automation. Please apply
 * the SQL schema manually using psql or your Postgres client.
 */

const path = require('path');
const schemaPath = path.resolve(__dirname, '..', 'sql', 'schema.sql');

console.log('Supabase automation removed from repository.');
console.log('Run the canonical SQL schema file manually:');
console.log('  psql $DATABASE_URL -f', schemaPath);
console.log('\nOr open `sql/schema.sql` and apply the statements in your SQL editor.');
process.exit(0);
