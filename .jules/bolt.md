## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.
## 2026-04-26 - Audio Level State Prop Drilling
**Learning:** Passing a high-frequency state like `audioLevel` (updating at 60fps) from a top-level component (`ChatInterface`) down to its children (`AcheevyChatInput` -> `VoiceInputBtn`) causes continuous, unnecessary re-renders of the entire parent component tree, severely degrading UI performance.
**Action:** Isolate high-frequency state. Instead of prop-drilling the state, pass the underlying reference (`stream`) down to a memoized leaf node (`VoiceInputBtn`) and have that specific node consume the hook (`useAudioLevel`) directly. This restricts re-renders to only the component that actually needs to animate.
