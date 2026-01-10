$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "Checking EC2 deployment status..." -ForegroundColor Cyan

Write-Host "`nChecking Docker status..." -ForegroundColor Yellow
ssh -i $PEM $EC2 'sudo systemctl status docker --no-pager | head -5'

Write-Host "`nChecking running containers..." -ForegroundColor Yellow
ssh -i $PEM $EC2 'docker ps -a'

Write-Host "`nChecking application logs..." -ForegroundColor Yellow
ssh -i $PEM $EC2 'cd ~/tobacco-tracker 2>/dev/null && docker compose logs --tail=50 || echo "No app deployed yet"'

Write-Host "`nChecking uploaded files..." -ForegroundColor Yellow
ssh -i $PEM $EC2 'ls -la ~/tobacco-tracker/ 2>/dev/null || echo "Directory not found"'

Write-Host "`nDiagnostic complete!" -ForegroundColor Green
