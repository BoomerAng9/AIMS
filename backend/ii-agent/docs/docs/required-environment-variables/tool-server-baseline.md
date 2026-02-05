---
id: tool-server-baseline
title: Tool Server Baseline Storage
slug: /required-environment-variables/tool-server-baseline
sidebar_position: 16
---

The tool server writes artifacts (reports, logs, downloads) to Google Cloud Storage. Configure a bucket that is either dedicated to the tool server or has the correct IAM bindings.

## `STORAGE_CONFIG__GCS_BUCKET_NAME`

1. Create or reuse a GCS bucket that the tool server can write to (see [Storage Buckets and Domains](./storage.md) for creation steps).
2. Give the service account referenced by `GOOGLE_APPLICATION_CREDENTIALS` at least `Storage Object Admin` on the bucket.
3. Enter the bucket name in `.stack.env`.

## `STORAGE_CONFIG__GCS_PROJECT_ID`

- Project ID that owns the bucket above. Needed so the tool server client builds fully-qualified resource paths.

## Validation Checklist

1. Trigger a tool execution that produces artifacts (e.g., export a report).
2. Confirm new files appear in the bucket you configured.
