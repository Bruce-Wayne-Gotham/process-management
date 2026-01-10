$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "Testing RDS connectivity..." -ForegroundColor Cyan

ssh -i $PEM $EC2 @'
echo "1. Testing DNS resolution..."
nslookup tobacco-tracker-db.c9gmq66ye077.ap-southeast-2.rds.amazonaws.com

echo -e "\n2. Testing port 5432 connectivity..."
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/tobacco-tracker-db.c9gmq66ye077.ap-southeast-2.rds.amazonaws.com/5432' && echo "Port 5432 is open" || echo "Port 5432 is closed or filtered"

echo -e "\n3. Checking EC2 security group..."
curl -s http://169.254.169.254/latest/meta-data/security-groups

echo -e "\n4. Checking .env file..."
cat ~/tobacco-tracker/.env
'@
