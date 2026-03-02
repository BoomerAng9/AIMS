---
name: threejs-3d
description: |
  Three.js 3D Usage skill for A.I.M.S.
  Use when: deciding whether to use 3D graphics, implementing WebGL visualizations,
  building 3D avatars, or creating interactive data visualizations.
role: Specialist Executor
intent: Guide agents on when and how to use 3D graphics with performance constraints and best practices.
kpis:
  - render_fps
  - scene_load_time_ms
  - webgl_compatibility_rate
status: active
priority: low
triggers:
  - 3d
  - three
  - webgl
  - 3d visualization
execution: sequential
dependencies:
  - "threejs.tool.md"
  - "three"
  - "@react-three/fiber"
  - "@react-three/drei"
---

# Three.js 3D Usage

## When to Use 3D

Use Three.js / WebGL when the use case genuinely benefits from a 3D spatial representation:

| Use Case | Justification |
|----------|--------------|
| **Avatars** | PersonaPlex avatar rendering, 3D character display |
| **Data Visualization** | Network graphs, topology maps, 3D scatter plots where depth adds insight |
| **Onboarding** | Interactive product tours with spatial navigation |
| **Demos / Marketing** | Hero sections with immersive 3D scenes for landing pages |
| **Simulation** | LiveSim views showing spatial relationships between services/containers |

## When NOT to Use 3D

Do NOT reach for Three.js when a 2D solution is sufficient:

| Scenario | Use Instead |
|----------|-------------|
| **Simple dashboards** | Tailwind + Framer Motion (2D charts, cards, tables) |
| **Charts and graphs** | Recharts, Nivo, or D3.js (2D is faster and more accessible) |
| **Form-heavy pages** | Standard HTML forms with motion transitions |
| **Text-centric content** | CSS animations, Framer Motion scroll reveals |
| **Mobile-first views** | 3D kills mobile battery and performance; avoid unless critical |

## Performance Constraints

1. **Target 60fps minimum** on desktop, 30fps minimum on mobile
2. **Scene load time < 2 seconds** on 4G connection
3. **Maximum polygon count**: 100K triangles for hero scenes, 50K for embedded components
4. **Texture budget**: Max 4MB total texture memory per scene
5. **Always provide fallback**: If WebGL is not available, render a static image or 2D alternative
6. **Lazy load** all 3D scenes -- never block initial page load with Three.js bundles

## Best Practices

- Use `@react-three/fiber` for React integration (never raw Three.js in React components)
- Use `@react-three/drei` for common abstractions (OrbitControls, Environment, Text, etc.)
- Dispose geometries and materials in cleanup (`useEffect` return function)
- Use `Suspense` with a fallback for async model loading
- Compress textures with KTX2 format for GPU-native decompression
- Respect `prefers-reduced-motion`: disable auto-rotation and complex animations

## Integration with A.I.M.S. Motion System

3D scenes must still respect the A.I.M.S. motion token system:
- Camera transitions use `duration.slow` (500ms) from `frontend/lib/motion/tokens.ts`
- UI overlays on 3D scenes use standard Framer Motion variants
- 3D ↔ 2D transitions use shared easing curves

## References

- `references/acceptance-criteria.md` -- Acceptance criteria for this skill
