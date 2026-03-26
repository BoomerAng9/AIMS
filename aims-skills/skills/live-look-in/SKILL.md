---
name: live-look-in
description: |
  Build, extend, and integrate the Live Look In workspace viewer — the real-time
  animated observability layer for ACHIEVEMOR's digital workforce. Use this skill
  whenever the user mentions Live Look In, workspace viewer, agent monitoring,
  Boomer_Ang visualization, digital office floor plan, workforce dashboard, agent
  simulation, or wants to observe running processes/agents in real time. Also trigger
  when the user wants to add new departments, agents, character types, or connect
  real backend events to the viewer. Covers the full stack from canvas rendering to
  WebSocket event bus to SaaS deployment.
role: Visualization & Monitoring
intent: Provide at-a-glance operational awareness of the entire agent workforce through an animated office metaphor.
kpis:
  - agent_visibility_coverage
  - event_render_latency_ms
  - frame_rate_fps
  - pcp_grade_accuracy
  - workforce_utilization_pct
status: beta
priority: high
triggers:
  - live look in
  - workspace viewer
  - office view
  - agent viewer
  - workforce view
  - floor plan
  - live view
  - agent activity
  - who is working
  - agent monitoring
  - digital office
  - agent simulation
  - workforce dashboard
execution: internal
dependencies:
  - factory-controller
  - fdh-pipeline
---

# Live Look In — ACHIEVEMOR Workspace Viewer

## What It Is

Live Look In is a real-time animated workspace viewer that renders ACHIEVEMOR's
digital workforce as characters in a virtual office floor plan. Users watch
Boomer_Angs, Lil_Hawks, and other entities move between rooms, sit at desks,
complete tasks, and return to break — all constrained to proper office pathways.

**This is NOT a digital twin or generic dashboard.** It is a manager's window into
their team — like looking into a warehouse or office and watching your people work.

## Character Registry

All characters have specific visual designs. **Never use generic circles, dots, or simple shapes.**

### Boomer_Angs ({Skill}_Ang)

- **Visual**: Aussie boomerang — wood-grain body, 3 circuit-board windows with neon glyphs, LED edge dots
- **Naming**: `{Skill}_Ang` — prefix always relates to function (API_Ang, Crypt_Ang, Data_Ang, etc.)
- **Behavior**: Spin clockwise while working/traveling. Stop spinning on break.
- **Reference image**: `assets/boomer_ang_reference.png`
- **At scale**: Replace canvas drawing with spritesheet. See `references/asset-pipeline.md`

### ACHEEVY (Digital CEO)

- **Visual**: Helmeted figure, black tactical helmet with glowing orange visor slit, brown/rust jacket, camo pants, tech gloves, holding glowing blue "Plug Me In" cube
- **Behavior**: Stationary in CEO office. Visor pulses. Cube glows.
- **Reference image**: `assets/acheevy_reference.png`

### Chicken Hawk (Commander)

- **Visual**: Armored gold mech-hawk — dark metallic body, massive gold spread wings, hawk helmet with gold crest, glowing gold eyes, chest armor with slash marks, A.I.M.S. branding
- **Behavior**: Stationary in Hawk Nest. Wings subtly flap. Eyes pulse gold.
- **Reference image**: `assets/chickenhawk_reference.png`

### Lil_x_Hawks (Minions)

- **Visual**: Smaller gold hawk minions — same aesthetic as Chicken Hawk but miniature
- **Naming**: `Lil_{Skill}_Hawk` — prefix matches function (Lil_Code_Hawk, Lil_Vuln_Hawk, etc.)
- **Behavior**: Same movement rules as Boomer_Angs. Faster travel speed.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    LIVE LOOK IN                          │
├──────────┬──────────────┬───────────────┬───────────────┤
│ RENDERER │ STATE ENGINE │  EVENT BUS    │  ASSET LAYER  │
│ (Client) │  (Server)    │ (Transport)   │  (CDN/Store)  │
├──────────┼──────────────┼───────────────┼───────────────┤
│ React/   │ FastAPI or   │ Redis Pub/Sub │ Spritesheets  │
│ Canvas   │ Express      │ + WebSocket   │ via Cloudflare│
│ WebGL    │ World state  │ Agent SDKs    │ R2 or S3      │
│ Pixi.js  │ aggregation  │ emit events   │ Image assets  │
└──────────┴──────────────┴───────────────┴───────────────┘
```

Read `references/architecture.md` for full technical breakdown of each layer.

## Floor Plan System

### Layout Rules

1. **Department rooms** line the top row, evenly spaced
2. **Main Corridor** runs horizontally between top and bottom rows
3. **Bottom row**: Break Room, Chicken Hawk Nest, HR Dept, ACHEEVY CEO Office
4. Every room has a **door** connecting to the corridor
5. Agents **NEVER** leave their room boundaries except through the door → corridor → door path

### Movement Constraints

- Agents are ALWAYS inside a room OR on the corridor — never in open space
- Route: `seat/desk → room door → corridor centerline → destination door → desk`
- Waypoint-based pathfinding along these fixed lanes
- No diagonal shortcuts, no clipping through walls

### Desk System

- Each department has N desks (configurable)
- Agents can only work if a desk is available
- Desks track occupancy state
- At scale: desks map to real compute slots or job queues

### Adding New Rooms

When extending the floor plan:
1. Define room bounds (x, y, w, h)
2. Place a door on the corridor-facing wall
3. Add internal furniture (desks, seats)
4. Register the room in the layout generator
5. Add pathfinding door coordinates to the route builder

## Org Hierarchy

```
ACHEEVY (Digital CEO)
├── PMO-ECHO ── ENGINEERING
│   ├── API_Ang
│   ├── UI_Ang
│   └── Lil_Code_Hawk
├── PMO-SHIELD ── SECURITY
│   ├── Crypt_Ang
│   └── Lil_Vuln_Hawk
├── PMO-PULSE ── DATA OPS
│   ├── Data_Ang
│   └── Lil_Crawl_Hawk
├── PMO-LAUNCH ── DEPLOYMENT
│   └── Deploy_Ang
├── PMO-LENS ── QA / REVIEW
│   └── QA_Ang
├── HR DEPARTMENT (oversees all agents)
└── CHICKEN HAWK (commands all Lil_Hawks)
    ├── Lil_Code_Hawk
    ├── Lil_Vuln_Hawk
    └── Lil_Crawl_Hawk
```

### Adding New Agents

Follow the naming convention strictly:
- Boomer_Angs: `{Skill}_Ang` — e.g., `Net_Ang`, `Log_Ang`, `Auth_Ang`
- Lil_Hawks: `Lil_{Skill}_Hawk` — e.g., `Lil_Scan_Hawk`, `Lil_Parse_Hawk`
- Each agent MUST have: name, glyph (single letter for boomerang window), dept, specialty, glowColor

## Performance Measurement System

### Per-Job: Project Completion Plan (PCP)

Every job generates a PCP document containing:

| Field       | Description                              |
|-------------|------------------------------------------|
| ID          | Unique `PCP-{timestamp_base36}` identifier |
| Task        | What's being done                        |
| Agent       | Who's doing it                           |
| Complexity  | low / medium / high                      |
| Vision      | Strategic goal statement                 |
| Mission     | Execution methodology                   |
| Objectives  | Ordered steps to complete                |
| Start/End   | For duration tracking                    |
| Score       | 0-100 numeric score                      |
| Grade       | S (95+), A (85+), B (70+), C (55+), D (<55) |

### Per-Agent: KPIs

- Tasks Completed (cumulative)
- Average Score (running mean)
- Average Time (running mean in seconds)
- Efficiency % (derived from score × completion factor)

### Org-Level: OKRs

- Total workforce utilization (active / total)
- Job completion rate
- Average grade distribution
- Department throughput comparison

## Proof of Concept → Production Scaling Path

| Phase | Scope | Key Deliverables |
|-------|-------|------------------|
| 1 — POC | Single-file React + Canvas | Simulated agents, canvas-drawn chars, browser-only state |
| 2 — Asset Upgrade | Pre-rendered sprites | Spritesheets with animation frames, rotation, scaling |
| 3 — Backend Event Bus | Redis + WebSocket | Agent SDK emits events, state engine aggregates, client receives diffs |
| 4 — Real Integration | Hook into ACHIEVEMOR agents | Real tasks, real PCP scoring, real KPIs |
| 5 — Multi-Tenant SaaS | User auth + workspace isolation | Custom floor plans, persistent history, Docker deployment |

## Integration Points

| System             | Integration                                           |
|--------------------|-------------------------------------------------------|
| Factory Controller | Event source — agent state changes, task dispatches    |
| FDH Pipeline       | Phase transitions trigger room movements               |
| Chicken-Hawk       | Lil_Hawk health/status via gateway polling             |
| Hawk3D             | Complementary view — Live Look In = 2D, Hawk3D = 3D   |
| ACHEEVY Brain      | Org hierarchy and governance chain rules               |

## Reference Files

| File                           | When to Read                                |
|--------------------------------|---------------------------------------------|
| `references/architecture.md`   | Building or modifying the backend stack     |
| `references/asset-pipeline.md` | Replacing canvas drawings with real sprites |
| `references/event-bus.md`      | Connecting real agents to the viewer        |
| `references/character-specs.md`| Adding or modifying character designs       |
| `references/floor-plan.md`     | Extending or modifying room layouts         |
| `references/pcp-metrics.md`    | PCP scoring, KPIs, and OKR computation      |
