## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2024-05-23 - TypedArrays and Array.prototype Methods in Animation Loops
**Learning:** For performance in high-frequency React animation loops (e.g., requestAnimationFrame at 60fps), using `Array.prototype.reduce()` on TypedArrays like `Uint8Array` causes significant overhead and garbage collection due to callback allocation. A standard `for` loop is >10x faster in V8 and minimizes this overhead.
**Action:** When working inside a high-frequency loop like `requestAnimationFrame`, always prefer a standard `for` loop over array prototype methods like `reduce`, `map`, or `forEach`.
