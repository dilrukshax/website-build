# Deploying to Azure (Single VM, Docker Compose)

This guide is the most straightforward path to run this project on Azure with minimal architecture changes.

It reuses the existing unified container model:

- API on port 3002
- CMS on port 3001
- Redis as local sidecar (or Azure Cache for Redis)
- PostgreSQL externally (recommended: Azure Database for PostgreSQL Flexible Server)

## Architecture

- Compute: Azure Virtual Machine (Ubuntu 22.04 LTS)
- Runtime: Docker + Docker Compose
- App pattern: single app container (API + CMS)
- TLS/routing: Nginx + Certbot on VM

## 1. Create Azure resource group

```bash
az group create --name rg-booking-engine-prod --location eastus
```

## 2. Create VM (Ubuntu)

```bash
az vm create \
  --resource-group rg-booking-engine-prod \
  --name vm-booking-engine-prod \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys
```

Recommended minimum size: Standard_B2s. For more traffic, use Standard_D2s_v5 or higher.

## 3. Open required ports in NSG

```bash
az vm open-port --resource-group rg-booking-engine-prod --name vm-booking-engine-prod --port 22
az vm open-port --resource-group rg-booking-engine-prod --name vm-booking-engine-prod --port 80
az vm open-port --resource-group rg-booking-engine-prod --name vm-booking-engine-prod --port 443
```

If using Nginx reverse proxy, do not expose 3001/3002 publicly.

## 4. (Recommended) Create PostgreSQL Flexible Server

```bash
az postgres flexible-server create \
  --resource-group rg-booking-engine-prod \
  --name booking-engine-pg-prod \
  --location eastus \
  --admin-user dbadmin \
  --admin-password '<STRONG_PASSWORD>' \
  --sku-name Standard_B1ms \
  --version 16 \
  --storage-size 32
```

Then create DB:

```bash
az postgres flexible-server db create \
  --resource-group rg-booking-engine-prod \
  --server-name booking-engine-pg-prod \
  --database-name booking_engine
```

Ensure connectivity from VM to DB (private networking preferred).

## 5. (Optional) Create Azure Cache for Redis

If you want managed Redis instead of local container:

```bash
az redis create \
  --resource-group rg-booking-engine-prod \
  --name booking-engine-redis-prod \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

Set REDIS_URL accordingly in env:

- redis://:password@your-cache.redis.cache.windows.net:6380

## 6. Point DNS to VM public IP

Create DNS records at your provider:

- A record: api.yourdomain.com -> VM public IP
- A record: app.yourdomain.com -> VM public IP
- Optional wildcard: *.yourdomain.com -> VM public IP

## 7. SSH into VM and install Docker stack

```bash
ssh azureuser@<VM_PUBLIC_IP>

sudo apt-get update -y
sudo apt-get upgrade -y

curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo usermod -aG docker azureuser
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Log out and reconnect so docker group membership applies.

## 8. Clone repository and prepare env

```bash
git clone <YOUR_REPO_URL> booking-engine
cd booking-engine
cp .env.azure.example .env
nano .env
```

Set these mandatory values:

- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- WEB_PROXY_SHARED_SECRET
- API_BASE_URL=https://api.yourdomain.com
- CMS_URL=https://app.yourdomain.com
- NEXT_PUBLIC_API_URL=https://api.yourdomain.com
- SITE_DOMAIN=yourdomain.com
- NEXT_PUBLIC_SITE_DOMAIN=yourdomain.com
- CORS_ORIGIN=https://app.yourdomain.com,https://yourdomain.com

## 9. Build and run containers

```bash
docker compose -f docker-compose.azure.yml up --build -d
```

Check logs:

```bash
docker compose -f docker-compose.azure.yml logs -f app
```

Expected startup sequence:

- Prisma migrations succeed
- API starts on 3002
- CMS starts on 3001

## 10. Configure Nginx reverse proxy

Create site config:

```bash
sudo nano /etc/nginx/sites-available/booking-engine
```

Use this config:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name app.yourdomain.com *.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/booking-engine /etc/nginx/sites-enabled/booking-engine
sudo nginx -t
sudo systemctl reload nginx
```

## 11. Enable HTTPS with Certbot

```bash
sudo certbot --nginx -d api.yourdomain.com -d app.yourdomain.com
sudo certbot renew --dry-run
```

If you need wildcard TLS for *.yourdomain.com, use DNS challenge with your DNS provider.

## 12. Validate endpoints

- https://api.yourdomain.com/health
- https://api.yourdomain.com/docs
- https://app.yourdomain.com/login

## 13. Update and maintain

```bash
cd ~/booking-engine
git pull origin main
docker compose -f docker-compose.azure.yml up --build -d
```

Restart only app:

```bash
docker compose -f docker-compose.azure.yml restart app
```

Tail logs:

```bash
docker compose -f docker-compose.azure.yml logs -f app
```

Stop stack:

```bash
docker compose -f docker-compose.azure.yml down
```

## 14. Security checklist

- Keep SSH key auth only
- Restrict source IP for port 22
- Keep OS patched
- Rotate secrets regularly
- Store secrets in Azure Key Vault if possible
- Back up PostgreSQL regularly
