# NtNtN Engine — Category 4: 3D & Visual Technologies

> Depth, dimension, and immersive experiences.

---

## Three.js

### Overview
The foundational 3D graphics library for the web. Built on WebGL (and now WebGPU).
Everything else in the JS 3D ecosystem builds on or alongside Three.js.

- **Current:** Three.js r183 (WebGPU production-ready since r171)
- **Rendering:** WebGPU (default since r171, auto-fallback to WebGL 2)
- **Scene Graph:** Scene → Camera → Renderer → Mesh (Geometry + Material)

### Key Patterns & Techniques

#### 1. Core Setup
```ts
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

#### 2. PBR Materials
Physically Based Rendering for realistic lighting:
- `MeshStandardMaterial` — metalness + roughness workflow
- `MeshPhysicalMaterial` — adds clearcoat, transmission, sheen, iridescence

#### 3. GLTF Loading
```ts
const loader = new GLTFLoader();
loader.load('/model.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

#### 4. Post-Processing
EffectComposer pipeline: Bloom, SSAO, Depth of Field, Chromatic Aberration, Film Grain.

#### 5. Custom Shaders (GLSL)
```glsl
// vertex.glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Picker_Ang Notes
- Choose when: Full control over 3D, custom shaders, advanced post-processing
- Avoid when: Simple 3D embeds (use Spline), React project (use R3F instead)

---

## React Three Fiber (R3F)

### Overview
React renderer for Three.js. Write 3D scenes declaratively using JSX.
Automatic disposal, Suspense loading, React event system on 3D objects.

- **Current:** R3F v9.5 + Drei v10.7 (React 19 compatible)
- **Approach:** Declarative JSX → Three.js scene graph
- **A.I.M.S. Status:** Default for 3D in React/Next.js projects

### Key Patterns & Techniques

#### 1. Declarative Scene
```tsx
<Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
  <ambientLight intensity={0.5} />
  <directionalLight position={[10, 10, 5]} />
  <mesh rotation={[0, Math.PI / 4, 0]}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#E5A530" />
  </mesh>
  <OrbitControls />
</Canvas>
```

#### 2. Animation Loop (useFrame)
```tsx
function SpinningBox() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    ref.current!.rotation.y += delta;
  });
  return <mesh ref={ref}><boxGeometry /><meshStandardMaterial /></mesh>;
}
```

#### 3. Suspense Loading
```tsx
<Canvas>
  <Suspense fallback={<LoadingIndicator />}>
    <Model url="/product.glb" />
  </Suspense>
</Canvas>
```

#### 4. Event System
```tsx
<mesh
  onClick={(e) => console.log('clicked', e.point)}
  onPointerOver={() => setHovered(true)}
  onPointerOut={() => setHovered(false)}
>
```

### Ecosystem (Drei)
Drei is the essential helper library for R3F:
- **Controls:** OrbitControls, PresentationControls, ScrollControls
- **Staging:** Environment, Stage, ContactShadows, AccumulativeShadows
- **Shapes:** RoundedBox, Torus, Sphere, Text3D
- **Effects:** Float, MeshTransmissionMaterial, Sparkles, Stars, Cloud
- **Performance:** Instances, Merged, BakeShadows, AdaptiveDpr

### Picker_Ang Notes
- **Default for any 3D in React/Next.js builds**
- Choose when: React project needs 3D, product showcases, interactive scenes
- Avoid when: Non-React project (use vanilla Three.js), game engine needs (use Babylon)

---

## WebGPU

### Overview
Next-generation GPU API replacing WebGL. Provides compute shaders, better
GPU utilization, and modern rendering pipeline architecture.

- **Current:** Universal browser support (~95% coverage) — Chrome, Safari 26+, Firefox, Edge
- **Three.js:** `WebGPURenderer` production-ready since r171, import from `'three/webgpu'`
- **TSL:** Three Shader Language — write once, compiles to WGSL (WebGPU) or GLSL (WebGL)
- **Status:** Production-ready with automatic WebGL 2 fallback

### Key Capabilities
- **Compute Shaders:** General-purpose GPU computing (ML inference, particle systems, physics)
- **Render Pipelines:** More explicit control over GPU state (like Vulkan/Metal)
- **Storage Buffers:** GPU-side data storage for complex simulations
- **Indirect Drawing:** GPU-driven rendering for massive instanced scenes

### Picker_Ang Notes
- Choose when: Performance-critical 3D, GPU compute (particles, physics), future-proofing
- Avoid when: Basic 3D needs (WebGL is fine via automatic fallback)

---

## Spline

### Overview
3D design tool with direct web export. Designers create 3D scenes visually,
export as embeddable web components or React components.

- **Current:** Spline (Hana 2D editor, Timeline animation beta, AI image generation)
- **Approach:** Visual editor → embed or React component
- **Editors:** Spline (3D), Hana (2D interactive/animated)
- **AI:** Built-in image generation/transformation, OpenAI voice assistant (WebRTC)
- **Pricing:** Free tier, Starter $12/mo, Professional $20/mo, Team $36/mo

### Key Patterns
```tsx
import Spline from '@splinetool/react-spline';

<Spline scene="https://prod.spline.design/xxxxx/scene.splinecode" />
```

### Picker_Ang Notes
- Choose when: Designer-created 3D, quick embeds, no complex interaction
- Avoid when: Need programmatic control, custom shaders, performance-critical

---

## Babylon.js

### Overview
Full game engine for the web. More feature-complete than Three.js for game-like
experiences, VR/AR, and physics-heavy scenes.

- **Current:** Babylon.js 8.x (8.0 released March 2025, daily patch releases)
- **Features:** Physics engine (Havok), XR support, Node Material Editor, GUI system, full WebGPU support

### Picker_Ang Notes
- Choose when: Game-like web experiences, VR/AR, physics-heavy simulations
- Avoid when: Simple product showcases (R3F is lighter), non-game web apps

---

## p5.js

### Overview
Creative coding library (Processing for JavaScript). Sketch-based approach
for generative art, data visualization, and creative experiments.

- **Current:** p5.js 1.x
- **Modes:** 2D (Canvas) and WEBGL (3D)
- **Community:** Massive creative coding community, extensive tutorials

### Picker_Ang Notes
- Choose when: Generative art, creative experiments, educational visuals
- Avoid when: Production 3D (use R3F), performance-critical (use vanilla Canvas)

---

## D3.js

### Overview
Data-driven document manipulation. The standard for complex, custom data
visualization on the web. Low-level but extremely powerful.

- **Current:** D3 v7
- **Approach:** Data binding → DOM manipulation → transitions
- **Alternatives:** Recharts, Nivo, Visx (React wrappers over D3)

### Key Patterns
```ts
d3.select('svg')
  .selectAll('rect')
  .data(dataset)
  .join('rect')
  .attr('x', (d, i) => i * 25)
  .attr('height', d => d.value)
  .transition()
  .duration(750);
```

### Picker_Ang Notes
- Choose when: Complex custom charts, geographic maps, force layouts, data journalism
- Avoid when: Standard charts (use Recharts/Nivo), simple dashboards

---

## Canvas API & SVG Animation

### Canvas API
Native 2D drawing surface. Immediate-mode rendering — you draw pixels directly.
Best for custom graphics, games, image manipulation.

### SVG Animation
Animated vector graphics. Retained-mode — each element is a DOM node.
Best for icons, logos, illustrations, path animations.

| Feature | Canvas | SVG |
|---------|--------|-----|
| Rendering | Pixel-based (immediate) | Vector-based (retained) |
| Scalability | Fixed resolution | Infinite (vector) |
| Interactivity | Manual hit detection | Native DOM events |
| Performance | Better for many objects | Better for few complex shapes |
| Accessibility | Poor (bitmap) | Good (DOM, aria-labels) |
| Animation | requestAnimationFrame | CSS/SMIL/JS |

### Picker_Ang Notes
- Canvas when: Many objects (particles, games), image processing, pixel manipulation
- SVG when: Scalable icons/logos, path animations, accessible graphics, morphing shapes

---

## 3D & Visual Comparison Matrix

| Technology | Learning Curve | Performance | React Integration | Use Case |
|-----------|---------------|-------------|------------------|----------|
| **Three.js** | High | Excellent | Manual | Custom 3D, shaders |
| **R3F + Drei** | Medium | Excellent | Native | React 3D (default) |
| **WebGPU** | Very High | Best | Via Three.js | GPU compute, cutting-edge |
| **Spline** | Very Low | Good | Component | Designer-created 3D |
| **Babylon.js** | High | Excellent | Wrapper | Games, VR/AR |
| **p5.js** | Low | Good | Wrapper | Creative coding |
| **D3.js** | High | Good | Via wrappers | Data visualization |
| **Canvas** | Medium | Excellent | Ref-based | Custom 2D graphics |
| **SVG** | Low | Good | Native JSX | Icons, logos, paths |

---

## A.I.M.S. Default: R3F + Drei

For all A.I.M.S. builds needing 3D, **React Three Fiber + Drei** is the default.
Falls back to vanilla Three.js only for non-React contexts.
