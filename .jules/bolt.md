## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.

## 2024-05-24 - Expensive Blob instantiation for string byte size
**Learning:** Using `new Blob([string]).size` to calculate the byte length of a string is an expensive operation due to object instantiation overhead. When done inside loops (e.g., calculating total sizes of multiple files), this becomes a measurable performance bottleneck.
**Action:** Use `new TextEncoder().encode(string).length` or a similar lightweight method to calculate byte sizes of strings, avoiding `Blob` instantiation entirely.
