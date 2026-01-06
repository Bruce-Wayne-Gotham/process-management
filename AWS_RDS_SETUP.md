# AWS RDS PostgreSQL Setup Guide

This guide explains how to set up and connect to AWS RDS PostgreSQL for the Tobacco Tracker application.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS RDS PostgreSQL instance created
3. Security groups configured to allow connections from your application

## Step 1: Create AWS RDS PostgreSQL Instance

1. Log in to AWS Console
2. Navigate to RDS service
3. Click "Create database"
4. Choose:
   - Database creation method: Standard create
   - Engine type: PostgreSQL
   - Version: Latest stable version (recommended: 15.x or 16.x)
   - Template: Production, Dev/Test, or Free tier (as appropriate)
5. Configure settings:
   - DB instance identifier: `tobacco-tracker-db`
   - Master username: `admin` (or your preferred username)
   - Master password: Set a strong password
   - DB instance class: Choose appropriate size
6. Configure storage (defaults usually fine)
7. Configure connectivity:
   - VPC: Your application's VPC
   - Public access: Yes (if connecting from outside AWS) or No (if within AWS)
   - Security group: Create new or use existing
   - Availability Zone: Select or leave default
8. Database authentication: Password authentication
9. Create database

## Step 2: Configure Security Group

1. Go to RDS → Your database → Connectivity & security
2. Click on the Security group
3. Edit inbound rules
4. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: 
     - For production: Your application's security group or IP
     - For testing: Your IP address (0.0.0.0/0 only for development)

## Step 3: Download AWS RDS CA Certificate (Recommended for Production)

1. Download the global bundle from:
   ```
   https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   ```
2. Save it in your project (e.g., `certs/rds-ca-bundle.pem`)
3. Ensure it's not committed to git (add to `.gitignore`)

## Step 4: Set Environment Variables

### Option A: Using DATABASE_URL (Recommended)

```bash
DATABASE_URL=postgresql://username:password@your-db.xxxxx.us-east-1.rds.amazonaws.com:5432/tobacco_tracker?sslmode=require
```

Replace:
- `username`: Your RDS master username
- `password`: Your RDS master password
- `your-db.xxxxx.us-east-1.rds.amazonaws.com`: Your RDS endpoint
- `tobacco_tracker`: Your database name

### Option B: Using Individual Parameters

```bash
DB_HOST=your-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=tobacco_tracker
DB_USER=username
DB_PASSWORD=password
```

### SSL Configuration (Production)

```bash
AWS_RDS_CA_CERT_PATH=./certs/rds-ca-bundle.pem
NODE_ENV=production
```

### Connection Pool Settings (Optional)

```bash
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=10000
```

## Step 5: Create Database Schema

### Using the Setup Script

```bash
# Make sure DATABASE_URL is set
export DATABASE_URL=postgresql://...
node render-setup/setup-database.js
```

### Using psql Directly

```bash
psql $DATABASE_URL -f sql/schema.sql
```

### Using SQL Workbench or pgAdmin

1. Connect to your RDS instance
2. Execute the SQL from `sql/schema.sql`

## Step 6: Test Connection

Test the connection using the health endpoint:

```bash
curl https://your-app-url/api/health
```

Or test locally:

```bash
cd nextjs
npm install
npm run dev
# Visit http://localhost:3000/api/health
```

## Step 7: Deploy to Production

### Render Deployment

1. Go to Render Dashboard → Your Service → Environment
2. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: Your AWS RDS connection string
3. Add SSL certificate (if using):
   - Key: `AWS_RDS_CA_CERT_PATH`
   - Value: `/path/to/rds-ca-bundle.pem` (if file is included in deployment)
4. Redeploy your service

### AWS EC2/ECS/Elastic Beanstalk

Set environment variables in your platform's configuration:
- EC2: Use `.env` file or IAM roles
- ECS: Task definition environment variables
- Elastic Beanstalk: Configuration → Software → Environment properties

## Security Best Practices

1. **Use IAM Database Authentication** (Advanced):
   - Enable IAM authentication on RDS
   - Use IAM roles instead of passwords
   - More secure but requires additional setup

2. **SSL/TLS**:
   - Always use SSL in production
   - Download and use AWS RDS CA certificate bundle
   - Never use `rejectUnauthorized: false` in production

3. **Network Security**:
   - Use VPC security groups to restrict access
   - Avoid public access if possible
   - Use VPC peering for cross-region connections

4. **Secrets Management**:
   - Never commit passwords to git
   - Use AWS Secrets Manager or Parameter Store
   - Rotate passwords regularly

5. **Connection Pooling**:
   - Use RDS Proxy for connection pooling at scale
   - Or configure pg pool settings appropriately

## Troubleshooting

### Connection Timeout

- Check security group allows your IP/service
- Verify VPC/subnet configuration
- Check RDS instance is publicly accessible (if needed)

### SSL Certificate Error

- Download and use AWS RDS CA bundle
- Verify certificate path is correct
- Check file permissions

### Authentication Failed

- Verify username and password
- Check IAM permissions (if using IAM auth)
- Ensure database user exists

### Too Many Connections

- Reduce `DB_POOL_MAX` setting
- Use RDS Proxy for connection pooling
- Upgrade RDS instance size

## Monitoring

1. **CloudWatch Metrics**:
   - Database connections
   - CPU utilization
   - Read/Write IOPS
   - Free storage space

2. **Application Logs**:
   - Monitor connection errors
   - Track query performance
   - Watch for timeout issues

## Cost Optimization

1. Use appropriate instance size
2. Enable automated backups (required for production)
3. Use Multi-AZ for production (increases cost but improves availability)
4. Monitor and adjust reserved capacity if needed

## Support

For AWS RDS specific issues, refer to:
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS RDS PostgreSQL Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
