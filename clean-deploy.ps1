$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "Cleaning EC2 and redeploying..." -ForegroundColor Cyan

ssh -i $PEM $EC2 @'
cd ~/tobacco-tracker
git reset --hard HEAD
git clean -fd
git pull origin main
docker compose down -v
docker system prune -af
docker compose up -d --build
sleep 5
docker compose logs app --tail=30
'@

Write-Host "`n✅ Done! Check http://3.24.232.53" -ForegroundColor Green
