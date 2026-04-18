# Gate 1 Foundation Lock — "Run a Company, Without the Company" 3D Operations Floor

**Locked:** 2026-04-18 by ACHEEVY (Jarrett Risher)
**Supersedes proposals in:** `vertical-run-a-company-3d-engagement.md` → "Decisions pending"
**Unblocks:** Gate 1.5 (character design) and Gate 2 (asset pipeline POC)

---

## 1. First-cast — five characters

| # | Character | Role in Operations Floor debut | Design status |
|---|---|---|---|
| 1 | **ACHEEVY** | Digital CEO dispatching the mission brief | ✓ canonical |
| 2 | **Chicken Hawk** | 2IC commanding the tactical floor | ✓ canonical |
| 3 | **Iller_Ang (ILLA)** | Creative Director — visible creative output during the scene | ✓ canonical |
| 4 | **LUC** | Locale Universal Calculator — financial/calculation presence | ⚠ needs character design |
| 5 | **Port_Ang ("Docker")** | Operations PMO — dispatches plug/container instances | ⚠ net-new character |

Scout_Ang explicitly **not** in the first-cast. Ops_Ang and Betty-Anne_Ang are canonical but not in Gate 2 POC.

## 2. First-scene — Night Port

Matches the existing landing hero (`/deploy/night-port-hero.jpg`). Palette: `#0A0A0A` black, `#E8A020` gold accent, `rgba(6,182,212,0.4)` cyan circuit grid, sunset overlay available as alt lighting. Scene library expands from here.

## 3. Gate 3 output mode — WebRTC primary, MP4 clips fallback

- **Primary path:** Live WebRTC stream from a GPU-equipped Cloud Run Service → browser `<video>` element via WebRTC peer connection
- **Fallback path:** Pre-rendered clips to Cloudflare R2 → CDN → `<video>` player
- **Economic gate:** if WebRTC SKU cost-per-minute exceeds R2-cached clip cost by >3×, fall back to MP4. Measured at Gate 3.
- **Architectural note:** WebRTC requires Cloud Run *Services* (persistent) with GPU. Cloud Run *Jobs* (batch, scale-to-zero) remain the right path for asset pipeline renders at Gate 2.

## 4. Recon — authorized

Fresh Omniverse Kit + Cosmos WFM recon to run before Gate 2 spec. Findings will append to `vertical-run-a-company-3d-engagement.md` under "Gate 1 Recon Findings."

---

## Sign-off

- [x] ACHEEVY (Jarrett Risher) — 2026-04-18 via Claude Code session
- [ ] Iller_Ang character design deliverables (Port_Ang + LUC) — **pending, now the sole blocker for Gate 2**
- [x] Gate 1 Recon Findings appended to `vertical-run-a-company-3d-engagement.md` — 2026-04-18 (Sqwaadrun post-fix)

## Recon key takeaways (details in the main groundwork doc)

1. **Cosmos-Transfer2.5 is the right model.** "Simulations to Photorealism" — consumes spatial controls (depth + Canny + camera coords) to render photoreal environments without hallucination.
2. **Licensing is clean.** Apache 2 (code) + NVIDIA Open Model License (weights). No seat fees, GPU-hours only.
3. **Deployment via NIMs** (Docker microservices) — same ops model as the existing PersonaPlex Nemotron endpoint.
4. **L4 GPU for Gate 2 POC, A100 80GB for Gate 3+ production.** Cosmos floor is "Ampere+" which L4 satisfies; A100 explicitly called out for production.

## Extended Stack — Virtual Production Studio (added 2026-04-18)

Research doc `extended-stack-nvidia-research-2026-04-18.txt` added seven net-new stack components. See the main groundwork doc's "Extended Stack" section for details. Headline shifts:

1. **Puter** is the OS + file system for the engagement front-end. The 3D Operations Floor becomes a **Puter-native app**, not a Next.js page inside `/deploy-landing`.
2. **Sim-to-real pipeline** replaces the earlier "2D sprite → Cosmos upscale" shortcut. Flow: **Seedance 2.0 (ByteDance via fal.ai)** storyboard → Headless 3D Proxy World → depth/Canny/camera → Cosmos-Transfer2.5 → character motion (Seedance i2v preferred, Higgsfield fallback, daVinci-MagiHuman for talking heads) → Real-ESRGAN upscale → Remotion composite → FFmpeg → Puter.fs. **Seedance substitutes for LTX-Video 2.3 in the original research brief** — already paid, already live, consolidates video-gen billing through fal.ai.
3. **Two UI modes:** Pro Mode (multi-window Puter desktop for in-house studio) + Lite Mode (single-window guided flow for SaaS customers).
4. **New Gate 1.6** inserted between Gate 1 and Gate 2: "Pipeline Audit & Integration Strategy" per research Phase 1. Produces text pipeline diagram + explicit model handoff contracts.

Gate 2 scope **expanded** from "one character in one scene" to "Puter UI shells (Pro + Lite) + one event-to-MP4 pipeline traversal end-to-end."

## Next concrete action

1. Iller_Ang produces three Open Mind approaches for Port_Ang, selects and generates Recraft V4 portraits
2. Iller_Ang does the same for LUC (humanoid vs abstract decision inside Open Mind)
3. Fresh Omniverse/Cosmos recon findings appended
4. Then Gate 2 POC spec drafted against the full five-character cast
