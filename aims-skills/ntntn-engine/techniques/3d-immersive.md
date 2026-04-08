# NtNtN Engine — 3D & Immersive Techniques Deep Dive

> Every 3D rendering, shader, scene composition, and immersive web technique.

---

## 1. 3D Scene with Orbit Controls

**What it achieves:** An interactive 3D environment the user can rotate, zoom, and pan — the foundation for any product showcase, data visualization, or immersive experience.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **R3F + Drei** | `<Canvas>` + `<OrbitControls>` component | React-native, declarative | +150KB (Three.js) |
| **Three.js** | `OrbitControls` from three/addons | Imperative, full control | +150KB |
| **Babylon.js** | `ArcRotateCamera` with built-in controls | Engine-level | +200KB |
| **Spline** | Export scene with camera controls baked in | No-code, embeddable | Runtime ~100KB |

### Scene Composition Checklist
1. **Camera:** PerspectiveCamera (FOV 50-75, near 0.1, far 1000)
2. **Lighting:** Ambient (base) + Directional (key) + optional Point/Spot (accent)
3. **Environment:** HDRI environment map for realistic reflections
4. **Controls:** OrbitControls with min/max distance, auto-rotate option
5. **Loader:** Suspense boundary with loading fallback
6. **Responsiveness:** Canvas resizes with container, DPR limited to 2

### When to Use
- Product configurators and 3D showcases
- Architecture and real estate walkthroughs
- Data visualization with depth
- Interactive art installations

### When NOT to Use
- Mobile-first pages without WiFi (3D is bandwidth-heavy)
- Content pages where 3D is decorative, not functional
- When the scene has < 3 objects (overkill for simple geometry)

### Performance Rules
- Lazy load the entire 3D canvas (no 3D on initial page load)
- Limit poly count to 50K total in scene
- Use `DPR` capped at `Math.min(window.devicePixelRatio, 2)`
- Dispose geometries, materials, and textures on unmount
- Provide 2D fallback image for low-power devices
- Compress GLTF models with Draco or meshopt

---

## 2. 3D Text Extrusion

**What it achieves:** Text rendered as 3D geometry with depth, bevels, and materials — creates monumental, tactile typography.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Drei Text3D** | `<Text3D>` component with font JSON + geometry config | Declarative, easy | Included in Drei |
| **Three.js** | `TextGeometry` + `FontLoader` + custom material | Imperative | Included in Three.js |
| **CSS** | `transform: rotateX() rotateY()` + `text-shadow` stacking | Fake 3D, lightweight | 0KB |

### Configuration Options
- **Font:** Typeface JSON (convert TTF/OTF via facetype.js)
- **Depth:** Extrusion depth (0.1-2.0 typical)
- **Bevel:** Enable/disable, thickness, segments
- **Material:** MeshStandardMaterial (PBR), MeshPhysicalMaterial (glass), or custom shader
- **Alignment:** Center with `<Center>` from Drei

### When to Use
- Hero headlines on 3D-themed landing pages
- Logo presentations
- Award/achievement displays
- Interactive name/title cards

### When NOT to Use
- Long text passages (each character is geometry = expensive)
- Mobile (3D text is heavy)
- When 2D text with CSS 3D transforms would suffice

---

## 3. Environment Mapping / Reflections

**What it achieves:** Objects reflect their surroundings, creating realistic metallic, glass, water, and chrome materials.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Drei Environment** | `<Environment preset="city" />` loads HDRI cubemap | Simple, preset-based | HDRI file (1-5MB) |
| **Three.js CubeCamera** | Real-time reflections via 6-face render | Accurate but expensive | Included in Three.js |
| **Three.js PMREMGenerator** | Pre-filtered environment map from equirectangular HDRI | Best quality/perf ratio | Included in Three.js |

### HDRI Presets (Drei)
- `apartment` — indoor warm lighting
- `city` — outdoor urban
- `dawn` — golden hour
- `forest` — natural green
- `lobby` — architectural
- `night` — dark with point lights
- `park` — outdoor daylight
- `studio` — neutral studio lighting
- `sunset` — warm orange
- `warehouse` — industrial

### When to Use
- Product showcases (jewelry, cars, electronics)
- Metallic/chrome objects
- Glass and transparent materials
- Any scene needing realism

### Performance Rules
- Use `PMREMGenerator` (precomputed) over real-time `CubeCamera`
- HDRI resolution: 1K for mobile, 2K for desktop (not 4K)
- Use `envMapIntensity` to control reflection strength (0.5-1.5 typical)

---

## 4. Instanced Geometry

**What it achieves:** Renders thousands of identical objects efficiently using a single draw call — creates forests, particle clouds, crowds, starfields.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **R3F Instances** | `<Instances>` + `<Instance>` components from Drei | Declarative, React-friendly | Included in Drei |
| **Three.js** | `InstancedMesh` with per-instance matrix transforms | Imperative, maximum control | Included in Three.js |
| **Three.js InstancedBufferGeometry** | Custom buffer attributes per instance | Advanced, GPU-efficient | Included in Three.js |

### When to Use
- Rendering 100+ identical objects (trees, buildings, particles)
- Starfields and space environments
- Crowd/audience simulations
- Repeated decorative elements (dots, cubes, spheres)

### When NOT to Use
- Fewer than 50 objects (regular mesh is fine)
- Objects with different geometries (instancing requires same geometry)
- When per-object interactivity is needed (raycasting instanced meshes is limited)

### Performance Rules
- Use `InstancedMesh` for 100-100,000 objects
- Set `count` to exact number needed (don't over-allocate)
- Update instance matrices in `useFrame` only when positions change
- Use `frustumCulled: false` if all instances should always render

---

## 5. Post-Processing Effects

**What it achieves:** Full-screen effects applied after the 3D scene renders — bloom, depth of field, chromatic aberration, film grain — creating cinematic quality.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **@react-three/postprocessing** | React components wrapping pmndrs postprocessing | Declarative, optimized | +20KB |
| **Three.js EffectComposer** | Manual pass composition (RenderPass + effect passes) | Imperative, full control | Included in Three.js |
| **Babylon.js** | DefaultRenderingPipeline with built-in effects | Engine-level | Included in Babylon |

### Common Effects

| Effect | What It Does | Performance Cost |
|--------|-------------|-----------------|
| **Bloom** | Bright areas glow and bleed light | Medium |
| **Depth of Field** | Background/foreground blur based on focal distance | High |
| **Chromatic Aberration** | Color fringing at edges (lens effect) | Low |
| **Vignette** | Darkened edges, focused center | Very Low |
| **Film Grain** | Noise overlay (cinematic texture) | Low |
| **SSAO** | Ambient occlusion from screen-space depth | High |
| **Tone Mapping** | HDR to LDR color mapping | Very Low |
| **Color Correction** | Hue/saturation/brightness adjustment | Very Low |

### When to Use
- Cinematic 3D showcases
- Product renders needing photorealism
- Art/creative 3D experiences
- When the scene needs a "finished" look

### When NOT to Use
- Interactive 3D with many user controls (post-processing adds latency)
- Mobile (each pass = full-screen render = expensive)
- Simple 3D scenes that don't need the cinematic treatment

### Performance Rules
- Use `@react-three/postprocessing` (merged effect passes = fewer draw calls)
- Render at half resolution for expensive effects (SSAO, DoF)
- Max 3-4 simultaneous effects
- Disable on mobile or provide toggle

---

## 6. 3D Model Showcase (GLTF/GLB)

**What it achieves:** Load and display pre-built 3D models (exported from Blender, Maya, ZBrush, etc.) with materials, textures, and animations.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Drei useGLTF** | `useGLTF(url)` hook returns scene, nodes, materials | Declarative, cached | Included in Drei |
| **Three.js GLTFLoader** | `GLTFLoader.load()` returns scene graph | Imperative | Included in Three.js |
| **model-viewer** | `<model-viewer>` web component by Google | Zero-code, accessible | +80KB |

### Model Optimization Pipeline
1. **Export** from DCC tool as `.glb` (binary GLTF = smaller)
2. **Compress** with `gltf-transform` or `gltfpack` (Draco/meshopt compression)
3. **Optimize textures** — resize to power-of-2, convert to WebP/KTX2
4. **Generate types** with `npx gltfjsx model.glb --types` (creates typed React component)
5. **Lazy load** — wrap in `<Suspense>` with loading fallback

### When to Use
- Product pages (shoes, electronics, furniture)
- Architecture visualization
- Character/avatar display
- Portfolio showcases

### Performance Rules
- Max 5MB per model (compressed)
- Max 50K triangles per model in scene
- Use Draco compression (70-90% size reduction)
- Generate LODs (Level of Detail) for complex models
- Provide poster image while model loads

---

## 7. Shader Effects (Custom GLSL)

**What it achieves:** Custom GPU programs that create unique visual effects impossible with standard materials — noise distortion, water ripples, holographic, iridescence.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **R3F shaderMaterial** | `shaderMaterial` from Drei with vertex + fragment shaders | Declarative, hot-reload | Included in Drei |
| **Three.js ShaderMaterial** | Custom `vertexShader` + `fragmentShader` strings | Imperative, full control | Included in Three.js |
| **glslify** | GLSL module system for reusable shader components | Modular shaders | Build tool |
| **Shadertoy** | Reference implementations for common effects | Learning/porting | N/A |

### Common Shader Patterns

| Pattern | Effect | Complexity |
|---------|--------|-----------|
| **Noise distortion** | Warping/rippling surfaces | Medium |
| **Fresnel** | Edge glow (rim lighting) | Low |
| **Holographic** | Rainbow sheen based on view angle | Medium |
| **Water** | Reflective, refractive surface with waves | High |
| **Dissolve** | Object disintegrates into particles | Medium |
| **Gradient ramp** | Procedural color based on position/normal | Low |
| **Matcap** | Pre-baked lighting from matcap texture | Low |

### When to Use
- When built-in materials can't achieve the desired look
- Unique brand-specific effects
- Interactive backgrounds (noise, fluid, waves)
- Transition effects (dissolve, morph)

### When NOT to Use
- When standard PBR materials would suffice
- When you don't have shader expertise on the team
- Mobile (shader complexity = GPU drain)

### Performance Rules
- Keep fragment shader calculations minimal (runs per pixel per frame)
- Pass complex calculations as uniforms from JS, not computed in shader
- Use `lowp`/`mediump` precision where possible
- Profile with Spector.js or Chrome GPU profiler
