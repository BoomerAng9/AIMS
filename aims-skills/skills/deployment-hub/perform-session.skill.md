# Skill: perform-session

> Deploy Per|Form Platform sessions for athlete evaluation,
> scouting debates, and performance grading.
>
> DOMAIN: Sports Business (Per|Form vertical).
> This is NOT part of the Book of V.I.B.E. storytelling universe.

## Trigger
- User requests athlete analysis, scouting report, or film review
- ACHEEVY classifies intent as `perform-stack`
- Admin launches a Per|Form session from the Sandbox dashboard
- Scheduled scouting pipeline fires (event-driven)

## Overview

Per|Form sessions are bounded agent deployments where Boomer_Angs collaborate
on athlete evaluation. The Deployment Hub spawns a crew, runs the session,
and returns results with full audit trail.

## Session Types

### 1. Scout Run
Quick scouting report on a single athlete.
```
agents: [Scout_Ang, Index_Ang]
duration: 120s
pipeline: INGEST → ENRICH → GRADE → RANK → WRITE_BIO
output: AthleteCardJSON + Scouting Report
```

### 2. Film Analysis
Video-based evaluation using SAM 2 (Vertex AI).
```
agents: [Scout_Ang, Lab_Ang]
duration: 300s
pipeline: INGEST → VIDEO_ANALYSIS → GRADE → WRITE_BIO
output: FilmAnalysisMetrics + AthleteCardJSON
```

### 3. War Room Debate
Adversarial scouting — bull vs bear case.
```
agents: [Scout_Ang, Index_Ang, Chronicle_Ang]
lil_hawks: [Lil_Bull_Hawk, Lil_Bear_Hawk]
mediator: Chicken Hawk
duration: 180s
pipeline: RESEARCH → BULL_CASE → BEAR_CASE → MEDIATION → GROC_SCORE
output: DebateTranscript + GROCScore + LukeAdjustment
```

### 4. Full Evaluation
Complete pipeline — combines all three.
```
agents: [Scout_Ang, Index_Ang, Lab_Ang, Chronicle_Ang, Showrunner_Ang]
duration: 600s
pipeline: All 7 stages
output: AthleteCardJSON + FilmMetrics + DebateTranscript + Presentation
```

## Spawn Flow (via Deployment Hub)

```
ACHEEVY receives "evaluate [athlete]" intent
  │
  ▼
Classify as perform-stack → select session type
  │
  ▼
Deployment Hub: spawn required agents (AUTONOMOUS_SESSION)
  ├── Scout_Ang (research + data gathering)
  ├── Index_Ang (embeddings + dataset management)
  ├── Lab_Ang (video analysis via Vertex AI)
  ├── Chronicle_Ang (timeline + audit trail)
  └── Showrunner_Ang (presentation generation)
  │
  ▼
Chicken Hawk dispatches Lil_Hawks for debate (if War Room)
  ├── Lil_Bull_Hawk (bullish case)
  └── Lil_Bear_Hawk (bearish case)
  │
  ▼
Pipeline executes stage-by-stage
  │
  ▼
Chronicle_Ang logs full session timeline
  │
  ▼
Showrunner_Ang generates presentation (if Full Evaluation)
  │
  ▼
Results delivered to ACHEEVY → User
  │
  ▼
Agents return to Deployment Hub → Session closed → Audit sealed
```

## Scoring Integration

### P.A.I. Formula
`P.A.I. = Performance × 0.40 + Athleticism × 0.30 + Intangibles × 0.30`

| Component | Source Agent | Data Source |
|-----------|-------------|-------------|
| Performance (P) | Scout_Ang | MaxPreps, ESPN, 247Sports via Firecrawl |
| Athleticism (A) | Lab_Ang | SAM 2 video analysis via Vertex AI |
| Intangibles (I) | Scout_Ang | Brave Search — news, interviews, leadership |

### GROC+Luke Grading
| Component | Meaning |
|-----------|---------|
| G | Game performance |
| R | Raw athletics |
| O | Overall production |
| C | Competition level |
| Luke-L | Leadership multiplier |
| Luke-U | Upside ceiling |
| Luke-K | Known concerns |
| Luke-E | Evaluator confidence |

### Tier Output
| Tier | Color | Threshold |
|------|-------|-----------|
| ELITE | Gold #D4AF37 | 90+ |
| BLUE_CHIP | Cyan #22D3EE | 80-89 |
| PROSPECT | Green #22C55E | 70-79 |
| SLEEPER | Amber #F59E0B | 60-69 |
| DEVELOPMENTAL | Gray #6B7280 | <60 |

## Evidence Requirements

Every Per|Form session produces:
- `ATHLETE_CARD_JSON` — canonical athlete data payload
- `SOURCE_INDEX` — all data sources with timestamps
- `SESSION_TIMELINE` — Chronicle_Ang's structured event log
- `GROC_SCORE` — scoring breakdown with methodology
- `COMPLIANCE_FLAGS` — warnings (e.g., "limited_data", "photo_unverified")

No session closes without evidence. No grade ships without sources.

## Per|Form × Deployment Hub Contract

```json
{
  "spawn_type": "AUTONOMOUS_SESSION",
  "environment": "PERFORM_PLATFORM",
  "session_type": "SCOUT_RUN | FILM_ANALYSIS | WAR_ROOM | FULL_EVALUATION",
  "agents": ["Scout_Ang", "Index_Ang"],
  "athlete_query": "string",
  "budget_cap_usd": 5.00,
  "session_duration_max_s": 300,
  "scoring_formula": "PAI_V1",
  "output_format": ["ATHLETE_CARD_JSON", "SCOUTING_REPORT"]
}
```

---

*This skill is owned by the Per|Form vertical — a sports business vertical under A.I.M.S.
Per|Form is a standalone scouting & NIL intelligence platform. It is NOT part of the
Book of V.I.B.E. fictional universe. All sessions route through the Deployment Hub
and produce audit-grade evidence.*
