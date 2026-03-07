## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2024-05-24 - TypedArray reduce() in requestAnimationFrame
**Learning:** Using `Array.prototype.reduce()` on TypedArrays (like `Uint8Array`) inside a 60fps `requestAnimationFrame` loop creates a massive amount of garbage collection overhead because it allocates a new callback function every frame and invokes it hundreds of times per frame.
**Action:** Always use a standard `for` loop for array reductions in high-frequency React animation loops (e.g., audio visualizers) to prevent GC pauses and animation stuttering.
