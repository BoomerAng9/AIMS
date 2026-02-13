---
id: "threejs"
name: "Three.js"
type: "tool"
category: "ui"
provider: "Three.js"
description: "3D graphics library for web-based agent visualizations and immersive interfaces."
env_vars: []
docs_url: "https://threejs.org/docs/"
aims_files:
  - "frontend/package.json"
---

# Three.js — 3D Graphics Tool Reference

## Overview

Three.js powers 3D visualizations in the AIMS frontend. Used for agent avatars, immersive dashboards, and interactive 3D elements. Wrapped by React Three Fiber for declarative React integration.

## No API Keys Required

Three.js is a client-side library — no API keys needed.

## Packages

| Package | Purpose |
|---------|---------|
| `three` | Core 3D engine |
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | Helper components (OrbitControls, Text, etc.) |

## Usage Pattern

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gold" />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
}
```

## Performance Rules
- Limit polygon count for mobile devices
- Use `useFrame` sparingly (runs every frame)
- Dispose geometries and materials on unmount
- Lazy-load 3D scenes with `React.lazy`
