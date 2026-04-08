# ByteDance AI Products & Offerings — Research Report

**Date:** 2026-02-20
**Purpose:** Competitive intelligence on ByteDance's complete AI product ecosystem

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Seedance — AI Video Generation](#seedance)
3. [DeerFlow — Deep Research Agent Framework](#deerflow)
4. [Trae AI — AI-Powered IDE](#trae-ai)
5. [Doubao / Seed 2.0 — Flagship LLM & Chatbot](#doubao)
6. [Cici — International AI Assistant](#cici)
7. [Coze — No-Code AI Agent Platform](#coze)
8. [MarsCode — AI Coding Tool (now Trae Plugin)](#marscode)
9. [Dreamina — AI Image & Video Creative Suite](#dreamina)
10. [OmniHuman-1 — Realistic Human Video Generation](#omnihuman)
11. [Volcano Engine — Cloud & Enterprise AI](#volcano-engine)
12. [Seed Research Team — Full Model Portfolio](#seed-models)
13. [Hardware & Infrastructure](#hardware)
14. [Strategic Analysis](#strategic-analysis)

---

## Executive Summary

ByteDance has built one of the most comprehensive AI product ecosystems globally, spanning consumer chatbots, developer tools, creative AI, enterprise cloud, and foundational research. Key numbers:

- **$23B** planned AI infrastructure spend for 2026 (up from ~$20B in 2025)
- **200M+** monthly active users on Doubao (China's #1 AI chatbot)
- **30 trillion+** daily tokens consumed across ByteDance AI services (as of Oct 2025)
- **~1,500 people** on the Seed research team, led by Wu Yonghui (ex-Google Brain/DeepMind)
- **46.4%** market share in China's public cloud large model service market

The ecosystem is organized around a few pillars:
- **Seed team** builds the foundation models (LLM, vision, video, speech, 3D)
- **Doubao/Cici** are the consumer-facing chatbot apps (domestic/international)
- **Volcano Engine** is the enterprise cloud and API platform
- **Trae/MarsCode** target developers
- **Coze** enables no-code AI agent building
- **Seedance/Dreamina/Seedream** power creative AI (video, image)
- **DeerFlow** is an open-source research agent framework

---

## Seedance

**Category:** AI Video Generation (text-to-video, image-to-video)
**Official site:** [seed.bytedance.com/en/seedance](https://seed.bytedance.com/en/seedance)

### What It Is

Seedance is ByteDance's AI video generation model family, creating high-quality cinematic video from text prompts, images, audio, and video references. It is one of the most capable AI video generators available.

### Version History

| Version | Date | Key Capability |
|---------|------|----------------|
| Seedance 1.0 | Jun 2025 | 1080p text/image-to-video, multi-shot narrative, diverse styles |
| Seedance 1.5 Pro | Dec 2025 | First model to natively co-generate audio+video; lip-sync, spatial sound, multi-language |
| Seedance 2.0 | Feb 2026 | Unified multimodal architecture; up to 9 images + 3 videos + 3 audio clips as input; 15s multi-shot output with dual-channel audio |

### Key Capabilities

- **Motion quality:** Cinematic-level human motion — pair figure skating with synchronized takeoffs, spins, and landings without physical glitches
- **Multimodal input:** Text, image (up to 9), video (up to 3), audio (up to 3) simultaneously
- **Audio-video co-generation:** Synchronized dialogue, ambient sound, and mood-fitting music
- **Style range:** Photorealism, cyberpunk, illustration, felt texture, anime, and more
- **Multi-shot narrative:** Maintains subject/style consistency across shot transitions
- **Output:** 15-second high-quality multi-shot audio-video with dual-channel audio

### Use Cases

Commercial advertising, film/TV VFX, game animations, explainer videos, music videos, social media content.

### Competitive Position

Competes directly with: Runway Gen-3, Sora (OpenAI), Kling (Kuaishou), Pika Labs, Veo 2 (Google). Seedance 2.0's multimodal input breadth and audio co-generation are differentiators.

---

## DeerFlow

**Category:** Open-Source Multi-Agent Research Framework
**GitHub:** [github.com/bytedance/deer-flow](https://github.com/bytedance/deer-flow)
**Website:** [deerflow.tech](https://deerflow.tech/)
**License:** MIT

### What It Is

DeerFlow (Deep Exploration and Efficient Research Flow) is an open-source multi-agent orchestration system designed to automate complex research tasks. It's been positioned as ByteDance's open-source competitor to OpenAI's DeepResearch.

### Architecture

Built on **LangChain** and **LangGraph**, DeerFlow coordinates specialized agents:

| Agent | Role |
|-------|------|
| Researcher | Web search, academic source crawling (ArXiv), content extraction |
| Coder | Python REPL execution for data analysis and logic |
| Crawler | Deep content scraping via Jina |
| Reporter | Synthesizes outputs into reports, scripts, audio, slides |

Agents operate independently and communicate via a LangGraph-powered directed graph.

### Key Features

- **Persistent memory:** Stores user profile, preferences, accumulated knowledge locally across sessions
- **Model agnostic:** Works with any LLM implementing OpenAI-compatible API
- **Skills system:** Built-in skills for research, report generation, slide creation, web pages, image/video generation; fully extensible
- **MCP integration:** Model Context Protocol support for GitHub, Google Drive, Slack, and other APIs
- **Audio & slides:** Research reports convertible to podcasts (VolcEngine TTS) and presentations (Marp CLI)
- **Human-in-the-loop:** Users can review agent reasoning, override decisions, redirect research paths at runtime

### Relevance to AIMS

DeerFlow's architecture (multi-agent orchestration, persistent memory, skills system, MCP integration) closely mirrors patterns in AIMS. Worth studying for:
- Agent coordination patterns via LangGraph
- Skills/tools extensibility model
- Human-in-the-loop workflow design
- Open-source community engagement strategy

---

## Trae AI

**Category:** AI-Powered IDE
**Website:** [trae.ai](https://www.trae.ai/)

### What It Is

Trae ("The Real AI Engineer") is ByteDance's AI-powered IDE, built on VS Code, offering free access to Claude 3.7 Sonnet and GPT-4o. It launched January 20, 2025 and has rapidly become a competitor to Cursor, Windsurf, and GitHub Copilot.

### Key Features

- **AI chat & assistance:** Intelligent Q&A integrated into the editor
- **Real-time code suggestions:** Inline completions as you type
- **Natural language to code:** Convert descriptions to functional code
- **Builder Mode:** Create full applications from scratch through AI-guided project setup
- **Multimodal input:** Supports image upload for context
- **Integrated Webview:** Preview web development output in-editor
- **Free tier:** Claude 3.7 Sonnet and GPT-4o at no cost

### Platform Support

- macOS (launch)
- Windows 10/11 (added later)
- Linux (planned)

### Trae 2.0 (Upcoming)

Announced with voice interaction, deeper coding collaboration, and multimodal capabilities. Positions the product for "deep collaboration era."

### Privacy Concerns

Security firm Unit 221B documented in March 2025:
- Persistent connections to 5+ ByteDance domains
- Continuous telemetry transmission even during idle periods
- Extensive data collection infrastructure

### Relationship to MarsCode

MarsCode was ByteDance's earlier AI coding tool (cloud IDE + VS Code plugin). It has been rebranded/merged into the Trae product line. The Trae Plugin is the direct successor to MarsCode.

### Competitive Position

Competes with: Cursor, Windsurf (Codeium), GitHub Copilot, Devin, Bolt.new. Key differentiator is being completely free with access to frontier models.

---

## Doubao

**Category:** Consumer AI Chatbot / Flagship LLM
**Powered by:** Seed 2.0 model family

### What It Is

Doubao is China's #1 AI chatbot app with 200M+ monthly active users. It serves as ByteDance's primary consumer AI interface, powered by the Seed model family.

### Seed 2.0 Model Family (Feb 14, 2026)

| Variant | Use Case | AIME 2025 | Codeforces | Key Strength |
|---------|----------|-----------|------------|--------------|
| Pro | Frontier reasoning | 98.3 | 3020 | Competes with GPT-5.2, Gemini 3 Pro |
| Lite | Default production | 93 | 2233 | Cost-efficient enterprise workloads |
| Mini | High-throughput batch | 87 | 1644 | Content moderation, classification |
| Code | Software development | — | 3020 | Repo-level understanding, debugging |

### Key Capabilities

- **Reasoning:** Gold medals on ICPC, IMO, CMO competitions
- **Coding:** 76.5 SWE-Bench Verified, 87.8 LiveCodeBench v6
- **Video processing:** Hour-long video analysis, 89.5 VideoMME accuracy
- **Visual reasoning:** 88.8 MathVision, 85.4 MMMU
- **Agentic tasks:** 77.3 BrowseComp, 55.8 Terminal Bench
- **Cost:** Claims ~1/10th the cost of competing frontier models

### Consumer Features

- Text, image, and audio chat
- AI voice assistant (OS-level integration on phones — can hail taxis, buy train tickets)
- Screen reading and app control
- Persistent device-side memory (meeting notes, addresses, preferences)
- Speech-to-speech with interruption support
- Seedance 2.0 integration for video generation within chat

---

## Cici

**Category:** International AI Assistant (Doubao's global counterpart)
**Developer:** SPRING (SG) PTE. LTD. (ByteDance Singapore subsidiary)

### What It Is

Cici is ByteDance's international AI chatbot, targeting markets outside China (UK, Mexico, Southeast Asia — not available in US or China).

### Key Stats

- **86M** global downloads (as of Oct 2025)
- **13M** downloads in last 30 days alone
- **4.19/5** rating across 210K Google Play reviews
- Consistently top 20 in free app downloads in Indonesia, Malaysia, Philippines, Mexico, UK

### Technical Architecture

Unlike Doubao (which runs on ByteDance's Seed models), Cici uses **OpenAI GPT** and **Google Gemini** as its LLM infrastructure — deliberately sidestepping regulatory concerns in international markets.

### Features

- Text and voice chat with personalized agents
- Image generation
- Code debugging and optimization
- Calendar-based planning (study plans, fitness routines, schedules)
- 18 languages with culturally localized responses
- Integration with TikTok, CapCut, Lark/Feishu

### Pricing

$9.90/month premium (51% below ChatGPT Plus).

---

## Coze

**Category:** No-Code AI Agent Platform
**Website:** coze.com
**GitHub:** [github.com/coze-dev/coze-studio](https://github.com/coze-dev/coze-studio)

### What It Is

Coze is ByteDance's no-code/low-code platform for building AI agents and deploying them across Discord, WhatsApp, Twitter, Feishu, and other platforms.

### Open-Source Components (Jul 2025)

- **Coze Studio:** Visual drag-and-drop AI agent development (10K+ GitHub stars in 3 days)
- **Coze Loop:** Full lifecycle agent management — debugging, evaluation, monitoring

Tech stack: Golang backend, React + TypeScript frontend, microservices + DDD architecture.

### Coze 2.0 (Jan 19, 2026)

Major upgrade transforming it from chatbot builder to intelligent work partner:

- **Persistent planning:** AI breaks down complex objectives into tasks, executes autonomously over extended periods
- **Coze Coding:** Integrated "Vibe Coding" environment — build agents, workflows, web apps via natural language; one-click deploy
- **Skills Marketplace:** Professionals package expertise as purchasable Skills

### Coze Space (Apr 2025)

AI-powered productivity workspace where users and AI agents collaborate. Built on Doubao, supports MCP, 60+ plugins (information, travel, office, etc.).

### Enterprise Features

- New Responses API: cuts development time from 2 days to 1 hour, 87% less code
- Local deployment option for data privacy/compliance
- Multi-model support

### Relevance to AIMS

Coze's architecture is directly comparable to AIMS's Coze-like agent building ambitions. Key areas to study:
- Visual workflow builder patterns
- Skills marketplace concept
- Persistent planning for autonomous agents
- MCP integration approach

---

## MarsCode

**Category:** AI Coding Tool (now merged into Trae)

### What It Was

MarsCode was ByteDance's earlier AI coding assistant, built on the Doubao model. It offered:
- Cloud-based IDE (browser-accessible, no local setup)
- AI code completion for 100+ languages
- Code explanation and optimization
- Bug detection and automated fixing (MarsCode Agent ranked #1 on SWE-bench Lite)
- Unit test generation
- VS Code and JetBrains integration
- Free for domestic developers

### Current Status

MarsCode has been **rebranded as the Trae Plugin** under ByteDance's unified developer product line. The marscode.com domain now redirects to Trae.

---

## Dreamina

**Category:** AI Image & Video Creative Suite
**Website:** [dreamina.capcut.com](https://dreamina.capcut.com/)

### What It Is

Dreamina is ByteDance's consumer-facing AI creative platform, powered by Seedream 5.0 (images) and Seedance 2.0 (video). It integrates with CapCut for a complete generation-to-editing pipeline.

### Key Features

| Feature | Details |
|---------|---------|
| Text-to-image | 4 variations per prompt, up to 4K resolution via Seedream 5.0 |
| Text-to-video | Natural language camera/motion control via Seedance 2.0 |
| Image-to-video | Animate stills with Dreamina 3.0 (2K output) |
| Multiframes | Up to 10 images as connected scenes, auto-blended transitions |
| AI Lip Sync | Align audio to still image for talking-head video (Master & Fast modes) |
| Audio co-generation | Ambient sounds, lip-synced dialogue, mood music in English, Chinese, Cantonese |
| CapCut integration | Direct export to CapCut for professional editing |

### Pricing

- 225 free daily tokens (shared across tools)
- Paid membership ~$9.60/month for regular use
- Commercial use permitted under platform policies

### Styles Supported

Realistic, surreal, anime, documentary, fashion, commercial, ink wash, Chinese animation, crayon, Baroque, Cubism, and more.

---

## OmniHuman-1

**Category:** Realistic Human Video Generation (Research)
**Status:** Not publicly released

### What It Is

OmniHuman-1 generates ultra-realistic, full-body animated human videos from a single reference image plus audio or motion signals. Described as potentially the most realistic deepfake technology to date.

### Technical Details

- **Architecture:** Diffusion Transformer (DiT) with "omni-conditions training"
- **Training data:** 19,000 hours of video
- **Inputs:** Single image + audio (speech/music) and/or video (motion reference)
- **Outputs:** Arbitrary-length video with full-body animation, emotional expressions, precise lip-sync
- **Aspect ratios:** Any (portrait, half-body, full-body)

### Capabilities

- Full-body animation (not just face/upper body like competitors)
- Audio-driven: speech gestures and lip-sync
- Video-driven: replicate or modify motion from reference footage
- Combined modalities: audio for speech + reference clip for gestures/dance
- Demo: Einstein explaining equations at a blackboard with natural expressions

### Ethical Considerations

Significant deepfake concerns. ByteDance has not released it publicly. The broader industry is responding with watermarking (Google SynthID, Meta Video Seal) and regulatory frameworks (EU AI Act, US state laws).

---

## Volcano Engine

**Category:** Enterprise Cloud & AI Platform

### What It Is

Volcano Engine (火山引擎) is ByteDance's cloud computing and enterprise AI division, founded in 2021. It is China's second-largest AI cloud provider (behind Alibaba).

### Key Numbers

- **Revenue:** RMB 12B in 2024, targeting RMB 25B in 2025, RMB 100B by 2030
- **Market share:** ~13% of China's AI cloud services revenue (H1 2025)
- **Doubao API:** 46.4% of China's public cloud large model service market

### Enterprise Products

| Product | Description |
|---------|-------------|
| HiAgent | Custom AI agent creation for enterprise customers |
| Doubao API | Frontier LLM inference — RMB 0.15 per million input tokens, 10ms/token latency |
| Data Agent | Enterprise data intelligence for business data management |
| Simultaneous Interpretation Model 2.0 | 2-3 second latency (down from 8-10s), zero-shot voice cloning |
| Responses API | Native context management + multimodal support, 87% code reduction |

### Strategic Position

- Nvidia's largest customer in China (2024)
- RMB 85B budgeted for AI processors in 2025
- Exclusive AI cloud partner for China's Spring Festival Gala
- Aggressive pricing strategy to undercut Alibaba Cloud, Tencent Cloud, Huawei Cloud

---

## Seed Models

**Category:** ByteDance's Foundation Model Research Portfolio

The Seed team (est. 2023, ~1,500 people) produces all foundation models. Full portfolio:

### Foundation / LLM

| Model | Date | Notes |
|-------|------|-------|
| Seed 2.0 (Pro/Lite/Mini/Code) | Feb 2026 | Flagship; competes with GPT-5.2, Gemini 3 Pro |
| Seed 1.8 | Dec 2025 | Generalized agentic model; SOTA on BrowseComp |
| Seed 1.6 | 2025 | Adaptive thinking; multimodal |
| Seed 1.5 | 2025 | Strong knowledge, code, reasoning |
| Seed 1.5-VL | May 2025 | Vision-language; SOTA on 38/60 VLM benchmarks |
| Seed-OSS-36B | Aug 2025 | Open source (Apache 2.0); 512K context; 36B params |

### Image Generation

| Model | Notes |
|-------|-------|
| Seedream 5.0 | Latest; 2K/4K output; powers Dreamina |
| Seedream 4.5 | Dec 2025 |
| SeedEdit | Fast generative image editing |
| Seed LiveInterpret 2.0 | Image gen with deep thinking + web search |

### Video Generation

| Model | Notes |
|-------|-------|
| Seedance 2.0 | Feb 2026; multimodal audio-video co-generation |
| Seedance 1.5 Pro | Dec 2025; first native audio+video co-gen |
| Seedance 1.0 | Jun 2025; 1080p multi-shot narrative |

### Speech & Audio

| Model | Notes |
|-------|-------|
| Seed-TTS | Text-to-speech with diffusion architecture |
| Seed Realtime Voice | Real-time voice model |
| Seed Music | Music generation |

### 3D, Robotics & Science

| Model | Notes |
|-------|-------|
| Seed3D 1.0 | Oct 2025; 3D texture/material generation |
| GR-RL | Dec 2025; dexterous robotic manipulation |
| PXDesign | Sep 2025; protein binder design |
| Seed-Prover 1.5 | Jul 2025; automated theorem proving |

### Other

| Model | Notes |
|-------|-------|
| BAGEL | Open-source multimodal (text, image, video) |
| SeedVR2-3B | Video restoration / super-resolution |
| Seed Diffusion Code Model | Diffusion-based code gen; 2,146 tokens/s |
| GUI Agent Model | Native GUI interaction in virtual environments |

---

## Hardware

### Doubao AI Glasses

- Screenless AR glasses powered by Doubao
- Planned Q1 2026 launch (not officially confirmed)
- Follows Meta Ray-Ban / Google smart glasses trend

### Custom AI GPUs

- Developing 2 custom AI chips with Broadcom and TSMC
- Expected debut 2026
- Hedging against Nvidia export restrictions

### Infrastructure Spend

- 2025: ~RMB 150B ($20B+) on AI infrastructure
- 2026: RMB 160B ($23B) planned
- RMB 85B allocated specifically for AI processors
- Nvidia's largest China customer

---

## Strategic Analysis

### Strengths

1. **Vertical integration:** From foundation models (Seed) to consumer apps (Doubao/TikTok) to enterprise platform (Volcano Engine) to developer tools (Trae/Coze)
2. **Scale:** 200M+ MAU on Doubao, 30T+ daily tokens, massive training data from TikTok/Douyin
3. **Aggressive pricing:** Doubao API at 1/10th competitor costs; Trae IDE completely free
4. **Speed of execution:** Seed 1.5 → 1.6 → 1.8 → 2.0 in under 12 months
5. **Open source strategy:** DeerFlow (MIT), Coze Studio, Seed-OSS-36B (Apache 2.0), BAGEL
6. **Revenue engine:** ~$40B net profit in first 3 quarters of 2025 funds massive R&D

### Weaknesses / Risks

1. **Geopolitical:** US-China tensions, TikTok ban uncertainty, chip export restrictions
2. **Privacy concerns:** Trae telemetry issues documented by security researchers
3. **International model gap:** Cici uses OpenAI/Google models rather than proprietary Seed models
4. **Regulatory:** No federal US deepfake legislation; EU AI Act compliance requirements
5. **Talent dependence:** Heavy reliance on ex-Google Brain leadership

### Relevance to AIMS

| ByteDance Product | AIMS Parallel | Opportunity |
|-------------------|---------------|-------------|
| DeerFlow | ACHEEVY agent orchestration | Study multi-agent patterns, LangGraph usage |
| Coze | AIMS workflow builder | Visual agent builder, skills marketplace concept |
| Volcano Engine | UEF Gateway | API gateway patterns, enterprise agent deployment |
| Seedance/Dreamina | Content tools | AI video/image generation integration options |
| Trae | Developer experience | IDE-integrated AI agent patterns |
| Doubao voice assistant | ACHEEVY voice | OS-level AI assistant integration patterns |

---

## Sources

- [ByteDance Seed Official](https://seed.bytedance.com/en/)
- [Seedance 2.0 Announcement](https://seed.bytedance.com/en/blog/official-launch-of-seedance-2-0)
- [DeerFlow GitHub](https://github.com/bytedance/deer-flow)
- [DeerFlow — MarkTechPost](https://www.marktechpost.com/2025/05/09/bytedance-open-sources-deerflow-a-modular-multi-agent-framework-for-deep-research-automation/)
- [Trae AI Official](https://www.trae.ai/)
- [Trae Security Analysis — Unit 221B](https://blog.unit221b.com/dont-read-this-blog/unveiling-trae-bytedances-ai-ide-and-its-extensive-data-collection-system)
- [Trae Review — Skywork](https://skywork.ai/blog/trae-ai-ide-review-2025-cursor-alternative/)
- [Doubao 2.0 Launch — Technobezz](https://www.technobezz.com/news/bytedance-launches-doubao-20-ai-chatbot-and-positions-its-pro-model-against-gpt-52-and-gemini-3-pro)
- [Seed 2.0 Benchmarks — DigitalApplied](https://www.digitalapplied.com/blog/bytedance-seed-2-doubao-ai-model-benchmarks-guide)
- [Why Doubao is #1 — Counterpoint](https://counterpointresearch.com/en/insights/post-insight-research-notes-blogs-why-bytedances-doubao-is-1-chatbot-in-china)
- [Cici Global Strategy — Mischa Dohler](https://mischadohler.com/bytedances-global-ai-chatbot-strategy-how-cici-is-capturing-new-markets/)
- [Cici Stats — AboutChromebooks](https://www.aboutchromebooks.com/cici-ai/)
- [Coze 2.0 — AiX Society](https://aixsociety.com/bytedances-coze-2-0-transforming-ai-from-chat-tool-to-intelligent-work-partner/)
- [Coze Open Source — AIBase](https://test-news.aibase.com/news/19989)
- [MarsCode — Pandaily](https://pandaily.com/bytedance-releases-doubao-marscode-tool-with-code-completion-function)
- [Dreamina Official](https://dreamina.capcut.com/)
- [OmniHuman-1 — TechCrunch](https://techcrunch.com/2025/02/04/deepfake-videos-are-getting-shockingly-good/)
- [OmniHuman-1 — PetaPixel](https://petapixel.com/2025/02/05/bytedances-deepfake-tool-creates-convincing-videos-from-one-photo/)
- [Volcano Engine Revenue — Moomoo](https://www.moomoo.com/news/post/54044360/report-volcano-engine-s-revenue-will-double-this-year-to)
- [Volcano Engine Expansion — Dataconomy](https://dataconomy.com/2026/01/20/bytedance-targets-alibaba-with-aggressive-ai-cloud-expansion/)
- [ByteDance 2026 AI Spend — TrendForce](https://www.trendforce.com/news/2025/12/23/news-bytedance-reportedly-to-boost-2026-ai-spend-to-23b-plans-preliminary-20k-h200-chips-order)
- [ByteDance AI Apps Guide — vidBoard](https://www.vidboard.ai/bytedance-apps-products-explained-2025-guide/)
- [Seed-OSS-36B — VentureBeat](https://venturebeat.com/technology/tiktok-parent-company-bytedance-releases-new-open-source-seed-oss-36b-model-with-512k-token-context)
