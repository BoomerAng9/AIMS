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
  command: ". ./stitch.ps1; stitch"
dependencies:
  env: []
  packages: []
  files:
    - ".stitch/persona.md"
    - "stitch.ps1"
priority: "medium"
---

# Stitch Design System Skill

## How It Works
Stitch is a PowerShell function that:
1. Loads the persona from `.stitch/persona.md`
2. Combines it with the user's prompt as a system instruction
3. Invokes the Gemini CLI with the combined context
4. Returns design-grounded code/instructions

## Usage
```powershell
# Load the function
. ./stitch.ps1

# Run with a design prompt
stitch "Create a dashboard card for athlete scouting grades"
```

## Persona Context
The persona file (`.stitch/persona.md`) defines:
- **Role:** Nano Banana Pro UI architect
- **Framework:** Next.js 14 App Router
- **Aesthetic:** 4K glassmorphism with obsidian/gold brand
- **Layout Rule:** "Brick and Window" -- logo wall = brick, content = glass window
- **Colors:** Obsidian (#050507-#0A0A0A), Champagne Gold (#D4AF37-#F6C453)
- **Typography:** Doto (pixel font, headlines), Inter (body)
- **Glass panels:** 20-26px blur, subtle inner glow, 1px gold border

## Prerequisites
- Gemini CLI must be installed and available in PATH
- PowerShell environment (Windows native or cross-platform)
