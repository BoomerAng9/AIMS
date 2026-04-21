## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.

## 2024-05-23 - TextEncoder vs Blob for byte length
**Learning:** For calculating byte length in browser environments, `new TextEncoder().encode(content).length` is significantly faster than `new Blob([content]).size` for strings, but introduces a major bug if binary data (like Blobs) is passed, as it coerces them to "[object Blob]".
**Action:** Always use a type safety check (e.g., `typeof content === 'string' ? new TextEncoder().encode(content).length : new Blob([content]).size`) when the data type is not strictly guaranteed to be a string.
