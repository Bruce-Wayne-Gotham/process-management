# ====================================================================
# Tobacco Tracker - AWS RDS Initialization Script (via Docker)
# ====================================================================

# This script initializes your AWS RDS database using a temporary Docker container.
# This allows you to run the setup even if you don't have Node.js installed locally.

# Prerequisites:
# 1. Docker Desktop must be running.
# 2. You must have a .env file with DATABASE_URL set.

if (!(Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found. Please create one based on .env.rds.example" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Initializing Tobacco Tracker Database on AWS RDS..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if Docker is running
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host "`n🏗️  Building setup container..." -ForegroundColor Yellow
docker-compose -f docker-compose.setup.yml build tobacco-tracker-setup

Write-Host "`n⚙️  Running database initialization..." -ForegroundColor Yellow
# We use the .env file from the current directory
docker-compose -f docker-compose.setup.yml run --rm tobacco-tracker-setup

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Database initialization completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Database initialization failed. Please check the logs above." -ForegroundColor Red
}

Write-Host "`nCleaning up containers..."
docker-compose -f docker-compose.setup.yml down >$null 2>&1

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
