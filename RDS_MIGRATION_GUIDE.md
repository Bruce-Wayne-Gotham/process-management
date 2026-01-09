# AWS RDS Migration Guide

This guide walks you through migrating from Render Postgres to AWS RDS.

## Step 1: Verify RDS Instance

Your AWS RDS instance is ready:
- **Instance ID:** tobacco-tracker
- **Engine:** PostgreSQL 17.6
- **Endpoint:** `tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com`
- **Port:** 5432
- **Region:** ap-southeast-2 (Australia)
- **Master User:** postgres

## Step 2: Configure Environment Variables

### Option A: Using DATABASE_URL (Recommended)

Copy `.env.rds` to `.env.local` and update with your master password:

```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com:5432/tobacco_tracker?sslmode=require
NODE_ENV=production
```

### Option B: Using Individual Parameters

Set these environment variables:

```bash
DB_HOST=tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=tobacco_tracker
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
```

## Step 3: Set Up RDS CA Certificate (Optional but Recommended)

For production, use AWS RDS CA certificate:

```bash
# Download the certificate
curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o certs/rds-ca-bundle.pem

# Set environment variable
AWS_RDS_CA_CERT_PATH=./certs/rds-ca-bundle.pem
```

## Step 4: Initialize Database

Run the initialization script to create the database and schema:

```bash
cd rds-setup
npm install
DATABASE_URL="postgresql://postgres:PASSWORD@tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com:5432" npm run init
```

This will:
1. Create the `tobacco_tracker` database
2. Apply the schema from `sql/schema.sql`
3. Create all required tables

## Step 5: Verify Schema

Verify the database was initialized correctly:

```bash
cd rds-setup
npm run verify
```

## Step 6: Configure Security Group

Ensure your RDS security group allows connections:

1. Go to **AWS RDS → tobacco-tracker → Connectivity & security**
2. Click on the security group (currently: `default`)
3. Add inbound rule:
   - **Type:** PostgreSQL
   - **Port:** 5432
   - **Source:** Your application's IP or security group

## Step 7: Update Application

### Local Development

Add to `.env.local`:
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com:5432/tobacco_tracker?sslmode=require
```

Then start the app:
```bash
cd nextjs
npm install
npm run dev
```

### Docker Deployment

Set environment variables when running the container:
```bash
docker run \
  -e DATABASE_URL="postgresql://postgres:PASSWORD@tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com:5432/tobacco_tracker?sslmode=require" \
  -e NODE_ENV=production \
  -p 3000:3000 \
  tobacco-tracker:latest
```

### AWS Deployment (ECS, EC2, Lambda)

1. Store credentials in **AWS Secrets Manager** or **Parameter Store**
2. Set `DATABASE_URL` as an environment variable in your deployment configuration
3. The app automatically detects RDS and configures SSL

## Step 8: Migrate Existing Data (Optional)

If you have data in Render Postgres:

```bash
# Dump from Render
pg_dump RENDER_DATABASE_URL > dump.sql

# Restore to RDS
psql DATABASE_URL < dump.sql
```

## Troubleshooting

### Connection Refused
- Verify security group allows port 5432 from your IP
- Check `DATABASE_URL` is correct (copy from AWS RDS console)
- Ensure database is publicly accessible or in same VPC

### SSL/Certificate Errors
- Disable `sslmode=require` temporarily for testing:
  ```
  DATABASE_URL=postgresql://postgres:PASSWORD@tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com:5432/tobacco_tracker
  ```
- Download and use AWS RDS CA bundle for production

### Database Not Found
- Run initialization script: `cd rds-setup && npm run init`
- Verify database was created: `psql -d postgresql://postgres:PASSWORD@host:5432 -c "\\l"`

### Slow Connection
- Check if Multi-AZ is enabled (affects latency)
- Consider instance class upgrade
- Monitor Performance Insights in AWS console

## Rollback to Render (If Needed)

To switch back to Render:

1. Set `DATABASE_URL` to your Render Postgres endpoint
2. Re-apply schema to Render database
3. Restore backup data if needed

## Support

For issues, check:
- AWS RDS documentation: https://docs.aws.amazon.com/rds/
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Node.js pg module: https://node-postgres.com/
