$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "🔍 Checking EC2 deployment status..." -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`n1️⃣ Checking Docker status..." -ForegroundColor Yellow
ssh -i $PEM $EC2 "sudo systemctl status docker --no-pager | head -5"

# Check running containers
Write-Host "`n2️⃣ Checking running containers..." -ForegroundColor Yellow
ssh -i $PEM $EC2 "docker ps -a"

# Check logs if containers exist
Write-Host "`n3️⃣ Checking application logs..." -ForegroundColor Yellow
ssh -i $PEM $EC2 'cd ~/tobacco-tracker 2>/dev/null && docker compose logs --tail=50 || echo "No app deployed yet"'

# Check if files are uploaded
Write-Host "`n4️⃣ Checking uploaded files..." -ForegroundColor Yellow
ssh -i $PEM $EC2 'ls -la ~/tobacco-tracker/ 2>/dev/null || echo "Directory not found"'

Write-Host "`n" -NoNewline
$choice = Read-Host "Do you want to deploy/redeploy now? (y/n)"

if ($choice -eq 'y') {
    Write-Host "`n🚀 Starting deployment..." -ForegroundColor Green
    
    # Upload files
    Write-Host "📦 Uploading files..." -ForegroundColor Cyan
    scp -i $PEM -r "$PSScriptRoot\*" "${EC2}:~/tobacco-tracker/"
    
    # Deploy
    Write-Host "🏗️ Running deployment on EC2..." -ForegroundColor Cyan
    ssh -i $PEM $EC2 @"
cd ~/tobacco-tracker
chmod +x setup-ec2.sh
./setup-ec2.sh
cp .env.production .env
docker compose down
docker compose up -d --build
docker ps
"@
    
    Write-Host "`n✅ Deployment complete! Check http://3.24.232.53" -ForegroundColor Green
}
