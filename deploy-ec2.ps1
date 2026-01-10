# EC2 Deployment Script for Windows
# Usage: .\deploy-ec2.ps1 -PemPath "path\to\process.pem"

param(
    [string]$PemPath = "process.pem",
    [string]$EC2_IP = "3.24.232.53",
    [string]$User = "ec2-user"
)

Write-Host "🚀 Deploying to EC2 ($EC2_IP)..." -ForegroundColor Cyan

if (-not (Test-Path $PemPath)) {
    Write-Host "❌ Error: $PemPath not found!" -ForegroundColor Red
    exit 1
}

# 1. Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
$tempDir = "deploy-temp"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy necessary files
$filesToCopy = @(
    "nextjs",
    "docker-compose.yml",
    "nginx.conf",
    ".env",
    "INITIALIZE_DATABASE.sql"
)

foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $tempDir -Recurse -Force
    }
}

# 2. Upload to EC2
Write-Host "📤 Uploading to EC2..." -ForegroundColor Yellow
scp -i $PemPath -r "$tempDir\*" "${User}@${EC2_IP}:~/tobacco-tracker/"

# 3. Deploy on EC2
Write-Host "🏗️ Building and starting containers..." -ForegroundColor Yellow
$deployCommands = @"
cd ~/tobacco-tracker && \
docker compose down && \
docker compose build --no-cache && \
docker compose up -d && \
docker compose ps
"@

ssh -i $PemPath "${User}@${EC2_IP}" $deployCommands

# Cleanup
Remove-Item -Recurse -Force $tempDir

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Access your app at: http://$EC2_IP" -ForegroundColor Cyan
Write-Host "📊 Check logs: ssh -i $PemPath ${User}@${EC2_IP} 'cd ~/tobacco-tracker && docker compose logs -f'" -ForegroundColor Gray
