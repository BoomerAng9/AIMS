---
id: optional-media-generation
title: Media Generation (Optional)
sidebar_position: 11
slug: /optional-environment-variables/media-generation
---

The tool server can call Google AI Studio / Vertex AI models to generate images and videos. When these variables are unset the agents fall back to DuckDuckGo image search (for images) and skip video generation entirely.

## Image Generation Variables

| Variable | Description |
| --- | --- |
| `IMAGE_GENERATE_GCP_PROJECT_ID` | Google Cloud project that owns the Vertex or GenAI resources for image generation. |
| `IMAGE_GENERATE_GCP_LOCATION` | Region where the model is deployed (e.g., `us-central1`). |
| `IMAGE_GENERATE_GCS_OUTPUT_BUCKET` | Bucket where generated assets are written before they are handed back to the agent. |
| `IMAGE_GENERATE_GOOGLE_AI_STUDIO_API_KEY` | API key issued by Google AI Studio that authorizes direct calls to the image model. |

## Video Generation Variables

| Variable | Description |
| --- | --- |
| `VIDEO_GENERATE_GCP_PROJECT_ID` | Project ID that hosts your video-generation pipelines. |
| `VIDEO_GENERATE_GCP_LOCATION` | Region for the video model (`us-central1` works for most deployments). |
| `VIDEO_GENERATE_GCS_OUTPUT_BUCKET` | Bucket for intermediate/exported video files. |
| `VIDEO_GENERATE_GOOGLE_AI_STUDIO_API_KEY` | Google AI Studio key that has access to video models. |

## Setup Checklist

1. Enable the Vertex AI API inside the specified project(s) and grant the service account referenced by `GOOGLE_APPLICATION_CREDENTIALS` permission to use the models and write to the buckets.
2. Create the GCS buckets listed above (enable uniform bucket-level access and versioning if you need stronger controls).
3. Generate an API key inside Google AI Studio that has the correct project/region scope and paste it into the relevant variable(s).
4. Restart the tool server after updating the environment file; verify generation by asking the agent for a new image/video and checking the bucket for outputs.
