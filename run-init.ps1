$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

Write-Host "Uploading init script..." -ForegroundColor Cyan
scp -i $PEM init-rds-simple.js "${EC2}:~/tobacco-tracker/"

Write-Host "Running database initialization..." -ForegroundColor Cyan
ssh -i $PEM $EC2 'cd ~/tobacco-tracker && node init-rds-simple.js'

Write-Host "`nDone! Try http://3.24.232.53" -ForegroundColor Green
