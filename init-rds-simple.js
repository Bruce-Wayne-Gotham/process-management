const { Client } = require('pg');
const fs = require('fs');

async function initDB() {
  let client = new Client({
    host: 'tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'ganeshbagh501',
    database: 'postgres',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to RDS');

    await client.query('CREATE DATABASE tobacco_tracker');
    console.log('✅ Database created');
    await client.end();

    client = new Client({
      host: 'tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com',
      port: 5432,
      user: 'postgres',
      password: 'ganeshbagh501',
      database: 'tobacco_tracker',
      ssl: false
    });

    await client.connect();
    const schema = fs.readFileSync('./sql/schema.sql', 'utf8');
    await client.query(schema);
    console.log('✅ Schema created');

    const seed = fs.readFileSync('./sql/seed_data.sql', 'utf8');
    await client.query(seed);
    console.log('✅ Seed data inserted');

    await client.end();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initDB();
