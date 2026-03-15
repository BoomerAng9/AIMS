## 2024-05-23 - High-Frequency Hook Re-renders
**Learning:** Custom hooks that manage high-frequency state (like 60fps audio levels) trigger re-renders in the consuming component, even if that component only passes the data to a child.
**Action:** Isolate high-frequency state into a dedicated visualizer component or hook that is only used at the leaf node, or return a reference/stream and let the leaf component manage the animation loop.

## 2024-03-15 - [TypedArray reduce performance bottleneck]
**Learning:** Using `Array.prototype.reduce()` on TypedArrays like `Uint8Array` inside high-frequency animation loops (`requestAnimationFrame` at 60fps) is a significant performance bottleneck in V8. It's noticeably slower and creates closures repeatedly, leading to garbage collection pressure and dropped frames during voice recording analysis.
**Action:** Always replace `.reduce()` (and similar array methods) with a standard `for` loop when processing TypedArrays inside hot execution paths like audio visualization loops.
