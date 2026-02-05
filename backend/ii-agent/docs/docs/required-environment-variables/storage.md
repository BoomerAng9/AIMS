---
id: storage
title: Storage Buckets and Domains
slug: /required-environment-variables/storage
sidebar_position: 14
---

The stack writes generated artifacts (slides, uploads, avatars) to Google Cloud Storage. Configure dedicated buckets per asset class so you can apply fine-grained IAM policies later.

## Bucket Variables

For each pair below, repeat the same process:

| Purpose | Variables |
| --- | --- |
| Slide deck rendering | `SLIDE_ASSETS_PROJECT_ID`, `SLIDE_ASSETS_BUCKET_NAME` |
| General uploads | `FILE_UPLOAD_PROJECT_ID`, `FILE_UPLOAD_BUCKET_NAME` |
| Avatar uploads | `AVATAR_PROJECT_ID`, `AVATAR_BUCKET_NAME` |

1. In Google Cloud Console, choose the project that should own the assets. Note its project ID.
2. Go to **Cloud Storage → Buckets → Create** and create a bucket with globally unique name (e.g., `ii-dev-slide-assets`).
3. Assign IAM roles so the service account referenced by `GOOGLE_APPLICATION_CREDENTIALS` can write to the bucket (`Storage Object Admin` is sufficient for dev).
4. Record the project ID and bucket name in `docker/.stack.env`.
5. Repeat for each asset category or reuse the same bucket if segregation is unnecessary in dev.

## `CUSTOM_DOMAIN`

- Used for shareable URLs (e.g., `sfile.ii.inc`). Locally you can keep the default value.
- When deploying to a custom domain, ensure DNS points to the CDN/proxy hosting your assets and update the env variable to match.

