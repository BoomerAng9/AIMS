# A.I.M.S. Product Expansion — Full Rollout

> Date: 2026-02-22
> Status: Research complete, ready for implementation planning

---

## What This Document Covers

Five expansion layers for AIMS, built on top of the existing platform. Each layer depends on the one below it. The research behind every section is sourced from current (Feb 2026) market data, not speculation.

---

## Layer 1: Platform Engine Completion

### Current State
- 47% of AIMS requirements complete (17 done, 15 partial, 4 missing)
- 15 Docker services running on VPS
- ACHEEVY chat streaming via OpenRouter
- 16 revenue verticals defined with Phase A UI
- NtNtN/Buildsmith fully specced
- Plug system designed but not executing

### What's Missing (Blocks Everything Above)

| Gap | What It Is | Why It Matters |
|-----|-----------|----------------|
| Docker API integration | Programmatic container creation/destruction via Docker Engine API | Nothing deploys dynamically without it |
| Port allocation engine | Auto-assign ports in 51000+ range (10-port increments) | Each plug instance needs its own port block |
| Dynamic nginx config | Generate and reload reverse proxy configs per instance | Instances need public URLs |
| Health check engine | Continuous HTTP polling + resource monitoring per instance | Can't manage what you can't measure |
| Decommission flow | Graceful stop → cleanup → port release → config removal | Containers pile up without lifecycle management |

### Priority
This is the foundation. Every expansion below routes through the Plug Spin-Up engine. Ship this first.

---

## Layer 2: Sandboxed Computer Control

### The Landscape (Feb 2026)

Computer use has crossed from demo to production. Every major lab ships it.

| Provider | Product | How It Works | Benchmark | Status |
|----------|---------|-------------|-----------|--------|
| **Anthropic** | Claude Computer Use API | Screenshot → analyze → mouse/keyboard action → repeat | 72.5% OSWorld (Sonnet 4.6) | Beta, shipping |
| **Anthropic** | Claude Cowork | Desktop app, same loop, consumer-grade | Opus 4.6 powered | GA on Windows + macOS |
| **OpenAI** | ChatGPT Agent (ex-Operator) | Cloud-hosted browser, GPT-4o vision + RL reasoning | 38.1% OSWorld | GA for Plus/Pro |
| **Google** | Gemini 2.5 Computer Use | Browser-only control, API available | "Outperforms all providers" per Browserbase | Developer preview |
| **Google** | Project Mariner | Consumer browser agent, multi-task, teach-and-repeat | N/A | AI Ultra subscribers |
| **ByteDance** | UI-TARS 1.5 / 2 | Open-source VLM, unified perception+reasoning+action | SOTA on 7 GUI benchmarks | Apache 2.0, runs offline |
| **Open Source** | Browser Use | Python + Playwright + any LLM, 21k GitHub stars | N/A | v0.11.11, active |
| **Open Source** | Open Interpreter | Local execution, full system access | N/A | Stable |

### Sandboxing Options

| Approach | Isolation Level | Boot Time | Use Case |
|----------|----------------|-----------|----------|
| Docker + VNC + noVNC | Shared kernel (weakest) | Seconds | Dev/testing |
| Docker Desktop 4.50+ Sandboxes | MicroVM with private daemon | Seconds | Agent execution |
| E2B (Firecracker microVMs) | Dedicated kernel per workload | <200ms | Production standard |
| Browserbase | Cloud browser instances | Milliseconds | Browser-only tasks |
| Kata Containers | Multi-VMM orchestration + K8s | Seconds | Enterprise hardened |

**E2B is the production standard.** Firecracker microVMs (same tech as AWS Lambda), <200ms boot, 24hr sessions, 88% of Fortune 100 signed up. $21M Series A.

### What AIMS Builds

A plug called **Computer Control** in the catalog. One-click deploy through the existing Plug Spin-Up engine.

**Architecture:**
```
User → ACHEEVY (voice/text) → UEF Gateway → Computer Control Plug
  └─ Firecracker microVM (E2B or self-hosted)
       └─ Ubuntu + XFCE desktop + Firefox + apps
       └─ AI agent (Claude/Gemini/UI-TARS) controlling via screenshot loop
       └─ noVNC WebSocket → user's browser (live view)
```

**User experience:**
1. User says "I need a computer to work on [task]"
2. ACHEEVY spins up a sandboxed desktop environment
3. User sees the desktop in their browser via noVNC
4. AI agent controls the desktop, user watches and directs via voice/text
5. When done, container tears down clean

**What makes this different from E2B/Browserbase/Manus directly:**
- They're developer tools. AIMS makes it consumer-grade through ACHEEVY
- One-click deploy, no API keys, no code
- Full lifecycle management (health checks, resource monitoring, auto-teardown)
- Voice-first interaction — talk to the agent while it works
- Exportable — Plug Export bundles let clients self-host the same setup

### Model Strategy
- **Default:** Claude Sonnet 4.6 (72.5% OSWorld, $3/$15 per M tokens, best cost/performance)
- **Premium:** Claude Opus 4.6 (72.7% OSWorld, highest capability)
- **Self-hosted/offline:** UI-TARS 1.5 or 2 (Apache 2.0, no cloud dependency)
- **Browser-only tasks:** Gemini 2.5 Computer Use or Browser Use + any LLM

---

## Layer 3: Application Mastery Agents

### The Insight

Computer control is the commodity. Everyone ships it. The differentiation is *what you do with it*.

An AI controlling a computer is useless if it doesn't know the application's workflow. Clicking randomly through Premiere Pro doesn't edit a video. These agents need domain-specific knowledge baked in — keyboard shortcuts, menu structures, workflow patterns, output formats.

### Agent Catalog

Each of these is a plug in the catalog. Each runs inside a Layer 2 sandboxed desktop.

#### Video Production Agent
- **Applications:** Premiere Pro, DaVinci Resolve, CapCut, After Effects
- **Capabilities:** Import footage, organize bins, make cuts on dialogue/action, apply transitions, color grade, add titles, export to spec
- **Input:** Voice/text description of the edit ("Cut together the interview clips, add lower thirds, export 1080p for YouTube")
- **Differentiator:** Knows editing conventions — J-cuts, L-cuts, match cuts, pacing for different content types

#### Design Agent
- **Applications:** Figma, Canva, Photoshop, Illustrator
- **Capabilities:** Create layouts, design components, export assets, maintain design systems
- **Input:** Voice/text description or reference images
- **Differentiator:** Understands design principles — hierarchy, spacing, color theory, typography, responsive breakpoints

#### MCP Wiring Agent
- **Capabilities:** Auto-configure Model Context Protocol tool chains
- **Input:** "Connect Claude to my GitHub, database, and Slack"
- **Process:** Installs MCP servers, configures credentials, tests connections, validates tool availability
- **Differentiator:** Knows the MCP ecosystem — which servers exist, which are stable, how to configure each one

#### Prompt Engineering Agent
- **The meta-play.** An agent that knows how to talk to every other model.
- **Capabilities:** Write and optimize prompts for Midjourney, DALL-E, Stable Diffusion, Claude, GPT, Gemini, Suno, Runway
- **Input:** User describes what they want in plain language
- **Output:** Platform-specific prompt optimized for that model's strengths and syntax
- **Can execute:** If the target platform is accessible, the agent writes the prompt AND runs it
- **Differentiator:** Cross-platform prompt knowledge is tribal — scattered across Discord servers and Reddit. This centralizes it.

#### LMS Builder Agent
- **Applications:** Teachable, Thinkific, Canvas, or standalone via NtNtN
- **Capabilities:** Build course structures, write lesson plans, create quizzes, generate certificates, design landing pages
- **Input:** Subject matter + target audience + desired outcomes
- **Differentiator:** Combines curriculum design knowledge with the ability to actually build inside LMS platforms or generate standalone course sites

---

## Layer 4: Sports Playbook Engine

### Market Analysis

**The market is fragmented, static, and AI-illiterate.**

62+ playbook tools exist. None of them understand football. They're digital whiteboards.

| Tool | Level | Price | What It Does | What It Doesn't Do |
|------|-------|-------|-------------|-------------------|
| Hudl | HS/College/Pro | $900+/yr | Video analysis + basic playbook | No AI generation, no animation |
| FirstDown PlayBook | Youth/HS/College | $125-250/yr | 35,000 pre-drawn plays | Static library, no voice, no AI |
| Pro Quick Draw | College/NFL | $199+/yr | Visio/PPT plugin for diagramming | Manual drawing only |
| GoRout | HS/College | $650+ | Wearable play delivery | Hardware-dependent, no AI |
| Play Designer Pro | All | $120/yr | Drawing + auto-quizzes | Basic AI, no animation |
| Football Play Card | HS/College/Pro | $108+/yr | Scout card creation | No play design, no AI |

**NFL sidelines:** Microsoft Surface tablets, locked down, no third-party apps. Display static play images. New Copilot+ integration adds AI-filtered image search and Excel dashboards, but no play generation.

**AI in the space:** Near zero. A chatbot on Poe that generates text descriptions. A Roboflow prototype that identifies formations from video. ESPN's MNF Playbook does real-time analytics. Nothing generates play diagrams from natural language with scheme awareness.

### Eight Market Gaps

1. **No natural language → play diagram tool exists**
2. **No tool understands offensive systems** (West Coast, Air Raid, Run and Shoot, Go-Go, Spread)
3. **No play simulation against defenses**
4. **No unified platform** (play design + video + player learning + game-day in one)
5. **Youth/HS tier is overcharged** for basic tools
6. **Historical scheme knowledge isn't digitized**
7. **No "Duolingo for playbooks"** — player learning is primitive
8. **No animated play execution visualization** beyond basic GIFs

### What AIMS Builds

A tablet-first, voice-first playbook platform with four input modes and three output modes.

#### Input Modes

**1. Draw It (Touch)**
- Coach draws on the tablet screen with their finger — just like drawing in the dirt
- Stroke recognition converts hand-drawn lines into clean SVG:
  - Straight lines → route stems
  - Curved lines → route breaks (cuts, curls, posts)
  - Circles → player positions
  - X marks → defensive players
  - Arrows → blocking assignments, motion paths
- Real-time snapping to football conventions as they draw
- Technology: Canvas/SVG capture → ML stroke classifier → vector output

**2. Say It (Voice)**
- "Trips right, Z post, Y dig, X go, H swing left"
- ACHEEVY parses football terminology:
  - Formation names (I-Right, Shotgun Trips, Pistol, Empty, Bunch)
  - Route names (slant, out, post, corner, dig, wheel, seam, comeback)
  - Blocking schemes (zone left, man, slide protection, max protect)
  - Motion and shift calls
  - Play-action and RPO tags
- Generates the SVG diagram instantly from the voice description
- Technology: Groq Whisper → football NLP parser → formation/route resolver → SVG renderer

**3. Generate It (AI Scheme Engine)**
- "Give me five Air Raid mesh concepts against Cover 3 from trips"
- The AI knows the schemes. It has internalized:

| Innovator | System | Key Visual Signature |
|-----------|--------|---------------------|
| Vince Lombardi | Power Sweep | Two pulling guards creating an edge wall, RB reads daylight |
| Don Coryell | Air Coryell | Four vertical stems stretching deep, TE running WR routes |
| Bill Walsh | West Coast | Short crossing routes at precise angles, 5 receivers releasing simultaneously |
| Tiger Ellison / Mouse Davis / June Jones | Run and Shoot | Four WR routes with branching decision trees (2-3 options per route) |
| Hal Mumme / Mike Leach | Air Raid | 2x2 or 3x1 spread, small set of core concepts (Mesh, Y-Cross, Shallow, Four Verts) |
| Chip Kelly | Tempo/Blur | Spread formation + zone read, tempo indicator annotations |
| Brennan Marion | Go-Go | Quadruple-option RPOs, one-word calls, exotic formations hiding simple concepts |
| Sean McVay | Modern Motion | Pre-snap motion arrows with man/zone indicators, compressed alignments |
| Emory Bellard | Wishbone/Triple Option | Three running lanes from one snap |
| Kyle Shanahan | Outside Zone/Play-Action | Zone run action as play-action launch pad |

- Generates scheme-accurate plays with correct route trees, blocking assignments, and read progressions
- Can generate variations: same concept from different formations, against different coverages

**4. Type It (Text)**
- Standard text input for coaches who prefer typing play descriptions
- Same NLP parsing as voice mode

#### Output Modes

**1. Static SVG Diagram**
- Clean vector rendering of the play
- Standardized symbols: circles (offense), triangles (defense), solid lines (routes), dashed lines (motion), wavy lines (blocking)
- Color-coded by assignment type
- Exportable as SVG, PNG, PDF
- Print-ready for wristbands, play cards, playbook binders

**2. Animated SVG Execution**
- Players move along their routes in real time
- Ball travels from QB to receiver
- Blocking engagements animate
- Read progression highlights (primary → secondary → check-down)
- Controls: play, pause, rewind, speed (0.25x to 2x)
- Frame-by-frame stepping for teaching
- Technology: SVG + CSS animations / GSAP / Motion for complex sequencing

**3. Interactive Simulation**
- Drop the play against a defense: Cover 1, Cover 2, Cover 3, Cover 4, Cover 6, Man-Under, Quarters
- AI highlights:
  - Open windows (where the defense is weak)
  - Primary read vs. the called coverage
  - Hot route adjustments against blitz looks
  - Run gaps against front alignments
- Drag defenders to custom positions to test "what if" scenarios
- Technology: SVG + physics engine for route/defender intersection calculation

#### Player Learning System

- Auto-generate quizzes from the playbook:
  - "What's your assignment on Z-Right Mesh against Cover 3?"
  - "Identify the formation" (show diagram, name it)
  - "What's the hot route if the Mike blitzes?"
- Track comprehension per player
- Leaderboard / XP system (gamification)
- Spaced repetition for installation (the concepts coaches need drilled before game day)
- Export quiz results for coaches

#### Integration with Per|Form

This lives inside the existing Per|Form vertical:
- **Scout Hub** feeds opponent tendency data → playbook engine generates counters
- **Film Room** feeds game footage → SAM 2 segments players → overlay play diagrams on real film
- **War Room** feeds rankings/content → contextual play recommendations
- **Playbook Engine** ties it all together: scout → scheme → install → quiz → game-day call sheet

#### Pricing Strategy

Undercut the fragmented market by bundling everything:

| Tier | Target | Price | Includes |
|------|--------|-------|----------|
| Camp/Youth | Youth coaches, camps | Free / $10/mo | Draw + voice input, static SVG, 50 plays, basic quizzes |
| High School | HS programs | $30/mo | All input modes, animation, 500 plays, full quiz system |
| College | College programs | $75/mo | Everything + simulation, unlimited plays, film integration, roster management |
| Pro | NFL/CFL/XFL | Custom | Everything + API access, custom scheme libraries, dedicated support |

For context: FirstDown charges $250/yr for a static play library. Hudl charges $900+/yr for video alone. Pro Quick Draw charges $199+/yr for a PowerPoint plugin.

---

## Layer 5: Sequencing — The Loaded Magazine

### Warning Shots (Launch With)

These are the demos that get attention:

1. **Computer control sandbox** — AI running a desktop in the browser. Visceral, shareable, immediately understandable. "Watch AI use your computer" is a 10-second pitch.

2. **Voice-to-play-diagram** — Coach says "I-right 36 Power" and watches it draw itself in animated SVG. One video of this goes viral in coaching communities. Nothing like it exists.

3. **Prompt engineering agent** — Everyone wants better prompts. Low friction, high value, immediate utility. Works across every AI platform.

### Fast Follow (Weeks 2-6)

4. **Application mastery agents** — Video editing, design, MCP wiring. Each one is a new plug in the catalog.

5. **Full playbook engine** — Simulation, player learning, film integration. This is the complete sports product.

6. **LMS builder** — Course creation for educators, trainers, corporate L&D.

### The Rounds That Matter (Months 2-6)

7. **Plug Export for all of the above** — Self-hosting bundles so clients run this on their own infrastructure.

8. **Multi-sport expansion** — Same playbook architecture for basketball (plays/sets), soccer (formations/set pieces), baseball (defensive alignments/pitch sequences). Different sport knowledge, same engine.

9. **Model upgrades** — As Claude 5, Gemini 3.x, GPT-5 ship, computer control gets faster and more reliable. The agents get better without code changes. The architecture is model-agnostic.

10. **Marketplace** — Third-party agents built on the AIMS platform. Other developers create application mastery agents for niche tools. AIMS takes a cut.

---

## Technical Requirements Summary

### New Infrastructure

| Component | Purpose | Technology |
|-----------|---------|------------|
| Container execution engine | Dynamic plug deployment | Docker Engine API / Dockerode |
| MicroVM sandbox | Computer control isolation | E2B SDK or self-hosted Firecracker |
| noVNC gateway | Browser-based desktop viewing | noVNC + WebSocket proxy |
| SVG rendering engine | Play diagram generation | D3.js / custom SVG generator |
| SVG animation engine | Play execution visualization | GSAP / Motion / CSS animations |
| Football NLP parser | Voice/text → play structure | Custom parser + LLM classification |
| Scheme knowledge base | Historical system library | Structured data + RAG |
| Stroke recognition | Touch drawing → vector shapes | ML classifier (Canvas API input) |
| Simulation engine | Play vs. defense calculation | Custom geometry + physics |
| Quiz engine | Player learning/assessment | Question generator + spaced repetition |

### New Plugs in Catalog

| Plug | Layer | Container Type |
|------|-------|---------------|
| Computer Control | 2 | Firecracker microVM + desktop + noVNC |
| Video Production Agent | 3 | Desktop sandbox + Premiere/DaVinci |
| Design Agent | 3 | Desktop sandbox + Figma/Canva |
| MCP Wiring Agent | 3 | Standard container + MCP servers |
| Prompt Engineering Agent | 3 | Standard container + multi-model API access |
| LMS Builder | 3 | Desktop sandbox + LMS platform OR NtNtN |
| Playbook Engine | 4 | Standard container + SVG engine + NLP |

### Integration Points

```
Existing ACHEEVY Chat ──→ Voice/text intent classification
Existing UEF Gateway   ──→ Routes to new plug types
Existing Plug Spin-Up  ──→ Deploys new container types (needs Docker API)
Existing Per|Form      ──→ Playbook engine integration
Existing NtNtN         ──→ LMS site generation
Existing Film Room     ──→ Play diagram overlay on footage
Existing Scout Hub     ──→ Opponent data → play generation
```

---

## What Sets AIMS Apart

1. **Nobody else has the full vertical.** Deploy the sandbox + run the agent + manage the lifecycle + monitor health + export for self-hosting. Every competitor does one piece.

2. **The sports playbook is a real product with a real moat.** It requires scheme knowledge, SVG rendering, animation, voice input, NLP parsing, and simulation. That's not a feature someone bolts onto a chatbot.

3. **ACHEEVY as single interface.** Users never learn the underlying tools. They talk.

4. **Plug Export makes every product portable.** Client doesn't want to use your cloud? Bundle it up, hand them a docker-compose, they run it themselves. Same product, their infrastructure.

5. **Model-agnostic architecture.** Claude today, Gemini tomorrow, open-source UI-TARS for offline. The agents improve as models improve without code changes.

---

## Research Sources

### Computer Control
- Anthropic Claude Computer Use API docs
- Anthropic Claude Sonnet 4.6 announcement (Feb 17, 2026)
- OpenAI Operator / CUA documentation
- Google Gemini 2.5 Computer Use announcement
- ByteDance UI-TARS GitHub (Apache 2.0)
- E2B documentation and Firecracker architecture
- Browserbase documentation
- Docker Desktop 4.50+ Sandboxes documentation

### Sports Play-Calling Innovation
- Vince Lombardi / Packers Power Sweep — Packers.com, Wikipedia, The Quick Report
- Don Coryell / Air Coryell — Wikipedia, Bleacher Report, DraftBlaster
- Bill Walsh / West Coast Offense — Wikipedia, vIQtory Sports, Stanford Magazine, ESPN
- June Jones / Run and Shoot — Wikipedia, Grantland, Wesley Ross Football
- Hal Mumme & Mike Leach / Air Raid — Wikipedia, ESPN (2 articles), Smart Football
- Chip Kelly / Tempo Offense — FishDuck, Eleven Warriors, LimaOhio
- Brennan Marion / Go-Go Offense — Texas Talk, The Touchdown
- Sean McVay / Modern Motion — Coalescence, Turf Show Times, The Ringer, Buccaneers.com

### Digital Playbook Market
- NFL + Microsoft Surface partnership — Microsoft Source, NFL Operations, Windows Central, Fortune
- Hudl, FirstDown PlayBook, Pro Quick Draw, GoRout, Play Designer Pro — product sites and reviews
- AI in football — Roboflow, Yahoo Sports, AIhub, ESPN SVG, NFL/AWS Digital Athlete
- Market analysis — American Football Academy, MSPowerUser, Content Mavericks, Glazier Clinics
