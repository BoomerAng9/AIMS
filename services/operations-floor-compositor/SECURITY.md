# Compositor -- Security Posture

**Last audited:** 2026-04-19 by Gate 2.e production-hardening pass
**Policy:** zero high/critical vulnerabilities in runtime code; low/moderate
in third-party transitive deps documented here with rationale.

---

## npm audit summary

```
5 low severity vulnerabilities (as of 2026-04-19)
0 moderate / 0 high / 0 critical
```

All 5 vulnerabilities are transitive through **`@google-cloud/storage`**
(pinned at latest v7.19.0 — no newer version published). No upstream
fix is available. Listed below with rationale.

| Package | Severity | Advisory | Upstream status | Our mitigation |
|---|---|---|---|---|
| `tough-cookie` (via `teeny-request` → `@google-cloud/storage`) | low | Prototype pollution on unsanitized cookie input | Pending Google SDK refresh to a non-`teeny-request` HTTP stack | Compositor never parses external cookies; request path is server-to-server Cloud Run → GCS |
| `@tootallnate/once` (via `http-proxy-agent` → `teeny-request`) | low | Incorrect control flow scoping | Pending Google SDK refresh | No proxy is configured in our deployment; code path inactive |
| `http-proxy-agent` (via `teeny-request`) | low | Transitive of above | Pending Google SDK refresh | Same — no proxy configured |
| `retry-request` (via `@google-cloud/storage`) | low | Depends on vulnerable `teeny-request` | Pending Google SDK refresh | Upload path uses `resumable: false` — the vulnerable retry-with-redirect logic is not exercised |
| `teeny-request` (via `retry-request` → `@google-cloud/storage`) | low | Advisory rolls up the prior four | Pending Google SDK refresh | As above — not in the active code path |

### Fix trigger

Re-audit quarterly (or on any `@google-cloud/storage` version bump).
When Google publishes a v8+ with a replaced HTTP stack (the public
roadmap indicates migration to `gaxios` in a future release), upgrade
and delete this section.

## Runtime dev-dependency purge (2026-04-19)

Removed from `devDependencies` because the package was unused and
carried 5 moderate + 5 low vulnerabilities that had no runtime impact
but bloated the lockfile and audit surface:

- `vitest` (moderate: path traversal in Vite dev server, CORS bypass
  in esbuild dev server). Tests for the Compositor's client live in
  the `backend/uef-gateway/` jest suite — no test runner needed here.
- Transitive removals: `vite`, `vite-node`, `@vitest/mocker`,
  `esbuild`, plus their dev-only helpers.

## Supply chain

| Dependency source | Posture |
|---|---|
| Runtime npm packages | Pinned via `package-lock.json` with `npm ci`. Audit run on every build. |
| Docker base image | `node:20-bookworm-slim` -- LTS, refreshed on Debian security updates |
| Chromium | apt-installed from Debian bookworm-security channel |
| FFmpeg | apt-installed from Debian bookworm channel |
| Remotion Chrome shell | Downloaded from `remotion.media` at first run; verified via Remotion's bundled integrity check (bundled in `@remotion/renderer`) |

## Secrets + IAM

| Surface | Principle |
|---|---|
| `OPERATIONS_FLOOR_COMPOSITOR_URL` | Public Cloud Run URL, no bearer auth on `/compose` (protected by `allow-unauthenticated` + planned API-key middleware at Gate 3) |
| GCS write | Cloud Run service account (`939270059361-compute@developer.gserviceaccount.com`) has `roles/storage.objectAdmin` on `gs://operations-floor-outputs-foai` only -- no project-wide storage rights |
| GCP project | `foai-aims`; billing enabled; Artifact Registry repo `operations-floor-repo` scoped to `us-central1` |
| Secrets in env | None. Service reads only `PORT`, `GCP_PROJECT_ID`, `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`. |

## Known non-production gap — character matting

Current Remotion scene uses `mix-blend-mode: screen` to composite the
Seedance character over the Cosmos environment. This is **NOT
production-grade alpha** -- character edges bleed at low-luminance
zones. It was acceptable for the Gate 2.e smoke test but does NOT
satisfy the hardened production rule.

**Gate-2.e.2 fix (blocking merge of this service's PR):** swap to
either
1. a real matting service (rembg / MODNet / BiRefNet on a Cloud Run
   GPU instance) returning RGBA WebM for the character clip, or
2. FFmpeg `colorkey` filter in this service's pipeline with Seedance
   prompted to render on a solid-chromakey background.

Merge of PR #232 is **held** pending one of these two fixes landing.

## Review cadence

- Every release (PR merge to `main`): full `npm audit` run, zero new
  high/critical accepted
- Quarterly: full re-audit including Docker base image + apt packages
- On vendor release: reassess when `@google-cloud/storage` v8+ ships
