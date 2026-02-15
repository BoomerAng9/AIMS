# Task: Update to Main & Fix UI

## Status
- [x] Merge `origin/main` (Resolved conflicts using "theirs" to prioritize upstream).
- [x] Install missing frontend dependencies.
- [x] Verify Frontend Build (Passed locally).
- [x] **Critical**: Ensure Docker configuration is optimized for VPS (not local).
- [x] Restore/Verify Branding (A.I.M.S. / ACHEEVY identity).
- [x] Fix UI Regressions (Fonts, Layouts).
- [x] Dual-Domain Architecture (plugmein.cloud = lore, aimanagedsolutions.cloud = app).
- [x] Book of V.I.B.E. origin story and lore pages.
- [x] Character Gallery, Merch Store, About page.
- [x] Domain-aware SiteHeader, Hero with DO/EXPLORE split, Footer.
- [ ] **Deploy**: Push to `origin main` and trigger VPS deployment.

## Domain Architecture
- **plugmein.cloud** — LEARN: The Book of V.I.B.E., Character Gallery, Merch, About, Pricing
- **aimanagedsolutions.cloud** — DO: Chat w/ACHEEVY, Dashboard, Circuit Box, Model Garden, Deploy

## Next Steps
1. Merge this PR.
2. Push to `origin main`.
3. VPS deploy: `./deploy.sh`
4. Cloud Run deploy: `./infra/cloudrun/deploy-cloudrun.sh --all`
