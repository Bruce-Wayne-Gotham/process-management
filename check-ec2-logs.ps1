# Connect to EC2 and check logs
$keyPath = "C:\Users\vires\Downloads\process.pem"
$ec2Host = "ec2-user@3.24.232.53"

Write-Host "Connecting to EC2 instance..." -ForegroundColor Green

# Check system logs
ssh -i $keyPath $ec2Host "sudo journalctl -n 50"

Write-Host "`n--- Application Logs ---" -ForegroundColor Yellow
# Check if there are any application logs
ssh -i $keyPath $ec2Host "ls -la /var/log/ && tail -n 50 /var/log/messages"
