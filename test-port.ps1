$PEM = "C:\Users\vires\Downloads\process.pem"
$EC2 = "ec2-user@3.24.232.53"

ssh -i $PEM $EC2 'timeout 3 bash -c "cat < /dev/null > /dev/tcp/tobacco-tracker.cpqikwg4izyj.ap-southeast-2.rds.amazonaws.com/5432" && echo "✅ Port OPEN" || echo "❌ Port CLOSED"'
