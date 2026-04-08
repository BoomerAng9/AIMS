---
name: live-look-in
description: Build, extend, and integrate the Live Look In workspace viewer — the real-time animated observability layer for ACHIEVEMOR's digital workforce.
allowed-tools: Read, Edit, Write, Bash, Glob, Grep
---

# Live Look In — ACHIEVEMOR Workspace Viewer

Use this skill when building or modifying the Live Look In real-time workspace viewer.

## Key Implementation Rules

1. **Never use generic shapes** — All characters have specific visual designs (boomerang, mech-hawk, helmeted figure)
2. **Naming conventions are mandatory** — `{Skill}_Ang` for Boomer_Angs, `Lil_{Skill}_Hawk` for Lil_Hawks
3. **Movement is constrained** — Agents follow door → corridor → door paths only. No wall clipping.
4. **PCP grading** — S (95+), A (85+), B (70+), C (55+), D (<55)
5. **Desk occupancy** — Agents can only work at available desks

## Reference Files

- `aims-skills/skills/live-look-in/SKILL.md` — Full skill definition
- `aims-skills/skills/live-look-in/references/architecture.md` — Tech stack, state shape, component tree
- `aims-skills/skills/live-look-in/references/character-specs.md` — Character designs, sprites, animations
- `aims-skills/skills/live-look-in/references/event-bus.md` — Event protocol, Agent SDKs (Python/Node)
- `aims-skills/skills/live-look-in/references/floor-plan.md` — Room layout, grid, pathfinding
- `aims-skills/skills/live-look-in/references/pcp-metrics.md` — PCP scoring, KPIs, OKRs
- `aims-skills/skills/live-look-in/references/asset-pipeline.md` — Spritesheet specs, CDN, PixiJS migration
- `aims-skills/skills/live-look-in/references/deployment.md` — Docker, VPS, cloud SaaS, DB schema
