$Ec2Ip = "3.24.232.53"
$Ec2User = "ec2-user"
$PemPath = "C:\Users\vires\Downloads\process.pem"

Write-Host "Initialing local git repo..."
if (!(Test-Path .git)) {
    git init
}

Write-Host "Adding EC2 remote..."
# Remove if exists
git remote remove ec2 2>$null
git remote add ec2 "ssh://${Ec2User}@${Ec2Ip}/home/ec2-user/tobacco-tracker.git"

# Configure SSH for git to use the PEM key automatically for this remote
Write-Host "Configuring SSH for this remote..."
git config core.sshCommand "ssh -i '$PemPath' -o StrictHostKeyChecking=no"

Write-Host "========================================="
Write-Host "✅ GIT REMOTE SET UP!"
Write-Host "To deploy, just run:"
Write-Host "git add ."
Write-Host "git commit -m 'deploy'"
Write-Host "git push ec2 master"
Write-Host "========================================="
