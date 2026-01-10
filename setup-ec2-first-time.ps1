# First Time EC2 Setup
# Usage: .\setup-ec2-first-time.ps1

$PemPath = "process.pem"
$EC2_IP = "3.24.232.53"
$User = "ec2-user"

Write-Host "🚀 First Time EC2 Setup..." -ForegroundColor Cyan

if (-not (Test-Path $PemPath)) {
    Write-Host "❌ $PemPath not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n1️⃣ Setting up EC2 instance..." -ForegroundColor Yellow
$setupCommands = @"
# Install Docker and Git
sudo yum update -y && \
sudo yum install -y docker git && \
sudo systemctl start docker && \
sudo systemctl enable docker && \
sudo usermod -aG docker ec2-user && \
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)" -o /usr/local/bin/docker-compose && \
sudo chmod +x /usr/local/bin/docker-compose && \
echo '✅ Docker and Git installed'
"@

ssh -i $PemPath "${User}@${EC2_IP}" $setupCommands

Write-Host "`n2️⃣ Cloning repository..." -ForegroundColor Yellow
$cloneCommands = @"
cd ~ && \
rm -rf tobacco-tracker && \
git clone https://github.com/Bruce-Wayne-Gotham/process-management.git tobacco-tracker && \
cd tobacco-tracker && \
echo '✅ Repository cloned'
"@

ssh -i $PemPath "${User}@${EC2_IP}" $cloneCommands

Write-Host "`n3️⃣ Deploying application..." -ForegroundColor Yellow
$deployCommands = @"
cd ~/tobacco-tracker && \
docker-compose down 2>/dev/null || true && \
docker-compose build --no-cache && \
docker-compose up -d && \
docker-compose ps
"@

ssh -i $PemPath "${User}@${EC2_IP}" $deployCommands

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "🌐 App: http://$EC2_IP" -ForegroundColor Cyan
Write-Host "🔐 Login: http://$EC2_IP/login (owner/admin123)" -ForegroundColor Cyan
Write-Host "`n📝 Next time, just run: .\quick-deploy.ps1" -ForegroundColor Gray
