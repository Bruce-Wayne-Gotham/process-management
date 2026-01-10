# Clean EC2 and Deploy
# Usage: .\clean-and-deploy.ps1

$PemPath = "process.pem"
$EC2_IP = "3.24.232.53"
$User = "ec2-user"

Write-Host "🧹 Cleaning EC2 disk space..." -ForegroundColor Yellow

$cleanCommands = @"
# Remove old Docker images and containers
docker system prune -af --volumes && \
# Remove old builds
rm -rf ~/tobacco-tracker/.next ~/tobacco-tracker/node_modules && \
# Show disk space
df -h && \
echo '✅ Cleanup complete'
"@

ssh -i $PemPath "${User}@${EC2_IP}" $cleanCommands

Write-Host "`n🚀 Deploying application..." -ForegroundColor Cyan

$deployCommands = @"
cd ~/tobacco-tracker && \
git pull origin main && \
docker-compose down && \
docker-compose build --no-cache && \
docker-compose up -d && \
docker-compose ps
"@

ssh -i $PemPath "${User}@${EC2_IP}" $deployCommands

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "App: http://$EC2_IP" -ForegroundColor Cyan
Write-Host "Login: http://$EC2_IP/login" -ForegroundColor Cyan
