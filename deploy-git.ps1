$PemPath = "C:\Users\vires\Downloads\process.pem"
$Ec2Ip = "3.24.232.53"
$Ec2User = "ec2-user"
$RepoUrl = "git@github.com:Bruce-Wayne-Gotham/process-management.git"

Write-Host "Connecting to EC2 to clone and deploy via SSH..."

# Combine all commands: 
# 1. Cleanup old folder
# 2. Clone repo using SSH (key is already added)
# 3. Setup .env
# 4. Build images manually (to bypass buildx issues in compose)
# 5. Start containers
$RemoteCmd = "rm -rf ~/tobacco-tracker && " +
"git clone $RepoUrl ~/tobacco-tracker && " +
"cd ~/tobacco-tracker && " +
"if [ -f .env.production ]; then cp .env.production .env; fi && " +
"echo 'Building images...' && " +
"sudo DOCKER_BUILDKIT=0 docker build -t tobacco-tracker-app -f nextjs/Dockerfile . && " +
"sudo DOCKER_BUILDKIT=0 docker build -t tobacco-tracker-mcp mcp/gemini && " +
"echo 'Starting containers...' && " +
"sudo docker-compose up -d"

ssh -i $PemPath -o StrictHostKeyChecking=no "${Ec2User}@${Ec2Ip}" $RemoteCmd

Write-Host "========================================="
Write-Host "DEPLOYMENT VIA GIT CLONE (MANUAL BUILD) INITIATED!"
Write-Host "App URL: http://$Ec2Ip"
Write-Host "========================================="
