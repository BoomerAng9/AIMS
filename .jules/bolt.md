## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2024-05-24 - TypedArray reduce performance in hot loops
**Learning:** Using `Array.prototype.reduce()` on TypedArrays (like Uint8Array) inside high-frequency execution paths (e.g. `requestAnimationFrame` at 60fps) is an anti-pattern. It introduces callback overhead and causes unnecessary garbage collection, leading to performance degradation in V8.
**Action:** Replace `reduce()` with standard `for` loops when aggregating TypedArrays in hot paths to avoid closure allocation overhead.
