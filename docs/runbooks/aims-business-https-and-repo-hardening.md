# Runbook — aims.business HTTPS + `aims-storefront` Hardening

**Date:** 2026-06-25
**Domain:** `aims.business` → GitHub Pages (repo `BoomerAng9/aims-storefront`, branch `main`, static site)
**Status:** ✅ HTTPS secured + repo locked down · ⏳ 2 owner actions pending (domain verification, 2FA)

---

## Incident

`aims.business` showed **"Not Secure"** in browsers.

**Root cause:** GitHub Pages never provisioned a TLS certificate for the custom domain, so port 443 served the fallback `*.github.io` certificate (CN mismatch). `https_enforced` was `false`, so HTTP did not redirect to HTTPS.

**Not a compromise** — site content ("A.I.M.S. MARKETPLACE — by: ACHIEVEMOR") was fully intact. It is a static site (no server-side code), so this was purely a TLS/config issue.

---

## Resolution

### 1. HTTPS certificate

A same-value `PUT .../pages` (re-asserting the existing cname) did **not** trigger provisioning — the cert stayed absent for ~9 min. The reliable fix is to **remove + re-add the custom domain**, which forces a fresh Let's Encrypt request:

```sh
# remove (NOTE: briefly 404s the live domain during rebuild)
printf '%s' '{"cname":null,"source":{"branch":"main","path":"/"}}' \
  | gh api -X PUT repos/BoomerAng9/aims-storefront/pages --input -

# wait ~15s, then re-add
printf '%s' '{"cname":"aims.business","source":{"branch":"main","path":"/"}}' \
  | gh api -X PUT repos/BoomerAng9/aims-storefront/pages --input -
```

The cert state moved `absent → new → approved` in ~1 minute (a transient `errored` build status self-cleared). **Only after** `https_certificate.state == approved`, enable enforcement:

```sh
printf '%s' '{"cname":"aims.business","https_enforced":true,"source":{"branch":"main","path":"/"}}' \
  | gh api -X PUT repos/BoomerAng9/aims-storefront/pages --input -
```

**Verified:** cert `CN=aims.business` (Let's Encrypt) · `https://aims.business → 200` · `http → 301 → https` · HSTS active.

### 2. Repo lockdown (`aims-storefront`)

- **Branch protection on `main`:** force-pushes blocked, deletions blocked, `enforce_admins=true`. Normal pushes still allowed, so the Pages deploy flow is intact.
- **Secret scan:** GitHub history scan = 0 alerts; working-tree grep = clean (27 static files; no `.env`/keys).
- **Secret scanning + push protection:** both enabled → blocks any future commit containing a credential.

---

## Pending owner actions (require account / DNS access)

1. **Domain verification** (anti-hijack — prevents dangling-DNS takeover if the repo is renamed/deleted):
   GitHub → Settings → Pages → **Verify domain** → add the `TXT` record `_github-pages-challenge-BoomerAng9.aims.business` to DNS, then Verify.
2. **2FA** on the `BoomerAng9` GitHub account — the single biggest control; branch protection is moot if the account is phishable.

---

## Key lessons

- A **same-value cname `PUT` does NOT** re-trigger GitHub Pages cert provisioning. **Remove + re-add** the custom domain is the reliable trigger.
- Set `https_enforced: true` **only after** `https_certificate.state == approved`, or the API errors.
- Removing the cname briefly **404s the live domain** during the rebuild — do it only when downtime is acceptable, or use the Settings → Pages UI (atomic remove/re-add, no gap).
- Optional IPv6: add GitHub Pages AAAA records (`2606:50c0:8000::153`, `:8001::153`, `:8002::153`, `:8003::153`) alongside the existing A records.
