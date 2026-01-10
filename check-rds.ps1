$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "Testing RDS connection..." -ForegroundColor Cyan

ssh -i $PEM $EC2 'timeout 5 bash -c "cat < /dev/null > /dev/tcp/tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com/5432" && echo "✅ RDS port 5432 is OPEN" || echo "❌ RDS port 5432 is CLOSED - Update security group"'

Write-Host "`nChecking app database connection..." -ForegroundColor Cyan
ssh -i $PEM $EC2 'docker compose -f ~/tobacco-tracker/docker-compose.yml exec -T app node -e "const { Pool } = require(\"pg\"); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT NOW()\").then(r => console.log(\"✅ Database connected:\", r.rows[0])).catch(e => console.log(\"❌ Database error:\", e.message)).finally(() => pool.end());"'
