## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2026-03-24 - TypedArray reduce in 60fps loops
**Learning:** Using functional array methods like `reduce` on TypedArrays (e.g., `Uint8Array`) inside `requestAnimationFrame` loops causes unnecessary V8 overhead and garbage collection, severely impacting 60fps animation performance.
**Action:** Replace functional array methods like `reduce` with standard `for` loops when working with TypedArrays in high-frequency React animation loops.

## 2024-04-15 - Blob Memory Allocation Overhead
**Learning:** Instantiating `new Blob([string])` specifically to calculate the string's UTF-8 byte length via the `.size` property adds roughly 50-70ms of overhead (over 10,000 iterations) due to object memory allocation in V8/Node environments, when compared to `new TextEncoder().encode(string).length`.
**Action:** Always prefer `TextEncoder` (instantiated globally to avoid further overhead) over `Blob` instantiation when calculating the byte length of strings in browser or isomorphic contexts.
