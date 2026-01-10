#!/bin/bash

# Local Deployment Script to EC2
# Usage: ./deploy.sh [path/to/process.pem]

PEM_PATH=${1:-"process.pem"}
EC2_IP="3.24.232.53"
USER="ec2-user"

echo "🚀 Preparing to deploy to EC2 ($EC2_IP)..."

if [ ! -f "$PEM_PATH" ]; then
    echo "❌ Error: $PEM_PATH not found. Please provide the path to your .pem file."
    exit 1
fi

# 1. Sync files (excluding node_modules and big folders)
echo "📦 Uploading files..."
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
    -e "ssh -i $PEM_PATH" . $USER@$EC2_IP:~/tobacco-tracker

# 2. Run setup and launch
echo "🏗️  Starting remote setup..."
ssh -i "$PEM_PATH" $USER@$EC2_IP "cd ~/tobacco-tracker && chmod +x setup-ec2.sh && ./setup-ec2.sh && cp .env.production .env && newgrp docker <<EONG
docker compose up -d --build
EONG"

echo "✅ Deployment triggered! Access your app at: http://$EC2_IP"
