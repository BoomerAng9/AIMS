---
id: "nginx"
name: "Nginx"
type: "tool"
category: "infra"
provider: "Nginx"
description: "Reverse proxy routing traffic to frontend, UEF Gateway, and services with SSL termination."
env_vars: []
docs_url: "https://nginx.org/en/docs/"
aims_files:
  - "infra/nginx/nginx.conf"
  - "infra/nginx/ssl-landing.conf.template"
  - "infra/docker-compose.prod.yml"
---

# Nginx — Reverse Proxy Tool Reference

## Overview

Nginx serves as the reverse proxy for all AIMS traffic. It terminates SSL (via Let's Encrypt), routes requests to the correct backend service, and serves static assets. Deployed as a Docker container in the production stack.

## No API Keys Required

Nginx is infrastructure — configured via config files, not API keys.

## Configuration Files

| File | Purpose |
|------|---------|
| `infra/nginx/nginx.conf` | Main config — upstream routing, SSL, headers |
| `infra/nginx/ssl-landing.conf.template` | Landing domain SSL config |

## Routing

| URL Pattern | Backend | Port |
|-------------|---------|------|
| `plugmein.cloud/*` | Frontend (Next.js) | 3000 |
| `plugmein.cloud/api/*` | UEF Gateway | 3001 |
| `plugmein.cloud/n8n/*` | n8n Automation | 5678 |

## Key Config Sections

```nginx
# SSL termination
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/plugmein.cloud/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/plugmein.cloud/privkey.pem;

# Frontend
location / {
    proxy_pass http://frontend:3000;
}

# API Gateway
location /api/ {
    proxy_pass http://uef-gateway:3001;
}
```

## Docker Setup

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    - certbot-certs:/etc/letsencrypt
    - certbot-webroot:/var/www/certbot
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | Backend service not running; check `docker ps` |
| SSL error | Check certbot certs exist; run `certbot renew` |
| Config syntax error | `nginx -t` to validate config |
| Redirect loop | Check `proxy_set_header Host` is set correctly |
