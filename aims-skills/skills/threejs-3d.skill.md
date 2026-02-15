---
id: "threejs-3d"
name: "Three.js 3D Usage"
type: "skill"
status: "active"
triggers:
  - "3d"
  - "three"
  - "webgl"
  - "3d visualization"
description: "Guides agents on when and how to use 3D graphics, performance constraints, and best practices."
execution:
  target: "internal"
  route: ""
dependencies:
  files:
    - "aims-skills/tools/threejs.tool.md"
priority: "low"
---

# Three.js 3D Usage Skill

## When to Use 3D
- Agent avatars and visual identity
- Data visualizations that benefit from depth
- Immersive onboarding experiences
- Interactive product demos

## When NOT to Use 3D
- Simple dashboards (use 2D charts instead)
- Mobile-first pages (3D is heavy on mobile)
- Content-heavy pages (3D distracts from text)
- When it doesn't serve the user's goal

## Performance Rules
1. **Lazy load** — Never import Three.js on initial page load
2. **Mobile fallback** — Provide 2D alternative for low-power devices
3. **Max 50K polygons** — Keep scenes lightweight
4. **Dispose on unmount** — Memory leaks are common with Three.js
