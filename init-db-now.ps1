$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "Initializing database..." -ForegroundColor Cyan

ssh -i $PEM $EC2 @'
cd ~/tobacco-tracker
docker compose exec -T app node << 'NODESCRIPT'
const { Client } = require("pg");
const fs = require("fs");

async function init() {
  let client = new Client({
    host: "tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com",
    port: 5432,
    user: "postgres",
    password: "ganeshbagh501",
    database: "postgres",
    ssl: false
  });
  
  await client.connect();
  console.log("Connected to RDS");
  
  try {
    await client.query("CREATE DATABASE tobacco_tracker");
    console.log("✅ Database created");
  } catch (e) {
    console.log("Database exists:", e.message);
  }
  await client.end();
  
  client = new Client({
    host: "tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com",
    port: 5432,
    user: "postgres",
    password: "ganeshbagh501",
    database: "tobacco_tracker",
    ssl: false
  });
  
  await client.connect();
  const schema = fs.readFileSync("/app/sql/schema.sql", "utf8");
  await client.query(schema);
  console.log("✅ Schema created");
  
  const seed = fs.readFileSync("/app/sql/seed_data.sql", "utf8");
  await client.query(seed);
  console.log("✅ Seed data inserted");
  
  await client.end();
  console.log("✅ Done!");
}

init().catch(console.error);
NODESCRIPT
'@
