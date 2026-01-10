#!/bin/bash
# Run this on EC2 after pointing your domain to the server

DOMAIN="yourdomain.com"  # Replace with your domain

# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Stop nginx temporarily
docker compose stop nginx

# Get SSL certificate
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m your-email@example.com

# Update nginx config
cat > nginx-ssl.conf << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Update docker-compose to mount SSL certs
cat >> docker-compose.yml << 'EOF'

    volumes:
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - "443:443"
EOF

# Restart
docker compose up -d

echo "SSL setup complete! Visit https://$DOMAIN"
