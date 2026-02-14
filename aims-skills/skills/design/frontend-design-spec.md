# A.I.M.S. Frontend Design Specification (v2.1)
## "Digital Guild Hall" Architecture with Integrated Business OS

> **Version:** 2.1.0
> **Created:** 2026-02-14
> **Author:** ACHVMR
> **Status:** CANONICAL — the visual and structural contract for all frontend work
> **Triggers:** "design", "frontend", "ui", "layout", "guild", "lobby", "yourspace", "secure pipe"

---

## 1. Design Language & Philosophy

**Theme:** "Obsidian & Gold Circuitry"

| Element | Spec |
|---------|------|
| **Backgrounds** | Deep charcoal/black (#050507) with animated SVG circuit board traces (low opacity) |
| **Surfaces** | "Brick & Window" — background is "Brick" (structure); UI elements are "Windows" (Glassmorphism/Frosted Glass cards) |
| **Header Typography** | "Permanent Marker" (human touch) |
| **Data Typography** | "Inter" (machine precision) |
| **Primary Accent** | Champagne Gold (#D4AF37) for active states |
| **Secondary Accent** | Electric Blue for Agent activity |
| **Design System** | Nano Banana Pro tokens (see `design-tokens-standards.md`) |

---

## 2. Information Architecture — The "Guild" Layout

Three distinct zones mirroring the "Digital Guild" strategy.

### Zone A: The Lobby (Community & Discovery)
*Replaces static landing page with dynamic social feed.*

- **UI Structure:** Central feed (Bluesky/Discord hybrid) with "Agent Cards" intermixed with human posts
- **Component:** `FeedStream.tsx`
- **Features:**
  - **Plug Showcase:** Users post Dockerized tools. "One-Click Clone" buttons on posts.
  - **ACHEEVY Presence:** "Super-Mod" bot in chat sidebar, available for Pay-Per-Use queries.

### Zone B: YourSpace (The Digital Office)
*Private execution environment where containers run.*

- **UI Structure:** "Mission Control" dashboard
- **Component:** `WorkspaceGrid.tsx`
- **Integration:** Running Docker containers (n8n, OpenClaw) as "Active Tiles" with real-time status (green/red dots)

### Zone C: The A.I.M.S. Secure Data Pipe (Business OS)
*Centralized module for compliance, finance, and external API links.*

- **Location:** `/dashboard/secure-pipe`
- **UI Structure:** Secure, high-density data tables and form wizards

---

## 3. The A.I.M.S. Secure Data Pipe Implementation

Agent-driven structured reporting — Tax, Payroll, Compliance.

### Module 1: The "Vault" (Secure Drop Zone)
- **Design:** Drag-and-drop zone with encryption visuals (padlock animations)
- **User Action:** Drop raw PDFs (bank statements, invoices)
- **Agent Action:** Analyst_Ang OCRs and extracts data
- **Visual Feedback:** Processing status bar ("Analyst_Ang is parsing Invoice #1024...")

### Module 2: The "API Token Forge"
- **Function:** Secure one-way API tokens for external communication
- **Application:** Read-only tokens for accountants, investors, government portals
- **Component:** `TokenGenerator.tsx`
  - Active tokens display
  - "Revoke Access" red toggle
  - Audit trail of data access

### Module 3: The "Virtual Office" Dashboard
- **Function:** Real-time financial health visualization via LUC engine
- **UI Elements:**
  - Nixie Tube Counters for revenue/spend projections
  - Three Pillars Status indicators (Confidence, Convenience, Security)

---

## 4. Specific Page Specs & Component Wiring

### 4.1 Global Navigation (`AIMSNav.tsx`)

**Left Sidebar (The Dock):**
- Top: "Lobby" Icon (Community)
- Middle: List of User's "Plugs" (Active Docker Containers)
- Bottom: "Secure Pipe" (Business OS)

**Right Drawer (Collaboration Feed):**
- Slide-out panel showing "Chain of Command"
- Shows ACHEEVY delegating to Boomer_Angs ("ManagerAng assigned task to Coder_Ang")
- Provides "Glass Box" transparency per canon rules

### 4.2 The "Build-Your-Bill" Pricing Matrix (`/pricing`)

**Reference:** The 3-6-9 Model

- **Layout:** Dynamic matrix table (not vertical list)
  - Columns: 3-Month (Garage), 6-Month (Community), 9-Month (Enterprise)
  - Rows: Add-ons (Security Vault, Confidence Shield)
  - Interaction: Cell click updates "Live Bill Estimate" floating footer

### 4.3 The "Circuit Box" (`/dashboard/circuit-box`)

**Function:** API and Model wiring center

- **Design:** Literal visual representation of a breaker box
  - Switches: Toggle external APIs (Stripe, OpenAI, Deepgram)
  - Model Garden: Dropdown for brain selection (Claude, Gemini, Kimi)
  - Status: Green LED indicators for healthy connections

---

## 5. Development Roadmap (Frontend)

### Phase 1: The Shell (Days 1-3)
- Implement `LogoWallBackground` (Brick) and `GlassCard` (Window)
- Set up `AIMSNav` with "Lobby vs. Workspace" logic

### Phase 2: The Secure Pipe (Days 4-7)
- Build `SecureUpload` component (The Vault)
- Create `ReportViewer` table (Agent outputs)
- Implement `TokenForge` UI

### Phase 3: Agent Integration (Days 8-10)
- Wire "Chat w/ACHEEVY" floating button to Vercel AI SDK
- Enable Auto-TTS for ACHEEVY responses using `useVoice` hook

---

## 6. Required Assets

Ensure these exist in `frontend/public/images/brand/`:
- `acheevy-commander.png` — YourSpace Hero
- `luc-box.png` — Secure Pipe / Financial section
- `boomerangs-port.png` — Agent Marketplace / Lobby

---

## 7. Relationship to D.U.M.B. SOP

This design spec is the **visual implementation contract** for D.U.M.B.'s UI requirements:

| D.U.M.B. Required Screen | Frontend Implementation |
|--------------------------|------------------------|
| Intake | Chat w/ACHEEVY + vertical Phase A flows |
| Workstream | Deploy Dock + Pipeline view |
| Live Build Stream | Chicken Hawk execution view |
| Gates & Evidence Locker | Circuit Box > Evidence tab |
| Environments & Releases | Deploy Dock + Environment cards |
| Integrations | Circuit Box > Integrations tab |
| Security Center | Circuit Box > Security tab |
| Operations | Circuit Box > Live Events tab |
| Billing & Metering | LUC Dashboard + Pricing Matrix |

Every green check links to evidence. Every deploy shows rollback target. Every denial shows a reason.
