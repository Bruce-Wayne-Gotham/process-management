#!/usr/bin/env node

/**
 * Containerized Database Setup Script (Supabase removed)
 *
 * NOTE: The repository has removed Supabase integration. This script now
 * prints a short instruction to run the SQL schema manually (using psql or
 * your preferred Postgres client) and exits.
 */

const path = require('path');
const schemaPath = path.resolve(__dirname, '..', '..', 'sql', 'schema.sql');

console.log('This project no longer includes Supabase automation.');
console.log('Please run the PostgreSQL schema manually using your chosen client.');
console.log('Canonical schema file:', schemaPath);
console.log('Example (psql): psql $DATABASE_URL -f ' + schemaPath);
process.exit(0);
