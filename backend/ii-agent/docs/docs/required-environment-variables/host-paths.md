---
id: host-paths
title: Host Paths
slug: /required-environment-variables/host-paths
sidebar_position: 12
---

These variables point to files that live outside Docker but must be mounted into containers for credentials. Keep the referenced files in secure directories and avoid checking them into source control.

## `GOOGLE_APPLICATION_CREDENTIALS`

1. In Google Cloud Console, open **IAM & Admin → Service Accounts** and select/create the account used for storage or Vertex AI access.
2. Choose **Keys → Add key → Create new key → JSON** to download a service-account JSON file.
3. Move the JSON to a safe location on your workstation (for example `~/.config/gcloud/ii-service-account.json`) and restrict file permissions (`chmod 600`).
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of that file. Docker will mount it into the containers defined in `docker/docker-compose.stack.yaml`.
5. Update the path if you rotate the key or switch laptops.

