$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "Pulling latest code and rebuilding..." -ForegroundColor Cyan

ssh -i $PEM $EC2 @'
cd ~/tobacco-tracker
git pull
docker compose down
docker compose build --no-cache app
docker compose up -d
docker compose logs app --tail=20
'@

Write-Host "`nDone! Check http://3.24.232.53" -ForegroundColor Green
