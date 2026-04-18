# 3D Operations Floor — "Run a Company, Without the Company" Vertical

**Canonical groundwork doc for the NVIDIA-stack engagement front-end of Deploy's flagship vertical.**
**Dated:** 2026-04-18 · **Owner:** ACHEEVY (final approval) · **Creative:** Iller_Ang

This doc is *internal-only*. Nothing in it ever surfaces to end users. It reconciles:
- The live marketing page (`foai/cti-hub/src/app/deploy-landing/page.tsx`)
- CRUCIBLE (Planner / Generator / Judge_Hawk three-agent harness)
- The existing 2D Live Look In skill + active `feat/aims-pmo-live-look-in-events` worktree
- NVIDIA Omniverse libraries + Cosmos World Foundation Models + GCP Cloud Run Jobs

---

## The vertical (what's already public)

**Headline (locked copy):** "Run a **company**. Without the **company**."
**Subhead:** "Not a chatbot. Not an automation tool. A fully governed, self-measuring, memory-driven autonomous workforce that runs your business the way a real organization does."
**Differentiator:** "22 live services. 6 Boomer_Angs. 17 Lil_Hawks. An AI operations manager that delegates, not generates."
**Surface:** `/deploy-landing` on cti-hub. Palette `#0A0A0A` + gold `#E8A020` + cyan circuit grid + night-port hero.

**The promise the 3D layer must physically demonstrate:** a company running itself, on screen, in real time — no humans on stage.

## Naming triangle (never confuse these)

| Layer | Name | Visibility |
|---|---|---|
| What end users see | **Operations Floor** | Public — appears in all customer-facing copy |
| Internal product name | **Live Look In** | Team + docs only — never in end-user UI |
| Rendering technology | **NVIDIA Omniverse + Cosmos on GCP Cloud Run Jobs** | Engineering-only — never mentioned to users, same rule as model-name redaction |

Per `cti-hub/CLAUDE.md` IP Protection: model/tool/service names never appear in user-facing text. Extend the guard to Nvidia / Omniverse / Cosmos / USD / WebRTC / any backend term.

## Two-tier architecture

| Tier | Renderer | Who gets it | Status |
|---|---|---|---|
| **Base Operations Floor (2D)** | React + Canvas / Pixi.js + spritesheets | All tiers including free | Active skill at `live-look-in/`, 7 reference docs |
| **3D Operations Floor (Premium)** | Omniverse Kit headless on GCP Cloud Run Jobs (L4 dev / A100 render) + Cosmos WFMs | Premium tier of "Run a Company Without the Company" vertical only | This doc's groundwork |

**Lock: 2D does not get abandoned.** The 2D floor is the default-tier observability surface. The 3D floor is the premium vertical engagement surface. Both consume the *same event bus*.

## Existing anchors to wire (don't rebuild)

| Anchor | Location | Use |
|---|---|---|
| `deploy-landing/page.tsx` | cti-hub | Copy, palette, cast list |
| `LiveSandbox` component | cti-hub landing hero | Gets a "Watch on the 3D Operations Floor" toggle that swaps 2D for WebRTC or `<video>` |
| `VerbSpinner` | cti-hub landing | The verb it cycles maps to a scene action vocabulary |
| `PlugGallery` | cti-hub landing | Each plug = potential Operations Floor preset scene |
| 6 Boomer_Ang portraits | `/public/agents/*.png` (Recraft V4 regen #103/#104) | Source for 3D character rigs |
| Night-port hero + sunset overlay | `/public/deploy/*.jpg` | Scene palette + lighting reference |
| `feat/aims-pmo-live-look-in-events` | foai-worktrees | Postgres NOTIFY triggers (migration 005) + scene registry + render event schema |
| CRUCIBLE Planner/Generator/Judge_Hawk | Deploy dispatch path + `project_crucible_three_agent_harness` memory | Event producer |
| `live-look-in` skill + 7 refs | aims-core aims-skills | Floor plan / event-bus / character-specs / PCP metrics — all reusable as-is |

## What's net-new (the actual build surface)

1. **Omniverse Kit headless runner** — GCP Cloud Run Job image with Omniverse Kit installed, scale-to-zero, accepts scene action JSON + cast + scene fragment IDs, outputs clip to R2 or WebRTC stream
2. **Cosmos-WFM-assisted asset pipeline** — takes a 2D Recraft V4 portrait, returns a 3D-rigged USD character preserving visual identity (visor, hoodie, ANG patch, colorway)
3. **Scene fragment library in USD** — Night Port, Conference Room, Ops Floor, Break Room, CEO Office. First scene = Night Port (matches existing landing hero)
4. **Animation vocabulary** — five verbs `dispatching · typing · walking · consulting · verdict`. Authored once, reusable across cast
5. **Event translator module** — CRUCIBLE event → `{ character, verb, scene, target }` JSON. Owns a versioned schema contract.
6. **Render orchestrator** — consumes event stream via the existing Live Look In Postgres NOTIFY bus, dispatches Cloud Run Jobs, publishes clips
7. **Viewer swap in `LiveSandbox`** — 2D canvas ↔ 3D WebRTC/`<video>` toggle; premium-tier gating

## Gate sequence (no time estimates)

### Gate 0 — This document

### Gate 1 — Foundation lock (pre-work, zero code)
- [ ] Naming triangle confirmed (Operations Floor · Live Look In · Nvidia stack)
- [ ] 2D + 3D coexistence confirmed
- [ ] Stack verified: Omniverse Kit + Cosmos WFM versions + GCP GPU SKU + R2/WebRTC output
- [ ] First-cast lock (proposal: ACHEEVY + Chicken Hawk + Scout_Ang)
- [ ] First-scene lock (proposal: Night Port)
- [ ] First-verb lock (proposal: `dispatching`)

**Exit:** ACHEEVY approval on one-pager.

### Gate 2 — Asset pipeline POC (one character, one scene, one verb)
- [ ] ACHEEVY 2D portrait → Cosmos-assisted USD rig (visor + helmet + jacket + camo pants preserved)
- [ ] Night Port scene authored in USD
- [ ] `dispatching` verb clip authored
- [ ] Headless render job on Cloud Run succeeds on L4
- [ ] 10-second clip lands in R2, no Nvidia/Omniverse wordmarks in output

**Exit:** Watchable clip approved. Asset cost per character recorded.

### Gate 3 — CRUCIBLE-driven single-scene pilot
- [ ] Event translator module with schema contract + tests
- [ ] Render orchestrator consumes Live Look In NOTIFY events
- [ ] `LiveSandbox` gains "Watch on the 3D Operations Floor" toggle
- [ ] One real CRUCIBLE Planner → Generator → Judge_Hawk run renders end-to-end in 3D on `/deploy-landing`

**Exit:** Prospect-ready demo loop. Cost-per-minute of render recorded.

### Gate 4 — Productization
- [ ] Remaining 5 Boomer_Angs + Iller_Ang rigged
- [ ] 17 Lil_Hawks batch-rigged (simpler rigs acceptable given scale)
- [ ] Scene library complete (5 scenes per floor plan)
- [ ] Multi-character choreography (3-Consultant Engagement works)
- [ ] GPU-hour metering through Stepper → Taskade billing spine
- [ ] Premium-tier gating on `/deploy-landing` CTA

**Exit:** Public launch of 3D Operations Floor as the vertical's flagship surface.

### Gate 5 — Simplification Cadence (ongoing)
Per CRUCIBLE doctrine: every Anthropic / Gemini / Cosmos model release, stress-test which components of this stack are still load-bearing. Strip what isn't. Harness complexity should decrease over time.

## Pre-mortem failure modes

| Failure | Guard |
|---|---|
| Nvidia/Omniverse leaks to user-facing copy | Lint rule on `cti-hub/src/**` blocking `nvidia`, `omniverse`, `cosmos`, `usd`, `webrtc`, `kit headless` in any JSX text node / copy file |
| 2D Operations Floor gets abandoned | Two-tier architecture explicit in this doc; any PR that removes the 2D path must be rejected |
| CRUCIBLE event schema drift breaks 3D | Translator module owns a versioned contract; Gate 3 regression test |
| Asset pipeline stalls on ACHEEVY | Fallback: 2.5D parallax of the Recraft portrait inside Omniverse scene — still premium-feeling, less pipeline risk |
| "Human-Less" promise not visually delivered | Art-direction review at each gate. Cast = AI fleet. No human stand-ins in frame. |
| GPU cost explosion | Scale-to-zero Cloud Run Jobs + aggressive R2 clip caching + pre-render common fragments |
| Scope creep: "3D everywhere in the platform" | 3D is attached to this vertical. Per\|Form, AIMS, OKAI, Blockwise, Destinations each have their own visualization needs and decide independently. |

## Gate 1 — LOCKED 2026-04-18

1. **First-cast:** **ACHEEVY · Chicken Hawk · Iller_Ang (ILLA) · LUC · Port_Ang ("Docker")** — five characters. ILLA and LUC substitute for Scout_Ang. Port_Ang is a net-new character from the Operations PMO.
2. **First-scene:** **Night Port** — matches the existing `/deploy/night-port-hero.jpg` on `deploy-landing`.
3. **Gate 3 output mode:** **WebRTC live stream (primary), pre-rendered MP4 clips to R2 (fallback).** WebRTC requires Cloud Run *Services* with GPU SKU (not Jobs); fallback engages if economics don't pencil.
4. **Recon authorized** on current Omniverse Kit licensing + Cosmos WFM availability. Findings to be appended here under "Gate 1 Recon Findings."

## Gate 1.5 — Character design prerequisite (blocks Gate 2)

Two characters in the first-cast have no canonical design yet. Iller_Ang owes both before the Gate 2 rigging pipeline can start.

| Character | Status | Route |
|---|---|---|
| **ACHEEVY** | Canonical design exists | No new design work |
| **Chicken Hawk** | Canonical design exists | No new design work |
| **Iller_Ang (ILLA)** | Canonical design exists (`/c/Users/rishj/iCloudPhotos/Photos/ILLA.png`) | No new design work |
| **LUC** | No character form yet (infrastructure engine only) | **NEEDS DESIGN** — Open Mind → Iller_Ang → Recraft V4 |
| **Port_Ang ("Docker")** | Does not exist | **NEEDS DESIGN + CHARACTER BIBLE** — Open Mind → Iller_Ang → Recraft V4 |

### Port_Ang design brief (for Iller_Ang)

- **Department:** Operations PMO (reports to Boomer_COO / Ops_Ang)
- **Nickname:** "Docker" — evokes container/port/dispatch; *must not* reference Docker Inc.'s blue-whale IP
- **Visual family:** Boomer_Ang — full-face tactical mask + LED visor + hoodie + ANG-family glyph
- **Visor color:** **Cyan** (matches `deploy-landing` circuit grid `rgba(6,182,212,*)`) — distinct from ILLA orange, ACHEEVY orange, Betty-Anne_Ang gold
- **Chest patch:** "OPS" in cyan (Operations PMO badge)
- **Carried item:** Holographic port manifest / stylized container-key instead of tablet
- **Silhouette cues:** Port-master coat or high-vis tactical vest, cargo utility pockets (manifest, radio)
- **Backstory (for character bible):** Dispatches plug instances across the VPS fleet, allocates ports (51000+ range per `aims-core/CLAUDE.md`), orchestrates Docker Compose lifecycles, owns nginx routing and health checks — the embodiment of A.I.M.S.'s Container-as-a-Service delivery layer

### LUC design brief (for Iller_Ang)

- **Department:** Cross-cutting (calculation engine consumed by all PMOs — sits under Boomer_CFO operationally)
- **Current role:** Locale Universal Calculator — tax/VAT/K1/Zakat/billing quote engine, built from Flip Secrets real-estate calculator foundation
- **Visual approach recommendation:** Semi-abstract humanoid — Boomer_Ang-family silhouette but **face/visor replaced with a resolving numerical grid** (LED digits + ledger symbols coalescing into expressions). No ANG patch — carries a different chest emblem ("LUC" in a gold register).
- **Distinction from Boomer_Angs:** LUC is infrastructure personified, not an executive agent — treat it as a *character artifact of the platform itself* rather than a peer to Scout_Ang / Content_Ang.
- **Open question:** Should LUC be humanoid at all, or a floating holographic calculation-surface that characters consult? Iller_Ang decides via Open Mind three-approach.

## Gate 1 Recon Findings (2026-04-18)

Scraped via Sqwaadrun (post-fix) from `docs.nvidia.com/cosmos/latest/` and `docs.omniverse.nvidia.com/kit/docs/kit-manual/latest/`. Raw JSON cached at `C:\Users\rishj\.sqwaadrun\cosmos-*.json` + `omniverse-kit-alt.json`.

### Cosmos model families (v2.2, last updated 2026-02-18)

| Family | Purpose | Hardware floor |
|---|---|---|
| **Cosmos-Predict2.5** | Text/image/video → world (newest) | Ampere+ (RTX 30, A100 80GB) |
| **Cosmos-Predict2** | Text/video → world (7B + 5B) | Ampere+ |
| **Cosmos-Predict1** | Diffusion + autoregressive + tokenizer | **H100-80GB or A100-80GB required** |
| **Cosmos-Transfer2.5** | **Sim → Photorealism + Scale World State Diversity** | Ampere+ (this is our prime candidate) |
| **Cosmos-Transfer1** | 7B base + LiDAR/HDMap variants | Ampere+ |
| **Cosmos-Reason2** | Vision-language reasoning (2B/8B) | **Hopper/Blackwell only** (H100, GB200, Jetson AGX Thor) · 24-32GB VRAM |
| **Cosmos-Reason1** | Earlier VLM | Ampere+, 24GB for inference, 80GB × 4 for post-training |

### The family that matches our job

**Cosmos-Transfer2.5** is the right model. It takes an input video + control signal (depth, edge, segmentation, blur) and renders photorealistic output — "Simulations to Photorealism" is its literal headline. Our CRUCIBLE event stream drives the simulation layer (wireframe/sprite Operations Floor); Transfer2.5 upscales each clip to photoreal before it reaches the user's browser.

Transfer2.5 control variants available today: **Depth · Edge · Segmentation · Blur · Multi-control.** The first version of our 3D Operations Floor can be a "Blur"-conditioned render of the 2D canvas scene — fast iteration path that reuses the existing sprite rendering.

### Licensing — commercial use is OK

- **Source code:** Apache 2.0 (permissive, commercial + modification fine)
- **Model weights:** NVIDIA Open Model License (permits commercial use with attribution; full terms at `nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license`)
- **Custom license contact:** `cosmos-license@nvidia.com`

**Implication:** no enterprise-seat gate. We can self-host Cosmos WFMs on GCP with zero licensing fees. GPU-hours are the only cost.

### Software prerequisites (Predict2.5 / Transfer2.5)

- Linux x86-64, glibc 2.31+
- Python 3.10.x
- **CUDA 12.8.1**
- NVIDIA Driver 570.124.06+
- NVIDIA Container Toolkit 1.16.2+
- Docker Engine

All deployable on GCP Cloud Run GPU SKUs (which support Container Toolkit) and GKE GPU node pools.

### Deployment path — NVIDIA NIMs

NVIDIA NIM (NVIDIA Inference Microservices) is the canonical cloud deployment path:

- **NIM for Cosmos WFM** — currently supports Cosmos-Predict1 (expect Predict2.5 / Transfer2.5 to follow)
- **NIM for VLMs** — Reason2 / Reason1
- **NIM for Cosmos-Embed1** — joint video-text embeddings

NIMs are Docker-packaged microservices. Deploying on GCP = pulling the NIM image + attaching GPU + exposing REST endpoint. Same operational model as the existing PersonaPlex Nemotron deployment (per `aims-core/CLAUDE.md` deployment pipeline).

**Fallback path if NIM for Transfer2.5 isn't available yet:** clone the Apache-licensed source from `github.com/nvidia-cosmos/cosmos-transfer1` (v2.5 expected), build our own container, run on Cloud Run GPU Service or GKE.

### Inference interface (Transfer2.5)

```bash
# Single-GPU, single control variant
python examples/inference.py --params_file assets/robot_example/depth/robot_depth_spec.json

# Multi-GPU via torchrun
torchrun --nproc_per_node=$NUM_GPUS --master_port=12341 \
  -m examples.inference \
  --params_file assets/robot_example/vis/robot_vis_spec.json \
  --num_gpus=$NUM_GPUS
```

Params file schema: `prompt_path`, `output_dir`, `video_path`, `guidance`, plus control-specific fields. Simple JSON — easy to parameterize from our event translator.

### Omniverse Kit

Kit manual scraped from `docs.omniverse.nvidia.com/kit/docs/kit-manual/latest/`. Confirmed:
- Real SDK (`kit.exe` / `IApp` interface), USD/Hydra pipeline, RTX Renderer, Extensions (TOML config), Carbonite plugins, scripting, event system.
- **Gap:** specific headless-rendering + container deployment docs not captured in this pass. The `kit-app-template` URL (first attempt) returned 403 — may require different path or auth. **Followup scrape needed** to find the headless render + WebRTC streaming path specifically.

### GPU SKU decision for GCP

| GCP SKU | Cosmos compatibility | Use |
|---|---|---|
| L4 | Ampere gen — should work for Transfer2.5 / Predict2.5 inference per Nvidia's "Ampere+" floor, though not explicitly benchmarked | Dev / Gate 2 POC |
| A100 80GB | Explicitly called out for most Cosmos families | Production |
| H100 80GB | Required for Predict1, Reason2 | Not needed unless we upgrade to Predict1 later |

**Recommendation:** L4 for Gate 2 POC (cheapest A+ GPU on Cloud Run), A100 80GB for Gate 3 pilot and beyond.

### Updated architecture (post-recon)

```
CRUCIBLE events (Postgres NOTIFY)
    ↓
Event translator (character, verb, scene, target)
    ↓
2D scene render (Canvas/Pixi.js sprites on existing Live Look In) → base frame
    ↓
Cosmos-Transfer2.5 NIM on GCP Cloud Run (L4 dev / A100 prod)
    ↓ — input: base frame video + depth/edge control map
    ↓ — output: photoreal MP4 clip
R2 cache (MP4) OR WebRTC stream (Cloud Run Service with GPU, persistent conn)
    ↓
LiveSandbox "Watch on the 3D Operations Floor" toggle → <video> or WebRTC peer
```

This pins a key architectural simplification: **we don't need to rig 3D characters from scratch.** The 2D sprites we already have become the *control signal* for Transfer2.5, which hallucinates photoreal character detail over the sprite silhouettes. That dramatically shrinks Gate 2's asset pipeline scope — no USD rigging of Recraft portraits, no Cosmos character synthesis from scratch. Sprite → video frame → Transfer2.5 → photoreal.

### Open items (non-blocking)

- Fresh scrape on Omniverse Kit headless rendering + WebRTC streaming path (first attempt 403, need alternate URL)
- Benchmark L4 vs A100 on a single Transfer2.5 inference call (decide Gate 2 SKU empirically)
- Read full NVIDIA Open Model License terms to confirm commercial terms (redistribution, attribution, trademark — likely clean, must verify)

---

## Extended Stack — Virtual Production Studio Pipeline (added 2026-04-18)

Source research preserved at `extended-stack-nvidia-research-2026-04-18.txt` in this refs folder. Supersedes the simpler "sprite → Transfer2.5 → photoreal" flow sketched earlier under Gate 1 Recon — keep that as *minimum viable*, but the canonical build is the fuller pipeline below.

### The stack components (each non-overlapping)

API gateway: **fal.ai is the primary video-gen gateway.** ACHIEVEMOR already pays for it. Seedance 2.0 (ByteDance), daVinci-MagiHuman, and Kie.ai (Seedance fallback) all route through the same gateway + billing. No new-vendor onboarding needed for video gen.

| Tool | Role | Access / license |
|---|---|---|
| **Puter** | OS + cloud file system (`puter.js` / `puter.fs`). Replaces S3 for asset storage; provides the multi-window Cloud Desktop UI paradigm the 3D Operations Floor runs inside | Open-source, self-host |
| **Seedance 2.0 (ByteDance)** | Primary storyboard / pre-viz / text-to-video / image-to-video with subject preservation. Generates the initial 2D storyboard that informs the 3D proxy build. Replaces LTX-Video 2.3 in the original research brief — same slot, already paid. **API via fal.ai (primary) and Kie.ai (fallback).** Full usage patterns in Iller_Ang skill `references/seedance-video.md`. | Paid, live on fal.ai + Kie.ai |
| **daVinci-MagiHuman** (optional) | Talking-head lip sync on fal.ai at $0.05/sec. Applies if any Operations Floor scene needs a character delivering narrated audio (e.g., ACHEEVY briefing). Otherwise skipped. | Paid, live on fal.ai |
| **Headless 3D Proxy World Engine** (Project Lyra or equivalent) | Builds a navigable 3D scene from the Seedance storyboard. The camera navigates this proxy; each frame emits depth map + Canny edges + camera coordinates as *spatial control signals* | Open — Project Lyra is the reference candidate |
| **NVIDIA Cosmos-Transfer2.5** | Consumes the spatial controls → renders photoreal *environment* frames (non-hallucinating — the 3D proxy constrains geometry) | NVIDIA Open Model License (commercial OK), self-host on GCP Cloud Run GPU |
| **Open Higgsfield** | Generates character motion + consistency, outputs with alpha channel / mask for clean compositing. Candidate for substitution by Seedance 2.0 image-to-video for character slots where Seedance's subject-preservation is sufficient — A/B test at Gate 2. | Open source, self-host |
| **Real-ESRGAN or AuraSR** | AI upscaler (1080p → 4K neural upscale). Runs *before* Remotion final composition | Open source, self-host |
| **Remotion** | React-based programmatic timeline + compositing. Composites Higgsfield characters over Cosmos environments using upscaled clips | MIT (React-based) |
| **FFmpeg** | Frame extraction, audio muxing, final video encode | Ubiquitous LGPL/GPL |

### Vendor simplification vs. original research

The research brief listed LTX-Video 2.3 / LTX Studio for pre-viz. **ByteDance Seedance 2.0 on fal.ai substitutes cleanly** — same DiT-family video-gen slot, same text-to-video + image-to-video capability, and it's already on the existing invoice. One less auth, one less rate-limit policy, one less vendor relationship to maintain.

If Gate 2 testing proves Seedance 2.0 can also handle the character-motion slot with acceptable alpha-channel masking, **Higgsfield can also be swapped out** — further consolidating the video-gen path through a single fal.ai-gated model. A/B this at Gate 2 before committing either way.

### Canonical pipeline (sim-to-real, not 2D-to-photo)

```
CRUCIBLE event (Planner / Generator / Judge_Hawk)
    ↓
Seedance 2.0 [ByteDance, via fal.ai primary / Kie.ai fallback]
    — storyboard / pre-viz from event narrative
    — API pattern per Iller_Ang skill references/seedance-video.md
    ↓
Headless 3D Proxy World Engine — builds navigable 3D scene matching storyboard
    ↓
Camera navigation in 3D proxy → emits per-frame spatial controls
    • Depth map (16-bit)
    • Canny edges
    • Precise camera coordinates
    ↓
Cosmos-Transfer2.5 NIM (Ampere+ / L4 dev · A100 prod on GCP Cloud Run GPU)
    — consumes spatial controls, renders photoreal environment frames
    — non-hallucinating: 3D proxy constrains geometry
    ↓
Character motion track — one of:
    • Seedance 2.0 image-to-video [via fal.ai, subject-preserving]  ← preferred if alpha mask is sufficient
    • Open Higgsfield [self-host, richer character consistency]      ← fallback if Seedance alpha isn't clean
    • daVinci-MagiHuman [fal.ai $0.05/sec]                           ← only when talking-head lip sync needed
    ↓ (parallel tracks: environment frames + character clips with alpha)
Real-ESRGAN / AuraSR — upscale both streams to 4K
    ↓
Remotion (React timeline) — composite character over environment
    ↓
FFmpeg — audio mux + final MP4 encode
    ↓
Puter.fs — asset storage (raw frames purged on final MP4 delivery)
    ↓
Browser delivery via Puter-native app OR LiveSandbox "Operations Floor" toggle
    • Live WebRTC stream (Cloud Run Service with persistent GPU) OR
    • Pre-rendered MP4 from R2/Puter.fs cache
```

### Two UI paradigms (Puter-native)

Per the Puter pivot, the engagement surface has two modes — both live *inside* Puter, not as standalone web pages.

| Mode | Audience | UI paradigm |
|---|---|---|
| **Pro Mode** (In-House Studio Workflow) | ACHIEVEMOR internal team, Iller_Ang, Boomer_CDO, creative operators | Multi-window Puter desktop: 3D viewport window + Higgsfield parameters window + Remotion timeline window + LTX storyboard window — all floating, resizable, concurrent |
| **Lite Mode** (External SaaS / Customer) | Visitors landing on `/deploy-landing`, customers watching "Run a Company, Without the Company" demo | Single Puter app window with guided flow — abstracts the multi-model pipeline into a simple watch-or-trigger surface |

### Four integration phases (from research brief)

The research specifies a four-phase integration sequence. These map onto our existing gates:

| Research phase | Maps to our gate | Goal |
|---|---|---|
| **Phase 1 — Pipeline Audit & Integration Strategy** | Gate 1.6 (new) — sits between Gate 1 and Gate 2 | Text pipeline diagram, explicit model handoff contracts (LTX → Proxy → Cosmos → Higgsfield → Upscaler → Remotion → FFmpeg) |
| **Phase 2 — Puter-Native UI/UX Design** | Gate 2 | Pro Mode multi-window design + Lite Mode guided-flow design |
| **Phase 3 — File System & Asset State (Puter.fs)** | Gate 3 prerequisite | Lifecycle strategy: USD meshes, 16-bit depth maps, raw PNG frame sequences purged after FFmpeg final delivery |
| **Phase 4 — Backend Compute, Rendering, Upscaling** | Gate 3 / Gate 4 | FastAPI + Celery/Redis orchestrator on cloud GPUs, Puter frontend triggers backend GPU workers, final assembly line with upscaler injection before Remotion |

### Architectural implications / what changes

1. **Character assets:** The earlier plan said "rig 19 Recraft portraits in USD" OR "skip rigging by using sprites as control signal." The extended plan uses **Higgsfield** for character generation with alpha — neither approach. The Recraft portraits become character *reference* inputs to Higgsfield's consistency module, not USD rigs.
2. **Scene library:** The earlier plan said "author 5 USD scenes (Night Port, Conference Room, etc.)." The extended plan builds scenes on-demand via LTX → Proxy World Engine. The Night Port aesthetic becomes a *style anchor* for LTX prompts, not a pre-authored USD asset.
3. **Storage:** R2 was the proposed cache. **Puter.fs replaces R2 for this product** — unified cloud file system with UI integration. R2 may still be a caching fallback, but primary asset storage is Puter-native.
4. **UI surface:** The earlier plan upgraded the existing `LiveSandbox` React component on the Next.js `/deploy-landing` page. **Extended plan makes the 3D Operations Floor a Puter-native app** — it lives inside Puter's Cloud Desktop, launched from deploy-landing via a Puter app link.
5. **GPU orchestration:** Goes from "Cloud Run Job spins up, renders clip, scales to zero" to "FastAPI + Celery/Redis orchestrator coordinating multiple GPU-bound model workers (LTX, Proxy, Cosmos, Higgsfield, Upscaler) without OOM."
6. **Character design prerequisite still stands:** Port_Ang (Docker) and LUC still need canonical Iller_Ang Recraft V4 portraits — they feed Higgsfield as reference inputs, not USD rigs.

### Updated Gate sequence

- Gate 0 — groundwork doc ✓
- Gate 1 — foundation lock ✓ (with recon findings)
- **Gate 1.5 — character design prerequisite** (unchanged: Port_Ang + LUC Recraft V4 portraits via Open Mind)
- **Gate 1.6 — Pipeline Audit (new)** — produces the text pipeline diagram and explicit model handoff contracts per research Phase 1
- Gate 2 — Puter-native UI/UX design (Pro Mode + Lite Mode) + asset pipeline POC on one event end-to-end
- Gate 3 — Puter.fs file-lifecycle + backend orchestrator + CRUCIBLE-driven single-scene pilot
- Gate 4 — productization (full cast, multi-character choreography, premium-tier gating)
- Gate 5 — Simplification Cadence (ongoing)

### New pre-mortem failure modes (on top of existing)

| Failure | Guard |
|---|---|
| Seven-tool pipeline becomes one brittle chain (one model OOM breaks the whole flow) | Celery/Redis orchestrator with per-stage retry + intermediate artifact caching in Puter.fs |
| Puter-native app is a skill we don't have | Allocate a Lil_Hawk specifically for Puter SDK learning in Phase 2 |
| Cosmos-Transfer2.5 doesn't accept all three control signals (depth + Canny + camera coords) simultaneously | Verify Transfer2.5 "Multi-control" variant accepts the combo before Gate 1.6 diagram is signed off (quickstart doc already shows Multi-control variant exists) |
| Higgsfield character output and Cosmos environment don't match lighting/perspective | Pass camera coordinates from proxy into both Higgsfield and Cosmos; enforce same HDR lighting reference |
| Remotion can't handle 4K composite at target framerate | Fallback to FFmpeg-only compositing with filter_complex; Remotion only for clip assembly |
| Puter.fs storage cost for intermediate 16-bit depth maps + raw PNG frames balloons | Phase 3 file-lifecycle strategy aggressive: purge every intermediate within 60s of final MP4 landing |

---

## References

- `../SKILL.md` — the base 2D Live Look In spec (floor plan, event bus, character registry, PCP metrics) — reused as-is
- `../references/architecture.md` — existing backend architecture; 3D layer extends the same event bus
- `../references/character-specs.md` — canonical character designs; 3D rigs must preserve these specs
- `../references/floor-plan.md` — room layout the 3D scene library mirrors
- `project_crucible_three_agent_harness` memory — event producer semantics
- `project_live_look_in` memory — rendering philosophy (character models, never pixel capture)
- `project_nvidia_omniverse_cosmos_accessibility_2026_04_16` memory — stack accessibility (now stale on `nvidia-recon.json` location; fresh recon needed at Gate 1)
- `cti-hub/CLAUDE.md` — IP protection rules; internal-vs-user-facing name map
- `cti-hub/src/app/deploy-landing/page.tsx` — the vertical's live marketing surface

---

*Groundwork laid. Build nothing until Gate 1 locks.*
