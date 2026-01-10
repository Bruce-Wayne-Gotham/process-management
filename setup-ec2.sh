#!/bin/bash
set -e

echo "Starting Tobacco Tracker EC2 Setup (Amazon Linux 2023)"

# 0. Setup Swap (Critical for t3.micro)
echo "💾 Checking Swap..."
if [ ! -f /swapfile ]; then
    echo "Creating 2GB Swap..."
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap created!"
else
    echo "✅ Swap already exists."
fi

# 1. Update and Install Git & Docker
echo "Installing Git and Docker..."
sudo dnf update -y
sudo dnf install -y git docker

# 2. Install Docker Compose (V2) Global Plugin
echo "Installing Docker Compose Global Plugin..."
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# 3. Install Docker Buildx Global Plugin
echo "Installing Docker Buildx Global Plugin..."
sudo curl -SL https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-amd64 -o /usr/libexec/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-buildx

# 4. Configure Docker
echo "Configuring Docker permissions..."
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# 5. Verify Installations
echo "Verifying versions:"
docker version
git --version
docker compose version
docker buildx version

echo "✅ Setup Complete!"
