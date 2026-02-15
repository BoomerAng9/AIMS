---
id: "stitch"
name: "Stitch Design System"
type: "skill"
status: "active"
triggers:
  - "stitch"
  - "design system"
  - "weave"
  - "persona"
  - "gemini design"
  - "ui design"
  - "design guide"
description: "Persona-driven design system that injects the Nano Banana Pro aesthetic via Gemini CLI."
execution:
  target: "cli"
  command_linux: "./stitch.sh"
  command_windows: ". ./stitch.ps1; stitch"
dependencies:
  env:
    - "GEMINI_API_KEY"
  packages:
    - "gemini-cli"
  files:
    - ".stitch/persona.md"
    - "stitch.sh"
    - "stitch.ps1"
priority: "high"
---

# Stitch Design System Skill

## How It Works
Stitch is a CLI wrapper around Gemini that:
1. Loads the design persona from `.stitch/persona.md`
2. Combines it with the user's prompt as a system instruction
3. Invokes Gemini CLI with the combined context
4. Returns production-ready design specs, component code, and motion directives

## Usage

### Linux / VPS (Production)
```bash
# Direct invocation
./stitch.sh "Create a dashboard card for athlete scouting grades"

# Full design spec output
./stitch.sh --spec "ConversationShell layout for mobile"

# With file context
./stitch.sh --file src/components/Card.tsx "Refactor to Circuit Box tokens"
```

### Windows (Local Dev)
```powershell
. ./stitch.ps1
stitch "Create a dashboard card for athlete scouting grades"
```

## Persona Context
The persona file (`.stitch/persona.md`) defines:
- **Role:** Nano Banana Pro UI architect
- **Framework:** Next.js 14 App Router + Tailwind CSS 3.3
- **Aesthetic:** Retro-futurism — dark UI (#050505) + gold (#D4AF37)
- **Layout Rule:** "Brick and Window" — logo wall = brick, content = glass window
- **Colors:** Full Circuit Box palette (ink, obsidian, gold, signal colors)
- **Typography:** Doto (headlines/data), Inter (body), Permanent Marker (wordmark)
- **Glass panels:** backdrop-blur 20-26px, subtle inner glow, wireframe borders
- **Motion:** Framer Motion specs (stagger, breathe, scan, pulse-gold)
- **Tokens:** Maps to `--aims-{category}-{scale}` design token system

## Output Format
Every Stitch response includes:
1. **Layout Map** — Sections, spacing, responsive grid
2. **Component Tree** — React hierarchy with props
3. **Tailwind Classes** — Exact class strings
4. **State Map** — Loading/empty/error/success
5. **Motion Spec** — Framer Motion initial/animate/exit
6. **QA Checklist** — Acceptance criteria

## Chicken Hawk Integration
When Chicken Hawk dispatches a UI build task:
1. Chicken Hawk invokes Stitch via Runner_Ang (Gemini CLI wrapper)
2. Stitch generates design spec from the task description
3. Spec is passed to Patchsmith_Ang as coding context
4. Patchsmith_Ang implements the code
5. Evidence: design spec + component code + screenshot

## Prerequisites
- Gemini CLI installed and in PATH (`npm install -g @anthropic/gemini-cli` or system install)
- `GEMINI_API_KEY` set in environment
- `.stitch/persona.md` exists in project root
