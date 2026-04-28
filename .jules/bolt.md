## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.

## 2024-05-23 - TextEncoder Byte Length Optimization
**Learning:** Using `new Blob([string]).size` to calculate byte length of a string in browser environments creates unnecessary V8 overhead and memory allocation for the Blob object. Using a module-level `TextEncoder` and calling `.encode(string).length` is significantly faster and more memory efficient, but requires a type check (`typeof content === "string"`) to prevent coercing binary data to strings.
**Action:** Replace `new Blob([string]).size` with a module-level `textEncoder.encode(string).length` wrapped in a type safety check when calculating byte lengths for strings in React components or utility functions.
