# Acceptance Criteria: threejs-3d

## Must Pass

- [ ] 3D is only used when the use case genuinely benefits from spatial representation (avatars, data viz, demos)
- [ ] 3D is NOT used for simple dashboards, standard charts, form-heavy pages, or text content
- [ ] Target 60fps on desktop, 30fps on mobile -- measured and verified
- [ ] Scene load time < 2 seconds on 4G connection
- [ ] Polygon count within budget: 100K triangles (hero), 50K (embedded)
- [ ] Total texture memory < 4MB per scene
- [ ] WebGL fallback provided: static image or 2D alternative when WebGL unavailable
- [ ] 3D scenes lazy-loaded -- never block initial page load
- [ ] `@react-three/fiber` used for React integration (no raw Three.js in React components)
- [ ] Geometry and material disposal in cleanup (useEffect return)
- [ ] `prefers-reduced-motion` respected: disable auto-rotation and complex animations

## Should Pass

- [ ] `@react-three/drei` used for common abstractions (OrbitControls, Environment, Text)
- [ ] `Suspense` with fallback UI for async model loading
- [ ] Textures compressed with KTX2 format where supported
- [ ] Camera transitions use `duration.slow` from A.I.M.S. motion tokens
- [ ] UI overlays on 3D scenes use standard Framer Motion variants

## Performance

- [ ] No jank or frame drops during scene interaction (orbit, zoom, pan)
- [ ] GPU memory usage monitored -- no memory leaks on scene mount/unmount
- [ ] Mobile battery impact considered -- 3D scenes pause when off-screen or tab hidden
