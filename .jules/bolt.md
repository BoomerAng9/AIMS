## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2024-05-23 - Avoid reduce() on TypedArrays in high-frequency loops
**Learning:** Using `Array.prototype.reduce()` on TypedArrays like `Uint8Array` inside high-frequency React animation loops (e.g., `requestAnimationFrame` at 60fps) is >10x slower in V8 than a standard `for` loop, and increases garbage collection overhead.
**Action:** Replace `.reduce()` with standard `for` loops when calculating sums over TypedArray elements in performance-critical animation code paths to prevent unnecessary frame drops.
