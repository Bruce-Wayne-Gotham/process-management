const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function init() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = fs.readFileSync('./INITIALIZE_DATABASE.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Database initialized successfully');
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

init();
