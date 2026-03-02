# Acceptance Criteria: remotion-video

## Must Pass

- [ ] All compositions registered in `Root.tsx` with explicit `id`, `durationInFrames`, `fps`, `width`, `height`
- [ ] No usage of `requestAnimationFrame`, `setTimeout`, or CSS animations for timing -- only `useCurrentFrame()` / `useVideoConfig()`
- [ ] All prop types defined with `type` keyword (not `interface`)
- [ ] All asset references use `staticFile()` -- no relative imports for media
- [ ] All durations expressed as `seconds * fps` with a comment documenting intended duration
- [ ] Zero `as any` casts in the entire `frontend/remotion/` directory
- [ ] Scene transitions use `TransitionSeries` from `@remotion/transitions`
- [ ] A.I.M.S. theme colors applied (gold `#D4A843`, dark bg `#0A0A0F`, glass panels)
- [ ] Render command produces valid `.mp4` output without errors
- [ ] Multi-format support: at minimum landscape (1920x1080) and portrait (1080x1920) compositions exist

## Should Pass

- [ ] Reusable scene components in `scenes/` directory, not inlined in compositions
- [ ] Shared atoms (text blocks, overlays, logos) in `components/` directory
- [ ] `calculateMetadata` used for dynamic compositions (data-driven duration/dimensions)
- [ ] Audio synchronization tested if audio tracks are present
- [ ] Thumbnail composition available for each video composition

## Quality Checklist

- [ ] No render artifacts (flickering, blank frames, cut-off text)
- [ ] Smooth transitions between scenes (no jump cuts unless intentional)
- [ ] Text is legible at target resolution
- [ ] Gold accent color used consistently for highlights and CTAs
- [ ] Glass-morphism effects render correctly in video output (no transparency issues)
