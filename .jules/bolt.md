## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2024-05-24 - TypedArray Iteration in High-Frequency Animation Loops
**Learning:** For performance in high-frequency React animation loops (e.g., `requestAnimationFrame` at 60fps), avoid using `Array.prototype.reduce()` on TypedArrays like `Uint8Array`. A standard `for` loop is >10x faster in V8 and minimizes garbage collection overhead from closure creation.
**Action:** Always use classic `for` loops when calculating sums or iterating over TypedArrays inside `requestAnimationFrame` or hot rendering paths.
