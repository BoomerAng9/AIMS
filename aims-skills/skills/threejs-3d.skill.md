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

## NtNtN Engine Integration

This skill sets guardrails for 3D usage. The NtNtN Engine provides the full 3D
technology taxonomy and technique catalog that Picker_Ang uses to select 3D tools.

**NtNtN Engine References:**
- `aims-skills/ntntn-engine/categories/3d-visual.md` — Full 3D technology library (Three.js, R3F, Drei, WebGPU, Spline, Babylon.js, p5.js, D3.js)
- `aims-skills/ntntn-engine/techniques/3d-immersive.md` — Orbit controls, text extrusion, environment mapping, instanced geometry, shaders, GLTF showcase, post-processing
- A.I.M.S. default for 3D: **R3F + Drei** (React Three Fiber)

---

## Performance Rules
1. **Lazy load** — Never import Three.js on initial page load
2. **Mobile fallback** — Provide 2D alternative for low-power devices
3. **Max 50K polygons** — Keep scenes lightweight
4. **Dispose on unmount** — Memory leaks are common with Three.js
