# Deploying to AWS EC2 (Single Instance)

This guide explains how to deploy the Booking Engine monorepo on one EC2 instance using the existing unified `Dockerfile` and `docker-compose.aws.yml`.

This setup runs:

- API on port 3002
- CMS on port 3001
- Redis as a local sidecar container
- PostgreSQL externally (Neon or managed Postgres)

## Architecture

- VM: AWS EC2 Ubuntu 22.04 LTS
- Runtime: Docker + Docker Compose
- App pattern: single app container for API + CMS
- TLS and routing: Nginx + Certbot on EC2 host

## 1. Create the EC2 instance

Use these recommended settings:

- AMI: Ubuntu Server 22.04 LTS
- Instance: `t3.small` minimum, `t3.medium` recommended
- Disk: 30GB+ gp3
- Assign Elastic IP: yes (recommended)
- IAM role: optional (only if app uses AWS APIs)

Security group inbound rules:

- `22` SSH: source = your IP only
- `80` HTTP: source = 0.0.0.0/0
- `443` HTTPS: source = 0.0.0.0/0

If you use Nginx reverse proxy on host, do not expose `3001` and `3002` publicly.

## 2. Configure DNS

Create DNS records to point to your EC2 Elastic IP:

- `A` record: `api.yourdomain.com` -> `<elastic-ip>`
- `A` record: `app.yourdomain.com` -> `<elastic-ip>`
- Optional wildcard: `A` record `*.yourdomain.com` -> `<elastic-ip>`

## 3. Install Docker, Compose, Nginx, Certbot

SSH into EC2 and run:

```bash
sudo apt-get update -y
sudo apt-get upgrade -y

curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo usermod -aG docker ubuntu
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Reconnect so docker group membership is applied
exit
```

Reconnect and verify:

```bash
docker --version
docker compose version
nginx -v
```

## 4. Clone repository

```bash
git clone https://github.com/your-org/Booking-Engine-CMS.git booking-engine
cd booking-engine
```

## 5. Prepare environment variables

Use AWS env template from repo:

```bash
cp .env.aws.example .env
nano .env
```

Set these mandatory values:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `WEB_PROXY_SHARED_SECRET`
- `API_BASE_URL=https://api.yourdomain.com`
- `CMS_URL=https://app.yourdomain.com`
- `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
- `SITE_DOMAIN=yourdomain.com`
- `NEXT_PUBLIC_SITE_DOMAIN=yourdomain.com`
- `CORS_ORIGIN=https://app.yourdomain.com,https://yourdomain.com`

Optional values for Cloudflare and storage features:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- `R2_*`
- `PUBLISHED_SITES_BASE_URL`
- `ROUTING_INDEX_CURRENT_URL`

## 6. Build and start application

From repository root:

```bash
docker compose -f docker-compose.aws.yml up --build -d
```

View logs:

```bash
docker compose -f docker-compose.aws.yml logs -f app
```

Expected startup events:

- Prisma migration success
- API started
- CMS started

Quick local health checks:

```bash
curl -i http://127.0.0.1:3002/health
curl -I http://127.0.0.1:3001
```

## 7. Configure Nginx reverse proxy

Create Nginx site file:

```bash
sudo nano /etc/nginx/sites-available/booking-engine
```

Paste:

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

## 8. Enable HTTPS with Certbot

```bash
sudo certbot --nginx -d api.yourdomain.com -d app.yourdomain.com
sudo certbot renew --dry-run
```

For wildcard certificate (`*.yourdomain.com`), use DNS challenge with your DNS provider integration.

## 9. Validate production endpoints

- `https://api.yourdomain.com/health`
- `https://api.yourdomain.com/docs`
- `https://app.yourdomain.com/login`
- `https://app.yourdomain.com/preview/<instance-slug>`

Also verify tenant custom domains if using domain route mappings.

## 10. Maintenance and updates

Update deployment to latest code:

```bash
cd ~/booking-engine
git pull origin main
docker compose -f docker-compose.aws.yml up --build -d
```

Restart app only:

```bash
docker compose -f docker-compose.aws.yml restart app
```

Tail logs:

```bash
docker compose -f docker-compose.aws.yml logs -f app
```

Stop stack:

```bash
docker compose -f docker-compose.aws.yml down
```

## 11. Optional: auto-start with systemd

Create service:

```bash
sudo nano /etc/systemd/system/booking-engine.service
```

```ini
[Unit]
Description=Booking Engine Docker Compose Stack
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/booking-engine
ExecStart=/usr/bin/docker compose -f docker-compose.aws.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.aws.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable booking-engine.service
sudo systemctl start booking-engine.service
```

## 12. Security checklist

- Keep SSH key-only access enabled
- Restrict SSH source CIDR in security group
- Keep Ubuntu patched (`apt-get upgrade`)
- Rotate JWT and shared secrets periodically
- Keep backups for database and environment secrets
- Monitor logs and container restarts
