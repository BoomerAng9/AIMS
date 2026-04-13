## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.

## 2024-05-25 - Blob vs TextEncoder String Byte Length
**Learning:** Calculating string byte size in browser components using `new Blob([string]).size` is significantly slower (around 20x overhead) due to object instantiation compared to using `TextEncoder().encode(string).length` or `Buffer.byteLength`.
**Action:** Replace `new Blob([string]).size` with `TextEncoder().encode(string).length` in performance-critical or frequently-rendered components, ensuring `TextEncoder` is instantiated once outside the component scope to avoid repeated allocations.
