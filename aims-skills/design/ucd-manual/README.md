# User-Centered Design (UCD) Manual

**Source:** Agentic UI Design System by Alex Gilev (30kstrategy.com)
**License:** Non-resale, personal/team use only
**Sections:** 13 (0–12) + Bonuses

## Overview

Vetted product strategy and user experience frameworks used by leading Silicon Valley
companies and product leaders at Netflix, Meta, Amazon, Stripe, Apple, Google, and
Y Combinator. Tested on real six-figure projects over 15 years of work.

---

## Section 0 — Lean UX, Agile & Scrum

### Double Diamond Design Thinking
Two phases: **Discover + Define** (problem space) → **Develop + Deliver** (solution space).
Each diamond diverges (explore) then converges (focus).

### Velocity = Speed + Direction
- Speed alone = wasted effort if direction is wrong
- Strategy provides direction; Agile provides speed
- "Agile is NOT a UX strategy — it is a methodology"

### Key Definitions
| Term | Definition |
|------|-----------|
| **Agile** | Methodology — iterative development with continuous feedback |
| **Scrum** | Framework within Agile — sprints, ceremonies, artifacts |
| **Lean UX** | Strategy — validate assumptions before building |
| **Design Thinking** | Problem-solving approach — empathize, define, ideate, prototype, test |

### Team Roles
- **Product Owner** — Maximizes value, owns backlog
- **Scrum Master** — Facilitates process, removes blockers
- **Dev Team** — Cross-functional, self-organizing (3–9 members)

### A.I.M.S. Application
- ACHEEVY operates as product owner (backlog = user requests)
- Boomer_Angs operate as scrum masters (manage Lil_Hawks)
- Evidence gates = sprint review artifacts

---

## Section 1 — Mission, Vision & Core Values

### Core Values as Anchor
"Is it aligned with Vision & Mission?" a.k.a. "Is it leaning against the right wall?"
Core values are the decision filter for every feature, priority, and tradeoff.

### Positioning Formula
> "If you have this problem, we have your solution"

### GEM Model (Growth / Engagement / Monetization)
| Metric | Definition | A.I.M.S. Example |
|--------|-----------|-------------------|
| Growth | New user acquisition rate | Plug catalog discovery |
| Engagement | Active usage frequency | ACHEEVY chat sessions |
| Monetization | Revenue per user | Subscription tiers + Plug fees |

### GLE Model (Get Big / Lead / Expand)
Long-term strategy phases: capture market → establish leadership → expand laterally.

### A.I.M.S. Application
- **Mission:** AI Managed Solutions — manage services with AI
- **Core Values:** Autonomous operations + human-in-the-loop gates
- **Positioning:** "If you need managed AI infrastructure, we have your solution"

---

## Section 2 — UX Research Strategy

### Research Types
| Type | When | Goal | Methods |
|------|------|------|---------|
| **Generative** | Early stage | Understand needs, pain points, goals | Interviews, observation, diary studies |
| **Evaluative** | Later stage | Test hypotheses, validate assumptions | Usability tests, A/B tests, surveys |

### Key Principle
> "There's a technical name for the absence of user research: Guessing."
> "You can't guess your way to delivering successful products."

---

## Section 3 — Personas & Jobs to be Done (JBTD)

### JBTD Framework
Focus on what users are trying to accomplish, not demographics.
Format: `When [situation], I want to [motivation], so I can [expected outcome]`

### A.I.M.S. Personas
| Persona | Role | Primary JBTD |
|---------|------|-------------|
| OWNER | Platform developer | Deploy & manage AI infrastructure end-to-end |
| CUSTOMER | End user | Get AI-powered services without technical complexity |
| DEMO_USER | Prospect | Evaluate platform capabilities before committing |

---

## Section 4 — Problem / Opportunity Definition

### Problem Statement Formula
> "[User persona] needs a way to [user need] because [insight from research]"

### Opportunity Mapping
Map problems to business opportunities using ICE scoring:
- **Impact** — How significant is the problem?
- **Confidence** — How sure are we about the solution?
- **Ease** — How feasible is implementation?

---

## Section 5 — Prioritization Frameworks

### RICE Scoring
| Factor | Definition |
|--------|-----------|
| Reach | How many users affected per quarter |
| Impact | Massive (3x), High (2x), Medium (1x), Low (0.5x), Minimal (0.25x) |
| Confidence | High (100%), Medium (80%), Low (50%) |
| Effort | Person-months |

**Formula:** `(Reach × Impact × Confidence) / Effort`

### MoSCoW Method
- **Must have** — Non-negotiable for launch
- **Should have** — Important but not critical
- **Could have** — Nice to have, first to cut
- **Won't have** — Explicitly out of scope (this iteration)

---

## Section 6 — User Story Mapping

### Format
`As a [persona], I want [action], so that [benefit]`

### Mapping Structure
1. **Backbone** — High-level activities (left to right = user journey)
2. **Walking skeleton** — Minimum steps to complete each activity
3. **Slices** — Horizontal cuts = release priorities (top = MVP)

### A.I.M.S. Example
```
Backbone: Discover → Select → Deploy → Monitor → Scale
  Discover: Browse catalog, Search plugs, View details
  Select: Choose plug, Configure options, Review pricing
  Deploy: One-click deploy, Auto-configure, Health check
  Monitor: View metrics, Check logs, Get alerts
  Scale: Add resources, Auto-scale rules, Load balance
```

---

## Section 7 — OKRs (Objectives & Key Results)

### Structure
- **Objective** — Qualitative, inspirational, time-bound
- **Key Results** — Quantitative, measurable, 3–5 per objective

### A.I.M.S. Example
**Objective:** Make ACHEEVY the most capable AI orchestrator for container management

| Key Result | Target | Metric |
|-----------|--------|--------|
| Deploy success rate | >95% | First-attempt successful deployments |
| Time to deploy | <60s | Median deploy latency |
| User satisfaction | >4.5/5 | Post-deployment survey |

---

## Section 8 — Information Architecture

### 5-Step IA Checklist
1. **User needs analysis** — What are users trying to find/do?
2. **Content audit** — What content/features exist?
3. **Categorization** — Group by mental models (card sorting)
4. **Navigation design** — Primary, secondary, utility nav
5. **Usability testing** — Tree testing, first-click testing

### A.I.M.S. Navigation Architecture
```
Primary: Dashboard | Chat | Plugs | Settings
Secondary (Dashboard): Overview | Services | Monitoring | Billing
Utility: Profile | Notifications | Help | Admin (OWNER only)
```

---

## Section 9 — Wireframes & Prototyping

### Fidelity Spectrum
| Level | Purpose | Tools | A.I.M.S. Usage |
|-------|---------|-------|----------------|
| Lo-fi sketches | Explore ideas fast | Paper, Whimsical | Early concepts |
| Mid-fi wireframes | Layout & flow | Figma, Balsamiq | Feature design |
| Hi-fi prototypes | Visual + interaction | Figma, agentic-ui | User testing |
| Coded prototype | Real interactions | Next.js + agentic-ui | Sandbox validation |

### Rules
- Wireframe BEFORE coding — "measure twice, cut once"
- Test wireframes with users at mid-fi (cheapest place to find problems)
- Hi-fi prototypes use real data, not lorem ipsum

---

## Section 10 — Usability Testing

### Test Planning
- 5 users find 85% of usability problems (Nielsen Norman)
- Define tasks, scenarios, success criteria BEFORE testing
- Record sessions (with consent)

### Synthesis Framework
1. **Observations** — What happened (no interpretation)
2. **Insights** — What it means (pattern recognition)
3. **Recommendations** — What to change (actionable)
4. **Priority** — Severity × frequency matrix

### A.I.M.S. Usability Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Task success rate | >90% | Can user deploy a plug? |
| Time on task | <2 min | Chat → deployed plug |
| Error rate | <10% | Failed deployments from UI errors |
| SUS score | >80 | System Usability Scale survey |

---

## Section 11 — Accessibility

### Text
- Minimum **16px** desktop, **14px** mobile
- Use **REM** units (not px) for scalability
- Line height 1.5× for body text

### Color
- Design for Color Vision Deficiency (CVD) — 8% of males affected
- WCAG contrast ratios: **AA = 4.5:1** (normal text), **AAA = 7:1** (enhanced)
- Large text (18px+ bold or 24px+): AA = 3:1
- Never use color alone for meaning — always pair with icon or text label

### Forms
- Always visible labels (not placeholder-only)
- Error messages next to the field, not just at top
- Focus indicators visible and high-contrast

### Testing Tools
| Tool | Purpose |
|------|---------|
| WAVE | Browser extension — automated a11y scanning |
| axe | Developer-focused testing in browser DevTools |
| JAWS | Screen reader testing (Windows) |
| NVDA | Free screen reader testing (Windows) |

### A.I.M.S. Accessibility Requirements
- All agentic-ui components respect `prefers-reduced-motion`
- Chat interface keyboard-navigable (Tab, Enter, Escape)
- Agent status announced to screen readers (ARIA live regions)
- Error states include both color AND text description

---

## Section 12 — Gamification

### Core Mechanics
| Mechanic | Description | A.I.M.S. Application |
|----------|-------------|---------------------|
| Progress bars | Visual completion tracking | Deployment progress, onboarding flow |
| Achievements | Milestone rewards | "First Deploy", "10 Plugs Running" |
| Streaks | Consecutive action tracking | Daily platform usage |
| Leaderboards | Social comparison | Team deployment metrics |
| Points/XP | Accumulated value | Platform usage credits |

### Design Rules
1. Gamification ENHANCES — it doesn't replace core value
2. Rewards must align with desired behaviors
3. Avoid dark patterns (false urgency, manipulative streaks)
4. Make opt-out easy and respectful

---

## Quick Reference for AI Agents

When building A.I.M.S. UI, reference these sections:
- **New feature?** → Section 4 (Problem) + Section 5 (Prioritize) + Section 6 (Story Map)
- **New page layout?** → Section 8 (IA) + Section 9 (Wireframes)
- **Evaluating design?** → Section 10 (Usability Testing) + Section 11 (Accessibility)
- **Engagement features?** → Section 12 (Gamification) + Section 3 (JBTD)
- **Strategy alignment?** → Section 1 (Mission/Vision) + Section 7 (OKRs)
