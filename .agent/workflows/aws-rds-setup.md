---
description: Set up AWS RDS for Tobacco Tracker and configure environment
---

## Prerequisites
- AWS CLI installed and configured with appropriate credentials
- `aws` command available in PATH
- Access to the AWS account where you want to create the RDS instance
- Existing PostgreSQL or MySQL database engine preference
- Node.js project with `.env` file for environment variables

## Steps
1. **Create a security group**
   ```bash
   aws ec2 create-security-group \
       --group-name tobacco-tracker-db-sg \
       --description "Security group for Tobacco Tracker RDS"
   ```
   // turbo
   # Note the `GroupId` from the output (e.g., sg-0abc123def456).

2. **Authorize inbound traffic** (allow your IP or 0.0.0.0/0 for testing)
   ```bash
   aws ec2 authorize-security-group-ingress \
       --group-id <GroupId> \
       --protocol tcp \
       --port 5432 \
       --cidr <YOUR_IP>/32
   ```
   // turbo

3. **Create the RDS instance**
   ```bash
   aws rds create-db-instance \
       --db-instance-identifier tobacco-tracker-db \
       --db-instance-class db.t3.micro \
       --engine postgres \
       --master-username <DB_USERNAME> \
       --master-user-password <DB_PASSWORD> \
       --allocated-storage 20 \
       --vpc-security-group-ids <GroupId>
   ```
   // turbo
   # Wait for the instance to become `available` (you can poll with `aws rds describe-db-instances`).

4. **Retrieve the endpoint**
   ```bash
   aws rds describe-db-instances \
       --db-instance-identifier tobacco-tracker-db \
       --query "DBInstances[0].Endpoint.Address" \
       --output text
   ```
   // turbo
   # Save the output as `DB_ENDPOINT`.

5. **Update project environment variables**
   Open the `.env` file in the project root and add/replace the following lines:
   ```dotenv
   DATABASE_URL=postgresql://<DB_USERNAME>:<DB_PASSWORD>@${DB_ENDPOINT}:5432/<DB_NAME>
   ```
   Replace `<DB_NAME>` with the database name you plan to use (you can create it later via a migration script).

6. **Verify connection locally**
   Run the provided test script (or create one) to ensure the app can connect:
   ```bash
   node nextjs/test-connection.js
   ```
   The script should print a successful connection message.

7. **Commit changes**
   ```bash
   git add .env
   git commit -m "Configure AWS RDS connection"
   ```

## Optional: Automate with Terraform (if you prefer IaC)
- Create a `main.tf` with the above resources.
- Run `terraform init && terraform apply`.

---

**Note**: Remember to keep your database credentials out of version control. Use a secrets manager or encrypt the `.env` file if needed.
