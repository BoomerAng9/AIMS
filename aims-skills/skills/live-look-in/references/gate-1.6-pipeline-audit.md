# Gate 1.6 — Pipeline Audit & Integration Strategy

**Closes:** Research Phase 1 (from `extended-stack-nvidia-research-2026-04-18.txt`)
**Unblocks:** Gate 2 (Puter-native UI/UX + asset pipeline POC)
**Drafted:** 2026-04-18

This document fixes the exact input/output contract between every model in the 3D Operations Floor pipeline, so each stage can be built and tested in isolation. Read this *before* writing any integration code.

---

## Text pipeline diagram (end-to-end)

```
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 0  User / CRUCIBLE event                                  │
│   IN  : customer brief OR Planner/Generator/Judge_Hawk event    │
│   OUT : structured event envelope                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 1  Event Translator (new module)                          │
│   IN  : event envelope                                          │
│   OUT : { narrative, cast[], scene_hint, verb, camera_intent }  │
│   TECH: Python module in backend orchestrator                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2  Storyboard / Pre-Viz                                   │
│   IN  : narrative + scene_hint (text)                           │
│   OUT : short reference video clip (5–8s, 720p, MP4)            │
│   TECH: Seedance 2.0 via fal.ai (Kie.ai fallback)               │
│   REF : iller-ang/references/seedance-video.md                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 3  Headless 3D Proxy World                                │
│   IN  : Seedance reference video + scene_hint                   │
│   OUT : navigable USD scene + camera path                       │
│   TECH: Project Lyra (or equivalent headless 3D engine)         │
│   NOTE: the proxy LOCKS geometry — Cosmos won't hallucinate     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 4  Spatial Control Emission                               │
│   IN  : USD scene + camera path                                 │
│   OUT : per-frame bundle {                                      │
│           depth_16bit.exr,                                      │
│           canny.png,                                            │
│           camera_pose.json (position, rotation, fov)            │
│         }                                                       │
│   TECH: Headless render pass (USD → OpenEXR / PNG)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 5  Photoreal Environment Render                           │
│   IN  : control bundle + narrative prompt (text)                │
│   OUT : photoreal environment frame sequence (PNG, 1080p)       │
│   TECH: NVIDIA Cosmos-Transfer2.5 NIM on GCP Cloud Run GPU      │
│         (L4 dev, A100 80GB prod)                                │
│   NOTE: non-hallucinating — spatial controls constrain geometry │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 6  Character Motion Track (parallel to Stage 5)           │
│   IN  : character reference PNG + verb + camera_pose.json       │
│   OUT : character clip with alpha channel (MOV/WebM, 1080p)     │
│   TECH: PRIMARY    — Seedance 2.0 image-to-video via fal.ai     │
│         FALLBACK   — Open Higgsfield (self-hosted, if alpha     │
│                      from Seedance isn't clean enough)          │
│         NARRATED   — daVinci-MagiHuman via fal.ai for           │
│                      talking-head lip sync only                 │
│   REF : iller-ang/references/seedance-video.md                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 7  AI Upscale (both tracks)                               │
│   IN  : environment frames + character clip                     │
│   OUT : upscaled frames + upscaled character clip (4K)          │
│   TECH: Real-ESRGAN or AuraSR (open-source, GPU-bound)          │
│   NOTE: runs BEFORE Remotion; Remotion doesn't upscale          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 8  Composition                                            │
│   IN  : upscaled environment + upscaled character               │
│   OUT : composited video (4K, no audio) — programmatic timeline │
│   TECH: Remotion (React timeline, server-side render)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 9  Audio Mux + Final Encode                               │
│   IN  : composited video + (optional) audio track               │
│   OUT : final MP4 (H.264 or H.265), 4K, captioned if needed     │
│   TECH: FFmpeg                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 10  Storage + Delivery                                    │
│   IN  : final MP4                                               │
│   OUT : URL for browser delivery                                │
│   TECH: Puter.fs (primary) + Cloudflare R2 (cache fallback)     │
│   PATH: WebRTC live stream (Gate 3+) OR MP4 via <video>         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 11  Cleanup                                               │
│   Purge within 60s of final-MP4 delivery:                       │
│     • USD scene files                                           │
│     • 16-bit depth maps                                         │
│     • raw PNG frame sequences                                   │
│     • intermediate character clips                              │
│   KEEP: final MP4 + upscaled character reference (for reuse)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Model hand-off contracts (canonical)

Each row defines one edge in the DAG. Inputs MUST match the upstream stage's output; any schema drift = pipeline break.

| Edge | From → To | Data contract |
|---|---|---|
| E1 | Event → Translator | JSON envelope `{ event_id, event_type, payload, cast_hints[] }` |
| E2 | Translator → Seedance | `{ narrative: str, scene_hint: str, duration_s: int, style_tags: [] }` |
| E3 | Seedance → Proxy World | `{ reference_video_url, scene_hint, camera_intent }` — video file + text |
| E4 | Proxy World → Control Emitter | `{ usd_scene_path, camera_path: [pose, …] }` — USD + keyframes |
| E5 | Control Emitter → Cosmos | per-frame `{ depth_16bit.exr, canny.png, pose.json }` + prompt text |
| E6 | Cosmos → Compositor | frame-sequence path `environment/%04d.png` |
| E7 | Translator → Character Motion | `{ character_ref_png, verb, camera_pose.json, duration_s }` |
| E8 | Character Motion → Upscaler | alpha-channel clip `character.webm` |
| E9 | Upscaler → Remotion | upscaled frames + upscaled character clip |
| E10 | Remotion → FFmpeg | composited video `composed.mov` (no audio) |
| E11 | FFmpeg → Puter.fs | final MP4 `{ asset_id, duration_s, size_bytes, url }` |

Every edge gets its own integration test at Gate 2 (one fixture per edge). Breakage on any edge fails the gate.

---

## Where each tool lives

| Tool | Deployment | Runs in | Reason |
|---|---|---|---|
| Event Translator | Backend orchestrator | FastAPI in-process Python module | Stateless, fast |
| Seedance 2.0 | External (fal.ai / Kie.ai) | HTTPS API call | Already paid, already live |
| Proxy World Engine | Backend worker | Celery task on CPU node | Headless 3D, no GPU needed for proxy |
| Cosmos-Transfer2.5 | NIM on GCP Cloud Run GPU | L4 dev / A100 prod | Ampere+ required per Cosmos prereqs |
| Character Motion (Seedance i2v) | External (fal.ai) | HTTPS API call | Same gateway as Stage 2 |
| Character Motion (Higgsfield fallback) | Self-hosted | Cloud Run GPU | Only if Seedance alpha insufficient |
| Real-ESRGAN / AuraSR | Self-hosted | Cloud Run GPU | Open-source, cheap upscaling |
| Remotion | Self-hosted | Node.js on CPU node | Server-side React render |
| FFmpeg | Self-hosted | Same node as Remotion | Ubiquitous |
| Puter.fs | External Puter account | HTTPS API call | Primary storage + UI shell |

---

## Backend orchestrator (research Phase 4 preview)

```
                ┌────────────────────┐
                │  Puter-native app  │  (Pro Mode / Lite Mode)
                └──────────┬─────────┘
                           │ HTTPS
                ┌──────────▼─────────┐
                │   FastAPI Gateway  │  (auth, rate-limit, event intake)
                └──────────┬─────────┘
                           │ enqueue
                ┌──────────▼─────────┐
                │      Redis         │  (job queue + pub/sub for progress)
                └──────────┬─────────┘
                           │ dequeue
                ┌──────────▼─────────┐
                │  Celery Workers    │  (per-stage tasks, distinct queues)
                └──┬─────────────────┘
                   │
       ┌───────────┼───────────┬───────────┬───────────┐
       ▼           ▼           ▼           ▼           ▼
   Seedance     Proxy       Cosmos      Upscaler    Remotion
   (fal.ai)    (CPU)    (Cloud Run GPU) (GPU)       + FFmpeg
```

**Per-stage retry policy:** exponential backoff, max 3 retries per stage. Intermediate artifacts cached in Puter.fs so retries don't re-run successful upstream stages.

**OOM guard:** each GPU stage runs in its own Cloud Run Service instance (1 stage = 1 GPU); no co-tenancy. Scale-to-zero when idle.

---

## Critical risks flagged during audit

| Risk | Mitigation |
|---|---|
| Cosmos-Transfer2.5 may not accept depth + Canny + camera_pose simultaneously | Verify against `cosmos-transfer25-quickstart.json` recon — Multi-control variant confirmed accepts parameter-file with combined controls. Re-verify with real inference call in Gate 2. |
| Seedance i2v alpha channel may be lossy at character edges | A/B test at Gate 2 with identical input on Seedance vs Higgsfield. If alpha is unusable, fall back to Higgsfield. |
| USD scene from Proxy World Engine may not align with Seedance reference video | Pass `camera_intent` from Translator to both stages; reconcile in the proxy build step. If drift > threshold, regenerate Seedance clip with tighter scene_hint. |
| Puter.fs latency for 4K frame sequences | Cache intermediate frames in Cloud Run Service ephemeral disk during a single pipeline run; only push final MP4 to Puter.fs. |
| Real-ESRGAN / AuraSR licensing | Both are open-source (BSD / Apache-adjacent). Verify at Gate 2 — no commercial gate expected. |
| Event Translator is a single point of failure (one Python module in the orchestrator) | Ship with a contract schema + unit tests for every event type; Planner/Generator/Judge_Hawk each get their own handler class. |

---

## What Gate 2 starts with

After Port_Ang + LUC portraits land, Gate 2 begins by:

1. Implementing the Event Translator module against the E1/E2/E7 contracts
2. Running one end-to-end dry-run: canned CRUCIBLE event → Seedance storyboard → (skip Proxy for POC, feed Cosmos a hand-authored control bundle) → Cosmos environment → Seedance i2v character with canned reference PNG → Remotion composite → FFmpeg → MP4 to Puter.fs
3. If the dry-run renders a watchable clip, Gate 2 is green and Gate 3 adds the Proxy World Engine + real backend orchestrator

---

## Sign-off prerequisites for Gate 1.6

- [ ] Contracts E1–E11 reviewed and approved
- [ ] Gate 2 dry-run scope approved (skip Proxy World for first pass)
- [ ] Port_Ang + LUC portraits landed (Gate 1.5 prereq)
