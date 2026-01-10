#!/bin/bash
set -e

echo "🚑 Starting Rescue Operation..."

# 1. Clean up broken plugins
echo "🧹 Removing custom plugins..."
sudo rm -f /usr/local/bin/docker-compose
sudo rm -f /usr/local/bin/docker-buildx
sudo rm -rf /usr/local/lib/docker/cli-plugins
sudo rm -rf ~/.docker/cli-plugins
sudo rm -rf /usr/libexec/docker/cli-plugins

# 2. Setup Swap (Critical for t3.micro)
echo "💾 Setting up 2GB Swap..."
if [ ! -f /swapfile ]; then
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap created!"
else
    echo "✅ Swap already exists."
fi

# 3. Re-install Docker Compose (Standalone, Simple)
echo "📦 reinstalling clean Docker Compose..."
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/bin/docker-compose
sudo chmod +x /usr/bin/docker-compose

# 4. Restart Docker
sudo systemctl restart docker

echo "✅ Rescue Complete! RAM is valid and plugins are clean."
