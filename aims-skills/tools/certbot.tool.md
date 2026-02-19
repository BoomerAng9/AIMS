---
id: "certbot"
name: "Certbot / Let's Encrypt"
type: "tool"
category: "infra"
provider: "Let's Encrypt"
description: "Automated SSL/TLS certificate provisioning and renewal via Let's Encrypt."
env_vars: []
docs_url: "https://certbot.eff.org/docs/"
aims_files:
  - "infra/docker-compose.prod.yml"
  - "deploy.sh"
---

# Certbot / Let's Encrypt — SSL Tool Reference

## Overview

Certbot automates SSL certificate provisioning from Let's Encrypt. In AIMS, it runs as a Docker sidecar that issues certs on first deploy and renews every 12 hours.

## No API Keys Required

Let's Encrypt is free and uses ACME protocol — no API key needed. Just needs domain validation (HTTP-01 challenge).

## Docker Setup

```yaml
certbot:
  image: certbot/certbot
  volumes:
    - certbot-webroot:/var/www/certbot
    - certbot-certs:/etc/letsencrypt
  entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
```

## Initial Certificate Issuance

Run by `deploy.sh`:
```bash
certbot certonly --webroot \
  -w /var/www/certbot \
  -d plugmein.cloud \
  -d aimanagedsolutions.cloud \
  --email admin@aimanagedsolutions.cloud \
  --agree-tos --no-eff-email
```

## Certificate Locations

| File | Path |
|------|------|
| Full chain | `/etc/letsencrypt/live/plugmein.cloud/fullchain.pem` |
| Private key | `/etc/letsencrypt/live/plugmein.cloud/privkey.pem` |

## Renewal
- Automatic: every 12 hours via Docker entrypoint
- Manual: `docker exec aims-certbot certbot renew`
- Certs expire after 90 days

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Challenge failed | Ensure port 80 is open and Nginx serves `.well-known/acme-challenge` |
| Rate limited | Let's Encrypt has 5 certs/domain/week limit; use staging for testing |
| Cert not found | Check volume mount: `certbot-certs:/etc/letsencrypt` |
