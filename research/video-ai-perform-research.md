# Video AI for Per|Form — Meta SAM, Twelve Labs & VerifyAI Pattern Research

**Date:** 2026-02-20
**Purpose:** Evaluate Meta SAM and Twelve Labs for Per|Form's Film Room pipeline, plus the VerifyAI content verification pattern as inspiration for a sports-native implementation.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Inspiration: VerifyAI Pattern](#verifyai-pattern)
3. [Meta SAM (Segment Anything Model)](#meta-sam)
4. [Twelve Labs — Video Intelligence Platform](#twelve-labs)
5. [Per|Form Integration Architecture](#perform-integration)
6. [Build vs Buy Analysis](#build-vs-buy)
7. [Recommended Roadmap](#roadmap)
8. [Sources](#sources)

---

## Executive Summary

Per|Form's Film Room currently references SAM 2 for athleticism analysis in the P.A.I. grading system. This research evaluates two complementary technologies for deepening that capability:

- **Meta SAM 2/3** — Open-source (Apache 2.0) visual segmentation and tracking. Isolates players from game film, tracks movement across plays, feeds clean crops into pose estimation. SAM 3 (Nov 2025) adds text-based prompting ("track the quarterback") which is transformative for sports.

- **Twelve Labs** — Video-native AI platform with Marengo (search/embeddings) and Pegasus (video-to-text generation). The NFL already uses it. Enables semantic search over game film ("third-and-long scrambles"), automated scouting report generation, and highlight extraction.

- **VerifyAI pattern** — A hackathon project that uses Twelve Labs Pegasus + OpenAI to verify news content for bias and false claims. The pattern (multimodal content analysis → structured scoring → source verification) maps directly to Per|Form's need for automated, evidence-backed scouting intelligence.

**Key finding:** SAM and Twelve Labs are complementary, not competing. SAM handles pixel-level segmentation and tracking (the "eyes"), Twelve Labs handles semantic understanding and text generation (the "brain"). Together they form the complete Film Room pipeline.

---

## VerifyAI Pattern

### What It Is

VerifyAI is a hackathon project that takes video or text-based news and checks for indicators of false claims or bias — overly assertive statements, highly emotional language, unsourced claims. It uses Twelve Labs Pegasus for video content and OpenAI for text, producing a factuality score and bias summary.

### Architecture

```
Input (Video or Text)
    |
    ├─ Video Path: Twelve Labs Pegasus → AI summary + claim extraction
    |
    ├─ Text Path: OpenAI → AI analysis + claim extraction
    |
    v
Scoring Engine
    ├─ Assertiveness flags (overly absolute statements)
    ├─ Emotional language detection
    ├─ Source verification (checks for backing evidence)
    └─ Cross-modal consistency
    |
    v
Output: Factuality Score + Bias Summary + Flagged Claims
```

**Tech stack:** Python backend, Flask framework, HTML/CSS frontend, OpenAI API, Twelve Labs API.

### Why This Pattern Matters for Per|Form

The VerifyAI pattern — **multimodal content in → structured analysis → evidence-backed scoring** — is exactly what Per|Form needs, applied to sports instead of news:

| VerifyAI Concept | Per|Form Equivalent |
|------------------|---------------------|
| News video input | Game film / highlight reels |
| Bias detection | Hype vs reality check on prospect evaluations |
| Factuality scoring | P.A.I. confidence scoring (evidence-backed grades) |
| Source verification | Stats cross-referencing (MaxPreps, ESPN, 247Sports) |
| Emotional language flags | Media hype detection in recruiting coverage |
| AI-generated summary | Automated scouting reports |

### Per|Form "VerifyAI" Adaptation: **ScoutVerify**

A sports-native content verification engine that:

1. **Ingests highlight reels** via Twelve Labs Pegasus — generates structured play-by-play analysis
2. **Cross-references claims** — "fastest 40 time in the state" gets checked against actual timing data
3. **Detects highlight bias** — flags when a reel only shows best plays, estimates what % of total snaps are represented
4. **Scores confidence** — how much evidence supports the prospect's claimed tier
5. **Flags hype** — identifies language patterns in recruiting coverage that indicate inflated evaluations

This would be a unique differentiator. No scouting platform currently does automated verification of prospect hype against evidence.

---

## Meta SAM

### Version Summary

| Version | Date | Key Capability |
|---------|------|----------------|
| SAM 2 | Jul 2024 | Video segmentation with streaming memory, interactive prompting |
| SAM 2.1 | Sep 2024 | Improved occlusion handling, torch.compile support, fine-tuning code |
| SAM 3 | Nov 2025 | **Text-based prompting** — "player in white jersey" — 270K concepts, unified detect+segment+track |

### Core Capabilities

- **Zero-shot generalization** — segments objects never seen in training
- **Interactive refinement** — clicks, bounding boxes, or masks on any frame, propagated forward/backward
- **Occlusion handling** — dedicated prediction head for when objects disappear behind others
- **Streaming memory** — tracks objects across entire video sessions
- **Multi-object tracking** — SAM 2.1 supports independent per-object inference

### SAM 3 — Game Changer for Sports

SAM 3 adds **open-vocabulary segmentation**: describe objects in natural language instead of clicking.

- "Track all players in white jerseys" — segments and tracks the entire offense
- "Follow the running back" — isolates one player across the entire play
- 848M parameters, 2x performance over SAM 2 on concept segmentation
- Backward compatible with SAM 2's visual prompting
- **Decoupled detector-tracker** with presence tokens for disambiguating closely related prompts

### Sports-Specific Evidence

| Implementation | Details |
|---------------|---------|
| Team-Aware Football Tracking (arXiv 2512.08467) | 100% success in light occlusion, 90% in heavy; jersey color appearance models |
| Basketball Player Detection (Roboflow) | RF-DETR detection + SAM 2 tracking; handles 10 simultaneous players |
| SAMURAI (zero-shot variant) | +16.5% improvement in camera-motion tracking; Kalman filter motion modeling |
| Ball Tracking (Sieve) | SAM 2 + YOLOv8 for soccer ball tracking across full matches |
| Major Sports League (unnamed) | SAM 2 for real-time game film analysis, highlight reels, and strategic insights |

### Performance

| Model | Params | FPS (A100) | Best For |
|-------|--------|------------|----------|
| Hiera-Tiny | 38.9M | 47 | Real-time preview |
| Hiera-Base+ | 80.8M | 35 | **Production (best balance)** |
| Hiera-Large | 224.4M | 30 | Maximum accuracy |

- **DAVIS 2017:** 90.7% J&F (+2.6% over prior SOTA)
- **3x fewer interactions** than prior approaches for equivalent quality
- **8.4x faster** video annotation than manual per-frame SAM

### License & Deployment

- **Apache 2.0** — fully commercial, no royalties, attribution only
- Self-hostable on any NVIDIA GPU (A100, L4, or consumer RTX 4090)
- Available on AWS SageMaker JumpStart, GCP Vertex AI Model Garden, Hugging Face
- VRAM: 16-24GB for game clips, 48-80GB for full games (mitigated by play-by-play chunking)

### Integration with Meta AI Stack

```
DINOv2 (feature extraction / player identification)
    + Grounding DINO or SAM 3 (text-based detection)
    + SAM 2.1 (segmentation & tracking)
    + SAMURAI (motion-aware tracking for fast action)
    + Detectron2 (training, evaluation, deployment orchestration)
    + ViTPose / RTMPose (pose estimation on segmented crops)
```

---

## Twelve Labs

### What It Is

Twelve Labs is a video intelligence platform providing multimodal AI foundation models purpose-built for video understanding. Founded 2020, $107.1M raised from NVIDIA, NEA, Index Ventures, In-Q-Tel (CIA's venture arm). 30,000+ developers including the **NFL**.

**Core insight:** Unlike competitors that decompose video into frames/transcripts, Twelve Labs treats video as a first-class, temporally-coherent data type — jointly understanding visuals, audio, speech, text, and motion.

### Key Models

#### Marengo 3.0 (Dec 2025) — Embedding/Search

The "eyes and ears" — generates multimodal embeddings from video into a shared semantic space.

| Spec | Value |
|------|-------|
| Embedding dimensions | 512 (6x more efficient than Amazon Nova's 3072) |
| Max video length | 4 hours |
| Languages | 36 + English |
| Indexing speed | ~30-40% of video duration |
| Deployment | SaaS + Amazon Bedrock |

**Capabilities:** Semantic search over video using natural language, image queries, or audio clips. Tracks objects, movement, emotion, and events through time. Can connect a moment of dialogue to a gesture three minutes later.

#### Pegasus 1.2 (Feb 2025) — Video Language Model

The "brain" — produces human-readable text from video content.

| Spec | Value |
|------|-------|
| Max video length | 1 hour |
| Max prompt | 2,000 tokens |
| Architecture | Video Encoder → Video-Language Alignment → LLM Decoder |
| Outputs | Summaries, chapters, highlights, Q&A, custom reports, structured JSON |

**Performance:**
- 61% improvement on MSR-VTT over prior SOTA
- 47% enhancement on Video Descriptions Dataset
- 20% absolute F1-score increase on VidFactScore

### Sports Capabilities (Production-Ready)

Twelve Labs has a **dedicated sports documentation section** and explicit NFL adoption:

1. **Highlight generation** — Major sports leagues use it on AWS for automatic highlight reels
2. **Biomechanical analysis** — Swimmer stroke technique, sprinter starting position from smartphone video
3. **Semantic game film search** — "third-and-long plays where the quarterback scrambles right"
4. **Automated scouting reports** — Custom Pegasus prompts generate structured reports from game film
5. **Play classification** — Zero-shot classification by formation, outcome, or situation

### API Integration

```python
from twelvelabs import TwelveLabs

client = TwelveLabs(api_key="<API_KEY>")

# Index game film
index = client.index.create(
    name="perform-game-film",
    engines=[{"name": "marengo2.7", "options": ["visual", "audio"]}]
)
task = client.task.create(index_id=index.id, file="game_film.mp4")
task.wait_for_done()

# Semantic search
results = client.search.query(
    index_id=index.id,
    query_text="quarterback scrambles right and throws deep",
    options=["visual", "audio"]
)

# Generate scouting report
report = client.generate.summarize(
    video_id="<VIDEO_ID>",
    type="summary",
    prompt="Analyze this game film. Identify key plays, formations, "
           "and tendencies. Format as a scouting report."
)
```

### Integration Ecosystem

- **MCP Server** (Sep 2025) — bridges video understanding with Claude Desktop, Cursor, AI agents
- **Jockey** — open-source conversational video agent on LangGraph
- **n8n community node** — visual workflow automation (AIMS already runs n8n)
- **Vector DB support** — Elasticsearch, MongoDB, Pinecone, Milvus, LanceDB
- **Amazon Bedrock** — enterprise deployment

### Pricing

| Tier | Cost | Capacity |
|------|------|----------|
| Free | $0 | 600 minutes (cumulative) |
| Developer | From $0.033/min | Up to 10,000 hours |
| Enterprise | Custom | Unlimited, fine-tuning available |

### Content Verification Capabilities

**What works today:**
- Fact-oriented Q&A (yes/no verification of presence/absence)
- Entity identification (who appears, what brands visible)
- Event spotting with timestamps
- Compliance checking (APPROVED / REJECTED / NEEDS_REVIEW)
- Contextual content moderation (understands context, not just frame-level objects)

**What's missing (requires augmentation):**
- No formal bias detection benchmarks released yet
- No built-in claim verification against external knowledge bases
- Hallucination risk on Pegasus outputs — needs human review or cross-referencing

---

## Per|Form Integration Architecture

### The Complete Film Room Pipeline

```
                    GAME FILM INPUT (MP4)
                           |
                           v
            ┌──────────────────────────────┐
            │   PLAY DETECTION             │
            │   PySceneDetect / custom     │
            │   Segments film into plays   │
            └──────────────┬───────────────┘
                           |
              ┌────────────┴────────────┐
              |                         |
              v                         v
    ┌─────────────────┐      ┌──────────────────────┐
    │  SAM 2/3 TRACK  │      │  TWELVE LABS INDEX    │
    │                 │      │                      │
    │  Player segment │      │  Marengo 3.0 embeds  │
    │  + tracking     │      │  Pegasus generation  │
    │  SAMURAI motion │      │  Semantic search     │
    │  SAM 3 text     │      │                      │
    │  prompts        │      │  "The Eyes + Brain"  │
    │                 │      │                      │
    │  "The Hands"    │      │                      │
    └────────┬────────┘      └──────────┬───────────┘
             |                          |
             v                          v
    ┌─────────────────┐      ┌──────────────────────┐
    │  POSE ESTIMATION│      │  SCOUTING REPORTS     │
    │                 │      │                      │
    │  ViTPose on     │      │  Auto-generated from │
    │  segmented      │      │  Pegasus with custom │
    │  player crops   │      │  prompts             │
    │                 │      │                      │
    │  Joint angles,  │      │  Bull/Bear cases     │
    │  speed, accel   │      │  Play-by-play        │
    │                 │      │  Formation analysis  │
    └────────┬────────┘      └──────────┬───────────┘
             |                          |
             └────────────┬─────────────┘
                          |
                          v
            ┌──────────────────────────────┐
            │  SCOUTVERIFY ENGINE           │
            │                              │
            │  Cross-reference claims      │
            │  Highlight bias detection    │
            │  Hype vs reality scoring     │
            │  Stats verification          │
            │  P.A.I. confidence scoring   │
            └──────────────┬───────────────┘
                           |
                           v
            ┌──────────────────────────────┐
            │  P.A.I. GRADING SYSTEM       │
            │                              │
            │  Performance (stats data)    │
            │  Athleticism (SAM + pose)    │
            │  Intangibles (NLP + video)   │
            │                              │
            │  → Tier assignment           │
            │  → Confidence score          │
            │  → Evidence trail            │
            └──────────────────────────────┘
```

### How SAM + Twelve Labs Map to P.A.I.

| P.A.I. Component | SAM Role | Twelve Labs Role |
|-------------------|----------|-----------------|
| **Performance** | — | Pegasus extracts play outcomes, stats from game context |
| **Athleticism** | Segments player → clean crop for pose estimation → biomechanical metrics | Marengo semantic search finds relevant plays by movement type |
| **Intangibles** | — | Pegasus analyzes sideline behavior, leadership signals, celebration patterns |
| **ScoutVerify** | Counts actual snaps vs highlight clips shown | Pegasus extracts claims; cross-ref against stats APIs |

### ScoutVerify — The VerifyAI-Inspired Module

**Purpose:** Automated verification of prospect evaluations against evidence.

**Inputs:**
- Highlight reels (video)
- Recruiting articles and social media posts (text)
- Stats databases (MaxPreps, ESPN, 247Sports)

**Analysis Pipeline:**

```python
# Pseudocode for ScoutVerify pipeline

# 1. Ingest highlight reel via Twelve Labs
video_id = twelve_labs.index(highlight_reel)

# 2. Extract claims from the video
claims = twelve_labs.generate(
    video_id=video_id,
    prompt="List all performance claims made in this highlight reel. "
           "Include implied claims (e.g., showing only touchdown catches "
           "implies consistency). For each claim, note the timestamp."
)

# 3. Detect highlight bias
bias_report = twelve_labs.generate(
    video_id=video_id,
    prompt="Analyze this highlight reel for selection bias. "
           "Estimate what percentage of total plays are shown. "
           "Note if only positive plays are included. "
           "Flag any editing that exaggerates speed or athleticism."
)

# 4. Cross-reference with stats
for claim in claims:
    verified = stats_api.verify(claim)  # MaxPreps, ESPN, 247Sports
    claim.confidence = verified.score
    claim.evidence = verified.sources

# 5. SAM-based snap count verification
total_snaps_in_reel = sam.count_unique_plays(highlight_reel)
# Compare against known game snap counts

# 6. Generate ScoutVerify report
report = {
    "prospect": prospect_name,
    "highlight_bias_score": bias_report.score,  # 0-100
    "claims_verified": len([c for c in claims if c.confidence > 0.8]),
    "claims_unverified": len([c for c in claims if c.confidence < 0.5]),
    "snap_coverage": total_snaps_in_reel / known_total_snaps,
    "hype_index": calculate_hype_index(claims, bias_report),
    "pai_confidence": calculate_confidence(claims, bias_report),
    "evidence_trail": [c.evidence for c in claims],
}
```

**Outputs:**
- **Highlight Bias Score** (0-100) — how cherry-picked is this reel?
- **Claims Verified/Unverified** — count of backed vs unbacked assertions
- **Snap Coverage %** — what fraction of actual game snaps appear in the reel
- **Hype Index** — composite score of media hype vs evidence
- **P.A.I. Confidence** — how much data supports the assigned tier
- **Evidence Trail** — linked sources for every claim

---

## Build vs Buy Analysis

### SAM — Build (Self-Host)

| Factor | Assessment |
|--------|-----------|
| License | Apache 2.0 — fully commercial |
| Cost model | One-time GPU cost, no per-minute fees |
| Control | Full — fine-tune on sports data, customize pipeline |
| GCP fit | Runs on L4/A100 via Vertex AI (already in AIMS infra) |
| Maintenance | Meta actively maintains; large community |
| **Recommendation** | **Self-host on GCP Vertex AI** — aligns with existing PersonaPlex GPU infra |

### Twelve Labs — Buy (API)

| Factor | Assessment |
|--------|-----------|
| Cost | $0.033/min at developer tier; enterprise custom |
| Time to value | Days vs months for building equivalent |
| NFL validated | Already used by the NFL for game film |
| n8n integration | Community node exists (AIMS runs n8n) |
| MCP integration | Connects to Claude, AI agents |
| Limitations | API dependency, cost scales with usage |
| **Recommendation** | **Start with API, evaluate self-host later** — Pegasus/Marengo not open-source |

### Combined Strategy

| Phase | SAM | Twelve Labs | ScoutVerify |
|-------|-----|-------------|-------------|
| **MVP (Month 1-2)** | SAM 2.1 Hiera-Base+ on GCP L4, single-play clips | Free tier (600 min), Pegasus for scouting reports | Manual cross-referencing with stats APIs |
| **Beta (Month 3-4)** | SAM 3 text prompts, SAMURAI for motion, multi-play tracking | Developer tier, Marengo indexing of full game library | Automated pipeline with MaxPreps/ESPN verification |
| **Production (Month 5+)** | Fine-tuned SAM on football-specific data | Enterprise tier or evaluate Marengo on Bedrock | Full ScoutVerify with hype detection + confidence scoring |

---

## Recommended Roadmap

### Phase 1: Foundation (Immediate)

1. **Deploy SAM 2.1 on GCP** — Hiera-Base+ model on L4 GPU, processing play-by-play clips
2. **Twelve Labs free tier** — Index sample game film, test Pegasus for scouting report generation
3. **Pose estimation pipeline** — ViTPose on SAM-segmented player crops for athleticism metrics
4. **Wire into Film Room** — SAM output feeds the Athleticism score in P.A.I.

### Phase 2: ScoutVerify MVP

1. **Twelve Labs Pegasus** — Extract claims and bias indicators from highlight reels
2. **Stats API integration** — MaxPreps, ESPN for cross-referencing
3. **Highlight Bias Score** — First iteration of the verification scoring
4. **War Room integration** — Lil_Bull_Hawk and Lil_Bear_Hawk use ScoutVerify data in debates

### Phase 3: SAM 3 + Full Pipeline

1. **SAM 3 migration** — Text-based prompting for position-specific tracking
2. **SAMURAI integration** — Motion-aware tracking for fast-action plays
3. **Twelve Labs enterprise** — Full game library indexing, semantic search
4. **Hype Index** — Complete media hype detection across video + text + social
5. **Evidence Trail** — Every P.A.I. grade linked to verifiable evidence

### Phase 4: Differentiation

1. **Fine-tune SAM on football data** — Higher accuracy for football-specific segmentation
2. **Custom Pegasus prompts** — Position-specific scouting report templates
3. **Real-time ScoutVerify** — Live evaluation during games/combines
4. **Public API** — Let other scouting services use ScoutVerify (monetization opportunity)

---

## Competitive Advantage

No existing scouting platform combines all three of these:

| Capability | 247Sports | Rivals | PFF | On3 | **Per|Form** |
|-----------|-----------|--------|-----|-----|-------------|
| AI video segmentation | No | No | No | No | **SAM 2/3** |
| Semantic game film search | No | No | No | No | **Twelve Labs** |
| Auto scouting reports | No | No | No | No | **Pegasus** |
| Highlight bias detection | No | No | No | No | **ScoutVerify** |
| Evidence-backed grades | No | No | Partial | No | **P.A.I. + ScoutVerify** |
| Bull vs Bear AI debates | No | No | No | No | **War Room** |

Per|Form would be the first platform where every grade is **verifiable** — not just an opinion, but a score backed by tracked evidence with a confidence level and hype-check.

---

## Sources

### Meta SAM
- [Meta SAM 2 Official](https://ai.meta.com/sam2/)
- [SAM 2 GitHub](https://github.com/facebookresearch/sam2)
- [SAM 2 Paper (arXiv:2408.00714)](https://arxiv.org/abs/2408.00714)
- [SAM 3 Blog Post](https://ai.meta.com/blog/segment-anything-model-3/)
- [SAM 3 GitHub](https://github.com/facebookresearch/sam3)
- [SAM 3 Paper (arXiv:2511.16719)](https://arxiv.org/abs/2511.16719)
- [SAM 2.1 Explained — Encord](https://encord.com/blog/sam-2.1-explained/)
- [SAM 2 on SageMaker JumpStart](https://aws.amazon.com/blogs/machine-learning/meta-sam-2-1-is-now-available-in-amazon-sagemaker-jumpstart/)
- [SAMURAI: Zero-Shot Visual Tracking](https://github.com/yangchris11/samurai)
- [Team-Aware Football Tracking (arXiv:2512.08467)](https://arxiv.org/html/2512.08467)
- [Basketball Player Detection — Roboflow](https://blog.roboflow.com/identify-basketball-players/)
- [Ball Tracking — Sieve](https://www.sieve.ai/blog/ball-tracking-with-sam2)
- [SAM2Long (ICCV 2025)](https://github.com/Mark12Ding/SAM2Long)
- [SAM 3 — Roboflow Analysis](https://blog.roboflow.com/what-is-sam3/)

### Twelve Labs
- [Twelve Labs Official](https://www.twelvelabs.io/)
- [Twelve Labs Docs](https://docs.twelvelabs.io/)
- [Marengo 3.0 Launch](https://www.twelvelabs.io/blog/marengo-3-0)
- [Pegasus 1.2 Blog](https://www.twelvelabs.io/blog/introducing-pegasus-1-2)
- [Sports Analysis Docs](https://docs.twelvelabs.io/docs/sports)
- [Multi-Sport Analysis Blog](https://www.twelvelabs.io/blog/sports-analysis)
- [MCP Server](https://www.twelvelabs.io/blog/twelve-labs-mcp-server)
- [Jockey Agent](https://www.twelvelabs.io/blog/introducing-jockey)
- [n8n Integration](https://www.twelvelabs.io/blog/twelve-labs-and-n8n)
- [TechCrunch: Twelve Labs $12M](https://techcrunch.com/2022/12/05/twelve-labs-lands-12m-for-ai-that-understands-the-context-of-videos/)
- [AWS Case Study](https://aws.amazon.com/solutions/case-studies/twelvelabs-case-study/)
- [Marengo 3.0 — HPCwire](https://www.hpcwire.com/aiwire/2025/12/01/twelvelabs-launches-marengo-3-0-video-understanding-model-on-twelvelabs-and-amazon-bedrock/)

### VerifyAI / Content Verification
- VerifyAI hackathon project (DevPost submission — Flask + OpenAI + Twelve Labs Pegasus)
- [How Users Use Pegasus](https://www.twelvelabs.io/blog/how-twelvelabs-users-use-pegasus)
- [Video Classification — Twelve Labs](https://www.twelvelabs.io/blog/effortless-video-classifiers-with-twelve-labs-api-no-ml-training-required)
- [Denver Hackathon Recap](https://www.twelvelabs.io/blog/denver-hackathon-recap)
- [LA Hackathon Recap](https://www.twelvelabs.io/blog/la-hackathon-recap)
