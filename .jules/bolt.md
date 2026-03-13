## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2024-05-24 - High-Frequency Animation Loops Array Iteration
**Learning:** In high-frequency animation loops like `requestAnimationFrame` at 60fps on V8/Node, `Array.prototype.reduce()` on TypedArrays (e.g. `Uint8Array`) creates significant overhead and garbage collection pressure.
**Action:** Replace functional array methods like `reduce` with standard `for` loops in 60fps loops on TypedArrays. A standard `for` loop is >10x faster for this use case.
