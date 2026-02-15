# Secrets Reference

**NEVER commit actual secrets. This file documents WHERE they live.**

---

## Local Development

**File:** `frontend/.env.local` (gitignored)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<from-1password-or-generate>

# Firebase
FIREBASE_PROJECT_ID=ai-managed-services
FIREBASE_CLIENT_EMAIL=<from-firebase-console>
FIREBASE_PRIVATE_KEY=<from-firebase-console>

# API Keys
OPENROUTER_API_KEY=<from-openrouter.ai>
ELEVENLABS_API_KEY=<from-elevenlabs.io>
GROQ_API_KEY=<from-console.groq.com>

# n8n
N8N_API_KEY=<from-vps-n8n-instance>
```

---

## Production (VPS)

**File:** `/root/aims/.env` on 76.13.96.107

```bash
# SSH to view/edit
ssh root@76.13.96.107 "cat /root/aims/.env"
ssh root@76.13.96.107 "nano /root/aims/.env"
```

---

## GCP Secret Manager

**Project:** ai-managed-services

```bash
# List secrets
gcloud secrets list --project=ai-managed-services

# View a secret
gcloud secrets versions access latest --secret=NEXTAUTH_SECRET

# Create/update a secret
echo -n "new-value" | gcloud secrets create SECRET_NAME --data-file=-
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

**Secrets stored:**
- `NEXTAUTH_SECRET`
- `FIREBASE_PRIVATE_KEY`
- `OPENROUTER_API_KEY`
- `ELEVENLABS_API_KEY`

---

## Firebase Console

**URL:** https://console.firebase.google.com/project/ai-managed-services

**Location:** Project Settings → Service Accounts → Generate New Private Key

---

## Vercel (if using)

**URL:** https://vercel.com/[your-team]/aims/settings/environment-variables

---

## Generate New Secrets

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# Random API key
openssl rand -hex 32
```

---

## Quick Copy Template

```env
# === A.I.M.S. Environment Variables ===
# Copy this template and fill in values

NEXT_PUBLIC_APP_URL=https://aims.plugmein.cloud
NEXTAUTH_URL=https://aims.plugmein.cloud
NEXTAUTH_SECRET=

# Firebase
FIREBASE_PROJECT_ID=ai-managed-services
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# GCP
GCP_PROJECT_ID=ai-managed-services
GCP_PROJECT_NUMBER=1008658271134

# APIs
OPENROUTER_API_KEY=
ELEVENLABS_API_KEY=
GROQ_API_KEY=
DEEPGRAM_API_KEY=

# n8n (VPS internal)
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_KEY=
```
