$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "Uploading updated .env.production..." -ForegroundColor Cyan
scp -i $PEM .env.production "${EC2}:~/tobacco-tracker/"

Write-Host "Redeploying app..." -ForegroundColor Cyan
ssh -i $PEM $EC2 @'
cd ~/tobacco-tracker
cp .env.production .env
docker compose down
docker compose up -d --build
docker compose logs app
'@

Write-Host "`nDone! Check http://3.24.232.53" -ForegroundColor Green
