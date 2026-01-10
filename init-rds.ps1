$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "Initializing RDS database..." -ForegroundColor Cyan

ssh -i $PEM $EC2 @'
cd ~/tobacco-tracker
docker compose exec -T app node -e "
const { Client } = require('pg');
const fs = require('fs');

async function init() {
  // Connect to postgres database first
  const client = new Client({
    host: 'tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'ganeshbagh501',
    database: 'postgres',
    ssl: false
  });
  
  await client.connect();
  console.log('✅ Connected to RDS');
  
  // Create database
  try {
    await client.query('CREATE DATABASE tobacco_tracker');
    console.log('✅ Database created');
  } catch (e) {
    console.log('Database already exists or error:', e.message);
  }
  
  await client.end();
  
  // Connect to new database and run schema
  const dbClient = new Client({
    host: 'tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'ganeshbagh501',
    database: 'tobacco_tracker',
    ssl: false
  });
  
  await dbClient.connect();
  
  const schema = fs.readFileSync('/app/sql/schema.sql', 'utf8');
  await dbClient.query(schema);
  console.log('✅ Schema created');
  
  const seed = fs.readFileSync('/app/sql/seed_data.sql', 'utf8');
  await dbClient.query(seed);
  console.log('✅ Seed data inserted');
  
  await dbClient.end();
  console.log('✅ Database initialized!');
}

init().catch(console.error);
"
'@
