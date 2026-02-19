---
id: "certbot"
name: "SSL / TLS Certificates"
type: "tool"
category: "infra"
provider: "Hostinger"
description: "SSL/TLS certificates managed by Hostinger Lifetime SSL. No manual cert provisioning needed."
env_vars: []
docs_url: "https://support.hostinger.com/en/articles/1583403-what-is-lifetime-ssl"
aims_files:
  - "infra/docker-compose.prod.yml"
  - "deploy.sh"
---

# SSL / TLS Certificates — Hostinger Lifetime SSL

## Overview

SSL certificates for both AIMS domains are managed by Hostinger Lifetime SSL. Certificates are auto-provisioned, auto-renewed, and never expire. No certbot or ACME challenges are needed.

## Domains Covered

| Domain | SSL Type | Status | Expires |
|--------|----------|--------|---------|
| plugmein.cloud | Hostinger Lifetime SSL | Active | Never |
| aimanagedsolutions.cloud | Hostinger Lifetime SSL | Active | Never |

## How It Works

1. Hostinger manages certificate lifecycle automatically
2. Certs are available on the VPS host at `/etc/letsencrypt/live/<domain>/`
3. The nginx container bind-mounts `/etc/letsencrypt` read-only
4. `deploy.sh` activates HTTPS server blocks pointing to these certs

## Certificate Locations

| File | Path |
|------|------|
| Full chain (plugmein.cloud) | `/etc/letsencrypt/live/plugmein.cloud/fullchain.pem` |
| Private key (plugmein.cloud) | `/etc/letsencrypt/live/plugmein.cloud/privkey.pem` |
| Full chain (aimanagedsolutions.cloud) | `/etc/letsencrypt/live/aimanagedsolutions.cloud/fullchain.pem` |
| Private key (aimanagedsolutions.cloud) | `/etc/letsencrypt/live/aimanagedsolutions.cloud/privkey.pem` |

## Deploy Command

```bash
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud
```

No `--email` or `--ssl-renew` flags needed — Hostinger handles everything.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Cert not found on host | Check Hostinger hPanel → Security → SSL Certificate |
| HTTPS not working | Run `deploy.sh --domain ...` to activate nginx HTTPS blocks |
| Cert path different | Hostinger may use a different path — check hPanel for details |
