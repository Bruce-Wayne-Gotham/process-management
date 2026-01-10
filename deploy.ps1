$PemPath = "C:\Users\vires\Downloads\process.pem"
$Ec2Ip = "3.24.232.53"
$Ec2User = "ec2-user"

Write-Host "Creating deployment bundle..."
tar --exclude='node_modules' --exclude='.git' --exclude='.next' --exclude='bundle.tar.gz' -czf bundle.tar.gz .

Write-Host "Uploading bundle to EC2 ($Ec2Ip)..."
scp -i $PemPath -o StrictHostKeyChecking=no bundle.tar.gz "${Ec2User}@${Ec2Ip}:~/"

Write-Host "Extracting and setting up on EC2..."
# We combine all commands into a single line string to avoid CR/LF issues with bash on remote
$RemoteCmd = "mkdir -p ~/tobacco-tracker && " +
"tar -xzf ~/bundle.tar.gz -C ~/tobacco-tracker && " +
"cd ~/tobacco-tracker && " +
"sed -i 's/\r$//' setup-ec2.sh && " +
"chmod +x setup-ec2.sh && " +
"./setup-ec2.sh && " +
"cp .env.production .env && " +
"sudo docker compose up -d --build"

ssh -i $PemPath -o StrictHostKeyChecking=no "${Ec2User}@${Ec2Ip}" $RemoteCmd

Write-Host "Cleaning up..."
if (Test-Path bundle.tar.gz) { Remove-Item bundle.tar.gz }

Write-Host "========================================="
Write-Host "DEPLOYMENT COMPLETE!"
Write-Host "App URL: http://$Ec2Ip"
Write-Host "========================================="
