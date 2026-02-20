# A.I.M.S. Voice‑First Autonomous Platform – ACHEEVY + Per Form + Deploy Hangar v1

### Architecture Targets (frozen for v1)

- **Frontend:** Next.js + Stitch design system, single **ACHEEVY chat component** reused across all products.
- **Backend:** Firebase/Firestore + custom API on **Hostinger VPS (Docker / SmelterOS)**.
- **Autonomy:** VPS Docker containers for long‑running / scheduled agents.
- **Agents:** ACHEEVY orchestrator, Chicken Hawk (builder), Boomer_Angs (specialists), Lil Hawks (bots).
- **Voice:** PersonaPlex (GPU) + Deepgram Nova STT; all ACHEEVY responses stream text + auto‑play audio.  
- **Deployment split (rules):**
  - VPS (Docker): core platform services (ACHEEVY API, SmelterOS, n8n, PersonaPlex) + autonomous jobs / sandboxes.
  - CDN: user‑facing sites/apps, funnels, generated artifacts.

***

### Phase 0 – Intake & Requirements Harvest (FOSTER)

**Goal:** Convert conversation history into a machine‑readable backlog.

Tasks:

1. **Conversation mining (AI CTO):**
   - Parse all prior A.I.M.S. threads + this spec.
   - Build `AIMS_REQUIREMENTS` list:
     - Features (single ACHEEVY UI, Per Form lobby, hangar, vibe coding, BAMARAM, etc.).
     - Constraints (tech stack, budget, VPS + CDN split).
     - Integrations (PersonaPlex, Deepgram, OpenRouter, Brave, Stripe, n8n).
2. **Competitor capability matrix (research Boomer_Ang):**
   - Manus AI, Genspark, Flow With/Neo → features, autonomy triggers, progress UX, deployment patterns.
   - Output: “Capability Parity + Differentiation” markdown table for A.I.M.S.
3. **Draft PRD v0.1 + initial risks** using the template below.

Deliverables:

- `SOP-AIMS-001.md` (created).  
- `PRD-AIMS-VOICE-AUTON-v0.1.md` (created).  
- `AIMS_REQUIREMENTS.json` or TS module.

***

### Phase 1 – ACHEEVY Unified Experience (DEVELOP – Design + Impl Slice 1)

**Goal:** One ACHEEVY chat that works everywhere, voice‑first.

Tasks:

1. **Design:**
   - Define `<AcheevyChat />` React component API (props: workspace, vertical, context, theme).
   - Decide Stitch template variants for:
     - Dashboard shell
     - Chat-first page
     - Split layout (chat + panel).
2. **Implementation:**
   - Build `<AcheevyChat />` once in Next.js.
   - Wire to a single backend endpoint on VPS (`/api/acheevy`).
   - Integrate PersonaPlex streaming + Deepgram STT in the backend:
     - Bi‑directional audio WebSocket or SSE → audio chunks.
     - Auto‑play on frontend as response chunks arrive.
3. **Integration points:**
   - Mount `<AcheevyChat />` into:
     - A.I.M.S. home dashboard.
     - Per Form lobby route.
     - Deploy hangar route.
     - One sample “client plug” dashboard.

Deliverables:

- `apps/web/components/AcheevyChat.tsx` / `frontend/src/components/AcheevyChat.tsx`.
- `apps/web/pages/api/acheevy/*` (or app router handlers).  
- PersonaPlex + Deepgram integration module on VPS.

Milestone: **M1 – Single ACHEEVY Chat Everywhere (text + voice).**

***

### Phase 2 – Autonomy Core: VPS + SmelterOS Pipelines (DEVELOP – Design + Impl Slice 2)

**Goal:** Clean pipeline that manages VPS core services and VPS jobs vs CDN.

Tasks:

1. **Infra design (infra Boomer_Ang):**
   - Write `DEPLOYMENT_RULES.md` implementing the IF/THEN defined:
     - Core services → VPS.
     - Autonomous/scheduled work → VPS containers.
     - User apps/sites → CDN.
2. **n8n + Container template:**
   - Create generic Docker container job template for:
     - Per Form content update cycle.
     - Autonomous build jobs (vibe coding, playbooks).
   - n8n workflows:
     - Cron → trigger container job.
     - HTTP trigger → manual kick from ACHEEVY/CLI.
3. **Job state + BAMARAM:**
   - Firestore schema for `jobs`:
     - `status`, `progress`, `logs`, `outputs`, `bamaramEmitted`.
   - When all FDH + governance gates pass, Chicken Hawk:
     - Sets `status = COMPLETE`.
     - Writes `bamaramEmitted = true`.
     - Emits `))))BAMARAM((((` event → ACHEEVY notification and UI.

Deliverables:

- `infra/DEPLOYMENT_RULES.md`.  
- `vps/jobs/base-job.Dockerfile` + `vps/jobs/per-form-content.yaml`.  
- `n8n` workflows JSON.  
- Firestore `jobs` collection schema.

Milestone: **M2 – Working end‑to‑end job: trigger → VPS Container → BAMARAM → user notification.**

***

### Phase 3 – Per Form Autonomous Lobby (DEVELOP – Vertical Slice)

**Goal:** Per Form looks and feels like an always‑on ESPN/247 dashboard.

Tasks:

1. **Data + templates:**
   - Confirm ingestion of NCAA conferences, teams, players with your grading formula.
   - Build content templates (headline, recap, scouting report, trading card) in template files/hooks.
2. **Agents:**
   - Define Boomer_Angs:
     - `Scout_Ang` – stats + grades.
     - `News_Ang` – Brave API ingestion + headline drafting.
     - `Content_Ang` – posts generated from templates.
   - Lil Hawks for:
     - Single article creation.
     - Trading card creation.
3. **VPS jobs:**
   - Scheduled “Per Form heartbeat” job (VPS container):
     - Pull fresh stats + news.
     - Run ranking/grade updates.
     - Generate N new posts/cards per channel.
4. **UI:**
   - Lobby page:
     - Channels list (Power 5, G5, HS, NIL, etc.).
     - Live feed per channel (posts from agents).
     - ACHEEVY docked on the side.

Deliverables:

- `apps/web/app/per-form/*` pages.  
- `agents/per-form/*` configs (Boomer_Ang roles + tasks).  
- VPS job code for Per Form heartbeat.

Milestone: **M3 – Per Form shows fresh activity every day with no manual prompts.**

***

### Phase 4 – Deploy Hangar & Vibe Coding (DEVELOP)

**Goal:** Visual hangar where Boomer_Angs & Lil Hawks spawn and build.

Tasks:

1. **Agent framework selection:**
   - Use CrewAI for Boomer_Ang teams, LangGraph for workflows.  
2. **Hangar UI:**
   - Grid of agent cards with:
     - Role, status, current job, V.I.B.E. score.
   - Clicking card opens Live Job Monitor.
3. **Vibe coding sandbox:**
   - Chicken Hawk environment:
     - Dockerized isolated dev container.
     - SSE streaming of file changes, tests, logs into the UI.
   - Option to:
     - Run via ACHEEVY prompt.
     - Or open a dedicated vibe coding plug.

Deliverables:

- `apps/web/app/hangar/*` pages.  
- `agents/hangar/*` configs (CrewAI/LangGraph).  
- Chicken Hawk code execution container config.

Milestone: **M4 – You can watch agents spawn and see builds progressing live.**

***

### Phase 5 – Quality, Governance & Completion Audit (HONE)

**Goal:** Governance audit against `AIMS_REQUIREMENTS` on command.

Tasks:

1. **Governance wiring:**
   - Implement FDH and gate checks inside agent flows (Unit tests, V.I.B.E., security, cost).
2. **Completion audit hook:**
   - Implement “Run completion audit” command:
     - System reads:
       - `AIMS_REQUIREMENTS`
       - PRD
       - Codebase + infra configs
     - Produces:
       - DONE/PARTIAL/MISSING table.
       - Links to files for DONE.
       - Suggested TTD‑DRs for MISSING.
3. **UI surface:**
   - In A.I.M.S. admin dashboard:
     - Button: “Run Completion Audit”.
     - Show report and allow export as Markdown/PDF.

Deliverables:

- `agents/governance/audit.ts` (or similar).  
- “Completion audit” UI and API.

Milestone: **M5 – One-click / one-prompt audits against the PRD and SOP.**

***

### Phase 6 – Operation & Iteration

- Monitor:
  - Per Form activity levels.
  - Agent job success/failure.
  - Voice latency, cost profiles.
- Iterate:
  - Refine templates, agents, and deployment rules as new verticals spin up.
