# Quick EC2 Deploy
# Usage: .\quick-deploy.ps1

$PemPath = "process.pem"
$EC2_IP = "3.24.232.53"
$User = "ec2-user"

Write-Host "🚀 Quick Deploy to EC2..." -ForegroundColor Cyan

# Check if PEM exists
if (-not (Test-Path $PemPath)) {
    Write-Host "❌ $PemPath not found in current directory!" -ForegroundColor Red
    Write-Host "Please place your process.pem file here or specify path." -ForegroundColor Yellow
    exit 1
}

# Git push first
Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
git add -A
git commit -m "Deploy updates" -ErrorAction SilentlyContinue
git push origin main

# Deploy to EC2
Write-Host "`n🔄 Pulling and deploying on EC2..." -ForegroundColor Yellow
$commands = @"
cd ~/tobacco-tracker && \
git pull origin main && \
docker compose down && \
docker compose build --no-cache && \
docker compose up -d && \
echo '✅ Deployment complete!' && \
docker compose ps
"@

ssh -i $PemPath "${User}@${EC2_IP}" $commands

Write-Host "`n✅ Done!" -ForegroundColor Green
Write-Host "🌐 App: http://$EC2_IP" -ForegroundColor Cyan
Write-Host "🔐 Login: http://$EC2_IP/login" -ForegroundColor Cyan
