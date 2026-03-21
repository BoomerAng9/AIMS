## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.
## 2026-03-21 - Uint8Array reduce performance overhead
**Learning:** In high-frequency React animation loops (e.g., `requestAnimationFrame` at 60fps), using `Array.prototype.reduce()` on TypedArrays like `Uint8Array` is significantly slower than a standard `for` loop in V8 and introduces unnecessary callback/garbage collection overhead.
**Action:** Always use a standard `for` loop when iterating over TypedArrays in hot paths, especially for audio visualization or similar rapid state updates.
