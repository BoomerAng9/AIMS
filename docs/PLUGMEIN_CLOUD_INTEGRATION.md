# PlugMeIn.Cloud Integration Plan

**Document Version:** 1.1
**Created:** 2026-02-09
**Status:** Active

---

## Your Stack

| Layer | Service |
|-------|---------|
| **Compute** | Hostinger VPS Cloud Startup (KVM @ 76.13.96.107) |
| **CI/CD** | GCP Cloud Build → Cloud Run |
| **Auth** | Firebase Authentication |
| **Database** | Firebase Firestore |
| **Storage** | Firebase Storage |
| **Frontend** | Vercel (or VPS with Docker) |

---

## Domain Architecture

```
plugmein.cloud (Root Domain)
├── aims.plugmein.cloud      → Main A.I.M.S. Frontend
├── api.aims.plugmein.cloud  → API Gateway (VPS)
├── luc.plugmein.cloud       → LUC Billing Service
└── www.plugmein.cloud       → Marketing/Landing Page
```

---

## 5-Phase Integration Plan (Your Stack)

### Phase 1: DNS & SSL on Hostinger

**Configure in Hostinger DNS Manager:**

```
# A Records (point to VPS IP)
A    @              76.13.96.107
A    aims           76.13.96.107
A    api.aims       76.13.96.107
A    luc            76.13.96.107
A    www            76.13.96.107
```

**SSL with Certbot on VPS:**

```bash
# SSH to VPS
ssh root@76.13.96.107

# Install certbot
apt update && apt install -y certbot

# Get wildcard cert
certbot certonly --manual --preferred-challenges=dns \
  -d "plugmein.cloud" \
  -d "*.plugmein.cloud" \
  -d "*.aims.plugmein.cloud"

# Or individual certs
certbot certonly --standalone -d aims.plugmein.cloud
certbot certonly --standalone -d api.aims.plugmein.cloud
certbot certonly --standalone -d luc.plugmein.cloud
```

---

### Phase 2: Environment Variables

**On VPS (`/root/aims/.env`):**

```env
# Domain
NEXT_PUBLIC_APP_URL=https://aims.plugmein.cloud
NEXTAUTH_URL=https://aims.plugmein.cloud

# Firebase (from Firebase Console → Project Settings)
FIREBASE_PROJECT_ID=ai-managed-services
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@ai-managed-services.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# GCP
GCP_PROJECT_ID=ai-managed-services
GCP_PROJECT_NUMBER=1008658271134

# n8n (on VPS)
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_KEY=<your-n8n-key>

# Auth
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

**In GCP Secret Manager:**

```bash
# Store secrets
echo -n "your-secret-value" | gcloud secrets create NEXTAUTH_SECRET --data-file=-
echo -n "your-firebase-key" | gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=-
```

---

### Phase 3: Firebase Setup

**Firebase Console → ai-managed-services:**

1. **Authentication** → Enable Email/Password + Google Sign-In
2. **Firestore** → Create database in production mode
3. **Hosting** (optional) → Can use for static assets

**Firestore Security Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // LUC accounts
    match /luc_accounts/{accountId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
  }
}
```

---

### Phase 4: Deploy to Hostinger VPS

**Docker Compose on VPS:**

```bash
ssh root@76.13.96.107

cd /root/aims
git pull origin main

# Deploy all services
docker compose -f infra/docker-compose.production.yml up -d

# Check status
docker ps
```

**Nginx Config (`/etc/nginx/sites-available/aims`):**

```nginx
# aims.plugmein.cloud → Frontend
server {
    listen 443 ssl http2;
    server_name aims.plugmein.cloud;

    ssl_certificate /etc/letsencrypt/live/plugmein.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/plugmein.cloud/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# api.aims.plugmein.cloud → Backend API
server {
    listen 443 ssl http2;
    server_name api.aims.plugmein.cloud;

    ssl_certificate /etc/letsencrypt/live/plugmein.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/plugmein.cloud/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# luc.plugmein.cloud → LUC Service
server {
    listen 443 ssl http2;
    server_name luc.plugmein.cloud;

    ssl_certificate /etc/letsencrypt/live/plugmein.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/plugmein.cloud/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable and reload
ln -s /etc/nginx/sites-available/aims /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

### Phase 5: GCP Cloud Build Pipeline

**`cloudbuild.yaml` triggers on push to main:**

```yaml
steps:
  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/aims-frontend', './frontend']

  # Push to GCR
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/aims-frontend']

  # Deploy to Cloud Run (or SSH to VPS)
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'aims-frontend'
      - '--image=gcr.io/$PROJECT_ID/aims-frontend'
      - '--region=us-central1'
      - '--platform=managed'
```

**Or deploy to VPS via SSH:**

```yaml
  - name: 'gcr.io/cloud-builders/gcloud'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gcloud compute ssh aims-vps --command="cd /root/aims && git pull && docker compose up -d --build"
```

---

## Quick Deploy Commands

```bash
# From local machine
cd AIMS

# Push to trigger Cloud Build
git push origin main

# Or manual VPS deploy
ssh root@76.13.96.107 "cd /root/aims && git pull && docker compose -f infra/docker-compose.production.yml up -d --build"

# Check logs
ssh root@76.13.96.107 "docker logs aims-frontend --tail 100"
```

---

## Service Ports on VPS

| Service | Port | Domain |
|---------|------|--------|
| Frontend | 3000 | aims.plugmein.cloud |
| Backend API | 8000 | api.aims.plugmein.cloud |
| LUC | 3001 | luc.plugmein.cloud |
| n8n | 5678 | (internal only) |
| Nginx | 80, 443 | All domains |

---

## Verification Checklist

```bash
# Test SSL
curl -I https://aims.plugmein.cloud
curl -I https://api.aims.plugmein.cloud/api/health
curl -I https://luc.plugmein.cloud

# Test Firebase connection
curl https://aims.plugmein.cloud/api/health

# Check Docker services on VPS
ssh root@76.13.96.107 "docker ps"
```

---

*Last updated: 2026-02-09*
