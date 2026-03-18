## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2025-03-18 - TypedArray reduce() bottleneck in animation loops
**Learning:** Using `Array.prototype.reduce()` on TypedArrays (like `Uint8Array`) inside high-frequency `requestAnimationFrame` loops is notoriously slow in V8 engines (Chrome/Node) and introduces O(N) garbage collection overhead.
**Action:** Always use standard `for` loops for calculating sums or iterating over TypedArrays in high-frequency visualizer or audio processing loops, yielding ~10x performance improvement.
