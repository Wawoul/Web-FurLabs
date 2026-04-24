# Fur-Labs Deployment Guide

Deploy Fur-Labs on Debian 12 Turnkey NGINX (Proxmox)

## Prerequisites

- Proxmox server with Turnkey Debian 12 NGINX template
- Domain with DNS access (e.g., `furlabs.yourdomain.club`)
- Google AI API key (for AI features)

---

## 1. Create the VM/Container

1. Download template in Proxmox: `debian-12-turnkey-nginx-php-fastcgi_18.0-1_amd64.tar.gz`
2. Create new CT (Container) from template
3. Assign resources (recommended: 2 cores, 2GB RAM, 20GB disk)
4. Start the container and complete initial setup

---

## 2. Initial Server Setup

SSH into your server:

```bash
ssh root@your-server-ip
```

### Update System

```bash
apt update && apt upgrade -y
```

### Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### Verify installation

```bash
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x
```

### Install Git

```bash
apt install -y git
```

---

## 3. Clone Fur-Labs

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/Web-FurLabs.git furlabs
cd furlabs
```

### Install Dependencies

```bash
npm install
```

### Create Environment File

```bash
nano .env
```

Add the following:

```env
PORT=3000
NODE_ENV=production
NANOBANANA_API_KEY=your_google_ai_api_key_here
AI_PROVIDER=nanobanana
```

Save with `Ctrl+X`, `Y`, `Enter`

---

## 4. Configure NGINX

### Remove default site

```bash
rm /etc/nginx/sites-enabled/default
```

### Create Fur-Labs site config

```bash
nano /etc/nginx/sites-available/furlabs
```

Add:

```nginx
server {
    listen 80;
    server_name furlabs.yourdomain.club;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support (required for Socket.IO)
        proxy_read_timeout 86400;
    }

    # Increase max body size for image uploads
    client_max_body_size 50M;
}
```

### Enable the site

```bash
ln -s /etc/nginx/sites-available/furlabs /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 5. Setup PM2 (Process Manager)

### Install PM2

```bash
npm install -g pm2
```

### Start Fur-Labs with PM2

```bash
cd /var/www/furlabs
pm2 start server/index.js --name furlabs
```

### Save PM2 config and enable startup

```bash
pm2 save
pm2 startup
```

Run the command it outputs (looks like: `sudo env PATH=... pm2 startup systemd...`)

### Useful PM2 Commands

```bash
pm2 status          # Check status
pm2 logs furlabs    # View logs
pm2 restart furlabs # Restart app
pm2 stop furlabs    # Stop app
```

---

## 6. DNS Configuration

In your domain registrar/DNS provider, add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | furlabs | YOUR_SERVER_IP | 3600 |

Wait 5-15 minutes for DNS propagation.

---

## 7. SSL Certificate (HTTPS)

### Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Get SSL Certificate

```bash
certbot --nginx -d furlabs.yourdomain.club
```

Follow the prompts:
- Enter email
- Agree to terms
- Choose to redirect HTTP to HTTPS (recommended)

### Auto-renewal (already configured, but verify)

```bash
certbot renew --dry-run
```

---

## 8. Firewall Setup (Optional)

```bash
apt install -y ufw
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

---

## Updating Fur-Labs

SSH into server and run:

```bash
cd /var/www/furlabs
git pull origin main
npm install          # If dependencies changed
pm2 restart furlabs
```

### Quick Update Script

Create `/var/www/furlabs/update.sh`:

```bash
#!/bin/bash
cd /var/www/furlabs
git pull origin main
npm install
pm2 restart furlabs
echo "Update complete!"
```

Make executable:

```bash
chmod +x /var/www/furlabs/update.sh
```

Run updates with:

```bash
/var/www/furlabs/update.sh
```

---

## Troubleshooting

### Check if app is running

```bash
pm2 status
pm2 logs furlabs --lines 50
```

### Check NGINX

```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Check ports

```bash
ss -tlnp | grep 3000
```

### Restart everything

```bash
pm2 restart furlabs
systemctl restart nginx
```

### Git ownership error

If you see "dubious ownership" error:

```bash
git config --global --add safe.directory /var/www/furlabs
```

---

## File Permissions

If you have permission issues:

```bash
chown -R www-data:www-data /var/www/furlabs
chmod -R 755 /var/www/furlabs
```

---

## Directory Structure

```
/var/www/furlabs/
├── client/           # Frontend files
├── server/           # Backend Node.js
├── .env              # Environment variables
├── package.json      # Dependencies
└── update.sh         # Update script
```

---

## Quick Reference

| Task | Command |
|------|---------|
| View logs | `pm2 logs furlabs` |
| Restart app | `pm2 restart furlabs` |
| Update app | `/var/www/furlabs/update.sh` |
| Reload NGINX | `systemctl reload nginx` |
| Renew SSL | `certbot renew` |
| Check status | `pm2 status` |
