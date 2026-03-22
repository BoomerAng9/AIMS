## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2024-05-28 - Performance of Array.reduce on TypedArrays
**Learning:** Using `Array.prototype.reduce()` on TypedArrays (like `Uint8Array`) inside high-frequency `requestAnimationFrame` loops (60fps) introduces significant garbage collection overhead and is over 10x slower than a standard `for` loop in V8.
**Action:** Replace `.reduce()` and other higher-order array methods with standard `for` loops when processing TypedArrays in performance-critical animation frames.
